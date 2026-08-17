# Controle de Concorrência e Race Conditions

A nota de [ACID](/labs/web-dev/banco-de-dados/acid/) explica que o **I** (Isolamento) garante que transações concorrentes não se atrapalhem, e que o banco oferece **níveis de isolamento** para isso. Só que escolher um nível de isolamento não resolve tudo sozinho: mesmo com o nível certo configurado, a forma como a aplicação lê, calcula e escreve um dado pode continuar gerando bugs de concorrência. Esta nota é sobre esse problema na prática: o que é uma **race condition**, por que ela aparece mesmo em código aparentemente simples, e quais estratégias existem para evitá-la.

## O que é uma race condition

Uma race condition (condição de corrida) acontece quando o resultado de um programa depende da ordem em que duas ou mais execuções concorrentes acontecem, e essa ordem pode gerar um resultado incorreto. Ela ocorre quando quatro condições se juntam:

1. Existem dois ou mais processos, threads ou instâncias rodando.
2. Eles acessam um recurso compartilhado.
3. Pelo menos uma dessas execuções modifica esse recurso.
4. A operação de ler e atualizar esse recurso não é tratada como uma unidade indivisível.

Recurso compartilhado pode ser qualquer coisa que mais de uma execução consiga ler e escrever ao mesmo tempo:

- Uma linha numa tabela de banco de dados
- Uma variável global
- Um singleton
- Um objeto compartilhado em memória
- Um saldo ou estoque
- Um cache compartilhado

Vale reforçar um ponto importante: **leituras concorrentes, sozinhas, não causam race condition**. O problema aparece quando existe a sequência **ler → calcular → escrever** acontecendo em paralelo, porque uma execução pode calcular em cima de um valor que já ficou desatualizado no meio do caminho.

### Exemplo do saldo

Considere um saldo inicial de R$ 50, e dois processos tentando atualizá-lo ao mesmo tempo:

```text
Saldo inicial: R$ 50

Processo A: quer somar R$ 30
Processo B: quer somar R$ 20

Linha do tempo:

  A le saldo = 50
  B le saldo = 50          <- B ainda não viu a mudança de A, porque A nem escreveu ainda
  A calcula 50 + 30 = 80
  B calcula 50 + 20 = 70
  A salva 80
  B salva 70                <- sobrescreve o resultado de A

Saldo final: R$ 70 (errado)
Saldo correto seria: R$ 100
```

O problema é que o processo B nunca leu o resultado de A, ele leu o mesmo saldo antigo (R$ 50) e simplesmente sobrescreveu o que A tinha salvado. Esse tipo de bug tem nome: **lost update** (atualização perdida). A alteração de A não desapareceu por um erro visível, ela só foi silenciosamente substituída.

## Aplicações "single-threaded" também sofrem

É tentador achar que esse problema só existe em programação multithread, mas isso não é verdade. Mesmo uma aplicação que processa uma requisição por vez, sem threads concorrentes de verdade, pode sofrer race condition quando:

- A aplicação roda em várias instâncias ao mesmo tempo (ex: 3 réplicas atrás de um load balancer, veja [Escalabilidade horizontal](/labs/web-dev/escalabilidade/escalabilidade/))
- O serviço está distribuído em máquinas diferentes
- O runtime usa múltiplos processos-trabalhadores (ex: cluster do Node.js)
- Existem callbacks ou Promises concorrentes dentro do mesmo processo
- Uma operação fica esperando uma API externa ou o banco de dados responder, e nesse meio tempo outra requisição chegou
- O sistema foi escalado horizontalmente

O ponto chave é: mesmo que cada instância, sozinha, processe uma coisa de cada vez, duas instâncias diferentes podem alterar o mesmo registro ao mesmo tempo sem nenhuma delas saber da outra. Por isso, o controle de concorrência não pode viver só na memória de um processo, ele precisa acontecer numa camada compartilhada e confiável entre todas as instâncias, e essa camada normalmente é o banco de dados.

