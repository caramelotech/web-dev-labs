# Recursão, Busca e Ordenação

Esta nota reúne três clássicos que aparecem em quase todo curso de algoritmos e que servem de base para o resto da seção: a recursão (uma função que chama a si mesma), a busca binária (achar um item sem olhar tudo) e a ordenação (colocar itens em ordem).

## Recursão

Uma função é **recursiva** quando chama a si mesma para resolver uma versão menor do mesmo problema. Toda solução recursiva precisa de duas partes:

- **caso base:** a situação mais simples, que se resolve direto e para a recursão
- **passo recursivo:** reduz o problema e chama a função de novo, sempre chegando mais perto do caso base

Sem o caso base, a função chama a si mesma para sempre.

```js
function fatorial(n) {
  if (n <= 1) return 1; // caso base
  return n * fatorial(n - 1); // passo recursivo
}

fatorial(4); // 24
```

Passo a passo, o que acontece com `fatorial(4)`:

```text
fatorial(4) = 4 * fatorial(3)
                  fatorial(3) = 3 * fatorial(2)
                                    fatorial(2) = 2 * fatorial(1)
                                                      fatorial(1) = 1   <- caso base
                                    fatorial(2) = 2 * 1 = 2
                  fatorial(3) = 3 * 2 = 6
fatorial(4) = 4 * 6 = 24
```

### A pilha de chamadas

Cada chamada de função fica esperando a próxima terminar, e o computador guarda essas chamadas pendentes numa **pilha** (a _call stack_, a mesma estrutura da nota de [Estruturas Lineares](/labs/web-dev/algoritmos-e-estruturas-de-dados/05-estruturas-lineares/)). No exemplo, as quatro chamadas ficam empilhadas até `fatorial(1)` responder, e então se desempilham devolvendo os resultados.

A pilha tem tamanho limitado. Uma recursão profunda demais (ou sem caso base) termina em erro:

```js
function semFim(n) {
  return semFim(n + 1);
}
semFim(0); // RangeError: Maximum call stack size exceeded
```

Algumas linguagens otimizam certos tipos de recursão para não gastar pilha, mas a maioria dos motores de JavaScript não faz isso. Por isso, para profundidades muito grandes (dezenas de milhares de níveis), vale reescrever a solução com um laço e uma pilha explícita.

Recursão é a ferramenta natural quando o problema tem estrutura que se repete dentro de si: árvores (cada subárvore é uma árvore), pastas dentro de pastas, e as técnicas de [divisão e conquista e backtracking](/labs/web-dev/algoritmos-e-estruturas-de-dados/10-paradigmas-de-projeto-de-algoritmos/).

## Busca binária

Procurar um valor numa lista desordenada só tem um jeito: olhar item por item, O(n). Se a lista está **ordenada**, dá para fazer bem melhor. É o mesmo raciocínio de adivinhar um número entre 1 e 100 com a dica "maior" ou "menor": você chuta o do meio (50) e descarta metade a cada resposta.

A **busca binária** faz isso: compara o valor procurado com o elemento do meio. Se é o alvo, achou. Se o alvo é maior, descarta a metade esquerda, e se é menor, descarta a direita. Repete até achar ou acabar o intervalo.

```js
function buscaBinaria(lista, alvo) {
  let inicio = 0;
  let fim = lista.length - 1;

  while (inicio <= fim) {
    const meio = Math.floor((inicio + fim) / 2);
    if (lista[meio] === alvo) return meio;
    if (lista[meio] < alvo) inicio = meio + 1;
    else fim = meio - 1;
  }
  return -1; // não encontrou
}

buscaBinaria([2, 5, 8, 12, 16, 23, 38], 23); // 5
```

Como a cada passo o espaço de busca cai pela metade, o custo é **O(log n)**: para 1 milhão de itens, são cerca de 20 comparações, contra até 1 milhão da busca linear.

Dois cuidados:

- A lista **precisa estar ordenada**. Se não estiver, o resultado é lixo, sem aviso.
- O clássico bug de "erro por um": `inicio <= fim` (e não `<`) e `meio + 1` / `meio - 1` (e não só `meio`) evitam laços infinitos e itens perdidos.

Se você vai buscar muitas vezes, vale a pena ordenar uma vez (O(n log n)) e depois usar busca binária em cada consulta. Para poucas buscas numa lista desordenada, a busca linear sai mais barata.

## Algoritmos de ordenação

Ordenar aparece o tempo todo: listar produtos por preço, ranquear resultados, preparar dados para busca binária. Existem dezenas de algoritmos, e eles se dividem em dois grupos de custo:

| Algoritmo      | Tempo (pior caso)           | Memória extra | Observação                                                                |
| -------------- | --------------------------- | ------------- | ------------------------------------------------------------------------- |
| Bubble sort    | O(n²)                       | O(1)          | Didático, quase nunca usado                                               |
| Selection sort | O(n²)                       | O(1)          | Didático                                                                  |
| Insertion sort | O(n²)                       | O(1)          | Rápido em listas pequenas ou quase ordenadas                              |
| Merge sort     | O(n log n)                  | O(n)          | Custo previsível e estável                                                |
| Quicksort      | O(n²), com média O(n log n) | O(log n)      | Muito rápido na prática, se o pivô for bem escolhido                      |
| Heapsort       | O(n log n)                  | O(1)          | Usa um [heap](/labs/web-dev/algoritmos-e-estruturas-de-dados/07-arvores/) |

Um algoritmo é **estável** quando itens iguais mantêm a ordem que já tinham entre si. Isso importa quando você ordena por um critério (nome) depois de já ter ordenado por outro (cidade).

Um exemplo simples, o insertion sort: pega cada item e o encaixa na posição certa entre os anteriores, como quem ordena cartas na mão.

```js
function insertionSort(lista) {
  const arr = [...lista];
  for (let i = 1; i < arr.length; i++) {
    const atual = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > atual) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = atual;
  }
  return arr;
}
```

E o merge sort, que divide a lista ao meio, ordena cada metade recursivamente e **intercala** as duas metades já ordenadas:

```js
function mergeSort(lista) {
  if (lista.length <= 1) return lista;
  const meio = Math.floor(lista.length / 2);
  const esquerda = mergeSort(lista.slice(0, meio));
  const direita = mergeSort(lista.slice(meio));
  return intercalar(esquerda, direita);
}

function intercalar(a, b) {
  const resultado = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    resultado.push(a[i] <= b[j] ? a[i++] : b[j++]);
  }
  return resultado.concat(a.slice(i), b.slice(j));
}
```

O merge sort é um caso de **divisão e conquista**, paradigma detalhado na nota seguinte. Ele custa O(n log n) porque divide a lista em cerca de log n níveis e, em cada nível, intercala n elementos.

### E o `sort` do JavaScript?

No dia a dia você usa o `Array.prototype.sort`, que já é O(n log n) e fica a cargo do motor. Tem uma pegadinha clássica: **sem uma função de comparação, ele ordena como texto**.

```js
[10, 9, 1].sort(); // [1, 10, 9]  (ordem alfabética: "1" < "10" < "9")
[10, 9, 1].sort((a, b) => a - b); // [1, 9, 10]
```

Desde o ES2019, a linguagem exige que o `sort` seja estável. Lembre também que ele **modifica o array original**.

## Referências

- [Recursão](https://www.ime.usp.br/~pf/analise_de_algoritmos/aulas/recursion.html) - Paulo Feofiloff (IME-USP), pt-BR
- [Busca binária](https://www.ime.usp.br/~pf/analise_de_algoritmos/aulas/binarysearch.html) - Paulo Feofiloff (IME-USP), pt-BR
- [Ordenação: Mergesort](https://www.ime.usp.br/~pf/analise_de_algoritmos/aulas/mergsrt.html) - Paulo Feofiloff (IME-USP), pt-BR
- [Array.prototype.sort()](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) - MDN Web Docs, pt-BR
