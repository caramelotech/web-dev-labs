# Paginação

Uma listagem de API quase nunca deve devolver tudo. `GET /pedidos` numa base com 2 milhões de pedidos, sem limite, é uma resposta gigante que pesa em memória do servidor, em banda e no tempo de renderização do cliente, e piora sozinha conforme a tabela cresce. Paginar é quebrar essa listagem em pedaços e entregar um de cada vez.

Existem duas formas principais de fazer isso, e a diferença entre elas aparece exatamente quando a base fica grande.

## Paginação por offset (número de página)

É a forma mais direta e a primeira que quase todo mundo escreve. A API recebe um número de página e um tamanho, e traduz isso para `LIMIT` e `OFFSET` no banco:

```
GET /produtos?page=3&size=20
```

```sql
SELECT * FROM produtos
ORDER BY nome
LIMIT 20 OFFSET 40;   -- página 3: pula as 40 primeiras (páginas 1 e 2)
```

A resposta costuma vir com os metadados de navegação:

```json
{
  "conteudo": [ ... 20 produtos ... ],
  "pagina": 3,
  "tamanho": 20,
  "total": 347,
  "totalPaginas": 18
}
```

A vantagem é o acesso aleatório: dá para pular direto para a página 10, mostrar "página 3 de 18", deixar o usuário clicar num número de página.

O problema aparece nas páginas profundas. O `OFFSET` não é um atalho: o banco precisa ler e descartar todas as linhas puladas para chegar onde a página começa. `OFFSET 40` é barato. `OFFSET 100000` faz o banco varrer cem mil linhas só para jogá-las fora e devolver as 20 seguintes. O tempo da query cresce de forma linear com o número da página, e uma listagem que respondia em 20 ms na página 1 pode levar segundos na página 5000.

```mermaid
flowchart LR
    A["OFFSET 100000 LIMIT 20"] --> B["lê e descarta<br/>100.000 linhas"]
    B --> C["devolve as<br/>20 seguintes"]
```

## Paginação por cursor / keyset

A ideia aqui é não contar posições, e sim continuar de onde parou. Em vez de "pule 100 mil linhas", a query diz "me dê as linhas depois deste valor":

```sql
SELECT * FROM produtos
WHERE (nome, id) > ('Cadeira Gamer', 4821)
ORDER BY nome, id
LIMIT 20;
```

Como a coluna de ordenação está indexada, o banco faz uma busca direta na árvore do índice até a âncora e lê as 20 linhas seguintes. O custo de achar a linha 20 e a linha 5 milhões é o mesmo. Essa técnica é chamada de **keyset pagination** (paginação por chave), e ela só é rápida se a coluna do `ORDER BY` estiver indexada, ver [Índices e Planos de Execução](/labs/web-dev/banco-de-dados/14-indices-e-planos-de-execucao/).

O que a API expõe é um **cursor**: um token opaco (normalmente o último valor visto, codificado em base64) que o cliente devolve na próxima chamada para continuar:

```
GET /produtos?size=20
GET /produtos?size=20&cursor=eyJub21lIjoiQ2FkZWlyYSBHYW1lciIsImlkIjo0ODIxfQ
```

O token é opaco de propósito: o cliente não precisa saber que dentro dele tem um nome e um id, e o servidor pode mudar a estratégia sem quebrar quem já está paginando.

A limitação do keyset é o outro lado da moeda do offset: não dá para pular para a "página 500". O cliente só consegue avançar página a página (e, com um pouco mais de trabalho, voltar). Para um feed ou um scroll infinito isso é exatamente o comportamento desejado; para uma tabela onde o usuário quer ir direto para o fim, não serve.

## Ordenação estável

Os dois métodos dependem de um `ORDER BY` **determinístico**: dado o mesmo conjunto de dados, a ordem tem que ser sempre a mesma. Ordenar só por `nome` não basta se dois produtos podem ter o mesmo nome, porque o banco fica livre para desempatar como quiser, e a mesma linha pode aparecer em duas páginas ou sumir entre elas. A solução é adicionar um critério de desempate único, quase sempre o `id`: `ORDER BY nome, id`.

Fora isso, o offset tem uma fragilidade que o keyset não tem. O offset endereça por posição, e a posição muda quando linhas entram ou saem. Se um produto novo é inserido enquanto o usuário navega, todas as linhas "descem" uma posição, e ao virar a página ele vê de novo o último item da página anterior. Se um produto é removido, uma linha é pulada. O keyset endereça por conteúdo (o último valor visto), então uma inserção ou remoção no meio da lista não desloca a âncora.

## O custo de contar o total

Aquele campo `"totalPaginas": 18` tem um preço. Para saber o total, o banco roda um `COUNT(*)` com o mesmo `WHERE` da listagem, e num universo grande isso é uma varredura cara que acontece a cada página.

As saídas comuns:

- Não mostrar o total. Scroll infinito e feed não precisam de "página X de Y", só de um "carregar mais".
- Contar de forma aproximada, usando a estimativa de linhas que o próprio banco mantém nas estatísticas (no PostgreSQL, `reltuples`).
- Cachear o total por alguns minutos, se um número um pouco defasado for aceitável.

## Escolhendo a estratégia

