# Generics

## O problema que generics resolvem

Imagine uma função que devolve o próprio argumento. Com tipos fixos, você precisaria de uma versão para cada tipo. Com `any`, ela aceita tudo, mas o resultado perde o tipo:

```ts
function identidadeAny(valor: any): any {
  return valor;
}

const x = identidadeAny("oi"); // x: any, o TS esqueceu que era string
x.toFixed(); // compila, e quebra em runtime
```

_Generics_ resolvem isso com um **parâmetro de tipo**: um "buraco" no tipo que é preenchido a cada uso.

```ts
function identidade<T>(valor: T): T {
  return valor;
}

const a = identidade("oi"); // a: string
const b = identidade(42); // b: number
```

Leia `<T>` como "para algum tipo T". A função promete: o que entrar como `T`, sai como `T`. É escrever uma vez e reutilizar com muitos tipos, sem perder a informação. Por convenção, parâmetros de tipo usam letras maiúsculas (`T`, `U`, `K`, `V`) ou nomes descritivos (`TItem`, `TResposta`).

## Funções genéricas

Na maioria das vezes, o TypeScript **infere** o parâmetro de tipo a partir dos argumentos, como nos exemplos acima. Quando necessário, você pode passá-lo explicitamente:

```ts
const c = identidade<number>(123);
const lista = new Array<string>();
```

Um exemplo mais útil, que devolve o primeiro item de um array:

```ts
function primeiro<T>(lista: T[]): T | undefined {
  return lista.length > 0 ? lista[0] : undefined;
}

primeiro([10, 20, 30]); // number | undefined
primeiro(["a", "b"]); // string | undefined
primeiro([]); // undefined (T vira never, e never | undefined é undefined)
```

O `| undefined` no retorno é honesto: um array vazio não tem primeiro elemento, e o tipo obriga quem chama a tratar esse caso.

Funções podem ter vários parâmetros de tipo:

```ts
function par<K, V>(chave: K, valor: V): [K, V] {
  return [chave, valor];
}

par("idade", 30); // [string, number]
```

## Interfaces e tipos genéricos

Tipos também podem ser genéricos:

```ts
interface Caixa<T> {
  valor: T;
}

const caixaDeNumero: Caixa<number> = { valor: 10 };
const caixaDeTexto: Caixa<string> = { valor: "dez" };

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

type ResultadoUsuarios = ApiResult<Usuario[]>;
```

Você usa generics o tempo todo, talvez sem perceber: `Array<T>`, `Promise<T>`, `Map<K, V>`, `Set<T>`, `Record<K, V>`. Uma função `async` que devolve um usuário tem retorno `Promise<Usuario>`, ou seja, "uma promessa que vai entregar um `Usuario`" (veja [Programação assíncrona](/labs/web-dev/typescript/12-programacao-assincrona/)).

## Constraints

Um `T` sem restrição pode ser qualquer coisa, então dentro da função você não pode assumir nada sobre ele:

```ts
function obterId<T>(item: T) {
  return item.id; // erro: Property 'id' does not exist on type 'T'.
}
```

Uma _constraint_ (`extends`) limita o que `T` pode ser, e em troca libera o uso do que foi exigido:

```ts
function obterId<T extends { id: string }>(item: T): string {
  return item.id; // ok
}

obterId({ id: "u1", nome: "Ana" }); // ok, tem id
obterId({ nome: "Ana" }); // erro: falta id
```

Uma combinação muito usada é `keyof` com generics. `keyof T` é a união das chaves de `T` (detalhes em [Tipos avançados](/labs/web-dev/typescript/10-tipos-avancados/)), e `T[K]` é o tipo da propriedade `K`:

```ts
function pegar<T, K extends keyof T>(obj: T, chave: K): T[K] {
  return obj[chave];
}

const usuario = { id: 1, nome: "Ana", ativo: true };

pegar(usuario, "nome"); // string
pegar(usuario, "ativo"); // boolean
pegar(usuario, "idade"); // erro: '"idade"' não é uma chave de usuario
```

O retorno acompanha a chave pedida, e chaves inexistentes são barradas. É esse tipo de construção que sustenta os utility types e muitas bibliotecas.

## Defaults de parâmetros de tipo

Assim como parâmetros de função, parâmetros de tipo podem ter valor padrão, o que torna o genérico opcional para quem usa:

```ts
interface Resposta<T = unknown> {
  status: number;
  corpo: T;
}

const r1: Resposta = { status: 204, corpo: null }; // T = unknown
const r2: Resposta<Usuario> = { status: 200, corpo: usuario }; // T = Usuario

type Resultado<T, E = Error> = { ok: true; valor: T } | { ok: false; erro: E };
```

`unknown` é um bom padrão: força quem usa a estreitar o tipo antes de mexer no valor.

## Classes genéricas

Classes também aceitam parâmetros de tipo. Um repositório em memória que funciona para qualquer entidade com `id`:

```ts
class Repositorio<T extends { id: string }> {
  private itens = new Map<string, T>();

  salvar(item: T): void {
    this.itens.set(item.id, item);
  }

  buscar(id: string): T | undefined {
    return this.itens.get(id);
  }

  listar(): T[] {
    return [...this.itens.values()];
  }
}

type Produto = { id: string; nome: string; preco: number };

const produtos = new Repositorio<Produto>();
produtos.salvar({ id: "p1", nome: "Caneca", preco: 39.9 });
produtos.buscar("p1")?.preco; // number | undefined
```

## Quando não usar

Generics são poderosos, e por isso é fácil exagerar. Alguns sinais de que o genérico está sobrando:

- O parâmetro de tipo aparece uma vez só. Em `function tamanho<T extends string>(s: T): number`, o `T` não relaciona nada com nada; `function tamanho(s: string): number` faz o mesmo e é mais simples. Um parâmetro de tipo existe para ligar entradas e saídas (ou entradas entre si).
- A função é genérica "para o futuro", mas hoje só é usada com um tipo.
- Os parâmetros de tipo se multiplicam (`<T, U, V, W>`) e ninguém mais consegue ler a assinatura.

E o erro oposto: usar `T` sem constraint e depois acessar propriedades dele, recorrendo a `as any` para o código compilar. Se a função precisa de `id`, diga isso na constraint (`T extends { id: string }`).

## Referências

- [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) - TypeScript Handbook, en
- [TypeScript para programadores JavaScript](https://www.typescriptlang.org/pt/docs/handbook/typescript-in-5-minutes.html) - typescriptlang.org, pt-BR
- [Keyof Type Operator](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html) - TypeScript Handbook, en
