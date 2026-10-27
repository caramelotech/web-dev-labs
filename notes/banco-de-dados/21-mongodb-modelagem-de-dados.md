# MongoDB: modelagem de dados

## Modelar pelo padrão de acesso

No banco relacional, a modelagem começa pelos **dados**: você identifica as entidades, separa em tabelas e normaliza para não repetir informação (o processo descrito em [Normalização](/labs/web-dev/banco-de-dados/02-normalizacao/)). As consultas vêm depois, e o `JOIN` junta o que foi separado.

No MongoDB, a modelagem começa pelas **consultas**. A pergunta-guia é: "que dados a aplicação lê e escreve juntos, e com que frequência?". A regra prática que resume a filosofia é **dado que é acessado junto fica junto**. Se toda vez que você mostra um produto também mostra as especificações dele, faz sentido que as especificações morem dentro do documento do produto.

Isso tem uma consequência importante: no MongoDB, uma escrita em **um documento é atômica**, inclusive quando ela mexe em vários campos, documentos embutidos e arrays de uma vez. Quanto mais o que precisa mudar junto está no mesmo documento, menos você depende de transações multi-documento, que existem, mas custam mais (veja [MongoDB: replicação, sharding e transações](/labs/web-dev/banco-de-dados/24-mongodb-replicacao-sharding-e-transacoes/)). A própria documentação do MongoDB diz que transação não deve substituir um bom design de schema.

Na prática, cada relacionamento vira uma escolha entre duas ferramentas: **embutir** o dado relacionado dentro do documento, ou **referenciar** outro documento pelo `_id`.

## Documentos embutidos

Embutir é colocar o dado relacionado dentro do documento principal, como um subdocumento ou um array de subdocumentos.

```js
// Um produto com especificações e avaliações em destaque embutidas
{
  _id: 1,
  nome: "Notebook",
  categoria: "Eletrônicos",
  specs: { ram: "16GB", armazenamento: "512GB SSD", garantia: "1 ano" },
  tags: ["notebook", "trabalho"]
}

// Um usuário com o endereço embutido
{
  _id: 42,
  nome: "Rahul",
  endereco: { cidade: "Jaipur", estado: "Rajasthan", cep: "302001" }
}
```

O que se ganha:

- **Uma leitura só**: um `findOne` traz o produto e as specs, sem segunda consulta e sem join.
- **Atomicidade de graça**: atualizar o nome e as specs ao mesmo tempo é uma operação atômica.
- **Localidade**: os dados ficam fisicamente juntos, o que é bom para o cache do banco.

Para consultar e indexar campos embutidos, use a dot notation (detalhada em [MongoDB: CRUD e consultas](/labs/web-dev/banco-de-dados/20-mongodb-crud-e-consultas/)):

```js
db.usuarios.find({ "endereco.cidade": "Jaipur" })
db.usuarios.createIndex({ "endereco.cidade": 1 })
```

## Referências entre documentos

Referenciar é guardar, num documento, o `_id` de um documento de outra coleção, parecido com uma chave estrangeira. A diferença é que o MongoDB **não verifica** essa referência: não existe restrição de integridade, então apagar uma categoria não impede que produtos continuem apontando para ela. Essa garantia passa a ser da aplicação.

```js
// Coleção categorias
{ _id: 101, nome: "Eletrônicos" }

// Coleção produtos
{ _id: 1, nome: "Notebook", categoriaId: 101 }
```

Para juntar os dois, há dois caminhos:

```js
// 1. Na aplicação: duas consultas
const produto = db.produtos.findOne({ _id: 1 })
const categoria = db.categorias.findOne({ _id: produto.categoriaId })

// 2. No banco, com $lookup no aggregation pipeline (um left outer join)
db.produtos.aggregate([
  { $match: { _id: 1 } },
  { $lookup: { from: "categorias", localField: "categoriaId", foreignField: "_id", as: "categoria" } }
])
```

O `$lookup` está detalhado em [MongoDB: aggregation pipeline](/labs/web-dev/banco-de-dados/23-mongodb-aggregation-pipeline/). Ele funciona bem, mas é mais caro que ler um documento só; se quase toda leitura precisa dele, o modelo provavelmente deveria embutir.

