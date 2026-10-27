# MongoDB: índices

## Índices no MongoDB

O que é um índice, por que ele acelera a leitura, como funciona uma B-tree e quanto ela custa na escrita já está em [Índices e Planos de Execução](/labs/web-dev/banco-de-dados/14-indices-e-planos-de-execucao/). O MongoDB usa a mesma ideia: índices são B-trees guardadas à parte, ordenadas pelo valor do campo, cada entrada apontando para um documento. Esta nota cobre só o que muda no mundo de documentos: arrays, campos embutidos, tipos de índice próprios e o jeito de ler o plano de execução.

Toda coleção nasce com um índice **único no `_id`**, que não pode ser removido. Qualquer outro índice você cria:

```js
db.usuarios.createIndex({ email: 1 }); // 1 = crescente, -1 = decrescente
db.usuarios.createIndex({ email: 1 }, { name: "idx_email" });

db.usuarios.getIndexes(); // lista os índices da coleção
db.usuarios.dropIndex("idx_email"); // remove pelo nome
```

Sem um índice que sirva para o filtro, o MongoDB faz um **COLLSCAN** (collection scan): lê todos os documentos da coleção e testa cada um, o equivalente ao sequential scan do relacional. Com índice, o plano mostra um **IXSCAN** (index scan) seguido de um **FETCH**, que busca no disco só os documentos que o índice apontou.

O otimizador do MongoDB funciona um pouco diferente do planner do PostgreSQL. Quando há mais de um índice candidato, ele executa os planos possíveis em paralelo por um curto período de teste, escolhe o que produziu resultados mais rápido e guarda essa escolha num **plan cache** para consultas do mesmo formato. Não há estatísticas de distribuição como no `ANALYZE`, a decisão vem dessa "corrida".

## Tipos de índice

### Single field

Índice em um campo só, inclusive campo embutido via dot notation:

```js
db.usuarios.createIndex({ nome: 1 });
db.usuarios.createIndex({ "endereco.cidade": 1 });

db.usuarios.find({ nome: "Priyanka" }); // usa o índice em nome
```

Para índice de um campo só, a direção (`1` ou `-1`) não importa: a B-tree pode ser percorrida nos dois sentidos, então serve tanto para `sort({ nome: 1 })` quanto para `sort({ nome: -1 })`.

### Compound

Índice em vários campos, na ordem declarada. A analogia da lista telefônica da nota 14 vale igual: o índice `{ categoria: 1, preco: 1 }` atende consultas por `categoria` e por `categoria` + `preco`, mas não por `preco` sozinho. As combinações que podem usar o índice são os **prefixos** dele.

```js
db.produtos.createIndex({ categoria: 1, preco: 1 });

db.produtos.find({ categoria: "eletronicos", preco: { $lt: 500 } }); // usa o índice inteiro
db.produtos.find({ categoria: "eletronicos" }); // usa o prefixo
db.produtos.find({ preco: { $lt: 500 } }); // não usa (não é prefixo)
```

Em índice composto a direção passa a importar para ordenação: `{ data: -1, nota: 1 }` serve para `sort({ data: -1, nota: 1 })` e para o inverso exato `sort({ data: 1, nota: -1 })`, mas não para `sort({ data: -1, nota: -1 })`.

Para escolher a ordem dos campos, a documentação oficial recomenda a **regra ESR** (Equality, Sort, Range):

1. **Equality** primeiro: campos comparados por igualdade (`status: "pago"`).
2. **Sort** depois: campos usados na ordenação.
3. **Range** por último: campos com intervalo ou desigualdade (`$gt`, `$lt`, `$in` com muitos valores, `$ne`, regex).

```js
// Consulta: pedidos pagos de um cliente acima de R$ 100, mais recentes primeiro
db.pedidos
  .find({ clienteId: 42, status: "pago", total: { $gt: 100 } })
  .sort({ criadoEm: -1 });

// Índice seguindo ESR: igualdades, depois sort, depois range
db.pedidos.createIndex({ clienteId: 1, status: 1, criadoEm: -1, total: 1 });
```

