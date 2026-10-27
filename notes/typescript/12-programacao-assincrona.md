# Programação assíncrona

## Promise<T>

Em TypeScript, uma Promise carrega no tipo o valor que ela vai entregar: `Promise<Usuario>` é "uma promessa de um `Usuario` no futuro". O tipo do sucesso fica explícito na assinatura da função.

```ts
type Usuario = { id: string; nome: string; email: string };

async function carregar(): Promise<Usuario> {
  return { id: "1", nome: "Ana", email: "ana@exemplo.com" };
}
```

Uma função `async` **sempre** retorna uma Promise, mesmo quando o `return` devolve um valor comum. Por isso o retorno anotado é `Promise<Usuario>`, e não `Usuario`:

```ts
async function numero(): number {
  // erro: The return type of an async function or method must be the global Promise<T> type.
  return 1;
}
```

O `await` faz o caminho inverso: desembrulha `Promise<T>` em `T`.

```ts
async function main() {
  const usuario = await carregar(); // usuario: Usuario
  console.log(usuario.nome);

  const promessa = carregar(); // promessa: Promise<Usuario>
  promessa.nome; // erro: Property 'nome' does not exist on type 'Promise<Usuario>'.
}
```

Esse último erro é útil: esquecer o `await` é um bug comum, e o tipo `Promise<...>` denuncia o problema.

## Tratamento de erros

Em JavaScript, qualquer coisa pode ser lançada com `throw`: um `Error`, uma string, um número, `undefined`. Por isso o TypeScript não tem como garantir o tipo do que chega no `catch`. Com `strict` (opção `useUnknownInCatchVariables`, do TypeScript 4.4), a variável do `catch` é `unknown`, e você precisa estreitar antes de usar:

```ts
async function executar() {
  try {
    const dados = await carregar();
    console.log(dados);
  } catch (err) {
    // err: unknown
    if (err instanceof Error) {
      console.error(err.message); // ok, err: Error
    } else {
      console.error("Erro desconhecido", err);
    }
  }
}
```

Também é possível escrever `catch (err: unknown)` explicitamente (permitido desde o TypeScript 4.0), útil em projetos sem `strict`. O que **não** é permitido é anotar `catch (err: Error)`, justamente porque nada garante que o lançado seja um `Error`.

Assumir que o erro é um `Error` (com `as Error`, por exemplo) funciona até o dia em que uma biblioteca lança uma string ou um objeto, e aí `err.message` vira `undefined` no seu log, escondendo o problema real.

## Promise.all, allSettled e race

`Promise.all` espera várias Promises em paralelo, e o TypeScript tipa o resultado como uma tupla, preservando o tipo de cada posição:

```ts
async function painel() {
  const [usuario, pedidos] = await Promise.all([
    buscarUsuario("1"), // Promise<Usuario>
    buscarPedidos("1"), // Promise<Pedido[]>
  ]);
  // usuario: Usuario, pedidos: Pedido[]
}
```

Se qualquer uma falhar, `Promise.all` rejeita inteiro. Quando você quer o resultado de todas, mesmo com falhas, usa `Promise.allSettled`, que devolve um array de `PromiseSettledResult<T>`. Esse tipo é uma discriminated union pelo campo `status`:

```ts
const resultados = await Promise.allSettled([
  buscarUsuario("1"),
  buscarUsuario("2"),
]);

for (const r of resultados) {
  if (r.status === "fulfilled") {
    console.log(r.value.nome); // r.value: Usuario
  } else {
    console.error(r.reason); // r.reason: any
  }
}
```

O `reason` é `any` pelo mesmo motivo do `catch`: qualquer coisa pode ter sido lançada. Trate-o como `unknown`.

`Promise.race` resolve com a primeira Promise que terminar, e o tipo resultante é a união dos tipos possíveis:

```ts
const timeout = new Promise<never>((_, rejeitar) =>
  setTimeout(() => rejeitar(new Error("timeout")), 5000),
);

const usuario = await Promise.race([buscarUsuario("1"), timeout]); // Usuario
```

