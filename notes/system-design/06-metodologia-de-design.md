# Como Estruturar um System Design

Depois de estudar CDN, load balancer, cache, filas, réplicas e todos os outros componentes individualmente, falta a peça final: uma ordem de raciocínio para juntar tudo isso na hora de projetar um sistema do zero, seja numa entrevista, seja num projeto real. Esta nota fecha a seção de System Design com essa metodologia, em nove etapas, e um checklist de cenários de falha para testar o design no final.

## Etapa 1: Requisitos

Antes de desenhar qualquer componente, alinhe o que o sistema precisa fazer e sob quais condições (veja [System Design: Fundamentos](/labs/web-dev/system-design/01-o-que-e-system-design/)):

- **Requisitos funcionais**: o que o sistema faz, do ponto de vista de quem usa
- **Requisitos não funcionais**: escala esperada, disponibilidade exigida, latência aceitável

Pular essa etapa é o erro mais comum em entrevistas de system design: desenhar uma arquitetura elaborada para um problema que na verdade tinha requisitos simples, ou o oposto, subestimar a escala e propor algo que não aguentaria o tráfego real.

## Etapa 2: Capacity Planning

Transforme os requisitos não funcionais em números concretos, usando o método de [Capacity Planning](/labs/web-dev/system-design/03-capacity-planning/): DAU, requests por usuário, QPS médio e de pico, estimativa de storage e de bandwidth. Esses números são o que justifica cada decisão das próximas etapas, "precisa escalar" não diz nada, "precisa aguentar 20 mil QPS de pico" diz tudo.

## Etapa 3: Arquitetura inicial

Desenhe o esqueleto: cliente, CDN, load balancer, API Gateway, os serviços que compõem o sistema, cache, filas e banco de dados. A nota de [Arquitetura de uma Aplicação Distribuída](/labs/web-dev/system-design/02-arquitetura-de-referencia/) mostra esse esqueleto de referência, componente por componente.

Nem todo sistema precisa de todas as peças desse esqueleto desde o início, um sistema pequeno pode começar só com cliente, um serviço e um banco. A etapa 2 (capacity planning) é o que diz quais peças já se justificam desde a primeira versão.

## Etapa 4: Escalabilidade

Com o esqueleto no lugar e os números da etapa 2 em mãos, decida como cada parte escala: horizontal scaling atrás do load balancer, replicação e sharding no banco, cache para tirar carga de leitura do banco, filas para absorver picos de escrita. Toda essa camada está detalhada em [Escalabilidade e Infraestrutura](/labs/web-dev/escalabilidade/01-escalabilidade/).

## Etapa 5: Confiabilidade

Um sistema que escala mas cai na primeira falha de rede não está pronto. Aplique os padrões de [Resiliência](/labs/web-dev/resiliencia/01-timeout-retry-circuit-breaker-e-bulkhead/): retry com backoff, timeout em toda chamada entre serviços, circuit breaker nas dependências instáveis, idempotência em qualquer operação que pode ser reenviada, e dead letter queue para mensagens que falham repetidamente.

## Etapa 6: Dados

Volte para a camada de dados com mais detalhe: SQL ou NoSQL (veja [NoSQL](/labs/web-dev/banco-de-dados/10-nosql/)), como modelar as entidades, quais índices o padrão de consulta exige, como a replicação está configurada e qual nível de consistência cada tipo de dado exige (veja [Consistência e Replicação](/labs/web-dev/sistemas-distribuidos/01-consistencia-e-replicacao/)).

## Etapa 7: Performance

Revise o orçamento de latência do caminho crítico (veja [Latência, Throughput e Performance](/labs/web-dev/system-design/04-latencia-e-performance/)): qual o p99 esperado, onde o cache reduz esse número, o que pode sair do caminho síncrono e virar processamento assíncrono via fila.

## Etapa 8: Observabilidade

Um sistema em produção sem observabilidade é uma caixa preta. Defina que logs, métricas e traces (veja [Observabilidade](/labs/web-dev/observabilidade/01-logs-metrics-e-traces/)) o sistema vai expor, quais alertas disparam em cima dessas métricas, e quais SLOs (veja [Disponibilidade](/labs/web-dev/resiliencia/03-disponibilidade/)) definem "o sistema está saudável".

## Etapa 9: Failure Scenarios

A etapa final é atacar o próprio design com perguntas de "e se". Um design só está completo depois de responder, para cada componente crítico, o que acontece quando ele falha:

- E se o banco cair?
- E se o Redis cair?
- E se o Kafka ficar indisponível?
- E se uma instância morrer?
- E se houver um pico de 10x no tráfego?
- E se houver uma partição de rede entre dois serviços?
- E se uma mensagem for processada duas vezes?
- E se uma requisição ficar lenta, sem chegar a falhar de vez?
- E se uma região inteira cair?

Não existe sistema imune a todos esses cenários ao mesmo tempo, o objetivo não é ter resposta perfeita para cada um, é mostrar que cada cenário foi considerado conscientemente, e que a resposta ("o sistema degrada graciosamente", "perdemos disponibilidade mas não dados", "esse cenário é aceitável dado o SLA") foi uma escolha, não um ponto cego.

## Catálogo de padrões para sistemas distribuídos

Ao longo de todas as notas de system design deste lab, um conjunto recorrente de padrões aparece repetidas vezes, atacando os mesmos problemas de formas diferentes. Em vez de repetir a explicação de cada um aqui, esta lista serve como índice de onde cada padrão é coberto em profundidade:

| Padrão                                    | Onde é coberto                                                                                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retry, Timeout, Circuit Breaker, Bulkhead | [Timeout, Retry, Circuit Breaker e Bulkhead](/labs/web-dev/resiliencia/01-timeout-retry-circuit-breaker-e-bulkhead/)                                                                                            |
| Idempotency                               | [Idempotência](/labs/web-dev/resiliencia/02-idempotencia/)                                                                                                                                                      |
| Rate Limiting, Backpressure               | [Rate Limiting](/labs/web-dev/escalabilidade/09-rate-limiting/)                                                                                                                                                 |
| Cache                                     | [Cache e Redis](/labs/web-dev/escalabilidade/08-cache-e-redis/)                                                                                                                                                 |
| Queue, Pub/Sub                            | [Filas e Mensageria](/labs/web-dev/mensageria/01-filas-e-mensageria/)                                                                                                                                           |
| Replication                               | [Replicação e Escalabilidade do Banco de Dados](/labs/web-dev/escalabilidade/03-replicacao-de-banco-de-dados/) e [Consistência e Replicação](/labs/web-dev/sistemas-distribuidos/01-consistencia-e-replicacao/) |
| Sharding                                  | [Stateless, Particionamento e Sharding](/labs/web-dev/escalabilidade/02-stateless-e-particionamento/)                                                                                                           |
| Load Balancing                            | [Load Balancer](/labs/web-dev/escalabilidade/05-load-balancer/)                                                                                                                                                 |
| Health Check                              | [Load Balancer](/labs/web-dev/escalabilidade/05-load-balancer/) (seção Health Checks)                                                                                                                           |
| Failover                                  | [Load Balancer](/labs/web-dev/escalabilidade/05-load-balancer/) e [Disponibilidade](/labs/web-dev/resiliencia/03-disponibilidade/)                                                                              |

Uma boa resposta de system design, na prática, é reconhecer qual desses padrões resolve qual dos "e se" da etapa anterior, e justificar por que ele se encaixa (ou não vale a complexidade) para o problema específico em mãos.
