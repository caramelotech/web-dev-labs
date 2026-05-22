---
title: "Conventional Commits e SemVer"
description: "Versionamento Semântico (SemVer), Conventional Commits e ferramentas para padronizar mensagens de commit: commitlint e commitizen."
lastUpdated: 2026-05-21
sidebar:
  order: 2
tags:
  [
    "git",
    "conventional-commits",
    "semver",
    "versionamento",
    "commitlint",
    "commitizen",
  ]
---

Boas mensagens de commit são a diferença entre um histórico Git que conta a história do projeto e um que apenas acumula entradas sem sentido. Esta página cobre o padrão Conventional Commits, o versionamento semântico que ele sustenta e as ferramentas que automatizam o processo no dia a dia.

## Versionamento Semântico (SemVer)

Toda biblioteca, API ou software que outras pessoas dependem precisa de um sistema de versão previsível. O **SemVer (Semantic Versioning)** define um padrão amplamente adotado: o número de versão comunica o _tipo_ de mudança, não apenas "houve mudança".

O formato é sempre:

```
MAJOR.MINOR.PATCH
```

Exemplo: `2.4.1`

| Número    | Quando incrementar                                        | O que significa para quem usa             |
| --------- | --------------------------------------------------------- | ----------------------------------------- |
| **MAJOR** | Mudança que quebra compatibilidade com versões anteriores | É preciso adaptar o código para atualizar |
| **MINOR** | Nova funcionalidade sem quebrar o que já existia          | Pode atualizar com segurança              |
| **PATCH** | Correção de bug sem mudança de comportamento              | Deve atualizar - sem risco                |

Regras práticas:

- Quando MAJOR incrementa, MINOR e PATCH voltam a 0
- Quando MINOR incrementa, PATCH volta a 0
- Versões `0.x.x` indicam desenvolvimento inicial - a API pode mudar a qualquer momento
- Versão `1.0.0` marca o ponto em que a API pública está estável

**Versões de pré-release:**

```
1.0.0-alpha
1.0.0-beta.1
1.0.0-rc.1      # release candidate
```

**Na prática - npm e semver:**

Quando você vê `"react": "^18.2.0"` no `package.json`, o `^` significa "aceita MINOR e PATCH novos, mas não MAJOR". Isso vem diretamente do SemVer: uma versão MINOR não quebra compatibilidade, então é seguro atualizar automaticamente.

Spec completa em português: [semver.org/lang/pt-BR](https://semver.org/lang/pt-BR/)

## Conventional Commits

O [Conventional Commits](https://www.conventionalcommits.org/pt-br/) é uma especificação para mensagens de commit que torna o histórico legível por humanos e por ferramentas. [Git: Fundamentos](./01-git-fundamentos) cobre os prefixos básicos - aqui vamos ao formato completo e às ferramentas que automatizam o processo.

**Formato:**

```
<tipo>[escopo opcional]: <descrição curta>

[corpo opcional]

[rodapé(s) opcional(is)]
```

**Escopo:**

Indica qual parte do sistema foi afetada. Vai entre parênteses depois do tipo:

```bash
feat(auth): adicionar login com Google OAuth
fix(carrinho): corrigir arredondamento de frete
docs(readme): atualizar instruções de instalação
```

**Corpo e rodapé:**

Para commits mais complexos, use o corpo para explicar o _porquê_ e o rodapé para metadados como referências a issues ou revisores:

```
feat(auth): adicionar login com Google OAuth

Implementa o fluxo OAuth 2.0 com Google. Usuários podem
agora fazer login sem criar uma senha local.

Closes #42
Reviewed-by: @colega
```

**Breaking changes:**

Quando a mudança quebra compatibilidade (e deve incrementar o MAJOR no SemVer), sinalize de uma dessas duas formas:

```bash
# Opção 1: ! depois do tipo
feat!: remover suporte ao endpoint /api/v1

# Opção 2: rodapé BREAKING CHANGE
feat(api): nova estrutura de resposta nos endpoints

BREAKING CHANGE: O campo "data" foi renomeado para "payload".
Clientes precisam atualizar as chamadas para usar o novo campo.
```

**A relação com SemVer:**

Conventional Commits foi projetado para trabalhar junto com SemVer. A regra é direta:

- `fix:` → incrementa **PATCH**
- `feat:` → incrementa **MINOR**
- `feat!:` ou `BREAKING CHANGE:` → incrementa **MAJOR**

Ferramentas como o `semantic-release` leem o histórico de commits e calculam automaticamente qual versão deve ser lançada - sem intervenção manual.

## commitlint

O **commitlint** valida suas mensagens de commit automaticamente. Se você escrever algo fora do padrão Conventional Commits, o commit é bloqueado antes de ser criado.

**Instalação em projetos Node.js:**

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

**Configuração** - crie `commitlint.config.js` na raiz do projeto:

```js
export default {
  extends: ["@commitlint/config-conventional"],
};
```

**Integrando com Husky** (executa a validação automaticamente antes de cada commit):

```bash
npm install --save-dev husky
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

O arquivo `.husky/commit-msg` é executado pelo Git antes de cada commit. Se a mensagem não passar na validação, o commit não acontece.

**Exemplo de erro:**

```bash
$ git commit -m "arrumei o bug"
⧗   input: arrumei o bug
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]

✖   found 2 problems, 0 warnings
```

**Exemplo de commit válido:**

```bash
$ git commit -m "fix: corrigir cálculo de desconto no carrinho"
[main a1b2c3d] fix: corrigir cálculo de desconto no carrinho
```

Você pode personalizar as regras no `commitlint.config.js` para aceitar escopos específicos, exigir rodapé de issue, limitar o tamanho da descrição, etc.

## commitizen

O **commitizen** é uma CLI interativa que guia você pelo processo de criar uma mensagem no padrão Conventional Commits. Em vez de lembrar a sintaxe, você responde a perguntas e ele monta a mensagem.

**Instalação:**

```bash
npm install --save-dev commitizen cz-conventional-changelog
```

**Configuração** - adicione ao `package.json`:

```json
{
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}
```

Adicione também um script para facilitar o uso:

```json
{
  "scripts": {
    "commit": "cz"
  }
}
```

**Uso:**

```bash
npm run commit
```

O commitizen faz uma série de perguntas no terminal:

```
? Select the type of change you're committing:
❯ feat:     A new feature
  fix:      A bug fix
  docs:     Documentation only changes
  ...

? What is the scope of this change? (enter to skip)
  auth

? Write a short, imperative tense description:
  adicionar login com Google

? Provide a longer description: (press enter to skip)

? Are there any breaking changes? No

? Does this change affect any open issues?
  Closes #42
```

E gera a mensagem pronta:

```
feat(auth): adicionar login com Google

Closes #42
```

**Usando os dois juntos:**

commitlint + commitizen é a configuração mais robusta para times. O commitizen garante que ninguém escreve mensagens fora do padrão por não conhecer o formato. O commitlint é a rede de segurança que bloqueia mensagens inválidas mesmo que alguém use `git commit` diretamente, ignorando o commitizen.
