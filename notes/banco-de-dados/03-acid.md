# ACID

ACID é um acrônimo que descreve quatro garantias que uma transação em banco de dados relacional deve oferecer: **A**tômica, **C**onsistente, **I**solada e **D**urável. São essas garantias que permitem confiar que os dados vão continuar corretos mesmo quando várias operações acontecem ao mesmo tempo, ou quando algo dá errado no meio do caminho (uma queda de energia, um erro de rede, um crash da aplicação).

Uma **transação** é um conjunto de operações que deve ser tratado como uma única unidade de trabalho: ou todas as operações acontecem, ou nenhuma acontece. O exemplo clássico é uma transferência bancária: tirar dinheiro da conta A e colocar na conta B precisa acontecer como um bloco único, nunca como dois passos separados e independentes.

```sql
BEGIN;

UPDATE contas SET saldo = saldo - 500 WHERE id = 1; -- sai da conta A
UPDATE contas SET saldo = saldo + 500 WHERE id = 2; -- entra na conta B

COMMIT;
```

A sintaxe de `BEGIN`, `COMMIT` e `ROLLBACK` está detalhada na nota de [SQL](/labs/web-dev/banco-de-dados/01-sql/). Aqui o foco é entender o que cada letra do ACID garante.

## Atômica (Atomicity)

Atomicidade significa **tudo ou nada**. Se uma transação tem vários passos e qualquer um deles falha, o banco desfaz (`ROLLBACK`) tudo o que já tinha sido feito até ali, como se nada tivesse acontecido.

```
Transação: transferir R$500 da conta A para a conta B

Passo 1: retirar R$500 de A   [OK]
Passo 2: depositar R$500 em B [FALHOU]

Resultado: TUDO desfeito. A conta A volta a ter o valor original.
```

Sem atomicidade, poderia acontecer o pior cenário possível: o dinheiro sai da conta A, mas por causa de uma falha nunca chega na conta B. Ele simplesmente desaparece.

## Consistente (Consistency)

Consistência garante que uma transação só leva o banco de um **estado válido** para outro **estado válido**, respeitando todas as regras definidas (chaves estrangeiras, `UNIQUE`, `CHECK`, `NOT NULL`, etc.). Se uma transação violar alguma dessas regras, ela é rejeitada por inteiro.

Por exemplo, se existe uma regra de que o saldo de uma conta nunca pode ficar negativo, o banco impede que uma transação termine com um saldo negativo, mesmo que a atomicidade e o isolamento estejam funcionando perfeitamente. A consistência é sobre **manter as regras de negócio verdadeiras**, não apenas sobre executar os passos corretamente.

## Isolada (Isolation)

Isolamento é a garantia de que cada transação roda como se fosse a **única transação no banco naquele momento**, mesmo que, na prática, existam várias transações concorrentes acontecendo ao mesmo tempo. Uma transação não deve enxergar dados "no meio do caminho" de outra transação que ainda não terminou.

É por isso que o tópico também costuma ser descrito como "independência": transações concorrentes precisam se comportar de forma independente umas das outras, sem interferir nos resultados umas das outras.

Quando o isolamento é fraco, alguns problemas clássicos podem aparecer:

| Fenômeno            | O que acontece                                                                 |
| ------------------- | ------------------------------------------------------------------------------ |
| Dirty read          | Ler um dado que outra transação ainda não deu `COMMIT` (e pode dar `ROLLBACK`) |
| Non-repeatable read | Ler o mesmo registro duas vezes na mesma transação e obter valores diferentes  |
| Phantom read        | Repetir a mesma consulta e ver linhas novas que outra transação inseriu        |

Bancos de dados oferecem **níveis de isolamento**, que trocam consistência entre transações por performance:

| Nível de isolamento | Dirty read | Non-repeatable read | Phantom read |
| ------------------- | :--------: | :-----------------: | :----------: |
| Read Uncommitted    |  Possível  |      Possível       |   Possível   |
| Read Committed      |  Evitado   |      Possível       |   Possível   |
| Repeatable Read     |  Evitado   |       Evitado       |   Possível   |
| Serializable        |  Evitado   |       Evitado       |   Evitado    |

Quanto mais alto o nível de isolamento, mais segurança contra esses fenômenos, mas também mais lentidão, já que o banco precisa bloquear ou controlar mais acessos concorrentes. Na prática, a maioria das aplicações usa `Read Committed` (padrão no PostgreSQL) como equilíbrio razoável entre segurança e performance.

## Durável (Durability)

Durabilidade garante que, uma vez que uma transação deu `COMMIT`, os dados estão salvos **permanentemente**, mesmo que o banco caia, a energia acabe ou o servidor reinicie logo em seguida. Não existe cenário em que um `COMMIT` confirmado "some" depois.

Na prática, os bancos garantem isso escrevendo as mudanças em um **write-ahead log (WAL)** em disco antes de confirmar o `COMMIT` para quem fez a requisição, e muitas vezes replicando esses dados para outras máquinas. Assim, mesmo que a máquina principal falhe fisicamente, os dados confirmados não são perdidos.

## ACID na prática

| Letra | Garante                                   | Pergunta que responde                                    |
| ----- | ----------------------------------------- | -------------------------------------------------------- |
| A     | Tudo ou nada                              | A transação terminou por completo ou não mudou nada?     |
| C     | Regras de negócio sempre respeitadas      | O banco continua num estado válido depois?               |
| I     | Transações concorrentes não se atrapalham | Uma transação vê efeitos de outra ainda incompleta?      |
| D     | Mudanças confirmadas são permanentes      | Os dados sobrevivem a uma falha logo depois do `COMMIT`? |

# Recapitulando

- ACID é um conjunto de garantias que tornam transações em banco de dados relacional confiáveis.
- Atômica: a transação acontece por inteiro ou não acontece.
- Consistente: a transação nunca deixa o banco num estado que viole as regras definidas.
- Isolada (independente): transações concorrentes não interferem nos resultados umas das outras.
- Durável: depois do `COMMIT`, o dado está salvo mesmo que o sistema falhe em seguida.
