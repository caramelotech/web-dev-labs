# Capacity Planning e Capacity Math

## Estimativa de capacidade

Capacity planning é o exercício de estimar, com números aproximados, quanto tráfego e quanto dado um sistema vai precisar suportar. É a etapa que transforma "precisa ser escalável" (frase vaga, não ajuda a decidir nada) em "precisa aguentar 5 mil requisições por segundo no pico" (número concreto, que já diz se um único servidor resolve ou se é preciso distribuir carga).

Esse cálculo não precisa de precisão de casas decimais, é uma estimativa de ordem de grandeza. Errar por um fator de 2x geralmente não muda a arquitetura escolhida; errar por um fator de 100x muda tudo. Por isso, em entrevista ou no dia a dia, vale arredondar os números para deixar a conta simples.

As métricas de entrada mais comuns para esse cálculo são:

- **DAU (Daily Active Users)**: quantos usuários únicos usam o sistema por dia
- **MAU (Monthly Active Users)**: o mesmo, mas por mês. Útil para medir crescimento, menos útil para dimensionar infraestrutura (que precisa aguentar o pico diário, não o mensal)
- **Requests por usuário**: quantas ações em média um usuário faz por dia (abrir o feed, curtir um post, enviar uma mensagem)
- **QPS (Queries Per Second)**: quantas requisições por segundo o sistema recebe. É a métrica final que efetivamente dimensiona quantos servidores, quantas conexões de banco e qual capacidade de rede o sistema precisa

A conversão de DAU para QPS é o primeiro cálculo que qualquer capacity planning faz, e é a fórmula da próxima seção.

## Fórmulas importantes

A fórmula base para o QPS médio é:

```
QPS = (DAU × requests por usuário por dia) / 86400
```

O `86400` é o número de segundos em um dia (24 × 60 × 60). Divide o total de requisições do dia pelo total de segundos do dia, assumindo tráfego distribuído uniformemente. Só que tráfego real nunca é uniforme: ele tem picos (hora do almoço, fim de tarde, um evento específico), então o QPS médio sozinho subestima o que a infraestrutura realmente precisa aguentar.

Para isso existe o **fator de pico** (peak factor): a razão entre o tráfego no pico e o tráfego médio. Um fator de pico comum em produtos de consumo é entre 2x e 5x, dependendo de quão concentrado é o uso ao longo do dia.

```
QPS de pico = QPS médio × fator de pico
```

Cima do QPS de pico ainda se soma uma margem de segurança, chamada de **headroom**: capacidade extra reservada para picos inesperados (uma campanha de marketing viralizando, um evento externo, um bug em outro serviço jogando mais tráfego no seu). Um headroom típico fica entre 20% e 50% acima do QPS de pico calculado.

```
Capacidade máxima planejada = QPS de pico × (1 + headroom)
```

Dimensionar exatamente para o QPS de pico calculado é chamado de **underprovisioning**: funciona até o primeiro dia em que a estimativa erra para baixo, e nesse dia o sistema cai. Dimensionar muito acima do necessário é **overprovisioning**: o sistema nunca cai por falta de capacidade, mas o custo de infraestrutura fica alto demais para o tráfego real. Um bom capacity planning mira o meio do caminho: headroom suficiente para picos plausíveis, sem pagar por capacidade que nunca vai ser usada.

## Exemplo de capacity planning

Vamos aplicar as fórmulas a um cenário concreto: uma rede social com **10 milhões de DAU**, onde cada usuário faz em média **50 requisições por dia** (abrir o feed, curtir, comentar, dar scroll).

**QPS médio:**

```
QPS médio = (10.000.000 × 50) / 86400
QPS médio = 500.000.000 / 86400
QPS médio ≈ 5.787 QPS
```

**QPS de pico**, assumindo um fator de pico de 3x (tráfego concentrado em horários de maior uso):

```
QPS de pico = 5.787 × 3 ≈ 17.361 QPS
```

**Capacidade planejada**, com 30% de headroom:

```
Capacidade planejada = 17.361 × 1,3 ≈ 22.570 QPS
```

Esse número de ~22,5 mil QPS é o que efetivamente guia as próximas decisões de arquitetura: quantas instâncias de cada serviço rodar atrás do load balancer, quantas conexões o pool do banco precisa suportar, se um único banco relacional aguenta ou se é hora de pensar em réplicas de leitura e cache.

Vale sempre fazer esse mesmo exercício também para os cenários de 2x e 5x acima do calculado: se a capacidade planejada não deixa margem nenhuma para um crescimento de 2x sem uma reforma completa da arquitetura, isso já é um sinal de alerta a discutir antes de escrever a primeira linha de código.
