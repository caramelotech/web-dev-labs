# Módulos e declarações

## ES modules no TypeScript

O TypeScript usa a sintaxe de módulos padrão do JavaScript (ES modules). Cada arquivo com `import` ou `export` é um módulo, com seu próprio escopo:

```ts
// src/types/usuario.ts
export interface Usuario {
  id: string;
  nome: string;
}

// src/services/usuario.ts
import type { Usuario } from "../types/usuario.js";

export const API_URL = "https://api.exemplo.com";

export async function buscarUsuario(id: string): Promise<Usuario> {
  const res = await fetch(`${API_URL}/usuarios/${id}`);
  return res.json();
}

export default buscarUsuario;
```

```ts
// src/index.ts
import buscar, { API_URL, buscarUsuario } from "./services/usuario.js";
```

Tipos e interfaces podem ser exportados e importados como qualquer valor.

Prefira **exports nomeados** a `export default`. Com nomes, o editor autocompleta e refatora com segurança, e todo mundo importa a coisa pelo mesmo nome. Com `default`, cada arquivo pode dar um nome diferente para o mesmo import (`import buscar`, `import getUser`, `import fn`), o que dificulta buscas no código.

## import type e verbatimModuleSyntax

`import type` importa **só o tipo**, e a linha inteira é apagada na saída JavaScript:

```ts
import type { Usuario } from "./types/usuario.js";
import { type Pedido, calcularTotal } from "./pedido.js"; // misto: só Pedido é apagado
```

Por que isso importa? Ferramentas como esbuild, SWC, Vite e o type stripping do Node.js compilam **um arquivo de cada vez**, sem olhar os outros. Olhando só `import { Usuario } from "./x"`, elas não têm como saber se `Usuario` é um tipo (pode ser apagado) ou um valor (precisa ficar). O `import type` torna isso explícito.

Duas opções do tsconfig garantem que o código funciona nesse cenário:

- `isolatedModules` acusa construções que dependem de informação de outros arquivos para compilar.
- `verbatimModuleSyntax` adota uma regra simples: imports sem `type` ficam na saída, imports com `type` somem. Se você importar um tipo sem `type`, é erro.

As duas vêm ligadas no tsconfig gerado pelo `tsc --init` atual. Na prática, isso significa marcar com `type` todo import que só traz tipos.

## Resolução de módulos

_Module resolution_ é como o compilador descobre qual arquivo corresponde a `import ... from "algo"`. As opções `module` e `moduleResolution` precisam refletir quem vai de fato carregar o código:

| Cenário                                  | Configuração                                            |
| ---------------------------------------- | ------------------------------------------------------- |
| Código rodado pelo Node.js               | `"module": "nodenext"` (o `moduleResolution` acompanha) |
| App com bundler (Vite, webpack, esbuild) | `"module": "esnext"`, `"moduleResolution": "bundler"`   |

Com `nodenext`, o TypeScript segue as regras reais do Node, incluindo duas que pegam iniciantes:

- imports relativos precisam de extensão, e a extensão é `.js` mesmo no arquivo `.ts` (`import { x } from "./util.js"`), porque é o caminho que existirá depois de compilar. Com a opção `rewriteRelativeImportExtensions` dá para escrever `.ts`;
- o campo `"type": "module"` do `package.json` decide se os arquivos são ES modules ou CommonJS, e o campo `exports` de cada pacote decide o que pode ser importado dele.

Com `bundler`, as regras são mais flexíveis (extensões opcionais), porque quem resolve é o bundler.

Material antigo costuma recomendar `"moduleResolution": "node"`. Essa opção (hoje chamada `node10`) imita o Node.js de 2015, ignora o campo `exports` e foi depreciada no TypeScript 6.0. Use `nodenext` ou `bundler`.

## Arquivos de declaração (.d.ts)

Um arquivo `.d.ts` contém **só tipos**, sem implementação. Ele descreve o formato de código JavaScript para o TypeScript:

```ts
// util.d.ts
export declare function formatarMoeda(valor: number, moeda?: string): string;
export declare const VERSAO: string;
```

Existem três origens comuns:

1. **Gerados pelo seu projeto**: com `"declaration": true`, o `tsc` gera um `.d.ts` ao lado de cada `.js`. É assim que bibliotecas escritas em TS entregam seus tipos.
2. **Embutidos no pacote**: muitas bibliotecas já publicam seus `.d.ts`. Basta instalar e importar.
3. **DefinitelyTyped**: para bibliotecas JavaScript que não trazem tipos, a comunidade mantém os tipos no repositório DefinitelyTyped, publicados como pacotes `@types/*`:

```bash
npm i express
npm i -D @types/express
```

Os tipos do próprio Node.js também vêm daí (`@types/node`). Desde o TypeScript 6.0, a opção `types` do tsconfig é `[]` por padrão, então os pacotes globais (os que adicionam coisas como `process` ou `describe` ao escopo global) precisam ser listados:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

Pacotes importados explicitamente (`import express from "express"`) continuam encontrando seus `@types` normalmente.

## Ambient modules (declare module)

Quando uma biblioteca não tem tipos nem em `@types`, você pode escrever os seus com `declare module`. É uma _ambient declaration_: declara que algo existe, sem implementar:

```ts
// src/types/lib-legada.d.ts
declare module "lib-legada" {
  export function processar(entrada: string): number;
  export const versao: string;
}
```

Para começar rápido, `declare module "lib-legada";` sozinho já tira o erro, tipando tudo como `any`. É um paliativo; vale escrever os tipos de verdade aos poucos.

O mesmo mecanismo resolve imports de arquivos que não são código, comuns em projetos front-end:

```ts
// src/types/assets.d.ts
declare module "*.svg" {
  const url: string;
  export default url;
}

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
```

(Ferramentas como Vite já trazem essas declarações prontas.)

Para adicionar algo ao escopo global, usa-se `declare global` dentro de um módulo:

```ts
// src/types/global.d.ts
export {};

declare global {
  interface Window {
    analytics?: { track(evento: string): void };
  }
}
```

Isso funciona graças ao _declaration merging_ de interfaces, visto em [Interfaces e type aliases](/labs/web-dev/typescript/04-interfaces-e-type-aliases/).

## Namespaces

Antes dos ES modules existirem, o TypeScript organizava código com `namespace` (que já foi chamado de "módulo interno"):

```ts
namespace Validacao {
  export function email(valor: string) {
    return valor.includes("@");
  }
}

Validacao.email("a@b.com");
```

Hoje, namespaces são considerados legado. ES modules fazem o mesmo trabalho com melhor suporte de ferramentas (tree-shaking, imports explícitos). Além disso, um `namespace` com código gera JavaScript e por isso não roda com o type stripping do Node.js. No TypeScript 6.0, declarar namespace com a palavra-chave antiga `module Nome { }` virou erro.

Você ainda vai encontrar namespaces em arquivos `.d.ts` de bibliotecas antigas e em declarações globais. Em código novo de aplicação, use módulos.

## Organização de projeto

Um padrão comum é ter um _barrel file_, um `index.ts` que reexporta a API pública de uma pasta:

```ts
// src/index.ts
export * from "./types/usuario.js";
export * from "./services/usuario.js";
export { formatarData } from "./utils/datas.js";
```

```text
src/
├── types/usuario.ts
├── services/usuario.ts
├── utils/datas.ts
└── index.ts   ← API pública
```

Num pacote publicado, isso define com clareza o que é público e o que é interno. Dentro de uma aplicação, barrels grandes cobram um preço: importar uma coisa do barrel pode carregar todos os módulos que ele reexporta, deixando builds, testes e o servidor de desenvolvimento mais lentos, e facilitam dependências circulares. Mantenha barrels pequenos e intencionais, e evite cadeias de barrels reexportando outros barrels.

Para evitar imports relativos longos (`../../../utils/datas`), dá para configurar aliases com `paths`:

```json
{
  "compilerOptions": {
    "paths": {
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

O `paths` só ensina o **TypeScript** a resolver o alias; quem executa o código (bundler, Node, test runner) também precisa conhecê-lo. Bundlers como o Vite têm configuração própria ou plugins para isso, e no Node.js a alternativa nativa é o campo `imports` do `package.json` (aliases que começam com `#`). Material antigo pede `baseUrl` junto com `paths`; ele foi depreciado no TypeScript 6.0 e não é mais necessário.

## Referências

- [Modules - Theory](https://www.typescriptlang.org/docs/handbook/modules/theory.html) - TypeScript Handbook, en
- [Choosing Compiler Options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html) - TypeScript Handbook, en
- [Arquivos de declaração - Introdução](https://www.typescriptlang.org/pt/docs/handbook/declaration-files/introduction.html) - typescriptlang.org, pt-BR
- [Namespaces e Módulos](https://www.typescriptlang.org/pt/docs/handbook/namespaces-and-modules.html) - typescriptlang.org, pt-BR
- [Módulos JavaScript](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Modules) - MDN, pt-BR