## Estratégias para evitar race conditions

### 1. Execução sequencial

A solução mais simples é impedir que as operações aconteçam ao mesmo tempo:

```javascript
await venderUvas();
await venderAzeitonas();
```

**Como funciona:** a segunda operação só começa depois que a primeira termina por completo (leu, calculou e salvou). Como não existe sobreposição, a segunda leitura já enxerga o resultado atualizado pela primeira.

**Vantagens:** fácil de implementar, adequada para aplicações simples, reduz a complexidade de ter que pensar em concorrência.

**Desvantagens:** elimina o paralelismo, aumenta o tempo total de processamento, vira um gargalo conforme a carga cresce, e não resolve nada quando existem múltiplas instâncias do serviço rodando ao mesmo tempo (cada instância continua tendo sua própria fila sequencial, sem saber da fila das outras). Não é uma estratégia geral para sistemas distribuídos ou de alta escala.

### 2. Atualização atômica

Em vez da aplicação fazer o cálculo:

```text
saldo = lerSaldo()
saldo = saldo + valor
salvarSaldo(saldo)
```

ela delega o cálculo para o próprio banco, numa única instrução:

```sql
UPDATE account
SET balance = balance + :amount
WHERE id = :accountId;
```

**Como funciona:** o banco executa a leitura e a escrita como uma operação atômica só sua, sem expor esse "meio do caminho" para a aplicação. Cada `UPDATE` sempre usa o valor mais atual da coluna no momento em que ele roda, então duas operações concorrentes de `+30` e `+20` chegam corretamente em `R$ 100`, mesmo sem nenhum lock explícito.

**Vantagens:** simples, eficiente, permite que as operações rodem em paralelo de verdade, aproveita o controle de concorrência que o próprio banco já tem internamente, geralmente com melhor desempenho do que travar a aplicação inteira.

**Limitações:** funciona bem quando a regra é uma operação simples (incrementar, decrementar, somar, subtrair, atualizar um contador), mas não é suficiente quando é preciso ler o estado atual, aplicar várias validações, rodar regras de negócio complexas, e só depois decidir o que persistir.

Por exemplo, garantir que o saldo nunca fique negativo não é só questão de somar um número, é preciso validar antes. A saída é incorporar a validação na própria cláusula `WHERE`:

```sql
UPDATE account
SET balance = balance - 30
WHERE id = 123
  AND balance >= 30;
```

Se o saldo for menor que 30, nenhuma linha é atualizada, e a aplicação precisa checar quantas linhas foram afetadas para saber se a operação realmente aconteceu.

### 3. Mutex (exclusão mútua)

Mutex vem de **mutual exclusion**, exclusão mútua: um mecanismo que garante que só uma execução por vez entre numa determinada seção do código.

```text
adquirir lock
ler saldo
calcular novo saldo
salvar saldo
liberar lock
```

Se duas operações tentam rodar ao mesmo tempo, a primeira adquire o lock e segue normalmente; a segunda fica esperando até o lock ser liberado, e só então lê o valor já atualizado pela primeira.

```javascript
await mutex.lock();

try {
  const balance = await loadBalance();
  const newBalance = balance + amount;
  await saveBalance(newBalance);
} finally {
  mutex.unlock();
}
```

O trecho protegido pelo mutex é chamado de **seção crítica**.

**Cuidados importantes:**

- O `unlock` precisa acontecer mesmo quando algo dá erro no meio do caminho, por isso o padrão `try/finally` (nunca só `try`).
- Locks mantidos por muito tempo viram gargalo.
- É preciso tomar cuidado com deadlocks e esperas indefinidas.
- Evite deixar uma chamada externa lenta (ex: uma API de terceiros) dentro da seção crítica, isso trava todo mundo esperando por algo fora do seu controle.
- Um mutex em memória só protege o processo atual. Se existirem várias réplicas da aplicação (o cenário descrito na seção anterior), cada uma terá seu próprio mutex local, e eles não vão se enxergar entre si. Um mutex local sozinho não resolve concorrência entre instâncias diferentes.

