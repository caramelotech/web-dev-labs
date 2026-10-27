# MongoDB: CRUD e consultas

CRUD é a sigla para as quatro operações básicas sobre dados: **C**reate (inserir), **R**ead (ler), **U**pdate (atualizar) e **D**elete (remover). No MongoDB, cada uma tem métodos com nomes bem diretos, como `insertOne`, `find`, `updateMany` e `deleteOne`. Os exemplos abaixo usam o `mongosh` (veja [MongoDB: fundamentos e modelo de documentos](/labs/web-dev/banco-de-dados/19-mongodb-fundamentos/)); nos drivers os nomes são os mesmos, só que com `await` na frente (ou em `snake_case` no Python).

## Create: insertOne e insertMany

`insertOne` grava um documento e devolve o `_id` dele. Se você não passar um `_id`, um ObjectId é gerado.

```js
use escola

db.alunos.insertOne({ nome: "Aman", idade: 21, cidade: "Recife" })
// { acknowledged: true, insertedId: ObjectId("66a2...") }
```

`insertMany` recebe um array e devolve o mapa de `_id`s criados:

```js
db.alunos.insertMany([
  { nome: "Rohit", idade: 25, cursos: ["JS", "MongoDB"] },
  { nome: "Neha",  idade: 23, endereco: { cidade: "Natal", uf: "RN" } }
])
// { acknowledged: true, insertedIds: { '0': ObjectId("..."), '1': ObjectId("...") } }
```

Por padrão o `insertMany` é **ordenado** (`ordered: true`): se o terceiro documento falhar (por exemplo, `_id` duplicado), o banco para ali, e os dois primeiros continuam gravados. Com `{ ordered: false }`, ele tenta inserir todos e reporta os erros no fim, o que costuma ser mais rápido em cargas grandes onde um erro isolado não deve barrar o resto.

```js
db.alunos.insertMany(documentos, { ordered: false })
```

Repare que nenhum dos dois é "tudo ou nada": a inserção é atômica **por documento**. Se você precisa que vários documentos entrem juntos ou nenhum entre, isso é trabalho de transação (veja [MongoDB: replicação, sharding e transações](/labs/web-dev/banco-de-dados/24-mongodb-replicacao-sharding-e-transacoes/)).

## Read: find e findOne

A consulta é um **documento de filtro**. O caso mais simples é igualdade: `{ campo: valor }`.

```js
db.alunos.find()                         // todos os documentos
db.alunos.find({ cidade: "Recife" })     // cidade igual a "Recife"
db.alunos.find({ cidade: "Recife", idade: 21 })  // as duas condições (AND implícito)
```

`find` devolve um **cursor**, não um array (mais sobre isso adiante). No `mongosh` ele mostra os primeiros 20 resultados e você digita `it` para ver mais. `findOne` devolve **um documento** (o primeiro que casar) ou `null`:

```js
db.alunos.findOne({ nome: "Neha" })
```

Para filtrar por um campo dentro de um documento embutido, use **dot notation**, com o caminho entre aspas:

```js
db.alunos.find({ "endereco.cidade": "Natal" })
```

Cuidado com a armadilha: `{ endereco: { cidade: "Natal" } }` (sem dot notation) compara o documento embutido **inteiro**, campo a campo e na mesma ordem. Ele não casa com `{ cidade: "Natal", uf: "RN" }`, porque esse tem um campo a mais. Quase sempre o que você quer é a dot notation.

## Operadores de consulta

Para tudo além de igualdade, o valor do campo vira um documento com um **operador**, sempre começando com `$`.

### Comparação

| Operador | Significado |
| --- | --- |
| `$eq` | igual a (o mesmo que a forma implícita) |
| `$ne` | diferente de |
| `$gt` / `$gte` | maior que / maior ou igual |
| `$lt` / `$lte` | menor que / menor ou igual |
| `$in` | igual a algum valor da lista |
| `$nin` | não é igual a nenhum valor da lista |

```js
db.produtos.find({ preco: { $gt: 100 } })

// Intervalo: idade entre 18 e 30, inclusive
db.alunos.find({ idade: { $gte: 18, $lte: 30 } })

// Categoria "Eletrônicos" OU "Livros"
db.produtos.find({ categoria: { $in: ["Eletrônicos", "Livros"] } })
```

Atenção a `$ne` e `$nin`: eles também casam com documentos que **nem têm o campo**. `{ cidade: { $ne: "Recife" } }` traz quem mora em Natal e também quem não tem cidade cadastrada.

