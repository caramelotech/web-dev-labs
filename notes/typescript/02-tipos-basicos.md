# Tipos básicos

## Anotação e inferência

Uma anotação de tipo vem depois do nome, separada por dois-pontos:

```ts
let nome: string = "Ana";
let idade: number = 30;
```

Na maioria das vezes, porém, você nem precisa anotar. O TypeScript **infere** o tipo a partir do valor:

```ts
let x = 5; // x: number
x = "cinco"; // erro: Type 'string' is not assignable to type 'number'.
```

Anotar o óbvio só gera ruído. A regra prática: deixe a inferência trabalhar em variáveis locais e anote onde o tipo é um contrato - parâmetros de funções, retornos de funções exportadas, propriedades de objetos e classes - ou onde a anotação deixa a intenção mais clara.

`let` e `const` são inferidos de forma diferente. Como um `const` nunca muda de valor, o TypeScript guarda o valor exato como tipo (um _literal type_, assunto mais abaixo):

```ts
let cor = "azul"; // cor: string
const tom = "azul"; // tom: "azul"
```

## Tipos primitivos

Os primitivos do TypeScript são os mesmos do JavaScript, escritos em minúsculas:

```ts
let titulo: string = "Relatório";
let total: number = 42.5; // inteiros e decimais são todos number
let ativo: boolean = true;
let grande: bigint = 123n; // inteiros arbitrariamente grandes
let chave: symbol = Symbol("id"); // identificador único
let vazio: null = null;
let indefinido: undefined = undefined;
```

Cuidado para não usar `String`, `Number` e `Boolean` com maiúscula: esses são os objetos _wrapper_ do JavaScript, quase nunca o que você quer.

`null` e `undefined` merecem atenção. Com `strictNullChecks` (ligado pelo `strict`, padrão desde o TypeScript 6.0), eles não cabem em outros tipos. Se uma variável pode não ter valor, isso precisa aparecer no tipo:

```ts
let apelido: string = null; // erro
let apelido2: string | null = null; // ok
```

Esse `|` é uma _union_, explicada em [Unions, intersections e literais](/labs/web-dev/typescript/05-unions-intersecoes-e-literais/).

## Arrays e tuplas

Arrays têm duas sintaxes equivalentes:

```ts
const notas: number[] = [7, 8.5, 10];
const nomes: Array<string> = ["Ana", "Bia"];
```

A primeira é a mais comum. A segunda é a forma genérica (veja [Generics](/labs/web-dev/typescript/08-generics/)) e aparece em tipos mais complexos.

Uma **tupla** é um array de tamanho fixo em que cada posição tem seu próprio tipo:

```ts
const par: [string, number] = ["idade", 30];
const [chave, valor] = par; // chave: string, valor: number

// rótulos deixam a tupla autoexplicativa
type Coordenada = [lat: number, lng: number];

// readonly impede alterações
const origem: readonly [number, number] = [0, 0];
origem[0] = 1; // erro: Cannot assign to '0' because it is a read-only property.
```

Tuplas aparecem bastante em retornos de funções, como o clássico `useState` do React, que retorna `[valor, setValor]`.

Um detalhe sobre acesso por índice. Por padrão, `notas[10]` é tipado como `number`, mesmo que a posição não exista e o valor real seja `undefined`. A opção `noUncheckedIndexedAccess` corrige isso, somando `| undefined` a todo acesso por índice e obrigando você a tratar o caso:

```ts
// com noUncheckedIndexedAccess: true
const primeira = notas[0]; // number | undefined
if (primeira !== undefined) {
  console.log(primeira.toFixed(1));
}
```

## Objetos e Record

O formato de um objeto é descrito listando suas propriedades. O `?` marca uma propriedade opcional:

```ts
let usuario: { id: number; nome: string; email?: string } = {
  id: 1,
  nome: "Aman",
};
```

Escrever o formato inline em todo lugar fica repetitivo, por isso o normal é dar um nome a ele com `type` ou `interface` - tema de [Interfaces e type aliases](/labs/web-dev/typescript/04-interfaces-e-type-aliases/).

Para dicionários, em que as chaves são dinâmicas mas os valores têm todos o mesmo tipo, existe o `Record`:

```ts
const estoque: Record<string, number> = {
  maca: 10,
  banana: 4,
};
```

Evite o tipo `object` (ou `{}`) para descrever dados. Ele aceita quase qualquer coisa e não permite acessar nenhuma propriedade, então você perde exatamente o que queria ganhar. Prefira descrever o formato específico.

## any, unknown, never e void

