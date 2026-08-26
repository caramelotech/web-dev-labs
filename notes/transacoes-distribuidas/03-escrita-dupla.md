# Dual-Write Problem

O problema de dual-write acontece quando um sistema tenta **persistir a mesma mudança em dois sistemas diferentes** ao mesmo tempo, por exemplo:

- Banco de dados + broker
- Banco + cache
- Dois bancos diferentes

## Por que isso acontece

### Falta de atomicidade distribuída

Não existe transação ACID entre banco e broker de forma confiável em sistemas distribuídos.

```text
BEGIN TRANSACTION
  write DB
  publish event
COMMIT
```

### Falhas parciais

Entre as operações podem acontecer falha de rede, timeout, crash da aplicação e retries duplicados.

### Retries sozinhos não resolvem

Tentativas de correção podem gerar eventos duplicados e efeitos colaterais inesperados.

## Impacto real

- Dados inconsistentes entre serviços
- Eventos fantasmas
- Quebra de invariantes de negócio
- Bugs difíceis de reproduzir

## Abordagens ingênuas

**Só fazer dois writes**

```text
save DB
publish event
```

Não garante consistência.

**2PC**

Tem alta complexidade e baixa adoção em microsserviços modernos.

## Estratégias corretas

### Outbox Pattern

Persiste dados e evento no mesmo banco, na mesma transação. Um processo separado lê a tabela `outbox` e publica no broker. Aprofundamento dedicado em [Transactional Outbox Pattern](/labs/web-dev/transacoes-distribuidas/04-outbox-pattern/).

**Vantagens**: atomicidade local, eventos não se perdem, desacoplamento.

**Trade-offs**: latência maior e complexidade operacional.

### CDC

Ferramentas como Debezium observam mudanças direto no banco.

**Vantagens**: transparente para a aplicação.

**Desvantagens**: infraestrutura mais complexa.

### Listen to Yourself

O próprio serviço publica e consome os eventos, derivando o estado a partir deles.

### Event Sourcing

Eventos se tornam a fonte de verdade:

```text
append event -> event store -> projecoes derivadas
```

## Comparação

| Estratégia         | Consistência | Complexidade | Controle   |
| ------------------ | ------------ | ------------ | ---------- |
| Dual-write ingênuo | Nenhuma      | Baixa        | Baixo      |
| 2PC                | Forte        | Muito alta   | Alto       |
| Outbox             | Eventual     | Média        | Alto       |
| CDC                | Eventual     | Alta         | Médio      |
| Event sourcing     | Forte        | Muito alta   | Muito alto |

## Insight principal

> O problema não é escrever duas vezes. É tentar garantir consistência sem um mecanismo confiável.

## Boas práticas

- Idempotência em consumidores
- Retry seguro
- Ordenação de eventos quando necessário
- Monitoramento de inconsistências
- Dead letter queues

## Resumo

- Dual-write gera inconsistências entre sistemas
- A causa principal é a falta de transação distribuída
- Retry sozinho não resolve
- Outbox, CDC e event sourcing são caminhos reais

## Referências

- [Bug da Escrita-Dupla: como EVITAR o Erro Fatal de Dual-Write em Sistemas Distribuidos | Leonardo Zamariola](https://www.youtube.com/watch?v=E_j__O7j07Y)
