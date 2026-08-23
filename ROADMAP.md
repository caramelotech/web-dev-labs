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
- ✅ CAP Theorem (`03-teorema-de-cap.md`)
- ✅ PACELC (`04-teorema-de-pacelc.md`)
- ✅ Tabela de decisão prática de bancos por classificação PACELC (`05-escolha-de-banco-de-dados.md`)
- ✅ Isolation levels na prática: race conditions, locking pessimista/otimista, mutex (`06-controle-de-concorrencia.md`)
- ✅ Ledger Pattern (`07-ledger-pattern.md`)
- 🚧 NoSQL: key-value, document, wide-column, graph; SQL vs NoSQL (`08-nosql.md` criado via `/labs-organize`, aguardando `/labs-fill`)
- ⬜ Índices e planos de execução
- ⬜ Data modeling (relacional vs NoSQL)

### Testing (pasta ainda não criada, ex: `testes/`)

- ⬜ Unit tests
- ⬜ Integration tests, E2E, contract tests
- ⬜ Test doubles (mock, stub, spy, fake)
- ⬜ Test pyramid e TDD

## Trilha 2: System Design

### `system-design/` (criada via `/labs-organize`)

- 🚧 O que é System Design, requisitos funcionais/não funcionais, pilares (escalabilidade, disponibilidade, confiabilidade, consistência, latência, throughput, custo) (`01-o-que-e-system-design.md`)
- 🚧 Arquitetura de referência de uma aplicação distribuída (`02-arquitetura-de-referencia.md`)
- 🚧 Capacity planning e capacity math (`03-capacity-planning.md`)
- 🚧 Latência, throughput, performance e latency budget (`04-latencia-e-performance.md`)
- 🚧 Trade-offs arquiteturais (`05-trade-offs-arquiteturais.md`)
- 🚧 Metodologia de design + failure scenarios + catálogo de padrões (`06-metodologia-de-design.md`)
- Todas aguardando `/labs-fill`

### `sistemas-distribuidos/` (criada via `/labs-organize`)

- ✅ CAP Theorem e PACELC (cobertos em `banco-de-dados/03-teorema-de-cap.md` e `04-teorema-de-pacelc.md`, não nesta pasta)
- 🚧 Consistência (strong/eventual) e replicação: read-after-write, replication lag, quorum (`01-consistencia-e-replicacao.md`, aguardando `/labs-fill`)
- ⬜ Consistência causal
- ⬜ Consensus (Raft/Paxos) em profundidade

### `escalabilidade/` (rótulo do sidebar: "Escalabilidade e Infraestrutura")

- ✅ Escala vertical, horizontal e organizacional (`01-escalabilidade.md`)
- 🚧 Stateless, particionamento, sharding, leitura vs escrita, gargalos (`02-stateless-e-particionamento.md`)
- 🚧 Replicação e escalabilidade do banco, database bottlenecks (`03-replicacao-de-banco-de-dados.md`)
- 🚧 CDN (`04-cdn.md`)
- 🚧 Load balancer, incl. consistent hashing (`05-load-balancer.md`)
- 🚧 API Gateway (`06-api-gateway.md`)
- 🚧 Cache, Redis, cache-aside, cache stampede (`07-cache-e-redis.md`)
- 🚧 Rate limiting (token bucket e outros algoritmos) e backpressure (`08-rate-limiting.md`)
- Notas `02`-`08` criadas via `/labs-organize`, aguardando `/labs-fill`

### `transacoes-distribuidas/`

- ✅ Consistência transacional: monolito vs microsserviços, orquestração vs coreografia (`01-consistencia-transacional.md`)
- 🚧 Saga pattern em detalhe (`02-saga.md` existe, vazio - a nota `01` já cobre o básico, esta seria um aprofundamento dedicado)
- ✅ Dual-write problem, Outbox, CDC, Event Sourcing (`03-escrita-dupla.md`)
- ✅ Transactional Outbox Pattern em detalhe (`04-outbox-pattern.md`)
- ⬜ Two-Phase Commit (2PC)

### `mensageria/` (criada via `/labs-organize`)

- 🚧 Filas, producer/consumer/broker, comunicação assíncrona (`01-filas-e-mensageria.md`)
- 🚧 Kafka: topic, partition, offset, consumer group, replication (`02-kafka.md`)
- 🚧 DLQ, ordenação e semânticas de entrega (at-most/at-least/exactly-once) (`03-garantias-de-entrega.md`)
- Todas aguardando `/labs-fill`
- ⬜ RabbitMQ, SQS/SNS em detalhe (fora do escopo desta rodada)

### `resiliencia/` (criada via `/labs-organize`)

- 🚧 Timeout, retry (exponential backoff, jitter), circuit breaker, bulkhead, graceful degradation (`01-timeout-retry-circuit-breaker-e-bulkhead.md`)
- 🚧 Idempotência: idempotency key, idempotency store, exemplos (`02-idempotencia.md`)
- 🚧 Disponibilidade: SLA/SLO/SLI, os "noves", redundância, failover, multi-region, DR (`03-disponibilidade.md`)
- Todas aguardando `/labs-fill`

### `microsservicos/` (criada via `/labs-organize`)

- 🚧 Fundamentos: monólito vs microsserviços, stateless services (`01-fundamentos-de-microsservicos.md`)
- 🚧 Comunicação síncrona/assíncrona, service-to-service (service discovery, timeouts, retries, circuit breaker, bulkhead) (`02-comunicacao-entre-servicos.md`)
- Ambas aguardando `/labs-fill`
- ⬜ API Gateway aprofundado, BFF, service mesh (API Gateway básico já está em `escalabilidade/06-api-gateway.md`)
- ⬜ Database per service
- ⬜ Strangler Fig Pattern

### `observabilidade/` (criada via `/labs-organize`)

- 🚧 Logs, metrics, traces, correlação (correlation ID/trace ID), observabilidade distribuída (`01-logs-metrics-e-traces.md`, aguardando `/labs-fill`)

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
