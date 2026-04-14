---
title: "Dual-Write Problem"
description: "Entenda o problema de escrita dupla e compare Outbox, CDC e event sourcing."
lastUpdated: 2026-04-13
sidebar:
  order: 12
tags: ["system design", "outbox", "cdc", "consistencia"]
---

O problema de dual-write acontece quando um sistema tenta **persistir a mesma mudanca em dois sistemas diferentes** ao mesmo tempo, por exemplo:

- Banco de dados + broker
- Banco + cache
- Dois bancos diferentes

## Por que isso acontece

### Falta de atomicidade distribuida

Nao existe transacao ACID entre banco e broker de forma confiavel em sistemas distribuidos.

```text
BEGIN TRANSACTION
  write DB
  publish event
COMMIT
```

### Falhas parciais

Entre as operacoes podem acontecer falha de rede, timeout, crash da aplicacao e retries duplicados.

### Retries sozinhos nao resolvem

Tentativas de correcao podem gerar eventos duplicados e efeitos colaterais inesperados.

## Impacto real

- Dados inconsistentes entre servicos
- Eventos fantasmas
- Quebra de invariantes de negocio
- Bugs dificeis de reproduzir

## Abordagens ingenuas

**So fazer dois writes**

```text
save DB
publish event
```

Nao garante consistencia.

**2PC**

Tem alta complexidade e baixa adocao em microsservicos modernos.

## Estrategias corretas

### Outbox Pattern

Persiste dados e evento no mesmo banco, na mesma transacao. Um processo separado le a tabela `outbox` e publica no broker.

**Vantagens**: atomicidade local, eventos nao se perdem, desacoplamento.

**Trade-offs**: latencia maior e complexidade operacional.

### CDC

Ferramentas como Debezium observam mudancas direto no banco.

**Vantagens**: transparente para a aplicacao.

**Desvantagens**: infraestrutura mais complexa.

### Listen to Yourself

O proprio servico publica e consome os eventos, derivando o estado a partir deles.

### Event Sourcing

Eventos se tornam a fonte de verdade:

```text
append event -> event store -> projecoes derivadas
```

## Comparacao

| Estrategia | Consistencia | Complexidade | Controle |
| --- | --- | --- | --- |
| Dual-write ingenuo | Nenhuma | Baixa | Baixo |
| 2PC | Forte | Muito alta | Alto |
| Outbox | Eventual | Media | Alto |
| CDC | Eventual | Alta | Medio |
| Event sourcing | Forte | Muito alta | Muito alto |

## Insight principal

> O problema nao e escrever duas vezes. E tentar garantir consistencia sem um mecanismo confiavel.

## Boas praticas

- Idempotencia em consumidores
- Retry seguro
- Ordenacao de eventos quando necessario
- Monitoramento de inconsistencias
- Dead letter queues

## Resumo

- Dual-write gera inconsistencias entre sistemas
- A causa principal e a falta de transacao distribuida
- Retry sozinho nao resolve
- Outbox, CDC e event sourcing sao caminhos reais

## Referencias

- [Bug da Escrita-Dupla: como EVITAR o Erro Fatal de Dual-Write em Sistemas Distribuidos | Leonardo Zamariola](https://www.youtube.com/watch?v=E_j__O7j07Y)

[Voltar ao indice](/web-dev-labs/indice/)
