# Pilares de Estudo para Programar

Quem está começando costuma sentir que precisa aprender tudo ao mesmo tempo: uma linguagem, um framework, banco de dados, Docker e mais aquela ferramenta que apareceu na semana passada. Esta nota propõe outro ângulo: separar o que muda toda hora do que muda devagar, e dar mais tempo de estudo para o segundo grupo. Não tem código aqui, é um mapa.

## Os 7 pilares

Uma forma de organizar os estudos é dividir em sete pilares. É um modelo informal, comum em conteúdo para quem está entrando na área, e não um padrão oficial. Serve como checklist para perceber o que está faltando:

1. **Lógica de programação:** montar uma sequência coerente de instruções para resolver um problema, em qualquer linguagem (veja [Lógica de Programação e Pensamento Computacional](/labs/web-dev/algoritmos-e-estruturas-de-dados/02-logica-e-pensamento-computacional/)).
2. **Algoritmos e estruturas de dados:** como organizar dados e como resolver problemas sobre eles gastando pouco tempo e memória (o resto desta seção do lab).
3. **Pensamento computacional:** abstrair, automatizar e analisar, o raciocínio por trás do código.
4. **Prática constante (hands-on):** escrever, quebrar, consertar. Ler sobre nadar não ensina a nadar.
5. **Padrões e heurísticas:** reconhecer que um problema novo se parece com outro que você já resolveu.
6. **Fundamentos de sistemas:** rede, banco de dados e arquitetura, tudo que existe ao redor do seu código.
7. **Aprendizado contínuo:** a tecnologia muda, então saber aprender vale mais do que saber uma ferramenta específica.

## Fundamentos antes de frameworks

Frameworks e bibliotecas mudam rápido. Um projeto que hoje é padrão do mercado pode estar em declínio daqui a poucos anos. Já as ideias que ficam por baixo demoram muito mais para mudar: uma tabela hash funciona hoje como funcionava décadas atrás, e um banco de dados ainda precisa lidar com concorrência e consistência.

O que costuma permanecer útil, independente da moda:

- estruturas de dados e algoritmos
- redes e protocolos (como o HTTP)
- banco de dados e transações
- sistemas distribuídos
- arquitetura de software

Quem tem essa base costuma aprender um framework novo mais rápido, porque reconhece as ideias que ele reaproveita. O caminho inverso é mais difícil: dá para usar um framework por anos sem entender o que ele faz por baixo, e o desconforto aparece quando algo quebra de um jeito que a documentação não previu.

## Prática deliberada

Estudar mais horas não garante evoluir. O conceito de **prática deliberada**, descrito pelo psicólogo Anders Ericsson e colegas em 1993, diz que o que melhora o desempenho é uma prática desenhada para isso: com meta específica, feedback rápido e foco no que você ainda não domina. Repetir o que já sabe fazer só confirma o que você já sabe.

Aplicado a programação, algo como:

- resolver problemas de forma constante, e não só ler soluções prontas
- implementar você mesmo, mesmo quando a biblioteca já traz pronto
- comparar sua solução com outras e entender o trade-off entre elas (mais rápida, mais simples, mais legível?)
- olhar para onde você trava e treinar justamente isso
- refazer depois de um tempo, tentando melhorar

Uma ressalva importante: a famosa regra das "10 mil horas" é uma simplificação popular desse estudo, que foi feito com estudantes de violino e pianistas. O artigo original não afirma que existe um número mágico, e observa que sessões longas demais rendem pouco. Além disso, uma replicação publicada em 2019 (Macnamara e Maitra) encontrou que a prática explicava cerca de 26% da diferença de desempenho, contra 48% no estudo original. Ou seja, a prática pesa bastante, mas não explica tudo sozinha.

## Chunking e reconhecimento de padrões

Em 1973, Chase e Simon mostraram uma coisa curiosa com jogadores de xadrez: mestres lembravam posições de partidas reais muito melhor que iniciantes, mas com peças espalhadas ao acaso a vantagem sumia. A explicação proposta é que o mestre não tem memória melhor, ele agrupa as peças em **blocos** (chunks) que já viu milhares de vezes e enxerga cada bloco como uma unidade só.

Em programação, vale a comparação: quem já resolveu vários problemas de "janela deslizante" reconhece o formato do enunciado sem começar do zero. Isso é uma **analogia**, e não um resultado demonstrado para código: a pesquisa foi feita com xadrez. Ela ajuda a explicar por que estudar padrões acelera, e o reconhecimento de padrões é o assunto de [Padrões de Resolução de Problemas](/labs/web-dev/algoritmos-e-estruturas-de-dados/11-padroes-de-resolucao-de-problemas/).

## Como este lab cobre cada pilar

| Pilar                            | Onde estudar                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lógica de programação            | [Lógica e Pensamento Computacional](/labs/web-dev/algoritmos-e-estruturas-de-dados/02-logica-e-pensamento-computacional/)                                                                                                                                                             |
| Algoritmos e estruturas de dados | Notas 03 a 10 desta seção, começando por [Estruturas de Dados e Algoritmos](/labs/web-dev/algoritmos-e-estruturas-de-dados/03-estruturas-de-dados-e-algoritmos/)                                                                                                                      |
| Pensamento computacional         | [Lógica e Pensamento Computacional](/labs/web-dev/algoritmos-e-estruturas-de-dados/02-logica-e-pensamento-computacional/)                                                                                                                                                             |
| Prática constante                | Não cabe numa nota. Use a pasta `examples/` do repositório e resolva os exercícios que aparecem ao longo desta seção                                                                                                                                                                  |
| Padrões e heurísticas            | [Paradigmas de Projeto](/labs/web-dev/algoritmos-e-estruturas-de-dados/10-paradigmas-de-projeto-de-algoritmos/) e [Padrões de Resolução](/labs/web-dev/algoritmos-e-estruturas-de-dados/11-padroes-de-resolucao-de-problemas/)                                                        |
| Fundamentos de sistemas          | [HTTP e REST](/labs/web-dev/apis/01-http-rest/), [ACID](/labs/web-dev/banco-de-dados/03-acid/), [Escalabilidade](/labs/web-dev/escalabilidade/01-escalabilidade/), [Consistência e Replicação](/labs/web-dev/sistemas-distribuidos/01-consistencia-e-replicacao/) e o restante do lab |
| Aprendizado contínuo             | É um hábito, não um assunto: acompanhar a documentação oficial e revisitar os fundamentos quando uma ferramenta nova aparecer                                                                                                                                                         |

## Referências

- [The Role of Deliberate Practice in the Acquisition of Expert Performance](https://eric.ed.gov/?id=EJ471947) - Ericsson, Krampe e Tesch-Römer (Psychological Review, 1993), en
- [The role of deliberate practice in expert performance: revisiting Ericsson, Krampe & Tesch-Römer (1993)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6731745/) - Macnamara e Maitra (Royal Society Open Science, 2019), en
- [Perception in Chess](https://andymatuschak.org/prompts/Chase1973.pdf) - Chase e Simon (Cognitive Psychology, 1973), en
- [Expert Chess Memory: Revisiting the Chunking Hypothesis](https://www.tandfonline.com/doi/abs/10.1080/741942359) - Gobet e Simon (Memory, 1998), en