### 4. Locks no banco de dados

Quando o mutex em memória não é suficiente (por causa de múltiplas instâncias), o lock pode ser movido para dentro do banco, que é a camada compartilhada entre todas elas.

#### Lock pessimista

Parte do princípio de que conflitos são prováveis, então bloqueia o registro **antes** de mexer nele:

```sql
BEGIN;

SELECT balance
FROM account
WHERE id = 123
FOR UPDATE;

UPDATE account
SET balance = balance + 30
WHERE id = 123;

COMMIT;
```

Enquanto essa transação estiver aberta, qualquer outra transação que tentar travar a mesma linha (com outro `FOR UPDATE`) precisa esperar. Retomando o exemplo do saldo:

```text
1. Processo A trava a linha
2. Processo A le R$ 50
3. Processo A calcula e salva R$ 80
4. Processo A libera o lock (COMMIT)
5. Processo B trava a linha
6. Processo B le R$ 80 (ja atualizado) e aplica sua propria alteracao
```

Repare que agora B lê o valor já atualizado por A, porque B só consegue travar a linha depois que A libera. O lost update desaparece.

**Vantagens:** funciona entre múltiplas instâncias, porque o banco é a fonte compartilhada da verdade; protege de fato contra alterações concorrentes vindas de qualquer lugar.

**Desvantagens:** pode gerar contenção (fila de espera pelo lock), aumenta o tempo de resposta sob carga, pode causar deadlocks se locks forem adquiridos em ordens diferentes por transações diferentes, mantém recursos bloqueados durante toda a transação. Em JPA/Hibernate, essa estratégia costuma aparecer como `PESSIMISTIC_WRITE`.

#### Lock otimista

Parte do princípio oposto: conflitos são raros, então não vale a pena bloquear nada durante a leitura. Em vez disso, a aplicação verifica, na hora de salvar, se o registro mudou desde que foi lido. Isso costuma ser feito com uma coluna de versão:

```text
id  | balance | version
123 | 50      | 7
```

```sql
UPDATE account
SET balance = 80,
    version = 8
WHERE id = 123
  AND version = 7;
```

Se outra transação já tiver alterado essa conta (e a versão já não for mais 7), o `WHERE` não bate com nenhuma linha, e o `UPDATE` não altera nada:

```text
1. Processo A le a versao 7
2. Processo B tambem le a versao 7
3. A salva usando WHERE version = 7, e muda a versao para 8   -> sucesso
4. B tenta salvar usando WHERE version = 7
5. A atualizacao de B falha, porque a versao atual ja e 8
6. B precisa reler os dados, recalcular, e tentar de novo (ou retornar um conflito pro usuario)
```

Diferente do lock pessimista, o lock otimista não bloqueia ninguém enquanto a leitura acontece, ele só detecta o conflito na hora de escrever, e devolve a responsabilidade de decidir o que fazer (tentar de novo, avisar o usuário) para a aplicação. Em JPA/Hibernate, essa estratégia normalmente é implementada com a anotação `@Version`.

#### Lock distribuído

Quando o recurso compartilhado não vive dentro do banco de dados (por exemplo, um arquivo, uma fila, ou um passo de um processo que precisa rodar só uma vez entre várias instâncias), é preciso um mecanismo de lock que funcione entre máquinas diferentes, coordenado por um serviço externo (Redis, ZooKeeper, etcd, por exemplo). A ideia é a mesma do mutex (só uma execução por vez na seção crítica), mas implementada numa infraestrutura compartilhada em vez de memória local, e com tratamento extra para o caso de uma instância travar o lock e nunca liberar (normalmente resolvido com um tempo de expiração automática do lock).

## Comparação das estratégias

