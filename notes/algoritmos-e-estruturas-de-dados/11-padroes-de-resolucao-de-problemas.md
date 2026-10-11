# Padrões de Resolução de Problemas

Quem resolve muitos problemas de algoritmos percebe uma coisa: eles se repetem. O enunciado muda (uma lista de preços, um texto, uma matriz), mas o formato da solução é parecido. Esta nota é sobre reconhecer esses formatos. Não é decorar respostas, é ter um repertório de ferramentas para testar contra o problema novo, algo próximo da ideia de "blocos" mentais vista em [Pilares de Estudo](/labs/web-dev/algoritmos-e-estruturas-de-dados/01-pilares-de-estudo-para-programar/).

## Por que reconhecer padrões

O caminho comum de quem resolve bem é:

1. Entender o problema e escrever a solução mais direta (força bruta), mesmo que lenta.
2. Calcular o custo dela com [Big O](/labs/web-dev/algoritmos-e-estruturas-de-dados/04-complexidade-e-big-o/).
3. Perguntar qual trabalho está sendo repetido, e qual padrão elimina esse trabalho.

Alguns sinais no enunciado e o padrão que costuma acompanhá-los:

| Sinal no enunciado                                                   | Padrão em que pensar                                                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Par ou trio de itens numa lista **ordenada**                         | Two pointers                                                                                                   |
| Trecho **contíguo** (subarray ou substring), com tamanho ou condição | Sliding window                                                                                                 |
| "Já vi esse valor?", contar ocorrências                              | [Tabela hash](/labs/web-dev/algoritmos-e-estruturas-de-dados/06-tabelas-hash/)                                 |
| Lista ordenada, "achar um valor"                                     | [Busca binária](/labs/web-dev/algoritmos-e-estruturas-de-dados/09-recursao-busca-e-ordenacao/)                 |
| Menor número de passos, camadas, vizinhos                            | BFS                                                                                                            |
| Explorar todos os caminhos, detectar ciclos                          | DFS                                                                                                            |
| Gerar todas as combinações ou permutações válidas                    | [Backtracking](/labs/web-dev/algoritmos-e-estruturas-de-dados/10-paradigmas-de-projeto-de-algoritmos/)         |
| Subproblemas que se repetem                                          | [Programação dinâmica](/labs/web-dev/algoritmos-e-estruturas-de-dados/10-paradigmas-de-projeto-de-algoritmos/) |

Essa tabela é ponto de partida, e não regra: às vezes o sinal é enganoso, e o mesmo problema aceita padrões diferentes.

## Two pointers

Em vez de dois laços aninhados (O(n²)), você usa **dois ponteiros** (índices) que se movem pela lista e se ajudam a decidir para onde ir. O caso mais comum: uma lista **ordenada**, com um ponteiro em cada ponta.

Problema: dado um array ordenado, ache dois números que somam um alvo.

```js
function parComSoma(ordenada, alvo) {
  let esq = 0;
  let dir = ordenada.length - 1;

  while (esq < dir) {
    const soma = ordenada[esq] + ordenada[dir];
    if (soma === alvo) return [esq, dir];
    if (soma < alvo)
      esq++; // precisa de uma soma maior: avança o menor
    else dir--; // precisa de uma soma menor: recua o maior
  }
  return null;
}

parComSoma([1, 3, 4, 6, 8, 11], 10); // [2, 3] (4 + 6)
```

Por que funciona: como a lista está ordenada, o número da direita é o maior que ainda resta. Se a soma está pequena demais, o número da esquerda não alcança o alvo nem quando pareado com o maior possível, então ele não serve para ninguém e pode ser descartado (avança o `esq`). O raciocínio simétrico vale para soma grande demais: o número da direita passa do alvo até com o menor parceiro, então sai (recua o `dir`). Cada ponteiro anda no máximo `n` casas, então o custo total é **O(n)**, com **O(1)** de memória extra, contra O(n²) da força bruta.

Outros usos típicos: verificar se um texto é palíndromo (um ponteiro em cada ponta, andando para o centro), remover duplicatas de uma lista ordenada e juntar duas listas ordenadas.

## Sliding window

A **janela deslizante** trabalha com um trecho contíguo da lista (a "janela") que se move de um lado ao outro. Em vez de recalcular tudo para cada posição, você **atualiza** o resultado tirando o que saiu da janela e colocando o que entrou.

