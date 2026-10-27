# Tipos avançados

Esta nota trata das ferramentas para **construir tipos a partir de outros tipos**. São as peças com que os utility types da [nota anterior](/labs/web-dev/typescript/09-utility-types/) são feitos, e é aqui que o sistema de tipos do TypeScript começa a parecer uma pequena linguagem de programação.

## keyof e typeof em tipos

`keyof` recebe um tipo de objeto e devolve a união das suas chaves:

```ts
type Usuario = {
  id: number;
  nome: string;
  email: string;
};

type ChaveUsuario = keyof Usuario; // "id" | "nome" | "email"
```

Em posição de tipo, `typeof` faz o caminho inverso do que você está acostumado: recebe um **valor** e devolve o **tipo** dele.

```ts
const config = {
  porta: 3000,
  host: "localhost",
};

type Config = typeof config; // { porta: number; host: string }
```

Os dois juntos, `keyof typeof`, são a forma de pegar as chaves de um objeto que existe em runtime. Com `as const`, dá para derivar também a união dos valores:

```ts
const CORES = {
  primaria: "#0055ff",
  perigo: "#ff3300",
} as const;

type NomeCor = keyof typeof CORES; // "primaria" | "perigo"
type ValorCor = (typeof CORES)[keyof typeof CORES]; // "#0055ff" | "#ff3300"
```

Esse é o padrão usado como alternativa a `enum` em [Tipos básicos](/labs/web-dev/typescript/02-tipos-basicos/).

## Indexed access types

Com colchetes, você acessa o tipo de uma propriedade, do mesmo jeito que acessaria o valor:

```ts
type IdUsuario = Usuario["id"]; // number
type IdOuNome = Usuario["id" | "nome"]; // number | string
type Qualquer = Usuario[keyof Usuario]; // number | string

const papeis = ["admin", "editor"] as const;
type Papel = (typeof papeis)[number]; // "admin" | "editor"
```

O último exemplo é útil: `[number]` significa "o tipo de qualquer elemento do array", e transforma uma lista `as const` numa union de literais.

Em funções genéricas, `T[K]` liga o tipo da propriedade à chave pedida, como no `pegar<T, K extends keyof T>` de [Generics](/labs/web-dev/typescript/08-generics/).

## Mapped types

Um _mapped type_ percorre as chaves de um tipo e gera um novo tipo, propriedade por propriedade. A sintaxe lembra um `for...in`:

```ts
type Copia<T> = {
  [K in keyof T]: T[K];
};
```

Leia como: "para cada chave `K` de `T`, crie uma propriedade `K` com o tipo `T[K]`". Sozinho, isso só copia. A graça está em mudar algo no caminho. Recriando o `Partial` e o `Readonly`:

```ts
type MeuPartial<T> = {
  [K in keyof T]?: T[K];
};

type MeuReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

type U = MeuPartial<Usuario>; // { id?: number; nome?: string; email?: string }
```

Os modificadores também podem ser **removidos** com `-`:

| Sintaxe                    | Efeito                                           |
| -------------------------- | ------------------------------------------------ |
| `readonly [K in keyof T]`  | Adiciona `readonly`                              |
| `[K in keyof T]?`          | Adiciona opcional                                |
| `-readonly [K in keyof T]` | Remove `readonly`                                |
| `[K in keyof T]-?`         | Remove opcional (é assim que `Required` é feito) |

E o tipo do valor pode ser transformado:

```ts
type Flags<T> = {
  [K in keyof T]: boolean;
};

type CamposAlterados = Flags<Usuario>; // { id: boolean; nome: boolean; email: boolean }
```

Com `as`, é possível **renomear** as chaves durante o mapeamento (_key remapping_). Combinado com template literal types (mais abaixo), gera getters automaticamente:

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type GettersUsuario = Getters<Usuario>;
// { getId: () => number; getNome: () => string; getEmail: () => string }
```

O `string & K` existe porque as chaves podem ser `string | number | symbol`, e `Capitalize` só aceita strings.

## Conditional types

Um _conditional type_ escolhe entre dois tipos com base numa condição, com sintaxe de operador ternário:

```ts
T extends U ? X : Y
```

"Se `T` é atribuível a `U`, o resultado é `X`; senão, `Y`."

```ts
type EhTexto<T> = T extends string ? "sim" : "não";