O motivo: com as igualdades fixadas, as entradas do índice já estão na ordem do `sort`, e o banco não precisa ordenar em memória. Se o campo de range viesse antes do sort, o índice entregaria os documentos agrupados pelo range e o MongoDB teria que reordenar tudo (o plano mostra um estágio `SORT` em memória, um sinal de alerta).

### Multikey

Quando você indexa um campo que é um **array**, o MongoDB cria uma entrada no índice **para cada elemento** do array. Você não declara nada especial: o índice vira multikey automaticamente quando algum documento tem array naquele campo.

```js
db.produtos.insertOne({
  nome: "Notebook",
  tags: ["eletronicos", "trabalho", "promo"],
});
db.produtos.createIndex({ tags: 1 });

db.produtos.find({ tags: "promo" }); // IXSCAN: acha direto pela entrada "promo"
```

Esse é o índice que torna barato o modelo de "array de referências" de [MongoDB: modelagem de dados](/labs/web-dev/banco-de-dados/21-mongodb-modelagem-de-dados/). Duas observações: um documento com array de 1.000 elementos gera 1.000 entradas no índice (arrays grandes inflam o índice e encarecem a escrita), e num índice composto **no máximo um** dos campos pode ser array em cada documento, porque indexar dois arrays exigiria o produto cartesiano dos elementos.

### Text

O text index quebra strings em palavras, remove stopwords e aplica stemming, permitindo busca por termos com o operador `$text`. Os conceitos (tokenização, stemming, índice invertido, ranking) são os mesmos de [Busca Full-Text](/labs/web-dev/banco-de-dados/16-busca-full-text-search/).

```js
db.artigos.createIndex(
  { titulo: "text", conteudo: "text" },
  { weights: { titulo: 5, conteudo: 1 }, default_language: "portuguese" },
);

db.artigos
  .find(
    { $text: { $search: "replicação mongodb" } },
    { score: { $meta: "textScore" } },
  )
  .sort({ score: { $meta: "textScore" } });
```

As limitações pesam: uma coleção pode ter **um único** text index (que pode cobrir vários campos), não há busca aproximada (fuzzy), autocomplete ou facetas, e o ranking é simples. Para busca de verdade em produção, o próprio MongoDB recomenda o **Atlas Search** (baseado em Lucene) quando o banco está no Atlas; fora dele, um motor dedicado como Elasticsearch ou OpenSearch.

### Hashed

O hashed index guarda o **hash** do valor do campo em vez do valor. Hashes de valores parecidos ficam espalhados, então ele distribui uniformemente, e é por isso que é usado como base do sharding por hash (veja [MongoDB: replicação, sharding e transações](/labs/web-dev/banco-de-dados/24-mongodb-replicacao-sharding-e-transacoes/)).

```js
db.usuarios.createIndex({ userId: "hashed" });

db.usuarios.find({ userId: 101 }); // serve: igualdade
db.usuarios.find({ userId: { $gt: 100 } }); // não serve: o hash não preserva ordem
```

Ele só atende **igualdade**. Intervalos e ordenação não funcionam, porque a ordem dos hashes não tem relação com a ordem dos valores. Também não pode ser único nem indexar arrays.

### Geoespacial e wildcard

O índice `2dsphere` indexa coordenadas na superfície da Terra (em GeoJSON) e permite consultas como "restaurantes num raio de 2 km":

```js
db.lojas.insertOne({
  nome: "Centro",
  local: { type: "Point", coordinates: [-34.877, -8.063] },
}); // [longitude, latitude]
db.lojas.createIndex({ local: "2dsphere" });

db.lojas.find({
  local: {
    $near: {
      $geometry: { type: "Point", coordinates: [-34.88, -8.05] },
      $maxDistance: 2000,
    },
  },
});
db.lojas.find({
  local: { $geoWithin: { $centerSphere: [[-34.88, -8.05], 5 / 6378.1] } },
}); // raio de 5 km
```

