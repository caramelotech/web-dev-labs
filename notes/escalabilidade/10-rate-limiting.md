# Rate Limiting

## Conceito

**Rate limiting** é a prática de limitar quantas requisições uma origem específica (um usuário, um IP, uma aplicação parceira) pode fazer dentro de um intervalo de tempo.

Sem esse limite, um único cliente mal comportado (ou malicioso) pode consumir uma fatia desproporcional da capacidade do sistema, degradando a experiência de todo mundo. Os motivos mais comuns para limitar requisições:

- Proteger o sistema contra picos que ultrapassem sua capacidade planejada (veja [Capacity Planning](/labs/web-dev/system-design/03-capacity-planning/))
- Evitar abuso deliberado, como scraping agressivo ou tentativas de força bruta em login
- Garantir uso justo entre clientes de uma API paga, respeitando o plano contratado por cada um
- Proteger serviços internos mais frágeis (como um banco de dados) de receberem mais carga do que aguentam

## Token Bucket

Token Bucket (balde de tokens) é o algoritmo de rate limiting mais usado na prática, por equilibrar simplicidade com a capacidade de absorver picos curtos sem ser rígido demais.

A ideia: existe um **bucket** (balde) com capacidade para um número máximo de **tokens**. Cada requisição consome um token do balde; se não houver token disponível, a requisição é bloqueada. O balde é reabastecido continuamente a uma taxa fixa, o **refill rate**.

```mermaid
flowchart TB
    Refill["Refill rate:<br/>10 tokens/segundo"] --> Bucket["Bucket<br/>capacidade máxima: 50 tokens"]
    Req[Requisição chega] --> Check{Existe token<br/>disponível?}
    Bucket --> Check
    Check -->|Sim| OK["Request permitida<br/>(consome 1 token)"]
    Check -->|Não| Blocked["Request bloqueada"]
```

O detalhe importante desse algoritmo é o **burst**: como o bucket acumula tokens até sua capacidade máxima mesmo quando ninguém está fazendo requisições, um cliente que ficou inativo por um tempo consegue disparar uma rajada de requisições de uma vez (até o limite do bucket) sem ser bloqueado, mesmo que essa rajada, momentaneamente, ultrapasse a taxa média configurada. Isso reflete melhor o tráfego real, que raramente é perfeitamente constante.

## Outros algoritmos

- **Fixed Window**: conta requisições dentro de janelas de tempo fixas (ex: "no máximo 100 requisições por minuto", contando de 00 a 59 segundos). Simples de implementar, mas tem um problema conhecido nas bordas da janela: um cliente pode fazer 100 requisições no último segundo de uma janela e mais 100 no primeiro segundo da próxima, totalizando 200 requisições em 2 segundos, mesmo respeitando o limite "por minuto" em cada janela isoladamente.
- **Sliding Window**: em vez de janelas fixas que resetam de uma vez, considera uma janela de tempo que "desliza" continuamente (ex: sempre olhando para os últimos 60 segundos a partir de agora, não para o minuto do relógio). Resolve o problema de borda da Fixed Window, ao custo de mais complexidade de cálculo.
- **Sliding Window Log**: uma variação mais precisa da Sliding Window, que guarda o timestamp exato de cada requisição individual (o "log") para contar com exatidão quantas aconteceram na janela. Mais preciso, mas consome mais memória por cliente, já que precisa lembrar de cada requisição, não só um contador.
- **Sliding Window Counter**: um meio-termo entre a Fixed Window (barata) e a Sliding Window Log (precisa). Em vez de guardar o timestamp de cada requisição, mantém só dois contadores por origem: o da janela fixa atual e o da janela fixa anterior. A contagem estimada é `atual + anterior * (1 - fração_decorrida_da_janela_atual)`. Exemplo com limite de 100 req/min: a janela anterior teve 80 requisições, a atual já tem 30 e estamos a 25% do minuto atual; a estimativa é `30 + 80 * (1 - 0,25) = 90`, abaixo de 100, então a requisição passa. É uma aproximação porque assume que o tráfego da janela anterior foi distribuído por igual: quem concentrou uma rajada no fim da janela anterior é superestimado, quem ficou ocioso é subestimado. Na prática o erro é pequeno e o custo de memória é fixo (dois inteiros, não importa se a origem mandou 10 ou 10 mil requisições). É a abordagem que a Cloudflare usa no rate limiting de produção deles.
- **Leaky Bucket**: parecido com Token Bucket, mas pensado ao contrário: as requisições entram num balde e saem (são processadas) numa taxa fixa e constante, como um balde furado vazando numa velocidade constante. Se as requisições chegam mais rápido do que esse vazamento, o balde enche e transborda (requisições extras são descartadas). Diferente do Token Bucket, ele não permite burst, o processamento é sempre no mesmo ritmo, o que é útil quando o objetivo é suavizar o tráfego para um serviço de trás, não só bloquear excesso.

