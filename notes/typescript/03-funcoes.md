# Funções

## Parâmetros e retorno

Em uma função, cada parâmetro recebe um tipo, e o retorno é anotado depois dos parênteses:

```ts
function somar(a: number, b: number): number {
  return a + b;
}

somar(2, 3); // ok
somar(2, "3"); // erro: Argument of type 'string' is not assignable to parameter of type 'number'.
somar(2); // erro: Expected 2 arguments, but got 1.
```

Arrow functions seguem a mesma ideia:

```ts
const dobrar = (n: number): number => n * 2;
```

O tipo de retorno pode ser inferido. `somar` sem o `: number` continuaria retornando `number`. Então quando anotar? Em funções internas e pequenas, deixar inferir está ótimo. Em funções exportadas, que outras partes do código (ou outros times) usam, anotar o retorno compensa:

- a assinatura vira documentação legível sem abrir o corpo da função;
- o contrato fica estável: se alguém mudar a implementação e, sem querer, o retorno mudar de tipo, o erro aparece dentro da função, e não espalhado por quem a chama;
- em projetos grandes, retornos explícitos deixam a checagem de tipos mais rápida.

Pense na assinatura de uma função como um contrato com quem a chama, e o compilador como o fiscal desse contrato.

## Parâmetros opcionais, padrão e rest

Um `?` torna o parâmetro opcional. Dentro da função, o tipo dele passa a incluir `undefined`:

```ts
function saudar(nome?: string, msg: string = "Olá") {
  return `${msg}, ${nome ?? "amigo"}!`;
}

saudar(); // "Olá, amigo!"
saudar("Ana"); // "Olá, Ana!"
saudar("Ana", "Oi"); // "Oi, Ana!"
```

Repare em duas coisas. Parâmetros com valor padrão (`msg = "Olá"`) já são opcionais e têm o tipo inferido pelo valor. E o operador `??` (_nullish coalescing_) devolve o lado direito só quando o esquerdo é `null` ou `undefined` - diferente do `||`, que também troca `""` e `0`.

Parâmetros opcionais precisam vir depois dos obrigatórios.

_Rest parameters_ recebem um número variável de argumentos como um array:

```ts
function somarTodos(...numeros: number[]): number {
  return numeros.reduce((acc, n) => acc + n, 0);
}

somarTodos(1, 2, 3, 4); // 10
```

## Tipos de função

Funções também são valores, então também têm tipo. A sintaxe parece uma arrow function:

```ts
type Formatador = (valor: number) => string;

const emReais: Formatador = (v) => `R$ ${v.toFixed(2)}`;
```

Repare que `v` não precisou de anotação: o TypeScript sabe, pelo tipo `Formatador`, que ele é `number`. Isso se chama _contextual typing_ e é o que faz callbacks ficarem tipados sem esforço:

```ts
[1, 2, 3].map((n) => n.toFixed(1)); // n: number, inferido pelo array

function aplicar(valores: number[], fn: (n: number) => number): number[] {
  return valores.map(fn);
}
```

Quando um objeto precisa ser chamável e também ter propriedades, usa-se uma _call signature_ dentro de um tipo de objeto:

```ts
type Validador = {
  (valor: string): boolean; // pode ser chamado como função
  descricao: string; // e tem uma propriedade
};
```

## void, undefined e never no retorno

Os três parecem "nada", mas significam coisas diferentes:

| Retorno     | Significado                               |
| ----------- | ----------------------------------------- |
| `void`      | "não use o resultado desta função"        |
| `undefined` | "esta função devolve o valor `undefined`" |
| `never`     | "esta função nunca termina normalmente"   |

```ts
function registrar(msg: string): void {
  console.log(msg);
}

function buscarCache(chave: string): string | undefined {
  return undefined; // um valor de verdade, que quem chama vai checar
}

function erroFatal(msg: string): never {
  throw new Error(msg);
}
```

O `void` tem um comportamento que confunde: um _tipo de função_ com retorno `void` aceita funções que retornam algo. É por isso que `[1, 2].forEach((n) => lista.push(n))` funciona, mesmo `push` retornando um número - o `forEach` só promete que vai ignorar o retorno.

O `never` ajuda o _control flow analysis_. Depois de uma chamada a uma função que retorna `never`, o TypeScript sabe que o código seguinte é inalcançável naquele caminho:

```ts
function obterPorta(valor: string | undefined): number {
  if (valor === undefined) {
    erroFatal("PORTA não definida");
  }
  return Number(valor); // aqui valor já é string
}
```

## Overloads

_Overloads_ (sobrecargas) descrevem uma função que aceita combinações diferentes de argumentos, com retornos diferentes para cada uma. Você escreve várias assinaturas e uma única implementação compatível com todas:

```ts
function formatar(valor: number): string;
function formatar(valor: Date): string;
function formatar(valor: string[]): string;
function formatar(valor: number | Date | string[]): string {
  if (typeof valor === "number") return valor.toFixed(2);
  if (valor instanceof Date) return valor.toISOString();
  return valor.join(", ");
}

formatar(10); // ok
formatar(new Date()); // ok
formatar(true); // erro: No overload matches this call.
```

A assinatura da implementação (a última) não é visível para quem chama; só as de cima contam.

Overloads valem a pena quando o tipo do retorno depende do tipo do argumento de um jeito que não dá para expressar de outra forma. Se todas as variantes retornam a mesma coisa, como no exemplo acima, uma única assinatura com union (`valor: number | Date | string[]`) resolve com menos código. Se o retorno simplesmente acompanha o tipo da entrada, generics costumam ser a solução mais limpa.

## Funções genéricas (prévia)

E se você quiser escrever uma função `map` que funcione para qualquer tipo de array, sem perder a informação de tipo? É o que generics fazem:

```ts
function map<T, U>(lista: T[], fn: (item: T, indice: number) => U): U[] {
  const saida: U[] = [];
  for (let i = 0; i < lista.length; i++) {
    saida.push(fn(lista[i]!, i));
  }
  return saida;
}

const dobrados = map([1, 2, 3], (n) => n * 2); // number[]
const tamanhos = map(["a", "bb"], (s) => s.length); // number[]
const maiusculas = map(["a", "bb"], (s) => s.toUpperCase()); // string[]
```

`T` e `U` são parâmetros de tipo, preenchidos automaticamente a cada chamada. O `!` depois de `lista[i]` diz ao compilador que o valor existe (necessário com `noUncheckedIndexedAccess`, já que o laço garante o índice válido). O assunto continua em [Generics](/labs/web-dev/typescript/08-generics/).

## Erros comuns

Parâmetro sem tipo vira `any` implícito quando o `strict` está desligado, e aí qualquer coisa passa:

```ts
// com strict: false
function processar(x) {
  // x: any, sem aviso nenhum
  return x.toUpperCase(); // quebra se receber um número
}
```

Com `strict` (mais precisamente, `noImplicitAny`) isso vira erro, que é exatamente o que você quer.

Outro erro comum é anotar `void` numa função que deveria devolver um valor, e depois tentar usar esse valor:

```ts
function obterId(): void {
  return "id_123"; // erro: Type 'string' is not assignable to type 'void'.
}
```

Se a função tem algo útil para devolver, o retorno é o tipo desse algo, não `void`.

## Referências

- [More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html) - TypeScript Handbook, en
- [TypeScript para programadores JavaScript](https://www.typescriptlang.org/pt/docs/handbook/typescript-in-5-minutes.html) - typescriptlang.org, pt-BR
- [Funções de seta](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Functions/Arrow_functions) - MDN, pt-BR
