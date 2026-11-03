# Timeout, Retry, Circuit Breaker e Bulkhead

Em um sistema distribuído, toda chamada entre dois serviços pode falhar: a rede pode cair, o serviço do outro lado pode estar lento, sobrecarregado ou fora do ar. Os padrões desta nota existem para lidar com esse tipo de falha sem deixar o problema de um serviço derrubar todos os outros.

Esses padrões podem ser implementados em três lugares: numa biblioteca dentro da aplicação (como o Resilience4j no ecossistema Spring), numa camada de infraestrutura entre os serviços (um [Service Mesh](/labs/web-dev/microsservicos/05-service-mesh/)), ou na borda do sistema (um API Gateway ou NGINX). O funcionamento de cada padrão é o mesmo nos três casos, muda só onde o código roda.

## Timeout

Timeout é o tempo máximo que você espera por uma resposta antes de desistir. Sem timeout, uma chamada para um serviço travado pode prender a thread (ou a conexão) que fez a chamada indefinidamente, e isso se espalha: se o serviço A chama o serviço B sem timeout, e B está travado, A também trava. Com dezenas de requisições acumulando, A fica sem recursos livres e para de responder, mesmo sem nenhum bug no próprio código de A.

Existem alguns tipos de timeout, cada um cobrindo uma fase diferente da comunicação:

- **Connection timeout**: tempo máximo para estabelecer a conexão TCP (ou o handshake TLS) com o servidor remoto. Se o servidor está fora do ar ou inacessível na rede, é aqui que a falha aparece primeiro.
- **Read timeout** (também chamado de socket timeout): tempo máximo esperando por dados depois que a conexão já foi estabelecida e a requisição já foi enviada. Cobre o caso em que o servidor aceitou a conexão, mas está demorando demais para responder.
- **Request timeout**: o teto total da operação, do início ao fim, somando conexão, envio, processamento do outro lado e leitura da resposta. É o limite que geralmente importa para quem está chamando: "eu não posso esperar mais que X segundos por essa operação, custe o que custar".

Definir um timeout bom é um equilíbrio: baixo demais e você corta requisições legítimas que só estavam um pouco lentas; alto demais e você perde a proteção, porque a thread ainda fica presa por tempo suficiente para causar dano. Uma prática comum é olhar a latência p99 da dependência (veja [Latência, Throughput e Performance](/labs/web-dev/system-design/04-latencia-e-performance/)) e definir o timeout com alguma margem acima dela, não um número arbitrário.

### Deadline propagation e cancelamento

Timeout protege quem chama, mas não avisa quem foi chamado. Imagine um cliente com timeout de 2 segundos chamando um backend que leva 30 segundos para responder. Depois de 2 segundos o cliente desiste e mostra um erro, só que o backend não fica sabendo: ele segue os 28 segundos restantes consultando banco, chamando outros serviços e montando uma resposta que ninguém vai ler. Com retry configurado, fica pior, porque cada nova tentativa dispara mais um processamento de 30 segundos enquanto os anteriores ainda rodam 🔥

Duas ideias resolvem isso.

**Deadline propagation** (propagação de prazo): a requisição carrega o tempo que ainda resta, e cada serviço repassa esse orçamento para as chamadas que faz em seguida, descontando o que já gastou. Se o usuário tem 2 segundos e o gateway gastou 300 ms, o serviço seguinte recebe 1,7 s, não um timeout novo de 2 s.

```mermaid
flowchart LR
    C[Cliente<br/>prazo: 2000 ms] -->|restam 2000 ms| G[Gateway]
    G -->|gastou 300 ms<br/>restam 1700 ms| P[Pedidos]
    P -->|gastou 500 ms<br/>restam 1200 ms| E[Estoque]
```

A documentação do gRPC, que faz isso automaticamente em Java e Go, recomenda repassar o prazo como **tempo restante** e não como um horário absoluto ("termina às 14:03:05.200"), porque os relógios de máquinas diferentes nunca estão perfeitamente sincronizados.

**Cancelamento cooperativo**: quando o prazo estoura (ou o cliente desconecta), o trabalho em andamento precisa ser avisado para parar. Isso não acontece por mágica, o código tem que passar um "sinal de cancelamento" para cada operação demorada e checar esse sinal. Cada linguagem tem o seu mecanismo:

- JavaScript: `AbortController` e `AbortSignal`
- Go: `context.Context`, passado como primeiro parâmetro de toda função que faz I/O
- .NET: `CancellationToken`
- Java: interrupção de threads ou o cancelamento do `CompletableFuture`/framework reativo em uso