### Lógicos

Vários campos no mesmo filtro já formam um **AND implícito**. Os operadores lógicos existem para os casos que o implícito não cobre:

```js
// OR: mais velhos que 25 OU de Delhi
db.usuarios.find({ $or: [ { idade: { $gt: 25 } }, { cidade: "Delhi" } ] })

// NOR: nem uma condição nem outra
db.usuarios.find({ $nor: [ { ativo: false }, { banido: true } ] })

// NOT: nega o operador de um campo
db.produtos.find({ preco: { $not: { $gt: 100 } } })   // preço <= 100 OU sem preço
```

O `$and` explícito é necessário quando você precisa repetir o mesmo operador ou campo, porque um objeto JavaScript não pode ter duas chaves iguais:

```js
// Dois $or combinados: (a OU b) E (c OU d)
db.pedidos.find({
  $and: [
    { $or: [ { status: "pago" }, { status: "enviado" } ] },
    { $or: [ { uf: "PE" }, { uf: "PB" } ] }
  ]
})
```

### Elemento

Os operadores de elemento olham para a **existência** e o **tipo** do campo, não para o valor:

```js
db.pedidos.find({ cupom: { $exists: true } })   // tem o campo cupom
db.pedidos.find({ cupom: { $exists: false } })  // não tem o campo
db.produtos.find({ preco: { $type: "decimal" } })
```

Existe uma diferença sutil entre campo **ausente** e campo com valor **`null`**, e a consulta por `null` junta os dois:

```js
db.c.insertMany([ { _id: 1, x: null }, { _id: 2 } ])

db.c.find({ x: null })                    // traz 1 e 2
db.c.find({ x: { $exists: false } })      // traz só 2 (campo ausente)
db.c.find({ x: { $type: "null" } })       // traz só 1 (campo existe e é null)
```

### Arrays

Arrays têm um comportamento que surpreende no início: uma igualdade simples num campo array significa "o array **contém** esse valor".

```js
db.alunos.insertOne({ nome: "Priya", skills: ["Java", "Python", "MongoDB"] })

db.alunos.find({ skills: "Python" })                 // casa: o array contém "Python"
db.alunos.find({ skills: ["Java", "Python", "MongoDB"] })  // igualdade exata, mesma ordem
db.alunos.find({ skills: { $all: ["MongoDB", "Java"] } })  // contém todos, em qualquer ordem
db.alunos.find({ skills: { $size: 3 } })             // array com exatamente 3 elementos
```

(Muito material classifica `$size` e `$elemMatch` como operadores "de elemento"; na documentação oficial eles são **operadores de array**, junto com `$all`.)

O `$elemMatch` resolve um problema real. Imagine notas guardadas como array de documentos:

```js
db.alunos.insertOne({
  nome: "Leo",
  provas: [ { materia: "mat", nota: 4 }, { materia: "port", nota: 9 } ]
})

// Sem $elemMatch: as condições podem casar em ELEMENTOS DIFERENTES
db.alunos.find({ "provas.materia": "mat", "provas.nota": { $gte: 7 } })
// Casa com o Leo! "mat" vem do 1º elemento e nota >= 7 vem do 2º.

// Com $elemMatch: as duas condições têm que valer no MESMO elemento
db.alunos.find({ provas: { $elemMatch: { materia: "mat", nota: { $gte: 7 } } } })
// Não casa, que é o resultado correto
```

### Avaliação

`$regex` filtra strings por expressão regular:

```js
// Nomes que começam com "A", sem diferenciar maiúsculas
db.funcionarios.find({ nome: { $regex: "^A", $options: "i" } })
```

Sobre desempenho: uma regex com prefixo âncora e sensível a maiúsculas (`^Ana`) consegue usar um índice no campo, percorrendo só o intervalo que começa com "Ana". Uma regex sem âncora (`ana`) ou com `i` precisa examinar todas as chaves do índice, ou todos os documentos. Para busca textual de verdade, regex não é a ferramenta (veja [Busca Full-Text](/labs/web-dev/banco-de-dados/16-busca-full-text-search/)).

`$expr` permite usar expressões do aggregation dentro do `find`, o que serve para comparar **dois campos do mesmo documento**, algo que os operadores comuns não fazem:

```js
// Pedidos em que o valor pago é menor que o total
db.pedidos.find({ $expr: { $lt: ["$pago", "$total"] } })
```

Outros dois operadores de avaliação:

