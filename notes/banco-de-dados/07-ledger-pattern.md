# Ledger Pattern

A nota de [Controle de Concorrência e Race Conditions](/labs/web-dev/banco-de-dados/controle-de-concorrencia/) mostra várias formas de proteger um saldo contra atualizações concorrentes: execução sequencial, atualização atômica, mutex, locks pessimistas e otimistas. Todas elas partem da mesma ideia: existe **um campo mutável** (o saldo) que duas execuções disputam para escrever, e o trabalho é impedir que uma pise na outra.

O Ledger propõe outra saída: em vez de proteger o campo mutável, **eliminar o campo mutável**. Isso o torna, na prática, um parente próximo do [Event Sourcing](/labs/web-dev/transacoes-distribuidas/escrita-dupla/) (já visto na nota de Dual-Write Problem): ao invés de guardar apenas o estado atual, o sistema guarda a sequência de eventos que levou até ele, e trata essa sequência como a fonte da verdade.

## O que é um ledger

Um ledger (livro-razão) não armazena um saldo único que é sobrescrito a cada operação. Ele armazena **todas as movimentações**, uma atrás da outra, e nunca apaga ou sobrescreve uma movimentação já registrada:

```text
Conta criada:        R$ 0
Venda de uvas:      +R$ 20
Venda de azeitonas: +R$ 30
```

O saldo deixa de ser um dado guardado diretamente, e passa a ser **calculado**, como a soma de todas as movimentações:

```text
saldo = soma de todas as transacoes da conta
```

## Por que isso resolve o problema de concorrência

Lembrando as quatro condições de uma race condition, vistas na nota anterior: dois ou mais processos, acessando um recurso compartilhado, pelo menos um alterando esse recurso, numa sequência ler → calcular → escrever que não é atômica.

Com o ledger, a quarta condição deixa de existir. Cada operação concorrente não lê mais um saldo, calcula um novo valor e sobrescreve um campo compartilhado. Ela apenas **insere uma nova linha independente** na tabela de movimentações:

```text
Processo A: INSERT movimentacao (+30)
Processo B: INSERT movimentacao (+20)
```

Não importa qual das duas operações chega no banco primeiro. Um `INSERT` não sobrescreve o outro, ambos coexistem, e o saldo final (a soma) está correto de qualquer jeito:

```text
0 + 20 + 30 = 50   (venda de uvas antes)
0 + 30 + 20 = 50   (venda de azeitonas antes)
```

A disputa por "quem escreve por último" desaparece, porque não existe mais um único valor para escrever por cima. A concorrência que antes era um problema (duas escritas competindo pelo mesmo campo) vira, no ledger, duas inserções independentes que nunca colidem.

## Benefícios

- **Histórico completo** de tudo que já aconteceu com a conta, não só o estado atual.
- **Auditabilidade**: dá para provar como o sistema chegou a um determinado saldo, movimentação por movimentação.
- **Rastreabilidade financeira**: cada centavo tem uma origem registrada.
- **Reconstrução do saldo** a qualquer momento, inclusive recalculando o passado se for preciso investigar um bug.
- **Maior aderência a sistemas financeiros** de verdade, que raramente confiam só num número guardado, precisam do extrato por trás dele.
- **Detecção de divergências**: se o saldo "oficial" guardado em algum lugar não bater com a soma das transações, isso é um sinal de bug, e o ledger dá o material para investigar.

## Saldo materializado e snapshots

Recalcular a soma de todas as transações desde o início da conta, toda vez que alguém precisa consultar o saldo, fica caro conforme o histórico cresce. Por isso, na prática, sistemas baseados em ledger costumam manter uma versão otimizada do saldo ao lado da tabela de transações:

- Uma **visão materializada** do saldo, atualizada conforme novas transações chegam.
- Um **snapshot** periódico (por exemplo, o saldo consolidado no fim de cada dia).
- O saldo atual calculado como `snapshot mais recente + transações depois do snapshot`, em vez de somar tudo desde o início.

```text
Snapshot de ontem:  R$ 1.950
Transacao de hoje:  +R$ 50
Saldo atual:        R$ 2.000
```

Nesse modelo, o **saldo materializado é uma projeção otimizada** para leitura rápida, mas continua sendo derivado das transações. A tabela de transações continua sendo a **fonte de verdade**, o saldo materializado é só uma otimização de performance por cima dela, que pode (e deve) ser recalculado e conferido periodicamente contra o total das transações.

Vale notar: manter uma tabela de saldo junto de uma tabela de transações, corrigindo divergências entre elas periodicamente, já é, na prática, reproduzir os princípios de um ledger, mesmo sem chamar o desenho dessa forma.

## Quando vale a pena

O Ledger custa mais complexidade arquitetural do que simplesmente proteger um saldo com lock (veja [Controle de Concorrência](/labs/web-dev/banco-de-dados/controle-de-concorrencia/)), então não é a escolha padrão para qualquer contador. Ele compensa quando:

- O domínio é financeiro, ou envolve qualquer coisa que precise de auditoria (dinheiro, créditos, pontos, estoque com rastreabilidade).
- É importante conseguir responder "como chegamos nesse número?", não só "qual é o número agora?".
- Divergências entre sistemas precisam ser detectáveis e investigáveis depois do fato.

Para um contador simples sem essas exigências (curtidas de um post, visualizações de uma página), uma atualização atômica ou um lock continuam sendo soluções mais simples e suficientes.

## Recapitulando

- O Ledger troca "proteger um saldo mutável" por "eliminar o saldo mutável": em vez de guardar o estado atual, guarda a sequência de movimentações que leva até ele.
- O saldo passa a ser calculado (soma das transações), não armazenado diretamente.
- Isso resolve concorrência porque cada operação vira uma inserção independente, que nunca sobrescreve outra, em vez de uma disputa por um único campo.
- Os benefícios (histórico, auditoria, rastreabilidade, detecção de divergência) vêm ao custo de mais complexidade arquitetural.
- Para não pagar o custo de recalcular tudo do zero a cada consulta, sistemas reais mantêm um saldo materializado (projeção otimizada) por cima da tabela de transações (fonte de verdade), geralmente com snapshots periódicos.
- O padrão é conceitualmente o mesmo do [Event Sourcing](/labs/web-dev/transacoes-distribuidas/escrita-dupla/), aplicado especificamente ao domínio financeiro.