| Algoritmo              | Permite burst?             | Precisão   | Custo de memória           |
| ---------------------- | -------------------------- | ---------- | -------------------------- |
| Fixed Window           | Sim (no problema de borda) | Baixa      | Baixo                      |
| Sliding Window         | Não                        | Média/Alta | Médio                      |
| Sliding Window Log     | Não                        | Alta       | Alto (guarda cada request) |
| Sliding Window Counter | Pouco (nas bordas)         | Média/Alta | Baixo (dois contadores)    |
| Leaky Bucket           | Não                        | Alta       | Baixo                      |
| Token Bucket           | Sim (controlado)           | Alta       | Baixo                      |

## Onde aplicar

Rate limiting pode ser configurado em vários níveis, e sistemas maduros normalmente combinam mais de um:

- **API Gateway**: o ponto mais comum de aplicar, porque centraliza todo o tráfego que entra no sistema (veja [API Gateway](/labs/web-dev/escalabilidade/07-api-gateway/)).
- **Serviço**: um limite específico de um microsserviço particularmente sensível a carga, além do limite geral do gateway.
- **Usuário**: limite por conta autenticada, o mais justo quando o sistema já sabe quem está fazendo a requisição.
- **IP**: útil antes mesmo de autenticação existir (ex: proteção contra força bruta no próprio endpoint de login), mas menos preciso, porque vários usuários podem compartilhar o mesmo IP (ex: numa rede corporativa).
- **API Key**: comum em APIs públicas, onde cada chave representa um cliente ou aplicação integradora.
- **Tenant**: em sistemas multi-inquilino (multi-tenant), o limite é aplicado por cliente empresarial, garantindo que o uso pesado de um tenant não afete os outros que compartilham a mesma infraestrutura.

## Backpressure

Rate limiting rejeita requisições que ultrapassam um limite definido de antemão. **Backpressure** é um mecanismo complementar: em vez de um limite fixo decidido com antecedência, o próprio sistema sinaliza, em tempo real, que está sobrecarregado e que quem está mandando trabalho para ele precisa desacelerar. Isso aparece, por exemplo, quando uma fila cresce além de um limite saudável e passa a rejeitar novas mensagens até os consumers darem conta do que já está acumulado (veja [Filas e Mensageria](/labs/web-dev/mensageria/01-filas-e-mensageria/)), em vez de aceitar mensagens indefinidamente até a memória do broker se esgotar.

## Referências

- [APIs performáticas: Rate Limiting e Caching em Redis](https://www.rocketseat.com.br/blog/artigos/post/apis-performaticas-rate-limiting-caching-redis) - Rocketseat, pt-BR
- [Rate Limiting](https://algomaster.io/learn/system-design/rate-limiting) - AlgoMaster (Ashish Pratap Singh), en
- [Rate Limiting Algorithms: Token Bucket vs Sliding Window vs Fixed Window](https://blog.arcjet.com/rate-limiting-algorithms-token-bucket-vs-sliding-window-vs-fixed-window/) - Arcjet, en
- [How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/) - Cloudflare, en
- [Build 5 Rate Limiters with Redis: Fixed Window, Sliding Window, Token Bucket](https://redis.io/tutorials/howtos/ratelimiting/) - Redis, en