Esses quatro são tipos "especiais", e confundi-los é um erro comum.

`any` desliga a checagem de tipos. Tudo é permitido, inclusive coisas que vão quebrar:

```ts
let a: any = "oi";
a = 123;
a.foo(); // compila, e explode em runtime
```

`unknown` também aceita qualquer valor, mas não deixa você fazer nada com ele até provar o que ele é. É o tipo certo para "não sei o que vem aqui" - dados de API, `JSON.parse`, erros de `catch`:

```ts
let b: unknown = "oi";
b.toUpperCase(); // erro: 'b' is of type 'unknown'.

if (typeof b === "string") {
  b.toUpperCase(); // ok, aqui o TS sabe que é string
}
```

Esse "provar" chama-se _narrowing_ e tem uma nota inteira: [Narrowing e type guards](/labs/web-dev/typescript/06-narrowing-e-type-guards/). Resumindo a diferença numa frase: `any` abre mão da segurança, `unknown` mantém a segurança e cobra uma checagem antes do uso.

`void` é o retorno de uma função que não devolve nada útil:

```ts
function logar(msg: string): void {
  console.log(msg);
}
```

`never` é o tipo de algo que nunca acontece. Uma função que sempre lança exceção nunca retorna, então seu retorno é `never`:

```ts
function falhar(msg: string): never {
  throw new Error(msg);
}
```

O `never` também aparece quando todas as possibilidades de um tipo foram eliminadas, o que é a base da checagem de exaustividade vista em [Unions, intersections e literais](/labs/web-dev/typescript/05-unions-intersecoes-e-literais/).

## Literal types

Um tipo pode ser um valor exato. Combinando valores com `|`, você restringe uma variável a um conjunto fechado de opções:

```ts
type Papel = "admin" | "usuario";

let papel: Papel = "admin";
papel = "usuario"; // ok
papel = "visitante"; // erro: Type '"visitante"' is not assignable to type 'Papel'.
```

Isso é muito mais seguro do que `string`: erros de digitação viram erros de compilação e o editor autocompleta as opções válidas.

Para objetos e arrays, `as const` diz ao TypeScript para manter os valores literais e tornar tudo `readonly`:

```ts
const config = { modo: "escuro", versao: 2 };
// config: { modo: string; versao: number }

const config2 = { modo: "escuro", versao: 2 } as const;
// config2: { readonly modo: "escuro"; readonly versao: 2 }
```

## Enums e alternativas

Um `enum` dá nomes a um conjunto de constantes:

```ts
enum Status {
  Ativo = "ATIVO",
  Inativo = "INATIVO",
}

function mudar(status: Status) {}
mudar(Status.Ativo);
```

Existem enums numéricos (sem valor explícito, começam em 0) e de string, como o do exemplo. Diferente do resto do TypeScript, um `enum` **gera código JavaScript** - um objeto real em runtime. Existe também o `const enum`, que é substituído pelos valores na compilação, mas ele traz problemas com ferramentas que compilam um arquivo de cada vez (`isolatedModules`).

Por gerarem código, enums não são sintaxe "apagável": não rodam com o type stripping padrão do Node.js e são barrados pela opção `erasableSyntaxOnly` (detalhes em [Introdução e configuração](/labs/web-dev/typescript/01-introducao-e-configuracao/)). Enums numéricos ainda têm uma pegadinha: aceitam números que não estão no enum.

Por isso, muitos projetos atuais preferem uma destas alternativas, que são puro TypeScript:

```ts
// 1. union de literais: o mais simples
type Status = "ATIVO" | "INATIVO";

// 2. objeto as const: quando você também quer os valores em runtime
const Status = {
  Ativo: "ATIVO",
  Inativo: "INATIVO",
} as const;

type Status = (typeof Status)[keyof typeof Status]; // "ATIVO" | "INATIVO"

function mudar(status: Status) {}
mudar(Status.Ativo); // ok
mudar("ATIVO"); // ok também
```

A segunda forma usa `typeof` e `keyof` em posição de tipo, explicados em [Tipos avançados](/labs/web-dev/typescript/10-tipos-avancados/). Você vai encontrar enums em muito código existente, então vale saber ler; para código novo, a union de literais costuma bastar.

## Referências

- [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) - TypeScript Handbook, en
- [Inferência de Tipo](https://www.typescriptlang.org/pt/docs/handbook/type-inference.html) - typescriptlang.org, pt-BR
- [Enums](https://www.typescriptlang.org/docs/handbook/enums.html) - TypeScript Handbook, en
- [TypeScript 5.8 - erasableSyntaxOnly](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html) - TypeScript, en
