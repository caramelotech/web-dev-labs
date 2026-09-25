# Disponibilidade

## Availability

Disponibilidade (availability) é a fração do tempo em que um sistema está no ar e respondendo corretamente às requisições. Um sistema com boa disponibilidade não é necessariamente rápido nem livre de bugs, ele simplesmente está lá, respondendo, quando alguém precisa dele.

Dois termos aparecem sempre nessa conversa:

- **Uptime**: o tempo em que o sistema esteve disponível, geralmente medido como percentual sobre um período (mês, ano).
- **Downtime**: o oposto, o tempo em que o sistema esteve indisponível, seja por uma queda total ou por erros que impedem o uso normal.

A causa mais comum de baixa disponibilidade é o **Single Point of Failure** (SPOF): um único componente que, se falhar, derruba o sistema inteiro. Um banco de dados sem réplica, um único servidor sem load balancer na frente (veja [Load Balancer](/labs/web-dev/escalabilidade/05-load-balancer/)), uma única zona de disponibilidade na nuvem, todos são exemplos de SPOF. Praticamente toda estratégia de alta disponibilidade é, no fundo, uma forma de eliminar algum SPOF específico.

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
- **Failover**: o mecanismo automático que detecta a falha de um componente e redireciona o tráfego para uma cópia saudável, sem intervenção manual. Um load balancer que para de enviar tráfego para uma instância que falhou no health check (veja [Load Balancer](/labs/web-dev/escalabilidade/05-load-balancer/)) está fazendo failover.
- **Replicação**: manter os dados sincronizados entre múltiplas cópias, para que o failover de um componente com estado (como um banco de dados) não signifique perder dados. Aprofundado em [Replicação e Escalabilidade do Banco de Dados](/labs/web-dev/escalabilidade/03-replicacao-de-banco-de-dados/) e em [Consistência e Replicação](/labs/web-dev/sistemas-distribuidos/01-consistencia-e-replicacao/).
- **Multi-AZ** (Multi Availability Zone): distribuir as instâncias entre zonas de disponibilidade diferentes dentro da mesma região de nuvem. Zonas de disponibilidade são fisicamente separadas (prédios, fontes de energia e rede independentes), então um problema de energia ou rede numa zona não afeta as outras.
- **Multi-region**: ir um passo além e distribuir o sistema entre regiões geográficas inteiras diferentes. Protege contra eventos que afetam uma região inteira (uma falha maciça de datacenter, um desastre natural), ao custo de mais complexidade para manter dados consistentes entre regiões distantes.
- **Disaster Recovery** (DR): o plano (e a infraestrutura) para recuperar o sistema depois de uma falha catastrófica, quando redundância e failover automático não foram suficientes. Envolve backups testados, um plano documentado de restauração e, geralmente, duas métricas: RTO (Recovery Time Objective, quanto tempo leva para restaurar o serviço) e RPO (Recovery Point Objective, quantos dados de dado mais recente podem ser perdidos no processo).

Nenhuma dessas técnicas é gratuita: mais redundância significa mais infraestrutura para pagar e mais complexidade operacional para manter, o que reforça o ponto do início desta seção, cada nove a mais de disponibilidade tem um preço concreto, e a decisão de perseguir esse nove precisa levar em conta se o negócio realmente precisa dele.

## Disaster Recovery

Redundância e failover cobrem falhas comuns (uma máquina, uma zona). **Disaster Recovery (DR)** entra quando o problema é maior: uma região inteira fora do ar, um banco corrompido por um bug, um `DROP TABLE` na produção, um ataque de ransomware. Nesses casos, ter uma segunda cópia ligada nem sempre ajuda (a corrupção pode ter sido replicada para ela), e o que salva é um plano de recuperação pensado com antecedência.

### RTO e RPO

Todo plano de DR gira em torno de duas metas, definidas pelo negócio e não pela equipe técnica:

- **RTO (Recovery Time Objective)**: quanto tempo o sistema pode ficar fora do ar até voltar. "RTO de 1 hora" significa que, depois do desastre, o serviço precisa estar de pé em até 1 hora.
- **RPO (Recovery Point Objective)**: quantos dados você aceita perder, medido em tempo. "RPO de 5 minutos" significa que, na pior hipótese, os últimos 5 minutos de dados podem sumir. O RPO depende de quão frequentemente os dados são copiados.

```mermaid
flowchart LR
    A[Último backup] -- RPO: dados perdidos --> B[Desastre]
    B -- RTO: tempo fora do ar --> C[Serviço restaurado]
```

Metas menores custam mais. RTO e RPO de segundos exigem infraestrutura duplicada e sempre ligada; metas de horas cabem em backups baratos.

### Estratégias de recuperação

A AWS, no whitepaper de DR, organiza as estratégias em quatro níveis (a ideia vale para qualquer nuvem), do mais barato e lento ao mais caro e rápido:

| Estratégia                   | Como funciona                                                                                                                               | RPO / RTO típicos                 | Custo      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ---------- |
| **Backup and restore**       | Só guarda backups (em outra região). No desastre, recria a infraestrutura e restaura os dados                                               | Horas / até 24h ou mais           | Mais baixo |
| **Pilot light**              | Mantém ligado só o núcleo em outra região (o banco replicado, por exemplo). Os servidores de aplicação ficam desligados e sobem no desastre | Minutos / horas                   | Baixo      |
| **Warm standby**             | Uma versão reduzida do sistema completo roda o tempo todo na outra região. No desastre, escala para o tamanho de produção                   | Segundos / minutos                | Médio      |
| **Multi-site active/active** | Duas ou mais regiões atendem tráfego ao mesmo tempo. No desastre, o tráfego só deixa de ir para a região afetada                            | Próximo de zero / próximo de zero | Mais alto  |

A analogia: backup and restore é ter um extintor no armário e comprar tudo de novo depois do incêndio. Pilot light é manter só a chama piloto de um aquecedor acesa, pronto para esquentar rápido. Warm standby é manter o aquecedor ligado no mínimo. Active/active é ter dois aquecedores funcionando o tempo todo.

Recriar rapidamente a infraestrutura na outra região depende de tê-la descrita em código, o que liga DR a [Infraestrutura como Código](/labs/web-dev/entrega-continua/06-infraestrutura-como-codigo/).

### Como escolher

Comece pelo custo da indisponibilidade: quanto o negócio perde por hora fora do ar e quantos dados perdidos são inaceitáveis (pagamentos costumam exigir RPO próximo de zero; um blog aguenta muito mais). Componentes diferentes podem ter estratégias diferentes: o banco de pedidos com pilot light ou melhor, o sistema de relatórios com backup simples. Igualar tudo ao nível mais caro é desperdício.

### Testar o plano

Um plano de DR que nunca foi executado provavelmente não funciona: o backup está corrompido, a permissão para restaurar não existe, o passo a passo está desatualizado. Pratique restaurar backups periodicamente e faça simulações de desastre (_game days_), em que a equipe executa o plano de verdade num ambiente de teste e mede o RTO e o RPO reais contra as metas.

## Referências

- [Disaster recovery options in the cloud](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html) - AWS Whitepaper, en
- [REL13-BP02 Use defined recovery strategies to meet the recovery objectives](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_disaster_recovery.html) - AWS Well-Architected, en