### Janela de tamanho fixo

Problema: qual a maior soma de `k` números consecutivos?

```js
function maiorSomaJanela(lista, k) {
  let soma = 0;
  for (let i = 0; i < k; i++) soma += lista[i]; // primeira janela

  let maior = soma;
  for (let i = k; i < lista.length; i++) {
    soma += lista[i] - lista[i - k]; // entra um, sai um
    maior = Math.max(maior, soma);
  }
  return maior;
}

maiorSomaJanela([2, 1, 5, 1, 3, 2], 3); // 9 (5 + 1 + 3)
```

Somar `k` números a cada posição custaria O(n × k). Atualizando a janela, cada posição custa O(1), e o total cai para **O(n)**.

### Janela de tamanho variável

Aqui a janela cresce e encolhe conforme uma condição. Problema: qual o tamanho da maior substring sem letras repetidas?

```js
function maiorSubstringSemRepeticao(texto) {
  const naJanela = new Set();
  let esq = 0;
  let maior = 0;

  for (let dir = 0; dir < texto.length; dir++) {
    while (naJanela.has(texto[dir])) {
      // repetiu: encolhe pela esquerda
      naJanela.delete(texto[esq]);
      esq++;
    }
    naJanela.add(texto[dir]); // cresce pela direita
    maior = Math.max(maior, dir - esq + 1);
  }
  return maior;
}

maiorSubstringSemRepeticao("abcabcbb"); // 3 ("abc")
```

O ponteiro `dir` só anda para frente, e o `esq` também: cada um percorre o texto uma vez. Por isso o custo é **O(n)**, mesmo com um `while` dentro do `for`.

Note que two pointers e sliding window são parentes: nos dois há dois índices se movendo pela lista. A diferença de foco é que na janela o que importa é o trecho entre os dois.

## BFS, DFS e backtracking aplicados

Estas três técnicas já têm nota própria, então aqui só o que muda: como **reconhecer** que o problema pede uma delas.

- **Grafo disfarçado.** Uma matriz de células (labirinto, mapa de ilhas, tabuleiro) é um grafo: cada célula é um vértice e os vizinhos são as células de cima, de baixo e dos lados. Se o enunciado pergunta pelo **menor número de passos**, pense em BFS. Se pergunta por **quantos grupos** existem ou se **existe um caminho**, DFS resolve bem. Os detalhes de cada busca estão em [Grafos](/labs/web-dev/algoritmos-e-estruturas-de-dados/08-grafos/).
- **Todas as possibilidades.** Se o enunciado pede "todas as combinações", "todas as permutações" ou "de quantas formas", é forte candidato a backtracking, com o padrão escolher, explorar e desfazer da nota de [Paradigmas de Projeto](/labs/web-dev/algoritmos-e-estruturas-de-dados/10-paradigmas-de-projeto-de-algoritmos/).

## Como reconhecer sem decorar

- **Leia o enunciado procurando palavras-chave:** "ordenado", "contíguo", "menor número de passos", "todas as combinações".
- **Comece pela solução lenta** e descubra qual parte é repetida. O padrão certo costuma ser o que remove essa repetição.
- **Treine por padrão:** resolva vários problemas seguidos do mesmo padrão, e depois misture. É a prática deliberada da nota de [Pilares de Estudo](/labs/web-dev/algoritmos-e-estruturas-de-dados/01-pilares-de-estudo-para-programar/).
- **Confira contra a solução lenta.** Sempre que escrever uma solução otimizada, rode nas duas com casos pequenos e compare as respostas.

## Referências

- [Two Pointers](https://usaco.guide/silver/two-pointers) - USACO Guide, en
- [Two pointer (also known as "Sliding Window")](<https://guides.codepath.org/compsci/Two-pointer-(also-known-as-'Sliding-Window')>) - CodePath, en
- [Busca em largura (BFS) num grafo](https://www.ime.usp.br/~pf/algoritmos_para_grafos/aulas/bfs.html) - Paulo Feofiloff (IME-USP), pt-BR
- [Busca em profundidade (DFS) num grafo](https://www.ime.usp.br/~pf/algoritmos_para_grafos/aulas/dfs.html) - Paulo Feofiloff (IME-USP), pt-BR