Repare que a ordem em GeoJSON é **longitude, latitude**, o contrário do que o Google Maps mostra; trocar as duas é o erro mais comum.

O **wildcard index** (`$**`) indexa todos os campos de um documento, ou de um subdocumento, sem você listar quais. Ele resolve um problema específico: atributos imprevisíveis, como os campos customizados que cada cliente define num SaaS.

```js
db.produtos.createIndex({ "atributos.$**": 1 });

db.produtos.find({ "atributos.voltagem": "220v" }); // usa o wildcard
db.produtos.find({ "atributos.cor": "azul" }); // também
```

Não é um atalho para "indexar tudo e não pensar mais": ele é maior e menos eficiente que índices dirigidos, e cada consulta só usa um campo dele. Se você sabe quais campos são consultados, crie índices normais.

## Propriedades de índice

Além do tipo, um índice pode ter propriedades que mudam seu comportamento.

**`unique`** impede valores repetidos no campo e é a forma de garantir, por exemplo, um e-mail por usuário:

```js
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.usuarios.insertOne({ email: "ana@x.com" });
db.usuarios.insertOne({ email: "ana@x.com" }); // erro E11000 duplicate key
```

Um detalhe: para o índice único, documento **sem o campo** conta como `null`, então só um documento pode ficar sem e-mail. Se o campo é opcional, combine com um filtro parcial.

**`partialFilterExpression`** indexa só os documentos que atendem a uma condição. O índice fica menor, e a escrita em documentos fora do filtro não paga o custo dele.

```js
// Índice só nos pedidos pendentes, que são os consultados pela fila de processamento
db.pedidos.createIndex(
  { criadoEm: 1 },
  { partialFilterExpression: { status: "pendente" } },
);

// E-mail único apenas para quem tem e-mail
db.usuarios.createIndex(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true } } },
);
```

Para o otimizador usar um índice parcial, o filtro da consulta precisa incluir a condição dele (no exemplo, `status: "pendente"`). Existe também a opção `sparse`, que indexa só documentos que têm o campo; ela é mais antiga e menos flexível, e a documentação recomenda índices parciais no lugar.

**TTL** (time to live) faz o MongoDB **apagar documentos automaticamente** depois de um tempo, a partir de um campo de data. Perfeito para sessões, códigos de verificação e logs temporários:

```js
// Remove sessões 1 hora depois de criadoEm
db.sessoes.createIndex({ criadoEm: 1 }, { expireAfterSeconds: 3600 });
```

A remoção é feita por um processo em background que roda a cada 60 segundos, então um documento pode sobreviver um pouco além do prazo. Se o seu código depende do segundo exato, filtre pela data na consulta também.

## Covered queries

Quando todos os campos do filtro e da projeção estão no índice, o MongoDB responde **só com o índice**, sem buscar os documentos (sem o estágio FETCH). É o equivalente ao index-only scan da nota 14.

```js
db.usuarios.createIndex({ email: 1, nome: 1 });

// Coberta: filtra por email, devolve só email e nome, e exclui o _id
db.usuarios.find({ email: "ana@x.com" }, { email: 1, nome: 1, _id: 0 });
```

O `_id: 0` é o detalhe que mais derruba a cobertura: como o `_id` volta por padrão e não está nesse índice, sem excluí-lo o banco precisaria ler o documento. Índices multikey em campo array também não cobrem consultas sobre esse campo.

## Lendo o explain

O `explain()` mostra o plano escolhido. O modo `"executionStats"` também executa a consulta e conta o trabalho feito:

```js
db.produtos
  .find({ categoria: "eletronicos", preco: { $lt: 500 } })
  .explain("executionStats");
```

Os campos que mais importam na saída:

- `winningPlan.stage` (e os `inputStage` aninhados): a árvore de estágios, como `COLLSCAN`, `IXSCAN`, `FETCH`, `SORT`, `PROJECTION_COVERED`
- `executionStats.nReturned`: quantos documentos voltaram
- `executionStats.totalKeysExamined`: quantas entradas de índice foram lidas
- `executionStats.totalDocsExamined`: quantos documentos foram lidos
- `executionStats.executionTimeMillis`: tempo total