- `$mod` casa por resto de divisão: `{ numero: { $mod: [2, 0] } }` traz os pares.
- `$text` faz busca textual e exige um **text index** na coleção; ele está detalhado em [MongoDB: índices](/labs/web-dev/banco-de-dados/22-mongodb-indices/).

E um que você vai ver em tutorial antigo e não deve usar: `$where`, que executa uma função JavaScript para cada documento. Server-side JavaScript (`$where`, `$function`, `$accumulator`) foi **deprecado no MongoDB 8.0**, é lento (não usa índice e roda um interpretador por documento) e quase sempre pode ser trocado por `$expr`.

## Projeção

O segundo argumento de `find` é a **projeção**: quais campos devem voltar. Trazer só o necessário economiza rede e memória, e em alguns casos permite que o banco responda só com o índice.

```js
// Só nome e idade
db.usuarios.find({}, { nome: 1, idade: 1 })
// [ { _id: ObjectId("..."), nome: "Aman", idade: 25 }, ... ]
```

Repare que o `_id` veio junto. Ao contrário do que alguns resumos dizem, o `_id` **é retornado por padrão**, e é preciso pedir explicitamente para tirá-lo:

```js
db.usuarios.find({}, { nome: 1, idade: 1, _id: 0 })   // { nome: "Aman", idade: 25 }
db.usuarios.find({}, { senhaHash: 0 })                // tudo, menos senhaHash
```

A regra é que uma projeção é **de inclusão** (`1`) ou **de exclusão** (`0`), não as duas. `{ nome: 1, senhaHash: 0 }` dá erro. A única exceção é o `_id`, que pode ser excluído numa projeção de inclusão.

Também dá para projetar campos embutidos com dot notation (`{ "endereco.cidade": 1 }`) e fatiar arrays com `$slice` (`{ comentarios: { $slice: 5 } }`, os cinco primeiros).

## Cursor: sort, limit e skip

O cursor é um ponteiro para o resultado da consulta. Ele é **preguiçoso**: a consulta só roda quando você começa a ler, e os documentos chegam do servidor em **lotes**, não todos de uma vez. Isso permite percorrer milhões de documentos sem carregar tudo na memória da aplicação.

Os métodos do cursor ajustam o resultado antes da leitura:

```js
db.usuarios.find({ cidade: "Delhi" }, { nome: 1, idade: 1, _id: 0 })
  .sort({ idade: -1 })   // 1 = crescente, -1 = decrescente
  .skip(10)              // pula os 10 primeiros
  .limit(5)              // devolve no máximo 5
```

A ordem em que você escreve os métodos não muda o resultado: o servidor sempre aplica **sort, depois skip, depois limit**. Ordenar sem índice tem um teto de memória e pode ficar caro, então ordenação frequente pede índice no campo (veja a regra ESR na nota de índices).

Formas de percorrer um cursor:

```js
const cursor = db.usuarios.find({ idade: { $gte: 18 } }).sort({ idade: 1 }).limit(5)

while (cursor.hasNext()) {
  printjson(cursor.next())
}

db.usuarios.find().forEach(u => print(u.nome))

const lista = db.usuarios.find().limit(100).toArray()   // cuidado: carrega tudo em memória
```

Para contar, use `countDocuments(filtro)`, que conta de verdade aplicando o filtro, ou `estimatedDocumentCount()`, que lê os metadados da coleção e é instantâneo, mas aproximado e sem filtro. O antigo `count()` está deprecado por dar resultados imprecisos em alguns cenários (por exemplo, em clusters com sharding).

```js
db.usuarios.countDocuments({ ativo: true })
db.usuarios.estimatedDocumentCount()
```

Uma dica de material introdutório que não se sustenta é "use sempre `skip` e `limit` para performance". O `limit` ajuda; o `skip` não. Para pular 100.000 documentos o servidor precisa **percorrer e descartar** esses 100.000, então a página 5.000 de uma listagem fica bem mais lenta que a página 1. A alternativa é a **paginação por intervalo** (keyset pagination): em vez de "pule N", você diz "continue depois do último que eu vi", usando um campo indexado e único.

```js
// Página 1
const pagina = db.posts.find().sort({ _id: 1 }).limit(20).toArray()
const ultimoId = pagina[pagina.length - 1]._id

// Página seguinte: começa depois do último _id visto, usa o índice direto
db.posts.find({ _id: { $gt: ultimoId } }).sort({ _id: 1 }).limit(20)
```

O custo é não conseguir saltar direto para "a página 37", o que, para feeds e rolagem infinita, raramente é um problema.