| Situação                                                                                    | Estratégia |
| ------------------------------------------------------------------------------------------- | ---------- |
| Tabela de admin, CMS, resultado de busca com número de página                               | Offset     |
| Conjunto pequeno e estável, onde acesso aleatório importa                                   | Offset     |
| Feed, timeline, scroll infinito                                                             | Keyset     |
| API pública de alto volume, exportação, sincronização de dados                              | Keyset     |
| Qualquer travessia de tabela grande onde a latência não pode degradar nas páginas profundas | Keyset     |

Na prática, muita API começa com offset porque é simples, e migra para keyset (ou oferece os dois) quando as páginas profundas começam a aparecer nos logs de query lenta.

## Filtros, ordenação e busca

Paginação quase nunca chega sozinha. O cliente raramente quer "a página 2 de todos os pedidos"; ele quer a página 2 dos pedidos pagos deste mês, do mais recente para o mais antigo. Filtros, ordenação e busca ficam na query string, junto dos parâmetros de página, porque não mudam _qual_ recurso é (a coleção `/pedidos`), só _como_ olhar para ele.

**Filtros por campo** são a forma mais simples: o nome do parâmetro é o campo, o valor é o que se quer.

```
GET /usuarios?role=admin&status=ativo
```

Vários parâmetros se combinam com "E": usuários que são admin **e** estão ativos.

**Intervalos** pedem dois parâmetros. Dá para usar nomes explícitos ou sufixos de operador, o importante é escolher um padrão:

```
GET /pedidos?dataInicio=2024-01-01&dataFim=2024-01-31
GET /pedidos?criadoEm_gte=2024-01-01&criadoEm_lte=2024-01-31
GET /produtos?preco[gte]=100&preco[lte]=500
```

**Ordenação** costuma vir em um de dois estilos: campo e direção separados, ou uma lista de campos com `-` na frente para decrescente (convenção usada por várias APIs públicas e pela especificação JSON:API):

```
GET /usuarios?sort=nome&order=asc
GET /pedidos?sort=-criadoEm,id
```

O segundo estilo resolve de quebra o desempate pelo `id` visto em "Ordenação estável", mais acima.

**Busca textual** geralmente usa um parâmetro `search` ou `q`: `/produtos?q=fone bluetooth`. Um `LIKE '%fone%'` resolve enquanto a tabela é pequena; quando a busca precisa de relevância, tolerância a erro de digitação ou volume grande, é hora de full text search, assunto de [Busca Full Text Search](/labs/web-dev/banco-de-dados/16-busca-full-text-search/).

Juntando tudo:

```
GET /pedidos?status=pago&dataInicio=2024-01-01&sort=-criadoEm&page=2&size=20
```

Algumas regras que evitam dor de cabeça:

- **Consistência.** Se um endpoint usa `sort` e outro usa `orderBy`, se as datas vêm em formatos diferentes, quem consome a API precisa consultar a documentação a cada chamada. Defina a convenção uma vez e aplique em todos os endpoints.
- **Allowlist de campos.** Só aceite filtrar e ordenar por campos que você listou explicitamente. Repassar o valor de `sort` direto para o `ORDER BY` é uma porta para SQL injection (nome de coluna não pode ser parametrizado como um valor), e mesmo com campos legítimos, ordenar ou filtrar por uma coluna sem índice numa tabela grande vira uma varredura completa a cada requisição. Quais combinações merecem índice está em [Índices e Planos de Execução](/labs/web-dev/banco-de-dados/14-indices-e-planos-de-execucao/).
- **Validação e limites.** Valide tipos e formatos (data inválida é 400, não 500) e imponha um máximo para o tamanho da página. Sem isso, um `size=1000000` derruba o banco.
- **Ordenação e cursor andam juntos.** No keyset, o cursor guarda os valores dos campos de ordenação do último item. Se o cliente mudar o `sort`, o cursor antigo não faz mais sentido: a API deve recusá-lo (400) ou recomeçar da primeira página, e nunca misturar os dois.

Por fim, a resposta precisa dizer ao cliente onde ele está. O jeito mais comum é um objeto de metadados junto com os dados:

```json
{
  "data": [ ... ],
  "pagination": { "page": 2, "size": 20, "total": 150, "totalPages": 8 }
}
```

Uma alternativa padronizada é o header `Link` (RFC 8288), que a API do GitHub usa: os links para as páginas vizinhas vão nos headers e o corpo fica só com os dados.

```
Link: <https://api.exemplo.com/pedidos?page=3&size=20>; rel="next",
      <https://api.exemplo.com/pedidos?page=8&size=20>; rel="last"
```

Lembre do custo de contar o total, discutido acima, antes de prometer `total` e `totalPages` em toda listagem.

## Referências

- [Diretrizes de design de API: filtrar, classificar e paginar dados - Microsoft Learn](https://learn.microsoft.com/pt-br/azure/architecture/best-practices/api-design) - Microsoft Learn, pt-BR
- [No Offset - Markus Winand](https://use-the-index-luke.com/no-offset) - Markus Winand ("Use The Index, Luke!"), en
- [RFC 8288 - Web Linking](https://www.rfc-editor.org/rfc/rfc8288.html) - IETF, en
- [Pagination guidelines - GitLab Development Documentation](https://docs.gitlab.com/development/database/pagination_guidelines/) - GitLab, en