Um exemplo em Node.js, em que o mesmo `signal` acompanha todas as chamadas de uma requisição:

```js
app.get("/pedidos/:id/resumo", async (req, res) => {
  // orçamento total de 2 s para a requisição inteira
  const signal = AbortSignal.timeout(2000);

  try {
    // as duas chamadas compartilham o mesmo prazo: se a primeira
    // gastar 1,5 s, a segunda tem só 0,5 s antes de ser abortada
    const pedido = await fetch(`http://pedidos/pedidos/${req.params.id}`, {
      signal,
    });
    const frete = await fetch(`http://frete/cotacao?pedido=${req.params.id}`, {
      signal,
    });

    res.json({ pedido: await pedido.json(), frete: await frete.json() });
  } catch (err) {
    if (err.name === "TimeoutError") return res.status(504).end();
    throw err;
  }
});
```

Abortar o `fetch` faz o cliente parar de esperar e fechar a conexão. O serviço do outro lado só para de trabalhar se também observar esse fechamento e repassar o cancelamento para as consultas que estiver fazendo, então o cuidado precisa existir nas duas pontas.

Uma ressalva: nem toda operação deve ser cancelada no meio. Uma cobrança enviada ao provedor de pagamento que já começou precisa terminar e ter o resultado gravado, senão o dinheiro sai e a aplicação não fica sabendo. Esse caso está detalhado em [Idempotência](/labs/web-dev/resiliencia/02-idempotencia/).

## Retry

Retry é tentar de novo uma operação que falhou. Faz sentido quando a falha é provavelmente temporária: um timeout, uma queda momentânea de rede, um erro 503 de "serviço temporariamente indisponível". Nesses casos, a mesma requisição enviada de novo alguns instantes depois tem boa chance de funcionar.

Retry **não** faz sentido, e pode até piorar as coisas, em alguns cenários:

- **Erros do próprio pedido**: um 400 (requisição malformada) ou um 404 (recurso não existe) não vão mudar de resultado só porque você tentou de novo. Insistir é desperdício.
- **Serviço já sobrecarregado**: se o serviço está lento porque está no limite da capacidade, uma onda de retries de todos os clientes que falharam é exatamente a pressão extra que pode derrubá-lo de vez. Esse efeito em cascata é conhecido como _retry storm_.
- **Operações não idempotentes sem proteção**: se a primeira tentativa teve efeito (por exemplo, cobrou o cliente) mas a resposta se perdeu no caminho, repetir a chamada pode duplicar o efeito. Retry seguro depende de a operação ser idempotente, isso é tratado em detalhe em [Idempotência](/labs/web-dev/resiliencia/02-idempotencia/).

Para evitar o problema de retries sincronizados martelando o serviço no mesmo instante, duas técnicas costumam andar juntas:

**Exponential backoff**: em vez de tentar de novo imediatamente, o intervalo entre tentativas cresce exponencialmente. Uma sequência comum é 1s, 2s, 4s, 8s, com um número máximo de tentativas antes de desistir de vez.

```mermaid
flowchart LR
    A[Tentativa 1: falha] -->|espera 1s| B[Tentativa 2: falha]
    B -->|espera 2s| C[Tentativa 3: falha]
    C -->|espera 4s| D[Tentativa 4: sucesso]
```

**Jitter**: se mil clientes falharam no mesmo milissegundo e todos aplicam exatamente o mesmo backoff, eles vão tentar de novo todos juntos, no mesmo instante, o que recria o problema original em menor escala a cada tentativa. Jitter adiciona uma variação aleatória ao tempo de espera (por exemplo, um valor aleatório entre 0 e o tempo calculado pelo backoff) para espalhar as tentativas ao longo do tempo em vez de concentrá-las.

## Circuit Breaker

Se um serviço está fora do ar, continuar tentando chamá-lo (mesmo com backoff) ainda desperdiça tempo, threads e conexões em cada tentativa fadada ao fracasso. O circuit breaker (disjuntor, na tradução literal) resolve isso parando de tentar por um tempo, do mesmo jeito que um disjuntor elétrico desarma para proteger o circuito.

Ele funciona como uma máquina de estados com três posições:

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open: taxa de falhas ultrapassa o limite
    Open --> HalfOpen: passa o tempo de espera
    HalfOpen --> Closed: chamada de teste funciona
    HalfOpen --> Open: chamada de teste falha
```

