# Roadmap de conteúdo

Backlog de próximos tópicos para o Web Dev Labs, organizado para estudo de entrevista de backend pleno. Baseado na trilha Engenharia de Software → System Design definida em conversa com o usuário. Não é publicado no site (só `notes/` e `sidebar.json` são publicados).

Legenda: ✅ nota existe e tem conteúdo · 🚧 pasta/arquivo criado mas vazio (stub) · ⬜ ainda não iniciado

## Trilha 1: Engenharia de Software

### `fundamentos/` (já existe, mas cobre HTML/CSS - fundamentos de front-end, não de programação)

- ⬜ Considerar se algoritmos, estruturas de dados e complexidade (Big O) merecem pasta própria (`algoritmos-e-estruturas-de-dados/`) ou se ficam fora do escopo deste lab

### `engenharia-de-software/`

- 🚧 SOLID (`01-solid.md` existe, vazio)
- ⬜ DRY, KISS, YAGNI
- ⬜ Clean Code e code smells
- ⬜ Refactoring
- ⬜ Cohesion, Coupling, Separation of Concerns
- ⬜ Composition vs Inheritance
- ⬜ Design Patterns - Creational (Factory, Builder, Singleton)
- ⬜ Design Patterns - Structural (Adapter, Decorator, Facade, Proxy)
- ⬜ Design Patterns - Behavioral (Strategy, Observer, Command, Template Method, Chain of Responsibility)
- ⬜ Padrões de backend: Repository, Service Layer, Dependency Injection, Unit of Work
- ⬜ Arquitetura de software: Layered, Hexagonal, Clean Architecture, Onion
- ⬜ Domain-Driven Design (Bounded Context, Aggregates, Entities, Value Objects)
- ⬜ Modular Monolith

### `apis/`

- ✅ HTTP e REST (`01-http-rest.md`)
- ⬜ Versionamento de API
- ⬜ gRPC
- ⬜ GraphQL

### `banco-de-dados/`

- ✅ SQL (`01-sql.md`)
- ✅ ACID (`02-acid.md`)
- ⬜ Índices e planos de execução
- ⬜ Isolation levels na prática (deadlocks, locking)
- ⬜ NoSQL: key-value, document, wide-column, graph
- ⬜ Data modeling (relacional vs NoSQL)

### Testing (pasta ainda não criada, ex: `testes/`)

- ⬜ Unit tests
- ⬜ Integration tests, E2E, contract tests
- ⬜ Test doubles (mock, stub, spy, fake)
- ⬜ Test pyramid e TDD

## Trilha 2: System Design

### Distributed Systems (pasta ainda não criada, ex: `sistemas-distribuidos/`)

- ⬜ CAP Theorem e PACELC
- ⬜ Consistência: strong, eventual, causal
- ⬜ Replication (leader/follower), consensus, quorum

### `escalabilidade/`

- ✅ Escala vertical, horizontal e organizacional (`01-escalabilidade.md`)
- ⬜ Load balancing
- ⬜ Sharding e partitioning
- ⬜ Consistent hashing
- ⬜ CDN e cache
- ⬜ Rate limiting e backpressure

### `transacoes-distribuidas/`

- ✅ Consistência transacional: monolito vs microsserviços, orquestração vs coreografia (`01-consistencia-transacional.md`)
- 🚧 Saga pattern em detalhe (`02-saga.md` existe, vazio - a nota `01` já cobre o básico, esta seria um aprofundamento dedicado)
- ✅ Dual-write problem, Outbox, CDC, Event Sourcing (`03-escrita-dupla.md`)
- ⬜ Two-Phase Commit (2PC)

### Messaging (pasta ainda não criada, ex: `mensageria/`)

- ⬜ Message queues, Pub/Sub, event streaming
- ⬜ Kafka, RabbitMQ, SQS/SNS
- ⬜ Delivery semantics (at-most-once, at-least-once, exactly-once)
- ⬜ Ordering, consumer groups, dead letter queue, idempotência

### Resilience (pasta ainda não criada, ex: `resiliencia/`)

- ⬜ Timeout, retry, exponential backoff
- ⬜ Circuit breaker, bulkhead
- ⬜ Graceful degradation, failover, disaster recovery

### Microservices (pasta ainda não criada, ex: `microsservicos/`)

- ⬜ Service boundaries, service discovery
- ⬜ API Gateway, BFF, service mesh
- ⬜ Database per service
- ⬜ Strangler Fig Pattern

### Observability (pasta ainda não criada, ex: `observabilidade/`)

- ⬜ Logs, metrics, traces
- ⬜ Distributed tracing, correlation ID
- ⬜ SLI, SLO, SLA

### Cloud & Infra (pasta ainda não criada, ex: `cloud-e-infra/`)

- ⬜ Containers e Kubernetes
- ⬜ Categorias de serviço AWS (compute, storage, rede) - sem precisar aprofundar em cada serviço
- ⬜ IaC (Terraform)

### `estudos-de-caso/`

- ✅ Encurtador de URL (`01-encurtador-de-url.md`)
- ⬜ Rate Limiter
- ⬜ Notification System
- ⬜ Payment System
- ⬜ Sistema de feed / rede social
- ⬜ Plataforma de streaming

## Notas de escopo

- Segurança (authn/authz, OWASP, OAuth2, JWT) e Performance aparecem em ambas as trilhas no material original. Avaliar se cada uma merece pasta própria ou se ficam distribuídas dentro das notas que já as usam na prática (ex: JWT dentro de APIs, índices dentro de Databases).
- Prioridade sugerida: fechar os stubs vazios (SOLID, Saga) antes de abrir pastas novas.