| Estratégia          | Como evita o conflito                                     | Melhor uso                                                                                                 | Principal limitação                               |
| ------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Execução sequencial | Remove o paralelismo                                      | Aplicações simples, uma única instância                                                                    | Baixa escalabilidade                              |
| Atualização atômica | Executa a alteração direto no banco, numa instrução só    | Incrementos e decrementos simples                                                                          | Insuficiente para regras de negócio complexas     |
| Mutex               | Permite uma execução por vez dentro do processo           | Estado compartilhado dentro de uma única instância                                                         | Não funciona sozinho entre réplicas diferentes    |
| Lock pessimista     | Bloqueia a linha no banco antes de alterar                | Conflitos frequentes, regras que dependem do estado atual                                                  | Contenção e risco de deadlock                     |
| Lock otimista       | Detecta alteração por número de versão, na hora de salvar | Conflitos pouco frequentes                                                                                 | Exige lógica de retry / tratamento de conflito    |
| Lock distribuído    | Coordena instâncias via um serviço externo compartilhado  | Recursos compartilhados fora do banco                                                                      | Exige infraestrutura extra e tratamento de falhas |
| Ledger              | Registra eventos em vez de sobrescrever um valor único    | Dinheiro, auditoria, rastreabilidade (veja [Ledger Pattern](/labs/web-dev/banco-de-dados/ledger-pattern/)) | Maior complexidade arquitetural                   |

## Escolhendo uma estratégia na prática

A escolha certa depende da regra de negócio, não só da tecnologia disponível:

- Se a operação é um incremento ou decremento simples (contador de visualizações, estoque básico): **atualização atômica** já resolve.
- Se a decisão depende de ler o estado atual e validar antes de escrever, e conflitos são esperados com frequência: **lock pessimista**.
- Se conflitos são raros e você prefere não pagar o custo de bloquear o recurso o tempo todo: **lock otimista**, com retry no caso raro de conflito.
- Se o recurso compartilhado não está no banco, ou envolve coordenar múltiplos serviços: **lock distribuído**.
- Se o domínio é financeiro e exige histórico, auditoria e reconciliação: considere trocar a abordagem inteira por um **Ledger** em vez de proteger um saldo mutável.

Um exemplo de aplicação dessas ideias com `@Transactional`, `@Version` e locks em Java/Spring:

```java
@Entity
class Account {

    @Id
    private Long id;

    private BigDecimal balance;

    @Version
    private Long version;
}
```

```java
@Transactional
public void credit(Long accountId, BigDecimal amount) {
    Account account = repository.findById(accountId)
        .orElseThrow();

    account.setBalance(account.getBalance().add(amount));
}
```

Vale um cuidado aqui: `@Transactional` sozinho garante atomicidade da transação (tudo ou nada), mas **não elimina** o lost update por si só. Sem `@Version` (lock otimista), `@Lock(LockModeType.PESSIMISTIC_WRITE)` (lock pessimista) ou uma atualização atômica no `UPDATE` gerado, duas transações concorrentes ainda podem ler o mesmo valor antigo e uma sobrescrever a outra.

## Recapitulando

- Race condition é quando o resultado depende da ordem de execuções concorrentes sobre um mesmo recurso compartilhado, tipicamente numa sequência ler → calcular → escrever.
- O problema clássico causado por isso é o **lost update**: uma escrita sobrescreve outra sem nenhum erro visível.
- Mesmo aplicações "single-threaded" sofrem race condition quando rodam em múltiplas instâncias, porque o controle de concorrência precisa acontecer numa camada compartilhada, geralmente o banco de dados.
- Execução sequencial resolve mas custa paralelismo; atualização atômica resolve bem casos simples; mutex protege dentro de um processo só; lock pessimista e otimista protegem entre instâncias diferentes usando o banco como fonte de verdade; lock distribuído resolve quando o recurso não está no banco.
- Para domínios financeiros com necessidade de auditoria, vale considerar trocar a abordagem por um [Ledger Pattern](/labs/web-dev/banco-de-dados/ledger-pattern/) em vez de proteger um saldo mutável.