- **Closed** (fechado): estado normal. As chamadas passam direto para o serviço remoto, e o circuit breaker só fica contando falhas e sucessos.
- **Open** (aberto): depois que a taxa de falhas ultrapassa um limite configurado (por exemplo, 50% das últimas 20 chamadas falharam), o circuito abre. Enquanto está aberto, nenhuma chamada real é feita, o breaker falha rápido de propósito (retorna erro imediatamente, ou aciona um fallback) sem nem tentar acessar o serviço com problema.
- **Half-open** (semiaberto): depois de um tempo de espera configurado, o breaker deixa passar um pequeno número de chamadas de teste. Se elas funcionarem, ele fecha o circuito de novo e volta ao normal. Se falharem, ele volta para aberto e espera mais um pouco antes de testar de novo.

O ganho principal é duplo: protege o cliente de ficar gastando recursos numa chamada que provavelmente vai falhar, e protege o serviço remoto de receber tráfego extra bem no momento em que ele está tentando se recuperar.

## Bulkhead

O nome vem dos compartimentos estanques (bulkheads) usados em navios: o casco é dividido em seções seladas, então se uma seção é perfurada e alaga, só aquela seção afunda, o resto do navio continua flutuando.

Aplicado a software, bulkhead significa isolar recursos (threads, conexões, pools de memória) por dependência, para que um problema em uma dependência não consuma os recursos usados para falar com as outras.

Um exemplo concreto: um serviço que chama três dependências externas (pagamentos, recomendações, notificações) usando um único pool de 100 threads para HTTP. Se o serviço de recomendações começa a responder devagar, as threads que estão esperando por ele vão, aos poucos, ocupar o pool inteiro, isso trava também as chamadas para pagamentos e notificações, que não têm nada a ver com o problema. Com bulkhead, cada dependência recebe seu próprio pool isolado (por exemplo, 30 threads para cada uma), então recomendações lento consome só as próprias 30 threads e deixa as outras 70 livres para o resto continuar funcionando.

Isso evita o que se chama de **cascading failure** (falha em cascata): uma falha pequena e localizada em um componente que se propaga e derruba componentes que, isoladamente, estavam saudáveis.

## Graceful Degradation

Graceful degradation (degradação suave) é o princípio de que, quando algo falha, o sistema deve continuar entregando o máximo de valor possível em vez de quebrar por completo.

A ideia central é separar funcionalidades essenciais das secundárias:

- **Funcionalidades secundárias podem falhar** sem derrubar a experiência inteira. Se o serviço de recomendações personalizadas está fora do ar, uma página de produto ainda consegue mostrar preço, descrição e botão de compra, só a seção "quem comprou isso também comprou" some ou mostra um conteúdo genérico.
- **O sistema principal continua funcionando**: o fluxo que realmente importa (nesse exemplo, comprar o produto) não depende de nenhuma peça secundária estar no ar.

Na prática, isso costuma ser implementado com um fallback: quando a chamada para a dependência falha (ou o circuit breaker está aberto), em vez de propagar o erro para o usuário, o código retorna um valor padrão, um cache antigo, ou simplesmente omite aquele pedaço da resposta. Um circuit breaker aberto sem um fallback definido só transforma "lento" em "quebrado" mais rápido, o valor de graceful degradation está justamente em decidir, para cada dependência, o que acontece quando ela não responde.

## Combinando os padrões

Cada padrão desta nota resolve um pedaço do problema, e nenhum deles funciona bem sozinho. Um timeout sem retry transforma toda falha passageira em erro para o usuário. Um retry sem timeout espera para sempre antes de tentar de novo. A meta não é impedir toda falha, isso não existe em sistema distribuído. É fazer a falha ficar **isolada** (não se espalha), **observável** (alguém vê), **recuperável** (o sistema volta sozinho) e, idealmente, chata: um incidente que se resolve sem ninguém ser acordado de madrugada 😴

### Quem envolve quem

Quando vários padrões protegem a mesma chamada, a ordem em que um envolve o outro muda o comportamento. O Resilience4j usa esta ordem por padrão, de fora para dentro:

```mermaid
flowchart LR
    R[Retry] --> CB[Circuit Breaker] --> RL[Rate Limiter] --> T[Timeout] --> B[Bulkhead] --> F[Chamada remota]
```

Lendo o diagrama:

