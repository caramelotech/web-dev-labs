# Escolha de Banco de Dados na Prática

As notas de [Teorema de CAP](/labs/web-dev/banco-de-dados/04-teorema-de-cap/) e [Teorema de PACELC](/labs/web-dev/banco-de-dados/05-teorema-de-pacelc/) explicam a teoria: todo banco distribuído troca consistência por disponibilidade (durante uma partição) e consistência por latência (no dia a dia). Mas na hora de escolher uma tecnologia de verdade, a pergunta muda de forma: não é "o que é CP?", é "qual desses bancos eu uso pro meu problema?".

Esta nota é uma tabela de decisão prática: pega bancos de dados reais, classifica cada um pela sigla do PACELC, explica o mecanismo interno que sustenta essa classificação e lista para quais casos de uso cada um costuma ser escolhido.

## Como ler a tabela

Cada banco é descrito por seis informações:

- **Classificação PACELC:** a combinação (ex: `AP/EL`, `CP/EC`) explicada na nota de [PACELC](/labs/web-dev/banco-de-dados/05-teorema-de-pacelc/). Resume se o banco prioriza disponibilidade/latência ou consistência.
- **Tipo de banco:** o modelo de dados (colunar, documento, chave-valor, relacional). Quando o tipo vem marcado com **(ACID)**, é porque esse banco também oferece as garantias de [ACID](/labs/web-dev/banco-de-dados/03-acid/) em transações, além da classificação PACELC.
- **Casos de uso:** para que tipo de sistema esse banco costuma ser a escolha certa.
- **Mecanismo interno:** o algoritmo que o banco usa por baixo dos panos para manter as réplicas sincronizadas (explicado no glossário abaixo).
- **Classificação é ajustável?:** muitos bancos não são 100% travados na sua categoria PACELC, eles expõem configurações que deslocam o comportamento padrão para mais perto de consistência ou de disponibilidade/latência.
- **Observação:** um detalhe extra sobre como essa configuração funciona (ou por que o banco não permite ajustar).

## Glossário: mecanismos internos

Esses nomes aparecem na coluna "Mecanismo interno" e são os algoritmos de replicação/consenso que cada banco usa para decidir quando um dado está "confirmado" entre várias réplicas:

- **Quorum:** em vez de esperar todas as réplicas confirmarem uma escrita, o banco espera só a maioria. A fórmula clássica é `N / 2 + 1`, onde `N` é o número de réplicas. Por exemplo, com fator de replicação 10: `10 / 2 = 5 + 1 = 6` réplicas precisam confirmar. É mais rápido que esperar todo mundo, e ainda garante que qualquer maioria vai sempre "enxergar" a escrita mais recente.
- **Raft:** algoritmo de consenso baseado em eleição de um líder. Um nó é eleito líder, recebe as escritas e as replica para os seguidores. Foi desenhado para ser mais fácil de entender e implementar do que o Paxos.
- **Paxos:** o algoritmo de consenso distribuído clássico (mais antigo que o Raft), também baseado em maioria de votos entre os nós, mas com uma formulação mais complexa. Usado em sistemas que precisam de consistência forte em escala global.
- **Sentinel:** mecanismo do Redis para monitorar o nó primário e promover uma réplica a primário automaticamente em caso de falha (failover). Não é um algoritmo de consenso por maioria como Raft/Paxos, é mais um "vigia" de alta disponibilidade.
- **Replicação baseada em WAL:** o PostgreSQL replica dados enviando o _write-ahead log_ (o mesmo log usado para garantir durabilidade, ver [ACID](/labs/web-dev/banco-de-dados/03-acid/)) para as réplicas, que o reproduzem para chegar no mesmo estado.

## Tabela comparativa

| Banco            | PACELC | Tipo                          | Mecanismo interno         | Classificação ajustável? |
| ---------------- | ------ | ----------------------------- | ------------------------- | ------------------------ |
| Cassandra        | AP/EL  | Colunar                       | Quorum                    | Sim                      |
| MongoDB          | CP/EC  | Documento (ACID)              | Raft                      | Sim                      |
| DynamoDB (AWS)   | AP/EL  | Chave-valor                   | Quorum                    | Sim                      |
| CockroachDB      | CP/EC  | Relacional distribuído (ACID) | Raft                      | Sim                      |
| Spanner (Google) | CP/EC  | Relacional distribuído (ACID) | Paxos                     | Sim                      |
| PostgreSQL       | CP/EC  | Relacional single-node (ACID) | Replicação baseada em WAL | Não                      |
| Redis            | AP/EL  | Chave-valor                   | Sentinel                  | Não                      |

## Detalhamento por banco

### Cassandra (AP/EL)

Banco colunar feito para escrita massiva e alta disponibilidade, mesmo em escala global.

- **Casos de uso:** redes sociais, séries temporais, catálogos (Netflix), IoT, assistência médica, plataformas que exigem escrita massiva de dados, catálogos de produtos globalmente distribuídos, aplicações com requisito de alta disponibilidade 24/7.
- **Mecanismo interno:** Quorum. Usa a fórmula `N / 2 + 1` para decidir quantas réplicas precisam confirmar uma operação.
- **Ajustável?** Sim. É possível configurar o _consistency level_ por operação (quantas réplicas precisam responder), deslocando o comportamento para mais perto de consistência forte quando necessário, mesmo o padrão sendo AP/EL.

### MongoDB (CP/EC)

Banco orientado a documentos com garantias ACID em transações.