type A = EhTexto<"oi">; // "sim"
type B = EhTexto<42>; // "não"
```

### Distribuição sobre unions

Quando o tipo checado é um parâmetro genérico "nu" (sozinho, sem estar envolvido em outro tipo) e você passa uma union, a condição é aplicada **a cada membro separadamente**, e os resultados são unidos de novo:

```ts
type ParaArray<T> = T extends any ? T[] : never;

type R = ParaArray<string | number>; // string[] | number[]  (e não (string | number)[])
```

É assim que `Exclude` e `NonNullable` funcionam por dentro:

```ts
type MeuExclude<T, U> = T extends U ? never : T;
type MeuNonNullable<T> = T extends null | undefined ? never : T;

type S = MeuExclude<"a" | "b" | "c", "a">; // "b" | "c"
```

Para cada membro, se ele é atribuível a `U` vira `never` (que some da union), senão fica.

A distribuição só acontece com o parâmetro nu. Para desligá-la, envolva os dois lados em colchetes:

```ts
type ParaArrayJunto<T> = [T] extends [any] ? T[] : never;

type R2 = ParaArrayJunto<string | number>; // (string | number)[]
```

## infer

Dentro da condição de um conditional type, `infer` declara uma variável de tipo que o TypeScript preenche "casando" o padrão. Serve para extrair um tipo de dentro de outro:

```ts
type ElementoDe<T> = T extends Array<infer E> ? E : never;

type X = ElementoDe<string[]>; // string
type Y = ElementoDe<number>; // never
```

Leia como: "se `T` é um array de alguma coisa, chame essa coisa de `E` e devolva `E`". Recriando o `ReturnType` e o `Awaited` simplificado:

```ts
type MeuReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Desembrulhar<T> = T extends Promise<infer V> ? V : T;

type Z = MeuReturnType<() => boolean>; // boolean
type W = Desembrulhar<Promise<string>>; // string
```

## Template literal types

Os _template literal types_ usam a sintaxe das template strings do JavaScript, só que em tipos. Com unions, eles geram todas as combinações:

```ts
type Tamanho = "p" | "m" | "g";
type Cor = "azul" | "preto";

type Sku = `${Cor}-${Tamanho}`;
// "azul-p" | "azul-m" | "azul-g" | "preto-p" | "preto-m" | "preto-g"
```

O TypeScript traz quatro utilitários intrínsecos para manipular strings em nível de tipo: `Uppercase`, `Lowercase`, `Capitalize` e `Uncapitalize`.

```ts
type NomeEvento<S extends string> = `on${Capitalize<S>}`;

type E1 = NomeEvento<"click">; // "onClick"
type E2 = NomeEvento<"click" | "focus">; // "onClick" | "onFocus"
```

Também servem para validar formatos simples de string:

```ts
type Rota = `/${string}`;

const ok: Rota = "/usuarios";
const erro: Rota = "usuarios"; // erro: não começa com /
```

## Quando usar

Esses recursos são o que permite a bibliotecas como ORMs, roteadores e clientes de API oferecerem autocomplete preciso e tipos que se ajustam ao seu código. Se você está escrevendo uma biblioteca ou uma camada compartilhada (um cliente HTTP tipado, um sistema de eventos), eles se pagam.

Em código de aplicação do dia a dia, use com moderação. Um tipo condicional recursivo de 15 linhas pode estar correto e ainda assim ser impossível de manter por quem chegar depois. Além disso, tipos muito elaborados deixam a checagem mais lenta e geram mensagens de erro difíceis de ler. A pergunta a fazer é se o tipo complexo está prevenindo bugs reais ou só sendo engenhoso. Muitas vezes, um `Pick`, um `Omit` ou um tipo escrito à mão resolve com mais clareza.

## Referências

- [Creating Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html) - TypeScript Handbook, en
- [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) - TypeScript Handbook, en
- [Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) - TypeScript Handbook, en
- [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) - TypeScript Handbook, en
- [Tipos Utilitários](https://www.typescriptlang.org/pt/docs/handbook/utility-types.html) - typescriptlang.org, pt-BR