- O **timeout** fica dentro do retry, então cada tentativa tem o seu próprio limite de tempo. Se fosse o contrário, um único timeout cobriria todas as tentativas juntas (o que também é útil, e é o papel do prazo total da seção [Deadline propagation e cancelamento](#deadline-propagation-e-cancelamento)).
- O **circuit breaker** fica dentro do retry, então cada tentativa conta como uma chamada para ele. Três tentativas que falham são três falhas na estatística do breaker, e ele abre mais cedo.
- Com o breaker aberto, cada tentativa do retry recebe um erro imediato do próprio breaker. Configure o retry para **não** repetir esse erro específico, senão ele gasta as tentativas sem nenhum ganho.

Não precisa decorar a ordem de uma biblioteca, mas vale perguntar, para cada par de padrões: "este aqui conta cada tentativa ou a operação inteira?".

### Combinações que dão errado

| Padrão sozinho                      | O que acontece                                                                          | O que falta                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Retry sem backoff e jitter          | Todos os clientes repetem juntos e o serviço não consegue se recuperar                  | Backoff exponencial com teto, jitter, retry budget |
| Retry sem idempotência              | A operação que funcionou mas teve a resposta perdida é executada duas vezes             | Idempotency key                                    |
| Timeout sem cancelamento            | O cliente desiste e o servidor continua trabalhando para ninguém                        | Propagar prazo e sinal de cancelamento             |
| Circuit breaker sem observabilidade | O breaker abre, o fallback esconde o erro e ninguém percebe que a dependência está fora | Métricas e alertas de estado do breaker            |
| DLQ sem dono                        | Mensagens ficam semanas paradas na fila de falhas sem ninguém notar                     | Alerta de tamanho da DLQ e ferramenta de replay    |

Algumas dessas linhas merecem mais detalhe.

**Retry sem backoff** é o caminho mais curto para um retry storm: uma instabilidade de 2 segundos num provedor vira 10 minutos de queda porque todos os workers repetiram ao mesmo tempo e multiplicaram o tráfego. Esse e outros padrões de falha estão em [Modos de Falha Comuns](/labs/web-dev/resiliencia/04-modos-de-falha/).

**Circuit breaker sem observabilidade** é traiçoeiro justamente quando funciona bem. Com um fallback bom, o usuário nem percebe que a dependência caiu, e o time também não. O breaker passou a esconder o sintoma em vez de ajudar a entender a causa. O mínimo a medir:

- Estado atual de cada breaker (fechado, aberto, semiaberto)
- Transições de estado, com alerta quando um breaker abre ou fica oscilando entre aberto e semiaberto
- Quantidade de chamadas rejeitadas pelo breaker aberto e quantidade de fallbacks servidos
- Taxa de falha e de chamadas lentas que o breaker está enxergando

O Resilience4j, por exemplo, publica essas métricas pelo Micrometer, e elas vão para o mesmo painel das outras métricas do serviço (ver [Observabilidade: Logs, Metrics e Traces](/labs/web-dev/observabilidade/01-logs-metrics-e-traces/)).

**Retry e replay de DLQ dependem de idempotência.** Repetir uma operação só é seguro se repetir não muda o resultado. Isso vale para o retry automático e vale também para o momento em que alguém pega as mensagens paradas na dead letter queue e reprocessa todas de uma vez: é ali que uma falta de idempotência vira pedido duplicado em massa. A DLQ em si, e por que ela precisa de dono, está em [Garantias de Entrega: Ordenação, DLQ e Idempotência](/labs/web-dev/mensageria/05-garantias-de-entrega/), e idempotência em [Idempotência](/labs/web-dev/resiliencia/02-idempotencia/).

Por último, nenhum desses padrões ajuda quando o problema é a demanda passar da capacidade de forma sustentada. Timeout, retry e circuit breaker reagem a falhas, mas não diminuem a carga que chega. Para isso existe **backpressure**, o mecanismo pelo qual o sistema sinaliza "estou cheio, diminua o ritmo" para quem envia, tratado junto com [Rate Limiting](/labs/web-dev/escalabilidade/12-rate-limiting/).

Qual combinação usar depende dos modos de falha que o seu sistema tem, do perfil de tráfego e do que o negócio aceita perder. Um checkout de pagamento e um widget de recomendações não merecem o mesmo tratamento.

## Referências

- [Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) - Marc Brooker (Amazon Builders' Library), en
- [Deadlines](https://grpc.io/docs/guides/deadlines/) - gRPC, en
- [AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) - MDN, en
- [Getting Started (Spring Boot 3)](https://resilience4j.readme.io/docs/getting-started-3) - Resilience4j, en
- [Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/) - Google SRE Book, en
