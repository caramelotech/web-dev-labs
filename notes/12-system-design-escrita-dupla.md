# O Dual-Write Problem

O problema de _dual-write_ acontece quando um sistema tenta **persistir a mesma mudança em dois sistemas diferentes** ao mesmo tempo, por exemplo:

- Banco de dados + broker (Kafka)
- Banco + cache
- Dois bancos diferentes

Exemplo clássico:

```text
1. Salva no banco ✅
2. Publica evento no Kafka ❌ (falha)
```

> O estado do sistema fica inconsistente (fonte de verdade ≠ eventos)

Esse é um dos bugs mais difíceis de detectar em sistemas distribuídos.

## Por que esse problema acontece

### 1. Falta de atomicidade distribuída

Não existe **transação ACID entre banco + broker**. Simplesmente não é possível fazer:

```text
BEGIN TRANSACTION
  write DB
  publish event
COMMIT
```

de forma confiável em sistemas distribuídos.

### 2. Falhas parciais são inevitáveis

Entre as operações podem acontecer: falha de rede, timeout, crash da aplicação, retry duplicado. Um lado executa, o outro não.

### 3. Retries pioram o problema

Tentativas de correção podem gerar eventos duplicados, escritas inconsistentes e efeitos colaterais inesperados.

## Impacto real no sistema

- Dados inconsistentes entre serviços
- Eventos "fantasmas" ou inexistentes
- Quebra de invariantes de negócio
- Bugs difíceis de reproduzir

> Você perde a **fonte única de verdade (source of truth)**

## Abordagens ingênuas (e por que falham)

**"Só fazer dois writes"**

```text
save DB
publish event
```

Não garante consistência e falha em cenários reais.

**Transações distribuídas (2PC)**

Complexas, baixa performance e pouco usadas em microsserviços modernos. Alto acoplamento + baixa resiliência.

## Estratégias corretas

### 1. Outbox Pattern (principal solução)

Persiste **dados + evento no mesmo banco, na mesma transação**:

1. Escreve no banco: dados do domínio + evento na tabela `outbox`
2. Um processo separado lê a `outbox` e publica no broker

**Vantagens**: atomicidade garantida (via banco), não perde eventos, desacoplamento entre persistência e publicação.

**Trade-offs**: latência maior (eventual consistency), complexidade operacional (worker/relay).

### 2. CDC (Change Data Capture)

Observa mudanças direto no banco (binlog, WAL). Ferramentas como Debezium leem logs do banco e transformam mudanças em eventos.

**Vantagens**: transparente para a aplicação, sem necessidade de alterar código.

**Desvantagens**: infra mais complexa, menor controle semântico.

### 3. "Listen to Yourself"

O próprio serviço publica um evento e consome esse mesmo evento. Garante que o estado do sistema seja derivado dos eventos. Aumenta complexidade mental e exige arquitetura bem desenhada (event-driven).

### 4. Event Sourcing

Eventos são a **fonte de verdade**. Não existe "dual write" porque você não escreve em dois lugares - só escreve eventos.

```text
append event → event store → projeções derivadas
```

**Vantagens**: consistência forte baseada em eventos, auditabilidade completa.

**Desvantagens**: alta complexidade, curva de aprendizado, debug mais difícil.

## Comparação das estratégias

| Estratégia         | Consistência  | Complexidade | Controle   |
| ------------------ | ------------- | ------------ | ---------- |
| Dual write ingênuo | Nenhuma       | Baixa        | Baixo      |
| 2PC                | Forte         | Muito alta   | Alto       |
| Outbox             | Eventual      | Média        | Alto       |
| CDC                | Eventual      | Alta         | Médio      |
| Event sourcing     | Forte         | Muito alta   | Muito alto |

## Insight principal

> O problema não é escrever duas vezes - é tentar garantir consistência sem um mecanismo confiável.

O erro está no modelo mental, não na implementação.

## Boas práticas

- Idempotência em consumidores
- Retry seguro
- Ordenação de eventos (quando necessário)
- Monitoramento de inconsistência
- Dead letter queues

## Resumo

- Dual-write = inconsistência entre sistemas
- Causa: falta de transação distribuída
- Solução NÃO é retry ou "fé"

Soluções reais:

- Outbox (mais usado)
- CDC (infra-driven)
- Event sourcing (arquitetural)

> "Em sistemas distribuídos, nunca confio em dois writes independentes - sempre garanto atomicidade local e consistência eventual."

## Referências

- [Bug da Escrita-Dupla: como EVITAR o Erro Fatal de Dual-Write em Sistemas Distribuídos | Leonardo Zamariola](https://www.youtube.com/watch?v=E_j__O7j07Y)

**[← Voltar ao índice](README.md)**
