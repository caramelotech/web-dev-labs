# Padrões que escalam

As notas anteriores apresentaram as ferramentas do sistema de tipos. Esta reúne padrões práticos que combinam essas ferramentas e aparecem com frequência em projetos reais e em entrevistas. A ideia que une todos eles: usar os tipos para tornar estados inválidos impossíveis de representar, e validar tudo que vem de fora logo na entrada.

## Result / Either

Em JavaScript, erros normalmente são exceções. O problema é que exceções são invisíveis na assinatura: olhando `function dividir(a: number, b: number): number`, nada indica que ela pode lançar. O padrão _Result_ (também chamado de _Either_) coloca o sucesso e a falha no tipo de retorno:

```ts
type Result<T, E = Error> = { ok: true; valor: T } | { ok: false; erro: E };

function dividir(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { ok: false, erro: "divisão por zero" };
  }
  return { ok: true, valor: a / b };
}

const r = dividir(10, 2);
if (r.ok) {
  console.log(r.valor); // só acessível depois de checar
} else {
  console.error(r.erro);
}
```

É uma discriminated union (veja [Unions, intersections e literais](/labs/web-dev/typescript/05-unions-intersecoes-e-literais/)), e quem chama é obrigado a tratar a falha para chegar ao valor.

Quando usar cada um? Result funciona bem para erros **esperados** do domínio (validação que falhou, saldo insuficiente, registro não encontrado), que quem chama deve tratar. Exceções continuam adequadas para erros inesperados (banco fora do ar, bug), que normalmente sobem até um tratador genérico. Converter tudo para Result deixa o código verboso sem ganho.

## Branded types

Em muitos sistemas, `UserId` e `OrderId` são ambos `string`. Para o TypeScript, que compara tipos pela estrutura, eles são idênticos, e trocar um pelo outro passa sem aviso:

```ts
function cancelarPedido(pedidoId: string) {}

const idDoUsuario = "u_123";
cancelarPedido(idDoUsuario); // compila, e cancela o pedido errado
```

Um _branded type_ (tipo "com marca") adiciona uma propriedade fantasma que só existe no tipo, tornando os dois incompatíveis:

```ts
declare const marcaUserId: unique symbol;
declare const marcaOrderId: unique symbol;

type UserId = string & { readonly [marcaUserId]: true };
type OrderId = string & { readonly [marcaOrderId]: true };

function cancelarPedido(pedidoId: OrderId) {}

const userId = "u_123" as UserId;
cancelarPedido(userId); // erro: UserId não é atribuível a OrderId
```

O `unique symbol` garante que a marca não colide com nenhuma outra. Em runtime, o valor continua sendo uma string comum: a marca some junto com os tipos.

O `as` acima é a única forma de "carimbar" um valor. Para não espalhar `as` pelo código, concentre-o numa função construtora que valida antes de marcar:

```ts
function toOrderId(valor: string): OrderId {
  if (!/^o_\d+$/.test(valor)) {
    throw new Error(`OrderId inválido: ${valor}`);
  }
  return valor as OrderId;
}

cancelarPedido(toOrderId("o_987")); // ok
```

Agora todo `OrderId` que circula pelo sistema passou pela validação.

## Switch exaustivo com never

A checagem de exaustividade vista em [Unions, intersections e literais](/labs/web-dev/typescript/05-unions-intersecoes-e-literais/) fica mais limpa com uma função auxiliar reutilizável:

```ts
function assertNever(valor: never): never {
  throw new Error(`Caso não tratado: ${JSON.stringify(valor)}`);
}

type Status = "idle" | "loading" | "success" | "error";

function icone(s: Status): string {
  switch (s) {
    case "idle":
      return "⏸️";
    case "loading":
      return "⏳";
    case "success":
      return "✅";
    case "error":
      return "❌";
    default:
      return assertNever(s);
  }
}
```

Ela faz dois trabalhos. Em tempo de compilação, se alguém adicionar `"cancelado"` ao `Status` sem tratar o caso, `assertNever(s)` deixa de compilar, porque `s` não é mais `never`. Em runtime, se um valor inesperado chegar mesmo assim (de uma API, por exemplo), ela lança um erro claro em vez de devolver `undefined` silenciosamente.

## Options object

Funções com muitos parâmetros posicionais são difíceis de ler na chamada: o que significa `criarUsuario("ana@x.com", "Ana", 30, "admin", true)`? Um _options object_ resolve, e os tipos ajudam a separar o obrigatório do opcional:

```ts
type OpcoesUsuario = {
  obrigatorio: { email: string; nome: string };
  opcional?: Partial<{
    idade: number;
    papel: "usuario" | "admin";
    ativo: boolean;
  }>;
};

function criarUsuario({ obrigatorio, opcional = {} }: OpcoesUsuario) {
  const { papel = "usuario", ativo = true, idade } = opcional;
  return { ...obrigatorio, papel, ativo, idade };
}

criarUsuario({
  obrigatorio: { email: "ana@exemplo.com", nome: "Ana" },
  opcional: { papel: "admin" },
});
```