## Update: updateOne, updateMany e replaceOne

Um update recebe dois documentos: o **filtro** (quais documentos) e o **update** (o que mudar, usando operadores).

```js
db.usuarios.updateOne(
  { nome: "Aman" },                 // filtro
  { $set: { idade: 26 } }           // update
)
// { acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedId: null }

db.usuarios.updateMany(
  { ativo: false },
  { $set: { arquivado: true } }
)
```

`updateOne` altera só o **primeiro** documento que casar; `updateMany`, todos. O resultado traz dois números que vale a pena conferir: `matchedCount` (quantos casaram com o filtro) e `modifiedCount` (quantos mudaram de fato). Se você setar um valor igual ao atual, `matchedCount` é 1 e `modifiedCount` é 0. E `matchedCount: 0` costuma indicar filtro errado, um bug silencioso clássico.

`replaceOne` é diferente: em vez de operadores, recebe o **documento novo inteiro**, que substitui o antigo (mantendo o `_id`). Qualquer campo que você não mandar some.

```js
db.usuarios.replaceOne(
  { _id: 1 },
  { nome: "Aman", idade: 26 }   // se o documento tinha "cidade", ela deixou de existir
)
```

Com `upsert: true`, se nenhum documento casar com o filtro, o MongoDB **cria** um, combinando os campos de igualdade do filtro com o update. Útil para "crie se não existir, atualize se existir":

```js
db.contadores.updateOne(
  { pagina: "/home" },
  { $inc: { visitas: 1 } },
  { upsert: true }
)
// 1ª vez: cria { pagina: "/home", visitas: 1 }. Depois: incrementa.
```

## Operadores de update

Os operadores de campo:

```js
// $set: define (cria ou sobrescreve) campos, sem mexer nos outros
db.usuarios.updateOne({ _id: 1 }, { $set: { idade: 26, "endereco.cidade": "Delhi" } })

// $unset: remove o campo (o valor passado não importa)
db.usuarios.updateOne({ _id: 1 }, { $unset: { cidade: "" } })

// $inc: soma (use negativo para subtrair); cria o campo se não existir
db.produtos.updateOne({ _id: 101 }, { $inc: { estoque: -1, vendidos: 1 } })

// $rename: renomeia o campo
db.usuarios.updateOne({ _id: 1 }, { $rename: { nome: "username" } })

// $min / $max: só atualiza se o novo valor for menor / maior que o atual
db.jogadores.updateOne({ _id: 7 }, { $max: { recorde: 950 } })

// $currentDate: grava a data atual do servidor
db.usuarios.updateOne({ _id: 1 }, { $currentDate: { atualizadoEm: true } })
```

Os operadores de array:

```js
// $push: adiciona ao fim (cria o array se não existir)
db.alunos.updateOne({ _id: 1 }, { $push: { cursos: "MongoDB" } })

// $push com $each: vários de uma vez; $slice mantém só os N últimos
db.posts.updateOne({ _id: 1 }, {
  $push: { ultimosLikes: { $each: ["ana", "bia"], $slice: -50 } }
})

// $addToSet: adiciona só se ainda não estiver no array (sem duplicata)
db.alunos.updateOne({ _id: 1 }, { $addToSet: { tags: "backend" } })

// $pull: remove TODAS as ocorrências que casarem (aceita condição)
db.alunos.updateOne({ _id: 1 }, { $pull: { cursos: "JS" } })
db.alunos.updateOne({ _id: 1 }, { $pull: { provas: { nota: { $lt: 5 } } } })

// $pop: remove o último (1) ou o primeiro (-1)
db.alunos.updateOne({ _id: 1 }, { $pop: { cursos: 1 } })
```

O `$push` com `$slice` é um padrão útil para manter arrays **limitados** e não estourar o tamanho do documento (o tema volta em [MongoDB: modelagem de dados](/labs/web-dev/banco-de-dados/21-mongodb-modelagem-de-dados/)).

Para atualizar um elemento específico de um array existem os operadores **posicionais**:

```js
// $ : o primeiro elemento que casou no filtro
db.alunos.updateOne(
  { _id: 1, "provas.materia": "mat" },
  { $set: { "provas.$.nota": 8 } }
)

// $[] : todos os elementos do array
db.alunos.updateOne({ _id: 1 }, { $inc: { "provas.$[].nota": 1 } })
```

