# Utility types

## O que são utility types

_Utility types_ são tipos genéricos que já vêm com o TypeScript e transformam um tipo existente em outro. Em vez de escrever à mão "o mesmo `Usuario`, mas com tudo opcional", você escreve `Partial<Usuario>`.

O ganho é ter uma fonte única de verdade. Se o `Usuario` ganhar um campo amanhã, todos os tipos derivados dele acompanham automaticamente, sem ninguém precisar lembrar de atualizar cópias.

Os exemplos desta nota usam este tipo base:

```ts
type Usuario = {
  id: number;
  nome: string;
  email: string;
  bio?: string;
};
```

## Partial, Required e Readonly

`Partial<T>` torna todas as propriedades opcionais. O caso de uso clássico é uma atualização parcial (um `PATCH`), em que o cliente manda só os campos que mudaram:

```ts
type AtualizacaoUsuario = Partial<Usuario>;
// { id?: number; nome?: string; email?: string; bio?: string }

function atualizar(id: number, mudancas: Partial<Usuario>) {
  // ...
}

atualizar(1, { nome: "Ana Paula" }); // ok, só o nome
```

Rascunhos de formulário, preenchidos aos poucos, são outro uso comum.

`Required<T>` faz o contrário, removendo os `?`:

```ts
type UsuarioCompleto = Required<Usuario>;
// bio deixa de ser opcional
```

`Readonly<T>` marca todas as propriedades como `readonly`:

```ts
const congelado: Readonly<Usuario> = { id: 1, nome: "Ana", email: "a@x.com" };
congelado.nome = "Bia"; // erro: Cannot assign to 'nome' because it is a read-only property.
```

O `Readonly` é raso: objetos aninhados continuam alteráveis. E, como todo tipo, não tem efeito em runtime.

## Pick e Omit

`Pick<T, K>` cria um tipo só com as chaves escolhidas. `Omit<T, K>` cria um tipo com tudo, menos as chaves indicadas:

```ts
type ResumoUsuario = Pick<Usuario, "id" | "nome">;
// { id: number; nome: string }

type UsuarioPublico = Omit<Usuario, "email">;
// { id: number; nome: string; bio?: string }
```

Os dois chegam a resultados parecidos por caminhos opostos. Use `Pick` quando você quer uma fatia pequena e bem definida ("só preciso disso"); use `Omit` quando quer quase tudo ("tudo menos isso").

Os dois preservam os modificadores originais: uma propriedade opcional ou `readonly` no tipo base continua assim no resultado. `Pick<Usuario, "id" | "bio">` dá `{ id: number; bio?: string }`.

Uma diferença sutil: `Pick` só aceita chaves que existem em `T` (erro de digitação vira erro de compilação), mas `Omit` aceita qualquer string. `Omit<Usuario, "emial">` compila sem reclamar e não remove nada.

## Record

`Record<K, V>` constrói um tipo de objeto com chaves `K` e valores `V`. Com uma union de literais como chave, ele obriga a ter **todas** as chaves:

```ts
type Papel = "admin" | "editor" | "leitor";

const permissoes: Record<Papel, boolean> = {
  admin: true,
  editor: true,
  leitor: false,
}; // esquecer um papel é erro de compilação
```

Com `string` como chave, ele vira um dicionário livre:

```ts
const cachePorId: Record<string, Usuario> = {};
```

## Exclude, Extract e NonNullable

Esses três operam sobre **unions**, filtrando membros:

```ts
type Evento = "click" | "hover" | "focus";

type SemHover = Exclude<Evento, "hover">; // "click" | "focus"
type SoTeclado = Extract<Evento, "focus" | "keydown">; // "focus"

type Talvez = string | null | undefined;
type Certo = NonNullable<Talvez>; // string
```

`Exclude<T, U>` remove de `T` o que é atribuível a `U`; `Extract<T, U>` mantém só o que é atribuível a `U`; `NonNullable<T>` remove `null` e `undefined`. Não confunda `Exclude` (para unions) com `Omit` (para propriedades de objetos).

## ReturnType, Parameters e Awaited

Às vezes o tipo que você quer já está "dentro" de uma função existente. Esses utilitários o extraem. Como eles recebem um **tipo** de função, é preciso usar `typeof` para obter o tipo a partir da função:

```ts
function criarUsuario(nome: string, admin: boolean) {
  return { id: Date.now(), nome, admin };
}

type NovoUsuario = ReturnType<typeof criarUsuario>;
// { id: number; nome: string; admin: boolean }

type ArgsCriar = Parameters<typeof criarUsuario>;
// [nome: string, admin: boolean]
```

É útil quando uma biblioteca exporta a função mas não o tipo do que ela retorna.

`Awaited<T>` desembrulha o tipo de uma Promise, inclusive Promises aninhadas:

```ts
async function buscarUsuario() {
  return { id: 1, nome: "Ada" };
}

type R = ReturnType<typeof buscarUsuario>; // Promise<{ id: number; nome: string }>
type U = Awaited<R>; // { id: number; nome: string }
```

## Combinando utilitários

Utility types são compostos como funções. Alguns padrões frequentes numa API:

```ts
type Usuario = {
  id: number;
  nome: string;
  email: string;
  criadoEm: Date;
};

// criação: o cliente não manda id nem criadoEm
type CriarUsuarioDTO = Omit<Usuario, "id" | "criadoEm">;

// atualização: qualquer subconjunto dos campos editáveis
type AtualizarUsuarioDTO = Partial<CriarUsuarioDTO>;

// resposta pública, sem e-mail
type UsuarioResposta = Omit<Usuario, "email">;
```

Em componentes, é comum partir das props de um componente base e ajustar:

```ts
type BotaoProps = {
  texto: string;
  variante: "primario" | "secundario";
  onClick: () => void;
};

// botão de perigo: variante fixa, o resto igual
type BotaoPerigoProps = Omit<BotaoProps, "variante">;
```

Todos esses utilitários são construídos com mapped types e conditional types, que você pode usar para criar os seus próprios. É o assunto de [Tipos avançados](/labs/web-dev/typescript/10-tipos-avancados/).

## Referências

- [Tipos Utilitários](https://www.typescriptlang.org/pt/docs/handbook/utility-types.html) - typescriptlang.org, pt-BR
- [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) - TypeScript Handbook, en
