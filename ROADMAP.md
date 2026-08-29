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
- 🚧 Segurança (authn/authz, mTLS, zero trust) e evolução/versionamento de API (`02-seguranca-e-evolucao-de-apis.md`, criada via `/labs-organize`, aguardando `/labs-fill`)
- 🚧 Outros estilos de comunicação: GraphQL, gRPC, WebSocket, SSE, Webhooks (`03-estilos-de-comunicacao.md`, criada via `/labs-organize`, aguardando `/labs-fill`)
- 🚧 Classificação por público: Open API (REST/SOAP/GraphQL), Internal API, Partner API (`04-classificacao-de-apis-por-publico.md`, criada via `/labs-organize`, aguardando `/labs-fill`)

### `banco-de-dados/`

- ✅ SQL (`01-sql.md`)
- ✅ ACID (`02-acid.md`)
- ✅ CAP Theorem (`03-teorema-de-cap.md`)
- ✅ PACELC (`04-teorema-de-pacelc.md`)
- ✅ Tabela de decisão prática de bancos por classificação PACELC (`05-escolha-de-banco-de-dados.md`)
- ✅ Isolation levels na prática: race conditions, locking pessimista/otimista, mutex (`06-controle-de-concorrencia.md`)
- ✅ Ledger Pattern (`07-ledger-pattern.md`)
- 🚧 NoSQL: key-value, document, wide-column, graph; SQL vs NoSQL (`08-nosql.md` criado via `/labs-organize`, aguardando `/labs-fill`)
- ✅ Postgres vs MySQL: arquitetura interna - motor único vs storage engines, processo vs thread, heap vs índice clusterizado, MVCC (heap tuple vs undo log), WAL vs redo/undo/binlog (`09-postgres-vs-mysql.md`, criada e preenchida via `/labs-organize`)
- ⬜ Índices e planos de execução
- ⬜ Data modeling (relacional vs NoSQL)

### Testing (`engenharia-de-software/`)

- 🚧 Pirâmide de testes, contract testing, Testcontainers, desafios de testar sistemas distribuídos (`02-testes-em-microsservicos.md`, criada via `/labs-organize`, aguardando `/labs-fill`)
- ⬜ Test doubles (mock, stub, spy, fake) em detalhe
- ⬜ TDD

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
- 🚧 Service Discovery: Eureka/Consul, client-side vs server-side discovery (`06-service-discovery.md`, criada via `/labs-organize`, aguardando `/labs-fill`)
- 🚧 API Gateway, incluindo BFF/agregação de requisições e adaptação de payload (`07-api-gateway.md`, seções de BFF e adaptação adicionadas via `/labs-organize`)
- 🚧 Cache, Redis, cache-aside, cache stampede (`08-cache-e-redis.md`)
- 🚧 Rate limiting (token bucket e outros algoritmos) e backpressure (`09-rate-limiting.md`)
- Notas `02`-`09` criadas via `/labs-organize`, aguardando `/labs-fill`

### `transacoes-distribuidas/`

- ✅ Consistência transacional: monolito vs microsserviços, orquestração vs coreografia (`01-consistencia-transacional.md`)
- ✅ Two-Phase Commit (2PC): coordenador/participantes, fases prepare-vote e commit-rollback, limitações, comparação com Saga (`02-two-phase-commit.md`, criada e preenchida via `/labs-organize`)
- ✅ Saga pattern em detalhe: tipos de passo, projeto de compensação, isolamento, coreografia vs orquestração aprofundadas (`03-saga.md`, renumerada de `02` e preenchida via `/labs-organize`)
- ✅ Dual-write problem, Outbox, CDC, Event Sourcing (`04-escrita-dupla.md`, renumerada de `03`)
- ✅ Transactional Outbox Pattern em detalhe (`05-outbox-pattern.md`, renumerada de `04`)

### `mensageria/` (criada via `/labs-organize`)

