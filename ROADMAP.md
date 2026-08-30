# Roadmap de conteúdo

Backlog do Web Dev Labs, organizado para estudo de entrevista de backend pleno. Baseado na trilha Engenharia de Software → System Design definida em conversa com o usuário. Não é publicado no site (só `notes/` e `sidebar.json` são publicados).

Este arquivo lista o **escopo de cada seção** e o **que ainda falta cobrir** (itens ⬜). O que já existe está em `notes/` - não replicamos aqui a lista de notas prontas, e adicionar uma nota dentro de um escopo já descrito não exige atualizar este arquivo, só remover o item do backlog se ele estava lá.

Algumas notas em `notes/` ainda são esqueleto (só headings, sem conteúdo). Para completá-las de uma vez, rode `/labs-fill notes/`.

## Trilha 1: Engenharia de Software

### `fundamentos/`

Escopo: fundamentos de front-end (HTML e CSS). Não cobre fundamentos de programação.

- ⬜ Decidir se algoritmos, estruturas de dados e complexidade (Big O) entram neste lab (pasta própria `algoritmos-e-estruturas-de-dados/`) ou ficam fora do escopo

### `engenharia-de-software/`

Escopo: design e qualidade de código, princípios, padrões de projeto e testes.

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
- ⬜ Test doubles (mock, stub, spy, fake) em detalhe
- ⬜ TDD

### `apis/`

Escopo: projeto de APIs - protocolos, estilos de comunicação, segurança e evolução.

Sem lacunas planejadas no momento.

### `banco-de-dados/`

Escopo: bancos relacionais e NoSQL - modelo, garantias transacionais, concorrência e arquitetura interna das engines.

- ⬜ Índices e planos de execução
- ⬜ Data modeling (relacional vs NoSQL)

## Trilha 2: System Design

### `system-design/`

Escopo: projeto de sistemas - fundamentos, capacity planning, latência, trade-offs e metodologia.

Sem lacunas planejadas no momento.

### `sistemas-distribuidos/`

Escopo: consistência, replicação e coordenação entre nós. CAP e PACELC ficam em `banco-de-dados/`.

- ⬜ Consistência causal

### `escalabilidade/` (rótulo do sidebar: "Escalabilidade e Infraestrutura")

Escopo: escalar carga e a infraestrutura que sustenta isso - particionamento, replicação, CDN, load balancer, service discovery, API Gateway, cache, rate limiting.

Sem lacunas planejadas no momento.

### `transacoes-distribuidas/`

Escopo: manter dados coerentes entre serviços sem uma transação única - consistência transacional, 2PC, Saga, dual-write, Outbox, CDC, Event Sourcing.

Sem lacunas planejadas no momento.

### `mensageria/`

Escopo: comunicação assíncrona - arquitetura orientada a eventos, filas, brokers (Kafka, RabbitMQ), evolução de schema, garantias de entrega, idempotência e casos de uso.

- ⬜ SQS/SNS em detalhe (fora do escopo desta rodada)

### `resiliencia/`

Escopo: padrões para o sistema aguentar falha - timeout, retry, circuit breaker, bulkhead, idempotência, disponibilidade (SLA/SLO/SLI, failover, DR).

Sem lacunas planejadas no momento.

### `microsservicos/`

Escopo: arquitetura de microsserviços - fundamentos, decomposição/bounded context, comunicação entre serviços, config server e endpoints operacionais.

Sem lacunas planejadas no momento.

### `observabilidade/`

Escopo: enxergar o sistema em produção - logs, métricas, traces, correlação e ferramentas (Zipkin, Prometheus, Grafana, ELK, OpenTelemetry).

Sem lacunas planejadas no momento.

### `entrega-continua/`

Escopo: empacotar, entregar e hospedar - Docker, Kubernetes, CI/CD para microsserviços e categorias de serviço em nuvem.

- ⬜ IaC (Terraform)

### `estudos-de-caso/`

Escopo: system design na prática, problemas resolvidos ponta a ponta.

- ⬜ Rate Limiter
- ⬜ Notification System
- ⬜ Payment System
- ⬜ Sistema de feed / rede social
- ⬜ Plataforma de streaming

## Notas de escopo

- Segurança (authn/authz, OWASP, OAuth2, JWT) tem uma primeira cobertura em `apis/02-seguranca-e-evolucao-de-apis.md`. Performance aparece espalhada nas notas que já a usam na prática (ex: índices dentro de Databases).
- Prioridade sugerida: fechar os esqueletos pendentes de `/labs-fill` antes de abrir seções novas.