Na forma mais comum, sem o aninhamento, os campos opcionais simplesmente levam `?`:

```ts
type OpcoesConexao = {
  host: string;
  porta?: number;
  timeoutMs?: number;
};

function conectar({ host, porta = 5432, timeoutMs = 3000 }: OpcoesConexao) {
  // porta e timeoutMs são number aqui, graças aos valores padrão
}
```

A chamada fica autoexplicativa, a ordem dos campos não importa, e adicionar uma opção nova não quebra quem já usa a função.

## Validação em runtime com Zod

Os tipos somem em runtime, então nada impede uma API, um formulário ou uma variável de ambiente de entregar dados no formato errado. Escrever type guards à mão para cada formato (como em [Programação assíncrona](/labs/web-dev/typescript/12-programacao-assincrona/)) funciona, mas obriga a manter duas descrições do mesmo dado: o tipo e a validação. Bibliotecas de schema como o **Zod** resolvem isso fazendo do schema a fonte única, e o tipo é inferido dele:

```ts
import { z } from "zod";

const UsuarioSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  nome: z.string().min(1),
  idade: z.number().int().positive().optional(),
});

type Usuario = z.infer<typeof UsuarioSchema>;
// { id: string; email: string; nome: string; idade?: number | undefined }
```

Há duas formas de validar:

```ts
// parse: devolve o dado tipado ou lança um erro
const usuario = UsuarioSchema.parse(json);

// safeParse: devolve um resultado, no estilo do padrão Result
const resultado = UsuarioSchema.safeParse(json);
if (resultado.success) {
  console.log(resultado.data.email); // tipado como Usuario
} else {
  console.error(resultado.error.issues);
}
```

O lugar certo para validar são as **bordas** do sistema, onde dados não confiáveis entram: respostas de APIs externas, corpo de requisições recebidas, formulários, `JSON.parse`, variáveis de ambiente. Depois de validado na entrada, o dado circula pelo resto do código com um tipo em que dá para confiar. É o princípio de "falhar rápido": um dado inválido é barrado logo na entrada, com uma mensagem clara, em vez de causar um erro estranho três camadas depois.

Uma atualização importante: no **Zod 4**, os formatos de string viraram funções de topo, `z.email()`, `z.uuid()`, `z.url()` e assim por diante. A forma antiga, `z.string().email()`, ainda funciona mas está depreciada, e aparece em muito material escrito antes de 2025. Alternativas ao Zod com a mesma ideia incluem Valibot e ArkType.

## satisfies e as const

Há uma tensão comum ao tipar objetos de configuração. Com uma anotação, o TypeScript checa o formato, mas **esquece** os valores específicos:

```ts
const rotas: Record<string, string> = {
  home: "/",
  sobre: "/sobre",
};

rotas.home; // string (o valor "/" se perdeu)
rotas.contato; // string, sem erro, mesmo não existindo
```

Sem anotação, os valores são preservados, mas nada é checado. O operador `satisfies` (TypeScript 4.9) resolve as duas coisas: ele **verifica** se o valor é compatível com o tipo, mas **mantém** o tipo inferido. Combinado com `as const`, os literais também são preservados:

```ts
const rotas = {
  home: "/",
  sobre: "/sobre",
  painel: "/painel",
} as const satisfies Record<string, `/${string}`>;

rotas.home; // "/"
rotas.contato; // erro: Property 'contato' does not exist
```

O template literal type `` `/${string}` `` (veja [Tipos avançados](/labs/web-dev/typescript/10-tipos-avancados/)) exige que toda rota comece com `/`: escrever `painel: "painel"` vira erro de compilação. E as chaves continuam conhecidas, então o editor autocompleta `rotas.` com as rotas reais.

Comparando as três formas de dar um tipo a um valor:

| Forma                         | Checa compatibilidade?                   | Tipo resultante          |
| ----------------------------- | ---------------------------------------- | ------------------------ |
| `const x: T = valor`          | Sim                                      | `T` (perde detalhes)     |
| `const x = valor as T`        | Quase nada (só se os tipos se sobrepõem) | `T` (pode ser mentira)   |
| `const x = valor satisfies T` | Sim                                      | O tipo inferido do valor |

Para objetos de configuração, tabelas de lookup e mapas de rotas, `satisfies` costuma ser a melhor escolha.

## Referências

- [Narrowing - Discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) - TypeScript Handbook, en
- [TypeScript 4.9 - satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html) - TypeScript, en
- [Zod](https://zod.dev/) - Zod, en
- [Zod - Defining schemas](https://zod.dev/api) - Zod, en
