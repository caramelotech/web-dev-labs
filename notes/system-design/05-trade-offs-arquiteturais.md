# Trade-offs Arquiteturais

Todo design de sistema é, no fundo, uma sequência de escolhas entre duas coisas boas que não cabem ao mesmo tempo. Não existe decisão "certa" isolada, cada trade-off só faz sentido olhando para os requisitos específicos do problema (veja [System Design: Fundamentos](/labs/web-dev/system-design/01-o-que-e-system-design/)). Esta nota reúne os trade-offs mais recorrentes, para servir como checklist rápido na hora de justificar uma decisão de arquitetura.

## Principais trade-offs para comparar

### Consistência vs disponibilidade

Coberto em detalhe no [Teorema de CAP](/labs/web-dev/banco-de-dados/03-teorema-de-cap/): durante uma partição de rede, o sistema escolhe entre responder com um dado possivelmente desatualizado (disponibilidade) ou recusar a resposta até garantir o dado mais recente (consistência). Sistemas financeiros tendem a priorizar consistência; feeds e contadores sociais tendem a priorizar disponibilidade.

### Latência vs consistência

Coberto pelo [PACELC](/labs/web-dev/banco-de-dados/04-teorema-de-pacelc/): mesmo sem partição de rede, esperar a confirmação de mais réplicas antes de responder (mais consistência) custa mais tempo de resposta (mais latência). Um checkout de e-commerce pode aceitar uns milissegundos a mais de latência para garantir que o estoque não vendeu em dobro; um sistema de busca pode preferir responder rápido com resultado ligeiramente desatualizado.

### Custo vs disponibilidade

Cada nove adicional de disponibilidade (veja [Disponibilidade](/labs/web-dev/resiliencia/03-disponibilidade/)) custa desproporcionalmente mais: redundância geográfica, times de plantão, infraestrutura redundante em múltiplas zonas. Sair de 99,9% para 99,99% não é 10% mais caro, costuma ser várias vezes mais caro. Vale perguntar se o produto realmente precisa daquele último nove antes de pagar por ele.

### Simplicidade vs escalabilidade

Arquiteturas que escalam bem (sharding, múltiplos serviços, filas, cache distribuído) quase sempre são mais difíceis de entender, operar e debugar do que um monolito simples com um banco só. Construir para uma escala que o produto ainda não tem é pagar esse custo de complexidade antes da hora, e é um erro tão comum quanto o oposto (não conseguir escalar quando a escala chega).

### Monólito vs microsserviços

Um monólito é mais simples de desenvolver, testar e implantar no começo, mas fica difícil de escalar times independentes conforme o produto cresce (veja [Escalabilidade Organizacional](/labs/web-dev/escalabilidade/01-escalabilidade/)). Microsserviços resolvem o problema organizacional, mas introduzem toda a complexidade de sistemas distribuídos: rede não confiável, consistência entre serviços, deploy independente. Não é incomum começar monólito e migrar para microsserviços só quando a dor organizacional aparece de verdade, não antes.

### SQL vs NoSQL

Detalhado em [NoSQL](/labs/web-dev/banco-de-dados/09-nosql/). Relacional dá consistência forte e um modelo de dados rígido e previsível; NoSQL dá flexibilidade de esquema e escala horizontal mais natural, ao custo de garantias mais fracas.

### Cache vs consistência

Todo cache é, por definição, uma cópia que pode ficar desatualizada em relação à fonte de verdade. Cachear mais agressivamente (TTL mais longo, invalidação mais preguiçosa) melhora performance e reduz carga no banco, mas aumenta a chance de servir dado velho. Ajustar TTL e estratégia de invalidação (veja [Cache e Redis](/labs/web-dev/escalabilidade/08-cache-e-redis/)) é literalmente negociar esse trade-off.

### Síncrono vs assíncrono

Chamadas síncronas são mais simples de raciocinar (peça, espere, receba), mas acoplam serviços no tempo: se um está fora do ar, quem chama trava ou falha junto. Comunicação assíncrona via filas (veja [Filas e Mensageria](/labs/web-dev/mensageria/01-filas-e-mensageria/)) desacopla esse tempo, ao custo de mais complexidade operacional e de uma resposta que não é imediata.

### Throughput vs latência

Como visto em [Latência, Throughput e Performance](/labs/web-dev/system-design/04-latencia-e-performance/), técnicas que aumentam o throughput total do sistema (batching, filas, processamento em lote) costumam aumentar a latência de cada operação individual. Um sistema pode otimizar para "processar o máximo de operações por segundo" ou para "responder cada operação o mais rápido possível", raramente consegue maximizar os dois ao mesmo tempo.

### Strong consistency vs eventual consistency

Aprofundado em [Consistência e Replicação](/labs/web-dev/sistemas-distribuidos/01-consistencia-e-replicacao/). Consistência forte simplifica o raciocínio sobre o sistema (o dado é sempre o mais recente), mas custa latência e disponibilidade. Consistência eventual é mais rápida e resiliente, mas exige que a aplicação (e quem a usa) tolere uma janela de divergência temporária.

### Scale up vs scale out

Como visto em [Escalabilidade](/labs/web-dev/escalabilidade/01-escalabilidade/), escalar verticalmente é mais simples (nenhuma mudança de arquitetura) mas tem teto físico e continua sendo um ponto único de falha. Escalar horizontalmente remove esse teto, mas exige que a aplicação seja projetada para rodar em várias instâncias (stateless, dados compartilhados), um custo de engenharia pago desde o início.
