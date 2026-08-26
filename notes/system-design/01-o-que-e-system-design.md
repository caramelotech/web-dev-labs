# System Design: Fundamentos

## O que é System Design

System Design é a atividade de desenhar a arquitetura de um sistema de software antes (ou durante) de construí-lo: quais componentes existem, como eles se comunicam, onde os dados moram e como o sistema se comporta sob carga, sob falha e ao longo do tempo. Não é sobre escrever a lógica de negócio de uma função, é sobre decidir a forma do sistema como um todo.

Na prática, é a diferença entre "como eu implemento essa validação de CPF" (um problema de código) e "como eu construo um encurtador de URL que aguenta 100 mil requisições por segundo sem perder dados" (um problema de design). O segundo tipo de pergunta é o que domina entrevistas de backend pleno/sênior, porque testa se a pessoa consegue enxergar o sistema inteiro, não só um trecho dele.

Os objetivos de um bom design geralmente se resumem a:

- **Resolver o problema real**, dentro dos requisitos que o negócio pediu, nem mais nem menos
- **Aguentar a escala esperada** (e um pouco além dela), sem reescrever tudo a cada pico de tráfego
- **Se manter no ar** mesmo quando partes dele falham, porque em produção alguma coisa sempre acaba falhando
- **Ser simples o suficiente para o time entender e operar**, um design brilhante que ninguém consegue debugar às 3h da manhã não é um bom design

Um bom projeto de sistema não busca a solução "perfeita": busca a solução certa para os requisitos, o orçamento e o tempo que aquele time tem disponível agora.

## Requisitos funcionais vs. não funcionais

Antes de desenhar qualquer arquitetura, é preciso saber o que o sistema precisa fazer e sob quais condições. Essas duas perguntas separam os requisitos em duas categorias.

**Requisitos funcionais** descrevem o comportamento do sistema, o que ele faz do ponto de vista de quem usa. Em um encurtador de URL, por exemplo:

- Um usuário consegue enviar uma URL longa e receber uma URL curta
- Ao acessar a URL curta, o usuário é redirecionado para a URL original
- URLs podem expirar depois de um tempo configurável

**Requisitos não funcionais** descrevem como o sistema deve se comportar, as qualidades que ele precisa ter independentemente da funcionalidade específica:

- O redirecionamento precisa responder em menos de 100ms no p99
- O sistema precisa suportar 10 mil criações de URL por segundo
- O sistema precisa ter 99,9% de disponibilidade
- Os dados não podem ser perdidos mesmo se um servidor cair

Essa separação importa porque os requisitos não funcionais são normalmente o que muda a arquitetura. Dois sistemas com os mesmos requisitos funcionais (por exemplo, "encurtar uma URL") podem ter designs completamente diferentes se um precisa suportar 100 requisições por segundo e o outro precisa suportar 1 milhão.

## Os pilares de um sistema distribuído

Todo requisito não funcional de um sistema distribuído acaba se apoiando em um pequeno conjunto de propriedades. Vale ter o vocabulário de cada uma antes de seguir para o resto do material, porque elas voltam a aparecer em praticamente toda nota desta seção.

- **Escalabilidade**: capacidade de o sistema continuar funcionando bem quando a carga aumenta (mais usuários, mais dados, mais requisições). Aprofundada em [Escalabilidade e Infraestrutura](/labs/web-dev/escalabilidade/01-escalabilidade/).
- **Disponibilidade**: fração do tempo em que o sistema está no ar e respondendo. Aprofundada em [Disponibilidade](/labs/web-dev/resiliencia/03-disponibilidade/).
- **Confiabilidade**: capacidade de o sistema continuar operando corretamente mesmo diante de falhas de componentes individuais, sem corromper dados nem se comportar de forma imprevisível.
- **Consistência**: garantia sobre o que diferentes partes do sistema (ou diferentes usuários) enxergam como o estado atual dos dados. Aprofundada em [Consistência e Replicação](/labs/web-dev/sistemas-distribuidos/01-consistencia-e-replicacao/) e no [Teorema de CAP](/labs/web-dev/banco-de-dados/03-teorema-de-cap/).
- **Latência**: tempo que uma única operação leva para ser concluída. Aprofundada em [Latência, Throughput e Performance](/labs/web-dev/system-design/04-latencia-e-performance/).
- **Throughput**: quantidade de operações que o sistema processa por unidade de tempo. Também aprofundado na mesma nota de latência e performance.
- **Custo**: dinheiro gasto em infraestrutura, operação e manutenção. Toda decisão de design tem um preço, e ignorar essa variável é um erro comum de quem está começando em system design.

Essas propriedades não são independentes: puxar uma para cima quase sempre empurra outra para baixo. Isso nos leva ao próximo ponto.

## Trade-offs arquiteturais

Não existe arquitetura que maximize todos os pilares ao mesmo tempo. Mais consistência normalmente custa mais latência. Mais disponibilidade normalmente custa mais complexidade e mais dinheiro. Mais escalabilidade normalmente custa consistência mais fraca.

Por isso, a habilidade central de quem faz system design não é conhecer os componentes (CDN, cache, fila, banco), é saber qual trade-off faz sentido para o problema específico que está na mesa. Um sistema de pagamentos prioriza consistência mesmo que isso custe latência. Um contador de curtidas em uma rede social prioriza disponibilidade e latência baixa, e aceita que o número mostrado esteja um pouco desatualizado.

Essa nota fica só na superfície do assunto: a lista completa dos trade-offs mais cobrados e como raciocinar sobre cada um está detalhada em [Trade-offs Arquiteturais](/labs/web-dev/system-design/05-trade-offs-arquiteturais/), depois que os componentes individuais (cache, filas, réplicas etc.) já tiverem sido apresentados nas próximas notas.