Todo update em **um documento é atômico**: ninguém vê o documento "pela metade", e operações como `$inc` não sofrem com o problema de ler, somar na aplicação e gravar de volta. É a estratégia de atualização atômica descrita em [Controle de Concorrência](/labs/web-dev/banco-de-dados/08-controle-de-concorrencia/): em vez de `find` + calcular + `updateOne` com o valor novo, mande o banco fazer a conta.

```js
// Debita o estoque só se houver estoque, numa operação só
db.produtos.updateOne(
  { _id: 101, estoque: { $gte: 1 } },
  { $inc: { estoque: -1 } }
)
// modifiedCount 0 = acabou o estoque, sem race condition
```

## Delete: deleteOne e deleteMany

```js
db.alunos.deleteOne({ nome: "Rohit" })     // remove o primeiro que casar
// { acknowledged: true, deletedCount: 1 }

db.logs.deleteMany({ criadoEm: { $lt: ISODate("2025-01-01") } })
```

O `deletedCount` diz quantos saíram. O cuidado aqui é com o filtro: `deleteMany({})` com filtro vazio **apaga a coleção inteira**, sem pergunta. Rode o mesmo filtro num `find` (ou `countDocuments`) antes de apagar em produção.

Se a remoção precisa ser reversível ou auditável, considere marcar o documento em vez de apagar, como discutido em [Soft Delete vs Hard Delete](/labs/web-dev/banco-de-dados/10-soft-delete-vs-hard-delete/). E para expirar dados automaticamente (sessões, logs antigos), um índice TTL faz o trabalho sem você escrever um `deleteMany` agendado (veja a nota de índices).

## findOneAndUpdate e companhia

`updateOne` diz quantos documentos mudaram, mas não devolve o documento. Quando você precisa **ler e modificar numa operação atômica só** (pegar o próximo item de uma fila, gerar um número sequencial), use `findOneAndUpdate`, `findOneAndReplace` ou `findOneAndDelete`:

```js
// Pega a próxima tarefa pendente e já marca como "em andamento"
db.tarefas.findOneAndUpdate(
  { status: "pendente" },
  { $set: { status: "em_andamento", inicio: new Date() } },
  { sort: { prioridade: -1 }, returnDocument: "after" }
)
```

Por padrão ele devolve o documento **antes** da mudança; `returnDocument: "after"` devolve a versão já atualizada. Como ler e alterar acontecem juntos, dois workers nunca pegam a mesma tarefa.

Em material mais antigo você vai ver `findAndModify()`, que faz a mesma coisa com uma sintaxe mais verbosa. Ele ainda existe, mas os métodos `findOneAnd*` são a forma recomendada no shell e nos drivers.

## Métodos legados que não devem mais ser usados

Tutoriais antigos usam métodos que hoje estão deprecados no `mongosh` e foram removidos de drivers modernos:

| Legado | Use no lugar |
| --- | --- |
| `insert()` | `insertOne()` / `insertMany()` |
| `update()` | `updateOne()` / `updateMany()` / `replaceOne()` |
| `remove()` | `deleteOne()` / `deleteMany()` |
| `save()` | `insertOne()` ou `replaceOne()` com `upsert: true` |
| `count()` | `countDocuments()` / `estimatedDocumentCount()` |
| `findAndModify()` | `findOneAndUpdate()` / `findOneAndReplace()` / `findOneAndDelete()` |

O problema dos antigos era a ambiguidade: `update()` atualizava um ou vários dependendo de uma opção, e substituía o documento inteiro se você esquecesse o `$set`. Os nomes novos deixam a intenção explícita.

Para mandar muitas operações diferentes de uma vez (importações, sincronizações), existe o `bulkWrite`, que agrupa inserts, updates e deletes numa ida só ao servidor:

```js
db.produtos.bulkWrite([
  { insertOne: { document: { _id: 200, nome: "Mouse", estoque: 10 } } },
  { updateOne: { filter: { _id: 101 }, update: { $inc: { estoque: 5 } } } },
  { deleteOne: { filter: { _id: 150 } } }
], { ordered: false })
```

## Referências

- [Operações CRUD](https://www.mongodb.com/pt-br/docs/manual/crud/) - documentação oficial do MongoDB, português
- [Operadores de consulta e projeção](https://www.mongodb.com/pt-br/docs/manual/reference/operator/query/) - documentação oficial do MongoDB, português
- [Operadores de update](https://www.mongodb.com/pt-br/docs/manual/reference/operator/update/) - documentação oficial do MongoDB, português
- [Server-side JavaScript](https://www.mongodb.com/docs/manual/core/server-side-javascript/) - documentação oficial do MongoDB, inglês
