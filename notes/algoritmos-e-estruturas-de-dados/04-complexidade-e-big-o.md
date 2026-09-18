# Complexidade de Algoritmos e Notação Big O

Como comparar dois algoritmos que resolvem o mesmo problema? Cronometrar não serve muito: o tempo depende do computador, do que mais está rodando e do tamanho dos dados que você testou. A **complexidade** troca o cronômetro por uma pergunta melhor: quando os dados crescem, quanto o custo cresce junto?

## Complexidade de tempo e de espaço

- **Complexidade de tempo:** como a quantidade de operações cresce conforme o tamanho da entrada (chamado de `n`) aumenta.
- **Complexidade de espaço:** como a memória extra usada cresce conforme `n` aumenta.

Repare que o que se conta são operações, e não segundos. Um algoritmo que faz 3 passos por item e outro que faz 5 passos por item crescem do mesmo jeito: dobrar a entrada dobra o trabalho. O que diferencia algoritmos é o *formato* do crescimento.

## Notação Big O

Big O é a notação que descreve esse formato de crescimento. Escrever `O(n)` significa "o custo cresce, no máximo, proporcionalmente a `n`". As classes que mais aparecem, da mais barata para a mais cara:

| Classe | Nome | Exemplo | Para n = 1.000 | Para n = 1.000.000 |
| ------ | ---- | ------- | -------------- | ------------------ |
| O(1) | constante | acessar `lista[0]` | 1 | 1 |
| O(log n) | logarítmica | busca binária | cerca de 10 | cerca de 20 |
| O(n) | linear | percorrer a lista inteira | 1.000 | 1.000.000 |
| O(n log n) | linearítmica | ordenar com merge sort | cerca de 10.000 | cerca de 20 milhões |
| O(n²) | quadrática | dois `for` aninhados sobre a mesma lista | 1.000.000 | 1 trilhão |
| O(2ⁿ) | exponencial | Fibonacci recursivo ingênuo | inviável | inviável |

Para ter uma noção do que isso significa: um computador comum faz da ordem de um bilhão de operações simples por segundo. Um algoritmo O(n) com um milhão de itens leva um milésimo de segundo. O(n²) com o mesmo milhão faz 1 trilhão de operações, cerca de 17 minutos. E o O(2ⁿ) nem termina antes de você desistir, já com n = 100.

### Como cada classe aparece no código

```js
// O(1): o custo não depende do tamanho da lista
const primeiro = lista[0];

// O(n): no pior caso olha todos os itens
const achou = lista.includes(valor);

// O(n²): para cada item, percorre a lista de novo
function temDuplicadoLento(lista) {
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      if (lista[i] === lista[j]) return true;
    }
  }
  return false;
}

// O(n): a mesma pergunta, com um Set
function temDuplicado(lista) {
  const vistos = new Set();
  for (const item of lista) {
    if (vistos.has(item)) return true;
    vistos.add(item);
  }
  return false;
}
```

As duas funções respondem à mesma pergunta. A segunda vai de O(n²) para O(n) usando um `Set` (que os motores implementam com uma [tabela hash](/labs/web-dev/algoritmos-e-estruturas-de-dados/06-tabelas-hash/)). O preço é memória extra, o que leva ao próximo ponto.

Os outros formatos aparecem nas próximas notas: O(log n) na [busca binária](/labs/web-dev/algoritmos-e-estruturas-de-dados/09-recursao-busca-e-ordenacao/), O(n log n) nos bons algoritmos de ordenação e O(2ⁿ) no Fibonacci recursivo que a [programação dinâmica](/labs/web-dev/algoritmos-e-estruturas-de-dados/10-paradigmas-de-projeto-de-algoritmos/) resolve.

### Como ler e simplificar

Duas regras cobrem a maioria dos casos:

1. **Ignore constantes.** `O(3n)` e `O(n)` são a mesma classe. Fazer três passos por item ou um passo por item cresce igual.
2. **Fique com o termo dominante.** Se o custo é `n² + 5n + 2`, quando `n` é grande o `n²` domina o resto. Vira `O(n²)`.

Outra convenção: quando alguém diz "esse algoritmo é O(n)" sem mais detalhe, quase sempre está falando do **pior caso**. Achar um valor com `includes` custa 1 operação se ele for o primeiro da lista e `n` se for o último ou não existir. O Big O do `includes` é O(n).

Formalmente, Big O é um limite superior. Existem também Ω (limite inferior) e Θ (limite justo), que o material do IME-USP nas referências explica com rigor. Para o dia a dia, saber ler O(...) já resolve.

## Complexidade de espaço

A mesma ideia vale para memória. `temDuplicadoLento` usa uma quantidade fixa de memória extra, então é O(1) de espaço. `temDuplicado` guarda cada item visto no `Set`, então é O(n) de espaço.

Esse é o trade-off clássico: **trocar memória por tempo**. É o que cache, índices e o `Set` acima fazem: gastam espaço guardando algo pronto para responder rápido depois.

## Limite da teoria

Big O descreve como o custo *cresce*, e não quanto tempo o código leva de fato. Por isso convém desconfiar de três armadilhas:

- **`n` pequeno engana.** Um algoritmo O(n²) simples, sem overhead, pode ser mais rápido que um O(n log n) complicado para 20 itens. A classe só começa a mandar quando os dados crescem.
- **As constantes existem.** Dois algoritmos O(n) podem ter velocidades bem diferentes na prática.
- **O hardware importa.** Percorrer um array (memória contínua) costuma ser mais rápido do que seguir ponteiros de uma lista ligada, mesmo com a mesma classe de complexidade.

A regra prática: use Big O para descartar escolhas ruins e para entender o comportamento quando o volume cresce, e **meça** (com `console.time`, `performance.now()` ou um profiler) antes de otimizar de verdade.

## Referências

- [Notação Big-O](https://pt.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/big-o-notation) - Khan Academy, pt-BR
- [O que é a notação Big O: complexidade de tempo e de espaço](https://www.freecodecamp.org/portuguese/news/o-que-e-a-notacao-big-o-complexidade-de-tempo-e-de-espaco/) - freeCodeCamp (tradução de Daniel Rosa), pt-BR
- [Comparação assintótica de funções](https://www.ime.usp.br/~pf/analise_de_algoritmos/aulas/Oh.html) - Paulo Feofiloff (IME-USP), pt-BR