- 🚧 Filas, producer/consumer/broker, comunicação assíncrona (`01-filas-e-mensageria.md`)
- ✅ Kafka: topic, partition, offset, consumer group, replication, arquitetura de cluster (ISR, KRaft), fluxo de producer/consumer, acks, retenção/compactação, semânticas de entrega, tabela de configs e evolução de schema/Schema Registry (`02-kafka.md`, seções de arquitetura e operação adicionadas e preenchidas via `/labs-organize`)
- 🚧 RabbitMQ: exchanges, filas, bindings, push-based, comparação com Kafka (`03-rabbitmq.md`, criada via `/labs-organize`, aguardando `/labs-fill`)
- 🚧 DLQ, ordenação e semânticas de entrega (at-most/at-least/exactly-once) (`04-garantias-de-entrega.md`, renumerada de `03` para `04` via `/labs-organize`)
- `01`, `03` e `04` aguardando `/labs-fill`
- ⬜ SQS/SNS em detalhe (fora do escopo desta rodada)

### `resiliencia/` (criada via `/labs-organize`)

- 🚧 Timeout, retry (exponential backoff, jitter), circuit breaker, bulkhead, graceful degradation (`01-timeout-retry-circuit-breaker-e-bulkhead.md`)
- 🚧 Idempotência: idempotency key, idempotency store, exemplos (`02-idempotencia.md`)
- 🚧 Disponibilidade: SLA/SLO/SLI, os "noves", redundância, failover, multi-region, DR (`03-disponibilidade.md`)
- Todas aguardando `/labs-fill`

### `microsservicos/` (criada via `/labs-organize`)

- 🚧 Fundamentos: monólito vs microsserviços, stateless services, Strangler Fig Pattern, cinco princípios de design (serviços independentes, fronteiras de negócio, regra das 2 pizzas, smart endpoints/dumb pipes, sync vs async) (`01-fundamentos-de-microsservicos.md`, seções de Strangler Fig e princípios de design adicionadas via `/labs-organize`)
- 🚧 Decomposição de serviços, DDD/bounded context, database per service (`02-decomposicao-e-bounded-context.md`, criada via `/labs-organize`, aguardando `/labs-fill`)
- 🚧 Comunicação síncrona/assíncrona, service-to-service (timeouts, retries, circuit breaker, bulkhead) (`03-comunicacao-entre-servicos.md`, renumerada de `02` para `03`)
- 🚧 Config Server e endpoints operacionais (Actuator/health/metrics) (`04-config-server-e-endpoints-operacionais.md`, criada via `/labs-organize`, aguardando `/labs-fill`)
- Todas aguardando `/labs-fill`
- ⬜ Service mesh (BFF e adaptação de payload já cobertos em `escalabilidade/07-api-gateway.md`)

### `observabilidade/` (criada via `/labs-organize`)

- 🚧 Logs, metrics, traces, correlação (correlation ID/trace ID), observabilidade distribuída (`01-logs-metrics-e-traces.md`, aguardando `/labs-fill`)
- 🚧 Ferramentas: Zipkin, Prometheus, Grafana, ELK Stack, OpenTelemetry, pipeline de observabilidade (`02-ferramentas-de-observabilidade.md`, criada via `/labs-organize`, aguardando `/labs-fill`)

### `entrega-continua/` (criada via `/labs-organize`)

- 🚧 Docker: containers, Dockerfile, Docker Compose (`01-docker.md`, aguardando `/labs-fill`)
- 🚧 Kubernetes: pods, deployments, services, configmap/secret, ingress (`02-kubernetes.md`, aguardando `/labs-fill`)
- 🚧 CI/CD para microsserviços: etapas do pipeline, boas práticas (`03-ci-cd-para-microsservicos.md`, aguardando `/labs-fill`)
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

- Segurança (authn/authz, OWASP, OAuth2, JWT) ganhou uma primeira cobertura em `apis/02-seguranca-e-evolucao-de-apis.md`. Performance ainda aparece espalhada nas notas que já a usam na prática (ex: índices dentro de Databases).
- Prioridade sugerida: fechar os stubs vazios (SOLID) antes de abrir pastas novas.