O que se ganha ao referenciar:

- **Sem duplicação**: o nome da categoria existe num lugar só; mudar é um update.
- **Documentos menores**, sem risco de crescer até o limite de 16 MB.
- **Dado compartilhado e independente**: uma categoria é usada por milhares de produtos e tem vida própria, faz sentido ela ser um documento à parte.

## Relacionamentos

A decisão entre embutir e referenciar depende muito da **cardinalidade**, ou seja, de quantos itens existem de cada lado.

### Um para um

Um usuário e o perfil dele, um pedido e o endereço de entrega. Quase sempre o caminho é **embutir**: os dados são lidos juntos e não fazem sentido sozinhos.

Separe em outro documento quando a parte relacionada é grande e raramente lida (por exemplo, a foto em alta resolução ou o histórico completo de configurações de um usuário que aparece em toda listagem). Carregar esse peso em todo `find` de usuários seria desperdício.

### Um para muitos

Aqui o "muitos" faz toda a diferença. Uma forma útil de pensar, popularizada pelo próprio blog do MongoDB, é separar em três tamanhos:

**Poucos** (dezenas): endereços de um usuário, telefones de um contato. Embuta como array no documento pai.

```js
{ _id: 42, nome: "Ana", telefones: [ { tipo: "celular", numero: "..." }, { tipo: "casa", numero: "..." } ] }
```

**Muitos** (centenas a alguns milhares): pedidos de um usuário, peças de um produto. Coloque a **referência no filho**, apontando para o pai, e indexe esse campo.

```js
// Coleção usuarios
{ _id: 1, nome: "Priyanka", email: "priyanka@exemplo.com" }

// Coleção pedidos: cada pedido aponta para o usuário
{ _id: 101, usuarioId: 1, produto: "Notebook", valor: Decimal128("5000.00") }
{ _id: 102, usuarioId: 1, produto: "Mouse",    valor: Decimal128("80.00") }

db.pedidos.createIndex({ usuarioId: 1 })
db.pedidos.find({ usuarioId: 1 })
```

Também é possível guardar no usuário um array com os ids dos pedidos (`pedidos: [101, 102]`), como alguns materiais mostram, mas isso cria dois lugares para manter em sincronia e um array que cresce com o tempo. Para pedidos, a referência no filho costuma ser mais simples.

**Muitíssimos** (sem limite previsível): logs de uma máquina, eventos de um sensor, mensagens de um canal. **Sempre** referência no filho e **nunca** um array no pai, porque o array cresceria até estourar os 16 MB.

### Muitos para muitos

Alunos e cursos: um aluno faz vários cursos, um curso tem vários alunos. No relacional isso pede uma tabela de junção. No MongoDB, a forma comum é um **array de referências** em um dos lados, ou nos dois quando as consultas vão nas duas direções:

```js
// Coleção alunos
{ _id: "a1", nome: "Leo", cursoIds: ["c1", "c2"] }

// Coleção cursos
{ _id: "c1", titulo: "MongoDB", alunoIds: ["a1", "a7"] }
```

Guardar dos dois lados deixa as duas consultas baratas ("cursos do Leo", "alunos do curso de MongoDB"), mas cada matrícula precisa atualizar dois documentos, idealmente numa transação ou com algum processo de reconciliação. Se um dos lados pode ficar enorme (um curso aberto com 200 mil alunos), não guarde o array desse lado: use só o array no aluno, com índice multikey em `cursoIds`, ou uma coleção de matrículas à parte, que é basicamente a tabela de junção do relacional.

## Abordagem híbrida

Os modelos reais raramente são 100% embutidos ou 100% referenciados. Dois padrões híbridos aparecem o tempo todo.

**Extended reference** (referência estendida): além do `_id`, copie para o documento os poucos campos do outro lado que você precisa mostrar sempre.

```js
// Pedido guarda o id do cliente E o nome dele, para a listagem de pedidos não precisar de $lookup
{
  _id: 9001,
  cliente: { _id: 42, nome: "Ana Souza" },
  itens: [ ... ],
  total: Decimal128("259.90")
}
```

