# Interfaces e type aliases

## Descrevendo formatos de objetos

Repetir `{ id: number; nome: string }` em cada função que recebe um usuário não escala. O TypeScript oferece duas formas de dar nome a um formato: `interface` e `type` (o _type alias_).

```ts
interface Usuario {
  id: number;
  nome: string;
  email?: string; // opcional
}

type Ponto = {
  x: number;
  y: number;
};

function exibir(u: Usuario) {
  console.log(u.nome, u.email ?? "sem e-mail");
}
```

Para descrever objetos, as duas formas são praticamente intercambiáveis. A propriedade opcional (`email?`) pode estar ausente; dentro do código, o tipo dela é `string | undefined`.

## interface vs type

As diferenças aparecem nas bordas:

|                                           | `interface` | `type`             |
| ----------------------------------------- | ----------- | ------------------ |
| Descreve objetos                          | Sim         | Sim                |
| Unions, tuplas, primitivos, funções       | Não         | Sim                |
| Mapped e conditional types                | Não         | Sim                |
| Herança                                   | `extends`   | Intersection (`&`) |
| Pode ser "reaberta" (declaration merging) | Sim         | Não                |

Um `type` pode nomear qualquer tipo, não só objetos:

```ts
type ID = string | number;
type Par = [string, number];
type Callback = (erro: Error | null) => void;
```

Uma `interface` pode ser declarada mais de uma vez, e as declarações se somam. Isso se chama _declaration merging_:

```ts
interface Janela {
  titulo: string;
}
interface Janela {
  largura: number;
}

const j: Janela = { titulo: "Início", largura: 800 }; // precisa das duas
```

Parece estranho, mas é útil para estender tipos que você não controla, como adicionar uma propriedade ao `Window` do navegador ou ao `Request` de um framework. Com `type`, declarar o mesmo nome duas vezes é erro.

Como escolher na prática:

- use `interface` para formatos de objetos, principalmente os que podem ser estendidos, implementados por classes ou aumentados por declaration merging;
- use `type` para unions, tuplas, tipos de função e tipos construídos a partir de outros (mapped, conditional);
- acima de tudo, siga a convenção do projeto. As duas funcionam, e consistência pesa mais do que a escolha em si.

## Estendendo e compondo

Interfaces herdam de outras com `extends`:

```ts
interface Animal {
  nome: string;
}

interface Cachorro extends Animal {
  raca: string;
}

const rex: Cachorro = { nome: "Rex", raca: "Vira-lata" };
```

Com `type`, o equivalente é a _intersection_ (`&`), que combina formatos:

```ts
type ComTimestamps = { criadoEm: Date; atualizadoEm: Date };
type Post = { titulo: string } & ComTimestamps;
```

Uma diferença sutil: se a interface filha redeclara uma propriedade com tipo incompatível, o `extends` acusa o erro na hora; a intersection aceita e o tipo resultante vira `never` naquela propriedade, o que pode gerar mensagens confusas mais adiante.

Classes podem prometer seguir um formato com `implements`. O compilador confere se a classe tem tudo que a interface exige:

```ts
interface Identificavel {
  id: string;
}

class Pedido implements Identificavel {
  constructor(
    public id: string,
    public valor: number,
  ) {}
}
```

Classes são o tema de [Classes e POO](/labs/web-dev/typescript/07-classes-e-poo/).

## Propriedades readonly

`readonly` impede que uma propriedade seja reatribuída depois de criada:

```ts
interface Conta {
  readonly id: number;
  titular: string;
}

const c: Conta = { id: 1, titular: "Alice" };
c.titular = "Bia"; // ok
c.id = 2; // erro: Cannot assign to 'id' because it is a read-only property.
```

Dois pontos importantes. O `readonly` só existe em tempo de compilação: o JavaScript gerado não congela nada (para isso existe `Object.freeze`). E ele é raso: se a propriedade é um objeto, as propriedades internas continuam alteráveis.

Para arrays, existem `readonly T[]` e `ReadonlyArray<T>`, que removem os métodos que alteram o array (`push`, `pop`, `sort`...):

```ts
function media(notas: readonly number[]) {
  notas.push(10); // erro: Property 'push' does not exist on type 'readonly number[]'.
  return notas.reduce((a, b) => a + b, 0) / notas.length;
}
```

Receber `readonly` em parâmetros é uma boa forma de prometer a quem chama que a função não vai mexer no array.

## Index signatures

Quando as chaves de um objeto não são conhecidas de antemão, mas os valores seguem um tipo, usa-se uma _index signature_:

```ts
interface Cabecalhos {
  [nome: string]: string;
}

const headers: Cabecalhos = {
  "content-type": "application/json",
  "x-token": "abc123",
};

headers["x-token"]; // string
```

O mesmo pode ser escrito com `Record<string, string>`, que costuma ser mais legível. A index signature brilha quando você quer misturar chaves conhecidas com chaves livres:

```ts
interface Traducoes {
  idioma: string;
  [chave: string]: string; // todas as propriedades precisam ser string
}
```

Atenção: por padrão, `headers["qualquer-coisa"]` é tipado como `string`, mesmo que a chave não exista. Com `noUncheckedIndexedAccess`, vira `string | undefined`, o que reflete melhor a realidade.

## Excess property checks

O TypeScript usa _tipagem estrutural_: um objeto é compatível com um tipo se tem as propriedades exigidas, mesmo que tenha outras a mais. Só que, quando você escreve um **object literal** direto numa posição tipada, ele faz uma checagem extra e reclama de propriedades desconhecidas:

```ts
type Usuario = { id: number; nome: string };

const u: Usuario = { id: 1, nome: "A", idade: 20 };
// erro: Object literal may only specify known properties, and 'idade' does not exist in type 'Usuario'.
```

A lógica é que, num literal, uma propriedade a mais quase sempre é erro de digitação (`nmoe` no lugar de `nome`) ou um campo que você achou que existia. Já um objeto que veio de outro lugar passa:

```ts
const dados = { id: 1, nome: "A", idade: 20 };
const u2: Usuario = dados; // ok: dados tem tudo que Usuario exige
```

## Boas práticas de modelagem

Um anti-padrão frequente é a "sopa de opcionais": um único tipo enorme em que tudo é opcional para caber em todas as situações.

```ts
// ruim: cada uso precisa adivinhar o que existe
type Usuario = {
  id?: number;
  nome?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
};
```

Esse tipo não diz nada. Prefira tipos pequenos e focados, compostos conforme a necessidade:

```ts
type Contato = { email: string; telefone?: string };
type Usuario = { id: number; nome: string } & Contato;

type NovoUsuario = Omit<Usuario, "id">; // para criação
type AtualizacaoUsuario = Partial<NovoUsuario>; // para PATCH
```

`Omit` e `Partial` são _utility types_, que derivam tipos novos a partir de existentes sem duplicar definições - veja [Utility types](/labs/web-dev/typescript/09-utility-types/).

Para organizar: exporte os tipos de domínio de um lugar só (uma pasta `types/` ou junto da feature que os usa) e reaproveite. Formato copiado e colado em três arquivos é formato que vai divergir.

## Referências

- [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html) - TypeScript Handbook, en
- [Mesclagem de declarações](https://www.typescriptlang.org/pt/docs/handbook/declaration-merging.html) - typescriptlang.org, pt-BR
- [Compatibilidade de tipos](https://www.typescriptlang.org/pt/docs/handbook/type-compatibility.html) - typescriptlang.org, pt-BR
