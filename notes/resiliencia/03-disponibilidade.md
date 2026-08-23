# Disponibilidade

## Availability

Disponibilidade (availability) é a fração do tempo em que um sistema está no ar e respondendo corretamente às requisições. Um sistema com boa disponibilidade não é necessariamente rápido nem livre de bugs, ele simplesmente está lá, respondendo, quando alguém precisa dele.

Dois termos aparecem sempre nessa conversa:

- **Uptime**: o tempo em que o sistema esteve disponível, geralmente medido como percentual sobre um período (mês, ano).
- **Downtime**: o oposto, o tempo em que o sistema esteve indisponível, seja por uma queda total ou por erros que impedem o uso normal.

A causa mais comum de baixa disponibilidade é o **Single Point of Failure** (SPOF): um único componente que, se falhar, derruba o sistema inteiro. Um banco de dados sem réplica, um único servidor sem load balancer na frente (veja [Load Balancer](/labs/web-dev/escalabilidade/load-balancer/)), uma única zona de disponibilidade na nuvem, todos são exemplos de SPOF. Praticamente toda estratégia de alta disponibilidade é, no fundo, uma forma de eliminar algum SPOF específico.

## SLO / SLA

Para que "disponibilidade" seja mais do que uma promessa vaga, times de engenharia usam três siglas para formalizar o compromisso:

- **SLI** (Service Level Indicator): a métrica medida de verdade. Exemplo: "percentual de requisições que responderam com sucesso em menos de 200ms nos últimos 30 dias".
- **SLO** (Service Level Objective): a meta interna para aquele indicador. Exemplo: "99,9% das requisições devem atender ao SLI acima". É um objetivo que o time se compromete a perseguir, usado internamente para decidir prioridade (vale mais a pena lançar uma feature nova ou investir em confiabilidade essa semana?).
- **SLA** (Service Level Agreement): o compromisso formal, geralmente contratual, feito com o cliente ou usuário externo, com consequências definidas (crédito, reembolso) se não for cumprido. Um SLA costuma ser um pouco mais frouxo que o SLO interno, para dar margem de segurança ao time antes de violar o contrato.

A relação entre os três é hierárquica: você mede o SLI, define um SLO mais rígido como meta interna, e oferece um SLA mais permissivo como garantia externa.

## Os "noves" de disponibilidade

Disponibilidade costuma ser expressa como uma porcentagem, e cada "nove" adicional depois da vírgula representa uma redução drástica no tempo de indisponibilidade tolerado:

| Disponibilidade | Indisponibilidade por ano | Indisponibilidade por mês |
| --------------- | ------------------------- | ------------------------- |
| 99%             | ~3,65 dias                | ~7,3 horas                |
| 99,9%           | ~8,76 horas               | ~43,8 minutos             |
| 99,99%          | ~52,6 minutos             | ~4,38 minutos             |
| 99,999%         | ~5,26 minutos             | ~26,3 segundos            |

Vale internalizar o número de 99,9%, porque é o SLA mais comum oferecido por serviços de nuvem e o mais citado em entrevistas: ele permite cerca de 43,8 minutos de indisponibilidade por mês. Isso parece bastante tempo até você pensar que uma única atualização de banco de dados mal planejada, ou um deploy problemático, pode consumir esse orçamento inteiro numa tarde só.

Cada nove adicional custa caro: sair de 99,9% para 99,99% significa reduzir o tempo de indisponibilidade tolerado em 10x, o que normalmente exige investimento pesado em redundância, automação de failover e testes de recuperação de desastre, não só "ter mais cuidado".

## Alta disponibilidade

Alcançar um SLO de disponibilidade alto depende de eliminar pontos únicos de falha, e as técnicas mais comuns para isso são:

- **Redundância**: ter mais de uma cópia de cada componente crítico (mais de um servidor de aplicação, mais de uma réplica de banco), de forma que a falha de uma cópia não tire o sistema do ar.
- **Failover**: o mecanismo automático que detecta a falha de um componente e redireciona o tráfego para uma cópia saudável, sem intervenção manual. Um load balancer que para de enviar tráfego para uma instância que falhou no health check (veja [Load Balancer](/labs/web-dev/escalabilidade/load-balancer/)) está fazendo failover.
- **Replicação**: manter os dados sincronizados entre múltiplas cópias, para que o failover de um componente com estado (como um banco de dados) não signifique perder dados. Aprofundado em [Replicação e Escalabilidade do Banco de Dados](/labs/web-dev/escalabilidade/replicacao-de-banco-de-dados/) e em [Consistência e Replicação](/labs/web-dev/sistemas-distribuidos/consistencia-e-replicacao/).
- **Multi-AZ** (Multi Availability Zone): distribuir as instâncias entre zonas de disponibilidade diferentes dentro da mesma região de nuvem. Zonas de disponibilidade são fisicamente separadas (prédios, fontes de energia e rede independentes), então um problema de energia ou rede numa zona não afeta as outras.
- **Multi-region**: ir um passo além e distribuir o sistema entre regiões geográficas inteiras diferentes. Protege contra eventos que afetam uma região inteira (uma falha maciça de datacenter, um desastre natural), ao custo de mais complexidade para manter dados consistentes entre regiões distantes.
- **Disaster Recovery** (DR): o plano (e a infraestrutura) para recuperar o sistema depois de uma falha catastrófica, quando redundância e failover automático não foram suficientes. Envolve backups testados, um plano documentado de restauração e, geralmente, duas métricas: RTO (Recovery Time Objective, quanto tempo leva para restaurar o serviço) e RPO (Recovery Point Objective, quantos dados de dado mais recente podem ser perdidos no processo).

Nenhuma dessas técnicas é gratuita: mais redundância significa mais infraestrutura para pagar e mais complexidade operacional para manter, o que reforça o ponto do início desta seção, cada nove a mais de disponibilidade tem um preço concreto, e a decisão de perseguir esse nove precisa levar em conta se o negócio realmente precisa dele.
