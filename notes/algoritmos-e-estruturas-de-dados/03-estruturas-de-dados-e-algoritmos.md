# Estruturas de Dados e Algoritmos

Todo programa faz duas coisas: guarda dados e resolve problemas com eles. Estruturas de dados e algoritmos são os nomes para essas duas metades, e é a dupla que decide se o seu código responde em milissegundos ou trava quando os dados crescem.

## O que é uma estrutura de dados

Uma **estrutura de dados** é uma forma de organizar e guardar dados para facilitar o acesso e a modificação deles. Pense na diferença entre uma pilha de livros no chão e uma estante organizada por autor. Os livros são os mesmos, mas achar um título específico é bem mais rápido na estante. Por outro lado, empilhar um livro novo no chão é mais rápido do que achar o lugar certo na estante.

Esse é o ponto principal: **cada estrutura deixa algumas operações baratas e outras caras**. Não existe uma estrutura melhor em tudo, existe a que combina com o que o seu programa mais faz.

Alguns exemplos que você já usa: arrays, objetos e `Map` do JavaScript. Nas notas seguintes você vai ver como eles funcionam por dentro.

## O que é um algoritmo

Um **algoritmo** é uma sequência finita de passos bem definidos que recebe uma entrada e produz uma saída, resolvendo um problema. A receita de bolo serve de novo: os ingredientes são a entrada, os passos são o algoritmo e o bolo é a saída.

Algoritmo e estrutura de dados andam sempre juntos. O algoritmo é o que você faz, a estrutura é onde os dados estão enquanto você faz.

## Por que isso importa

Dois programas podem dar a mesma resposta e ainda assim ter custos muito diferentes. Um exemplo: achar um usuário pelo `id`.

```js
// Com uma lista: percorre até achar
const usuarioNaLista = usuarios.find((u) => u.id === id);

// Com um Map indexado por id: vai direto
const usuarioNoMap = usuariosPorId.get(id);
```

Com 100 usuários, ninguém percebe a diferença. Com um milhão, o `find` pode olhar até um milhão de itens a cada requisição, enquanto o `Map` faz uma quantidade praticamente constante de trabalho. Multiplique isso pelo número de requisições por segundo e a diferença vira servidor a mais, ou site fora do ar.

O custo de um algoritmo aparece em três lugares:

- **tempo de execução:** quanto demora
- **uso de memória:** quanto espaço ocupa
- **escalabilidade:** como os dois crescem quando os dados aumentam

Aqui "escalabilidade" é o custo do código crescer devagar conforme os dados crescem. O lado de infraestrutura (mais servidores, load balancer, cache) está na seção de [Escalabilidade](/labs/web-dev/escalabilidade/01-escalabilidade/), e as duas conversam: às vezes, trocar um algoritmo é mais barato do que comprar uma máquina maior.

## Fazer funcionar vs fazer funcionar bem

Um código que "funciona" passou nos testes de hoje, com poucos dados. Um código que "funciona bem" continua funcionando quando os dados crescem 100 vezes. Conhecer as estruturas e os algoritmos clássicos ajuda de três formas:

- você escreve código mais eficiente sem esforço extra, porque já sabe qual ferramenta cabe em cada caso
- você toma decisões de arquitetura com base em custo, e não em palpite. Um exemplo é o [índice de banco de dados](/labs/web-dev/banco-de-dados/13-indices-e-planos-de-execucao/), que existe justamente para o banco não varrer a tabela inteira a cada consulta
- você resolve problemas novos com mais facilidade, porque eles quase sempre são variações de problemas clássicos

## Mapa do que vem a seguir

| Nota                                                                                                            | O que você vai ver                                                   |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [Complexidade e Big O](/labs/web-dev/algoritmos-e-estruturas-de-dados/04-complexidade-e-big-o/)                 | A régua para medir e comparar o custo de um algoritmo                |
| [Estruturas Lineares](/labs/web-dev/algoritmos-e-estruturas-de-dados/05-estruturas-lineares/)                   | Array, lista ligada, pilha e fila                                    |
| [Tabelas Hash](/labs/web-dev/algoritmos-e-estruturas-de-dados/06-tabelas-hash/)                                 | Chave e valor com acesso rápido                                      |
| [Árvores](/labs/web-dev/algoritmos-e-estruturas-de-dados/07-arvores/)                                           | Dados hierárquicos, busca em ordem e heap                            |
| [Grafos](/labs/web-dev/algoritmos-e-estruturas-de-dados/08-grafos/)                                             | Conexões entre coisas, BFS e DFS                                     |
| [Recursão, Busca e Ordenação](/labs/web-dev/algoritmos-e-estruturas-de-dados/09-recursao-busca-e-ordenacao/)    | Os algoritmos mais clássicos                                         |
| [Paradigmas de Projeto](/labs/web-dev/algoritmos-e-estruturas-de-dados/10-paradigmas-de-projeto-de-algoritmos/) | Divisão e conquista, programação dinâmica, guloso e backtracking     |
| [Padrões de Resolução](/labs/web-dev/algoritmos-e-estruturas-de-dados/11-padroes-de-resolucao-de-problemas/)    | Two pointers, sliding window e como reconhecer o formato do problema |

## Referências

- [Introduction to Algorithms, 4th ed.](https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/) - Cormen, Leiserson, Rivest e Stein (MIT Press, 2022), en
- [Algoritmos em Linguagem C](https://www.ime.usp.br/~pf/algoritmos-livro/) - Paulo Feofiloff (Elsevier, 2009), pt-BR
- [Estruturas de dados e tipos de dados em JavaScript](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Data_structures) - MDN Web Docs, pt-BR