- **Casos de uso:** aplicações web e mobile em geral, catálogos de produtos em e-commerces, dados de log, prototipagem rápida.
- **Mecanismo interno:** Raft, usado para eleger o nó primário do replica set e replicar as escritas.
- **Ajustável?** Sim, via `WriteConcern` (quantas réplicas confirmam uma escrita antes dela ser considerada bem-sucedida) e `ReadConcern` (qual garantia de consistência uma leitura exige).

### DynamoDB - AWS (AP/EL)

Banco chave-valor gerenciado, feito para baixa latência em alta escala.

- **Casos de uso:** aplicações web e mobile de alto tráfego, placar de jogos, perfis de usuários, cliques, histórico, e-commerce, carrinho de compras, telemetria.
- **Mecanismo interno:** Quorum entre réplicas.
- **Ajustável?** Sim. É possível ativar leitura e escrita fortemente consistentes através de configuração do próprio banco, trocando parte da disponibilidade/latência padrão por uma garantia de consistência maior nas operações que precisarem.

### CockroachDB (CP/EC)

Banco relacional distribuído, pensado para se comportar como um banco relacional tradicional mesmo espalhado por várias regiões.

- **Casos de uso:** aplicações financeiras e bancárias (exigindo ACID forte), sistemas de gerenciamento de inventário global, backends de jogos multi-região, processamento de pagamentos, e-commerce (estoque, pedidos e preços).
- **Mecanismo interno:** Raft.
- **Ajustável?** Sim. Um modo de consistência eventual foi habilitado mais recentemente para casos onde vale a pena abrir mão de um pouco de consistência em troca de mais desempenho.

### Spanner - Google (CP/EC)

Banco relacional distribuído da Google, com consistência forte em escala global sem abrir mão de baixa latência.

- **Casos de uso:** fintechs e pagamentos globais, jogos multi-região de alta escala (incluindo inventário e estado do jogador), backends de missão crítica com SLA de 99,999%, sistemas que exigem transações distribuídas com consistência absoluta.
- **Mecanismo interno:** Paxos.
- **Ajustável?** Sim, mas o diferencial do Spanner é justamente conseguir manter CP/EC com baixa latência através de infraestrutura própria: relógios atômicos, o protocolo **TrueTime**, rede privada do Google e controle direto do hardware, chegando a 99,999% de disponibilidade mesmo priorizando consistência.

### PostgreSQL (CP/EC)

Banco relacional tradicional, o mais usado neste lab (veja a nota de [SQL](/labs/web-dev/banco-de-dados/01-sql/)).

- **Casos de uso:** aplicações web, sistemas empresariais, comércio eletrônico, ERP, CMS, sites dinâmicos e qualquer sistema que precise de muita consistência, garantia, relacionamento e estruturação dos dados.
- **Mecanismo interno:** replicação baseada em WAL (write-ahead log).
- **Ajustável?** Não. O PostgreSQL nasceu como um banco single-node: virar um sistema distribuído de verdade depende de ferramentas externas (ex: Patroni, Citus), não é um comportamento nativo configurável dentro do próprio banco.

### Redis (AP/EL)

Banco chave-valor em memória, otimizado para velocidade.

- **Casos de uso:** cache, mensageria, controle de sessão.
- **Mecanismo interno:** Sentinel, que monitora o primário e promove uma réplica em caso de falha.
- **Ajustável?** Não, de fato. É possível configurar um quorum de confirmação entre réplicas, mas isso não muda o comportamento fundamentalmente AP/EL do Redis: ele continua priorizando disponibilidade e latência baixa.

## Como usar essa tabela na prática

Ao escolher um banco de dados para um sistema, a pergunta não é "qual banco é o melhor", é "qual trade-off esse sistema pode pagar":

- **Dado errado é inaceitável** (saldo bancário, estoque, pagamento): procure bancos **CP/EC**, como PostgreSQL, CockroachDB ou Spanner.
- **Sistema fora do ar é inaceitável, um dado levemente desatualizado é tolerável** (feed de rede social, catálogo de produtos, cache, telemetria): procure bancos **AP/EL**, como Cassandra, DynamoDB ou Redis.
- **O banco expõe configuração para ajustar isso?** Vale checar antes de descartar um banco só pela classificação padrão: MongoDB, DynamoDB e Cassandra, por exemplo, permitem apertar a consistência quando uma operação específica exigir, mesmo sendo AP/EL ou CP/EC por padrão.

## Recapitulando

- Esta nota aplica a teoria do [CAP](/labs/web-dev/banco-de-dados/04-teorema-de-cap/) e do [PACELC](/labs/web-dev/banco-de-dados/05-teorema-de-pacelc/) a bancos de dados reais.
- Cada banco tem uma classificação PACELC padrão (ex: Cassandra e DynamoDB são AP/EL, PostgreSQL e Spanner são CP/EC), sustentada por um mecanismo interno de replicação/consenso (Quorum, Raft, Paxos, Sentinel ou WAL).
- Muitos bancos permitem ajustar esse comportamento padrão via configuração (WriteConcern, ReadConcern, consistency level, quorum de confirmação), outros não (PostgreSQL, Redis).
- Na prática, a escolha depende do trade-off que o sistema pode pagar: dado sempre correto (CP/EC) ou sistema sempre no ar mesmo com dado levemente atrasado (AP/EL).

## Referências

- [Tabela de decisão CAP/PACELC (Miro)](https://miro.com/app/board/uXjVJCL6b64=/?share_link_id=911501521268&focusWidget=3458764643057124514)