Como a Promise de timeout nunca resolve com sucesso, ela é `Promise<never>`, e `Usuario | never` é simplesmente `Usuario`.

## Tipando dados externos (fetch)

Aqui está o ponto em que mais código TypeScript mente. O `res.json()` do `fetch` retorna `Promise<any>`, e é muito tentador fazer:

```ts
const usuario = (await res.json()) as Usuario; // perigoso
```

Isso compila, mas o TypeScript não verificou nada. Lembre que os tipos somem em runtime ([Introdução e configuração](/labs/web-dev/typescript/01-introducao-e-configuracao/)): se a API mudar um campo, mandar `null` ou devolver uma página de erro, o código segue confiando num formato que não existe, e o erro estoura longe dali, difícil de rastrear.

O caminho seguro é tratar dados externos como `unknown` e **validar** antes de usar:

```ts
function isUsuario(x: unknown): x is Usuario {
  return (
    typeof x === "object" &&
    x !== null &&
    "id" in x &&
    typeof x.id === "string" &&
    "nome" in x &&
    typeof x.nome === "string" &&
    "email" in x &&
    typeof x.email === "string"
  );
}

function parseUsuario(entrada: unknown): Usuario {
  if (isUsuario(entrada)) return entrada;
  throw new Error("Resposta inválida: não é um Usuario");
}

async function buscarUsuario(id: string): Promise<Usuario> {
  const res = await fetch(`/api/usuarios/${id}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json: unknown = await res.json(); // trata como unknown
  return parseUsuario(json); // validado em runtime
}
```

O `isUsuario` é um type guard, explicado em [Narrowing e type guards](/labs/web-dev/typescript/06-narrowing-e-type-guards/). Escrever esses guards à mão para objetos grandes cansa, e por isso é comum usar uma biblioteca de schema como o Zod, em que você descreve o formato uma vez e ganha a validação e o tipo juntos - veja [Padrões que escalam](/labs/web-dev/typescript/15-padroes-que-escalam/).

## Promise<void> vs Promise<undefined>

Os dois parecem iguais, mas comunicam intenções diferentes:

```ts
async function salvar(): Promise<void> {
  // faz o trabalho e não devolve nada que importe
}

async function talvez(): Promise<undefined> {
  return undefined; // undefined é um valor que quem chama vai receber
}
```

`Promise<void>` diz "vou terminar, mas não tenho nada para entregar". `Promise<undefined>` diz "vou entregar o valor `undefined`". Na dúvida, quando a função não tem resultado, use `Promise<void>`.

## Erros comuns

`Promise<any>` como tipo de retorno joga fora toda a segurança de quem chama. Se o formato é desconhecido, use `Promise<unknown>` e valide.

O outro erro clássico é a _floating promise_: chamar uma função assíncrona sem `await`, sem `.then`/`.catch` e sem guardar a Promise.

```ts
async function aoClicar() {
  salvar(); // sem await: se falhar, o erro some (ou vira unhandled rejection)
  fechar(); // e isto roda antes de salvar terminar
}
```

O compilador não acusa isso, porque chamar uma função e ignorar o retorno é válido. Quem pega esse bug é o lint, com a regra `no-floating-promises` do typescript-eslint, apresentada em [tsconfig e qualidade de projeto](/labs/web-dev/typescript/14-tsconfig-e-qualidade/).

Se você trabalha com React, o uso de Promises com `Suspense` e `use()` está em [Data fetching com Suspense e use()](/labs/web-dev/frontend-avancado/01-data-fetching-com-suspense-e-use/).

## Referências

- [Promise](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Promise) - MDN, pt-BR
- [Usando Fetch](https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API/Using_Fetch) - MDN, pt-BR
- [Promise.allSettled()](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) - MDN, pt-BR
- [TypeScript 4.4 - useUnknownInCatchVariables](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html) - TypeScript, en
