# tsconfig e qualidade de projeto

## O tsconfig como painel de controle

O `tsconfig.json` decide duas coisas: **quão rigorosa** é a checagem de tipos e **como** o projeto é compilado. As configurações básicas foram vistas em [Introdução e configuração](/labs/web-dev/typescript/01-introducao-e-configuracao/); aqui o foco é o que separa um projeto bem configurado de um que deixa bugs passarem.

A estrutura tem três partes principais:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "strict": true
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

- `compilerOptions`: as opções do compilador;
- `include`/`exclude`: quais arquivos fazem parte do projeto;
- `extends`: herda de outro tsconfig. É a forma de compartilhar uma configuração base entre vários pacotes, ou de partir de uma configuração pronta como as do projeto `@tsconfig/bases` (ex.: `@tsconfig/node22`).

A recomendação geral é manter o arquivo enxuto e explícito: cada opção ali deveria ter um motivo.

## Opções de checagem

`strict: true` é o ponto de partida inegociável (e o padrão desde o TypeScript 6.0). Ele liga `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `useUnknownInCatchVariables`, `alwaysStrict` e `noImplicitThis`.

De todas, `strictNullChecks` é a que mais evita bugs reais. Sem ela, `null` e `undefined` cabem em qualquer tipo, e o compilador deixa você chamar `usuario.nome` num `usuario` que pode ser `null` - exatamente o erro "Cannot read properties of null" que mais aparece em produção. Com ela, cada valor possivelmente ausente precisa ser tratado.

Algumas opções fora do `strict` também valem a pena:

| Opção                        | O que faz                                                     |
| ---------------------------- | ------------------------------------------------------------- |
| `noUncheckedIndexedAccess`   | `lista[i]` e `obj[chave]` passam a incluir `\| undefined`     |
| `exactOptionalPropertyTypes` | `prop?: string` não aceita receber `undefined` explicitamente |
| `noImplicitReturns`          | Todos os caminhos de uma função com retorno precisam retornar |
| `noFallthroughCasesInSwitch` | Proíbe `case` que "cai" no próximo sem `break`/`return`       |
| `noImplicitOverride`         | Exige a palavra `override` ao sobrescrever métodos            |

`noUncheckedIndexedAccess` é a mais impactante: ela pega o caso de acessar `lista[0]` numa lista vazia. Em código existente, ligá-la gera muitos erros de uma vez, então é mais fácil adotá-la desde o início do projeto.

## Ambiente e módulos

Estas opções descrevem **onde** o código vai rodar:

- `target`: a versão de JavaScript emitida. Recursos mais novos que o `target` são reescritos (quando possível) para versões antigas.
- `lib`: quais APIs existem no ambiente (`es2023`, `dom`...). Usar `Array.prototype.findLast` com uma `lib` antiga dá erro de tipo, mesmo que o runtime suporte.
- `module` e `moduleResolution`: como imports e exports são resolvidos (detalhes em [Módulos e declarações](/labs/web-dev/typescript/11-modulos-e-declaracoes/)).
- `types`: quais pacotes `@types` globais são carregados. Vazio por padrão desde o TypeScript 6.0.

Duas combinações cobrem a maioria dos projetos.

Uma API ou script rodando no Node.js, compilada pelo `tsc`:

```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "nodenext",
    "types": ["node"],
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Uma aplicação front-end em que o bundler (Vite, por exemplo) gera o JavaScript e o `tsc` só checa os tipos:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["es2022", "dom", "dom.iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

## Opções de interoperabilidade e build

`skipLibCheck: true` pula a checagem dos arquivos `.d.ts` (os de `node_modules` incluídos). Deixa o build bem mais rápido e evita erros causados por conflitos entre versões de tipos de bibliotecas que você não controla. O seu código continua sendo checado normalmente contra esses tipos. É seguro na grande maioria dos projetos.

`forceConsistentCasingInFileNames` acusa imports com maiúsculas/minúsculas diferentes do nome real do arquivo. No Windows e no macOS, `import "./Usuario"` encontra `usuario.ts`; no Linux da CI ou do servidor, não. É o clássico "funciona na minha máquina". Essa opção já é ligada por padrão.

`isolatedModules`, `verbatimModuleSyntax` e `erasableSyntaxOnly` garantem que cada arquivo pode ser transformado sozinho por ferramentas que não fazem checagem de tipos (esbuild, SWC, Vite, Babel, o type stripping do Node.js):

- `isolatedModules` acusa construções que exigem informação de outros arquivos;
- `verbatimModuleSyntax` exige `import type` para imports que só trazem tipos;
- `erasableSyntaxOnly` proíbe sintaxe que gera código (`enum`, parameter properties, `namespace` com código).

`paths` cria aliases de import (`"@utils/*": ["./src/utils/*"]`). Não precisa mais de `baseUrl`, que foi depreciado no TypeScript 6.0.

`noEmit: true` faz o `tsc` apenas checar os tipos, sem gerar arquivos. É o modo certo quando outra ferramenta é responsável por produzir o JavaScript.

## Project references e monorepos

Num monorepo com vários pacotes que dependem uns dos outros, compilar tudo como um único projeto fica lento e mistura as fronteiras entre pacotes. _Project references_ dividem o código em projetos TypeScript menores:

```text
apps/web          → depende de packages/ui e packages/utils
packages/ui       → depende de packages/utils
packages/utils
```

Cada pacote tem seu `tsconfig.json` com `"composite": true` (exigido para ser referenciado), e quem depende declara a referência:

```json
// apps/web/tsconfig.json
{
  "compilerOptions": { "composite": true, "outDir": "dist" },
  "references": [
    { "path": "../../packages/ui" },
    { "path": "../../packages/utils" }
  ]
}
```

Com `tsc -b` (_build mode_), o compilador monta o grafo de dependências, compila na ordem certa e recompila só o que mudou (build incremental). O editor também fica mais rápido, porque trabalha com um projeto menor de cada vez.

## Lint com typescript-eslint

O compilador verifica se os tipos batem; o linter verifica padrões de código problemáticos. Um não substitui o outro. O typescript-eslint é a ponte entre ESLint e TypeScript:

```bash
npm i -D eslint @eslint/js typescript-eslint
```

```js
// eslint.config.mjs
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig({
  files: ["**/*.{js,ts}"],
  extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
  languageOptions: {
    parserOptions: { projectService: true },
  },
});
```

As configs `recommendedTypeChecked` e `strictTypeChecked` ativam o _typed linting_: regras que usam as informações de tipo do compilador. São as mais valiosas e também as mais lentas. Algumas que pegam bugs que o compilador deixa passar:

- `no-floating-promises`: Promise chamada sem `await`, `.then` ou `.catch` (veja [Programação assíncrona](/labs/web-dev/typescript/12-programacao-assincrona/));
- `no-misused-promises`: Promise passada onde se espera uma função síncrona, como um `async` dentro de `if` ou num callback de `forEach`;
- `no-explicit-any`: uso de `any` explícito;
- `no-unsafe-*` (`no-unsafe-assignment`, `no-unsafe-member-access`...): valores `any` vazando para o resto do código.

Regras como `explicit-function-return-type` existem mas não fazem parte das configs recomendadas; ligue-as se o time quiser essa convenção.

Rode o lint no editor (feedback imediato) e na CI (garantia de que nada entra sem passar).

## Checagem de tipos na CI

Muitas ferramentas modernas (Vite, esbuild, o Node.js com type stripping) **não checam tipos**: elas só apagam as anotações e seguem em frente. O build passa mesmo com erros de tipo. Por isso, a pipeline de CI precisa de uma etapa explícita:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run"
  }
}
```

```yaml
# trecho de um workflow do GitHub Actions
- run: npm ci
- run: npm run typecheck
- run: npm run lint
- run: npm test
```

(Sobre pipelines, veja [GitHub Actions](/labs/web-dev/ferramentas/10-github-actions/).)

Um anti-padrão a evitar: frameworks como o Next.js têm a opção `typescript.ignoreBuildErrors`, que faz o build de produção ignorar erros de TypeScript. Ela parece salvar o dia quando o deploy está travado, mas o resultado é publicar código com erros conhecidos. A correção é arrumar o tipo, não esconder o aviso.

## Referências

- [Referência do TSConfig](https://www.typescriptlang.org/pt/tsconfig) - typescriptlang.org, pt-BR
- [O que é um tsconfig.json](https://www.typescriptlang.org/pt/docs/handbook/tsconfig-json.html) - typescriptlang.org, pt-BR
- [Referências de Projeto](https://www.typescriptlang.org/pt/docs/handbook/project-references.html) - typescriptlang.org, pt-BR
- [Typed Linting](https://typescript-eslint.io/getting-started/typed-linting/) - typescript-eslint, en
- [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/) - TypeScript Blog, en