**Subset** (subconjunto): embuta só a parte mais acessada e guarde o resto à parte. A página de um produto mostra as 10 avaliações mais recentes; as outras 3.000 ficam numa coleção de avaliações.

```js
db.produtos.updateOne(
  { _id: 1 },
  { $push: { avaliacoesRecentes: { $each: [novaAvaliacao], $position: 0, $slice: 10 } } }
)
db.avaliacoes.insertOne({ produtoId: 1, ...novaAvaliacao })
```

O preço dos dois padrões é a **duplicação**: se a Ana mudar de nome, os pedidos antigos continuam com o nome antigo até alguém atualizar. Às vezes isso é até desejável (o pedido deve guardar o nome e o endereço **do momento da compra**, como uma nota fiscal). Quando não é, você precisa de um processo para propagar a mudança (`updateMany` na hora, um job assíncrono, ou eventos), e a regra de bolso é duplicar só campos que **mudam pouco** e são **lidos muito**.

## Anti-padrões comuns

**Arrays que crescem sem limite.** O exemplo clássico é guardar todos os comentários dentro do post. Funciona com 50 comentários, fica lento com 5.000 (todo update reescreve um documento enorme) e quebra quando passa de 16 MB. Use referência no filho ou o padrão subset.

**Aninhamento profundo.** `empresa.departamentos[].equipes[].membros[].tarefas[]` é difícil de consultar, de atualizar (operadores posicionais em vários níveis) e de indexar. O limite técnico é 100 níveis, mas o limite prático chega muito antes. Se você precisa atualizar uma tarefa individualmente com frequência, ela provavelmente merece um documento próprio.

**Modelar como no relacional.** Uma coleção por entidade, tudo normalizado, e um `$lookup` em toda leitura. Isso entrega o pior dos dois mundos: os joins do relacional sem o otimizador e as garantias de integridade dele. Se o seu modelo é assim, talvez o banco certo para esse problema seja um relacional (o raciocínio está em [Escolha de Banco de Dados](/labs/web-dev/banco-de-dados/07-escolha-de-banco-de-dados/)).

**Documentos inchados com dado pouco usado.** Um documento de usuário que carrega o histórico de 2 anos de login, lido em toda requisição só para pegar o nome. O cache do banco (o WiredTiger cache) guarda documentos inteiros, então dado inútil ocupa memória que poderia estar servindo outras consultas. Projeção ajuda na rede, mas não no cache; separar ajuda nos dois.

## Checklist para decidir entre embutir e referenciar

Para cada relacionamento, responda:

| Pergunta | Tende a embutir | Tende a referenciar |
| --- | --- | --- |
| Quantos itens existem do lado "muitos"? | Poucos e com limite conhecido | Muitos ou sem limite |
| Os dados são lidos juntos na maioria das consultas? | Sim | Não, cada um tem suas telas |
| O dado relacionado é consultado sozinho? | Raramente | Com frequência |
| O dado relacionado muda com frequência? | Pouco | Muito (e é compartilhado) |
| Vários documentos compartilham o mesmo dado? | Não | Sim (duplicar exigiria sincronizar) |
| O documento pode crescer até perto de 16 MB? | Não | Sim |
| Os dados precisam mudar juntos atomicamente? | Sim | Não (ou aceita transação) |

Quando as respostas ficam divididas, o híbrido (extended reference ou subset) costuma ser a saída. E nenhum modelo é definitivo: como o schema é flexível, dá para evoluir conforme as consultas reais aparecem, medindo com `explain()` (veja [MongoDB: índices](/labs/web-dev/banco-de-dados/22-mongodb-indices/)) em vez de adivinhar.

## Referências

- [Modelagem de dados](https://www.mongodb.com/pt-br/docs/manual/data-modeling/) - documentação oficial do MongoDB, português
- [6 Rules of Thumb for MongoDB Schema Design](https://www.mongodb.com/blog/post/6-rules-of-thumb-for-mongodb-schema-design) - blog oficial do MongoDB, inglês
- [Building with Patterns: A Summary](https://www.mongodb.com/blog/post/building-with-patterns-a-summary) - blog oficial do MongoDB, inglês
- [Transações](https://www.mongodb.com/pt-br/docs/manual/core/transactions/) - documentação oficial do MongoDB, português