A leitura rápida: numa consulta saudável, `totalKeysExamined` e `totalDocsExamined` ficam próximos de `nReturned`. Examinar 100 mil documentos para devolver 12 é sinal de índice faltando ou mal ordenado.

Um antes e depois numa coleção de 200 mil produtos:

```js
// Antes do índice
{
  winningPlan: { stage: "COLLSCAN" },
  executionStats: { nReturned: 12, totalKeysExamined: 0, totalDocsExamined: 200000, executionTimeMillis: 140 }
}

db.produtos.createIndex({ categoria: 1, preco: 1 })

// Depois do índice
{
  winningPlan: { stage: "FETCH", inputStage: { stage: "IXSCAN", indexName: "categoria_1_preco_1" } },
  executionStats: { nReturned: 12, totalKeysExamined: 12, totalDocsExamined: 12, executionTimeMillis: 1 }
}
```

O mesmo raciocínio de investigação vale aqui: a nota de [Diagnóstico de Queries Lentas](/labs/web-dev/banco-de-dados/18-diagnostico-de-queries-lentas/) traz o processo geral. No MongoDB, o **database profiler** (`db.setProfilingLevel(1, { slowms: 100 })`) e os logs de slow query mostram quais consultas merecem um `explain`; no Atlas e no Compass, o Performance Advisor sugere índices a partir delas.

## Custo e boas práticas

Cada índice tem o custo descrito na nota 14: toda escrita que toca o campo indexado atualiza também o índice, e o índice ocupa disco. No MongoDB há um terceiro custo bem concreto, a **memória**: o WiredTiger cache (veja [Postgres vs MongoDB vs Cassandra](/labs/web-dev/banco-de-dados/13-postgres-vs-mongodb-vs-cassandra/)) guarda índices e documentos mais usados, e o desempenho cai quando os índices usados com frequência não cabem nele.

Alguns limites concretos: até **64 índices por coleção** e até **32 campos** num índice composto. Se você está perto disso, o problema é de modelagem.

Práticas que funcionam:

- Crie índices a partir das consultas reais (filtros, sorts frequentes), não "por garantia".
- Prefira um composto bem ordenado (ESR) a vários índices de um campo: ele também atende aos prefixos, então `{ a: 1, b: 1 }` torna `{ a: 1 }` redundante.
- Procure índices que ninguém usa com `$indexStats`, que mostra quantas vezes cada um foi acessado desde que o servidor subiu:

```js
db.pedidos.aggregate([{ $indexStats: {} }]);
// [ { name: "status_1", accesses: { ops: 0, since: ISODate("...") } }, ... ]
```

Índice com `ops: 0` depois de semanas de tráfego normal é candidato a remoção. Antes de apagar, dá para escondê-lo do otimizador com `db.pedidos.hideIndex("status_1")` e observar se algo piora; se piorar, `unhideIndex` devolve na hora, sem reconstruir.

Desde o MongoDB 4.2, criar índice numa coleção existente não bloqueia leituras e escritas durante toda a construção (o bloqueio exclusivo fica só no começo e no fim), mas ainda consome CPU e disco. Em coleções grandes de produção, crie fora do horário de pico.

## Referências

- [Índices](https://www.mongodb.com/pt-br/docs/manual/indexes/) - documentação oficial do MongoDB, português
- [Índices compostos](https://www.mongodb.com/pt-br/docs/manual/core/indexes/index-types/index-compound/) - documentação oficial do MongoDB, português
- [The ESR (Equality, Sort, Range) Guideline](https://www.mongodb.com/docs/manual/tutorial/equality-sort-range-guideline/) - documentação oficial do MongoDB, inglês
- [Interpret Explain Plan Results](https://www.mongodb.com/docs/manual/tutorial/analyze-query-plan/) - documentação oficial do MongoDB, inglês
- [Text Index Restrictions](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-text/text-index-restrictions/) - documentação oficial do MongoDB, inglês
