# Pull Requests e Code Review

Um Pull Request (PR) é uma solicitação para integrar mudanças de uma branch em outra. É o mecanismo central de code review em times e o ponto onde colaboração, qualidade e rastreabilidade se encontram.

## Fluxo típico

1. Criar uma branch para a funcionalidade ou correção
2. Fazer commits com as alterações
3. Fazer push da branch para o remoto
4. Abrir um PR no GitHub apontando a branch para `main`
5. Revisar o código com o time (comentários, sugestões)
6. Fazer ajustes e atualizar o PR com novos commits
7. Aprovar e fazer merge

## PR a partir de um fork

O fluxo acima assume que você pode dar push no repositório. Em projetos open source, ou em repositórios de outro time, normalmente não pode. Nesse caso o PR sai de uma branch do seu **fork** (a sua cópia do repositório no GitHub) e aponta para a branch do repositório original. Na tela de abertura do PR, o GitHub mostra os dois lados: `base repository` (o original) e `head repository` (o seu fork). O passo a passo de criar o fork e configurar o remoto `upstream` está em [GitHub](/labs/web-dev/ferramentas/05-github/).

Dois detalhes fazem diferença nesse tipo de PR:

- Deixe marcada a opção **Allow edits by maintainers**. Ela permite que quem mantém o projeto faça pequenos ajustes direto na sua branch (corrigir um typo, resolver um conflito simples) em vez de pedir tudo por comentário.
- Mantenha a branch atualizada com o original. Se o `upstream` andou bastante enquanto o PR estava aberto, traga as novidades (`git fetch upstream` e merge ou rebase de `upstream/main`) e resolva os conflitos do seu lado antes de pedir nova revisão.

## Boas práticas para PRs

- PRs pequenos são mais fáceis de revisar
- Descreva claramente o que foi feito e por quê
- Inclua contexto (screenshots, issue relacionada, etc.)
- Responda aos comentários antes de pedir nova revisão

## Formas de mesclar um PR

Depois da aprovação, o botão de merge integra a branch do PR na branch alvo. A setinha ao lado dele esconde três estratégias, e cada uma deixa um histórico diferente na `main`:

- **Create a merge commit** leva todos os commits do PR como estão e cria um commit de merge juntando as duas linhas. O histórico mostra exatamente como o trabalho aconteceu, inclusive os commits de "corrige typo".
- **Squash and merge** junta todos os commits do PR num único commit na branch alvo. A `main` fica com um commit por PR, fácil de ler e de reverter, mas os passos intermediários se perdem (continuam visíveis só no PR).
- **Rebase and merge** reaplica os commits do PR um a um em cima da branch alvo, sem commit de merge. O histórico fica linear e mantém cada commit, então só funciona bem se os commits do PR já estiverem organizados.

| Estratégia            | Commits na base      | Commit de merge | Histórico  | Bom quando                                     |
| --------------------- | -------------------- | --------------- | ---------- | ---------------------------------------------- |
| Create a merge commit | Todos, como estão    | Sim             | Ramificado | O time quer o registro completo de cada branch |
| Squash and merge      | Um só                | Não             | Linear     | PRs com muitos commits pequenos ou de ajuste   |
| Rebase and merge      | Todos, com hash novo | Não             | Linear     | Commits do PR já limpos e com mensagens boas   |

Não existe resposta certa universal. Muitos times usam squash como padrão justamente porque não precisam cobrar que cada commit do PR seja perfeito. Em **Settings > General > Pull Requests**, quem administra o repositório pode desabilitar as opções que o time não usa, para ninguém escolher a errada sem querer. O que acontece por baixo em cada caso (fast-forward, three-way merge, rebase) está em [Branches, Merge e Rebase](/labs/web-dev/ferramentas/02-branches-merge-e-rebase/).

## Protegendo branches

No GitHub, você pode configurar **regras de proteção** em uma branch para garantir que nenhum código entre diretamente sem passar por revisão. Isso é essencial para a `main` - e para qualquer branch de longa duração.

Para configurar:

1. Acesse o repositório no GitHub
2. Vá em **Settings > Branches**
3. Clique em **Add branch protection rule** (ou **Add ruleset** nas versões mais recentes)
4. Digite o nome da branch (ex: `main`) ou um padrão (ex: `release/*`)

As principais opções disponíveis:

| Regra                                 | O que faz                                                    |
| ------------------------------------- | ------------------------------------------------------------ |
| Require a pull request before merging | Impede push direto - exige PR para qualquer merge            |
| Require approvals                     | Define quantas aprovações o PR precisa antes de ser mergeado |
| Require status checks to pass         | Bloqueia merge se o CI falhar                                |
| Require branches to be up to date     | Força a branch a estar atualizada com a base antes do merge  |
| Restrict who can push                 | Limita quem pode fazer push direto                           |

**Em organizações:** o GitHub Organizations permite criar **rulesets** que se aplicam a todos os repositórios da organização de uma vez. Útil para garantir que todos os repos seguem as mesmas regras sem precisar configurar manualmente em cada um. Apenas admins da org podem criar rulesets globais.

## Template de PR

Um **template de Pull Request** é um arquivo Markdown que aparece automaticamente preenchido quando alguém abre um novo PR. Em vez de uma caixa de texto em branco, o autor já encontra uma estrutura pronta para preencher.

**Por que usar?**

- Elimina PRs com descrição vaga ("fix things", "ajustes gerais")
- Lembra o autor de adicionar contexto, link de issue e screenshots
- Padroniza o processo de review no time
- Facilita a vida do revisor, que sabe onde encontrar cada informação

**Como criar:**

Crie o arquivo `.github/PULL_REQUEST_TEMPLATE.md` na raiz do repositório:

```markdown
## O que foi feito

<!-- Descreva brevemente as mudanças. -->

## Por que

<!-- Qual problema ou requisito isso resolve? Vincule à issue, se houver. -->
<!-- Closes #123 -->

## Como testar

<!-- Passos para o revisor verificar que funciona. -->

- [ ] Passo 1
- [ ] Passo 2

## Screenshots (se aplicável)

## Checklist

- [ ] Testes passando
- [ ] Sem `console.log` solto
- [ ] Documentação atualizada (se necessário)
```

O GitHub carrega esse arquivo automaticamente em todo novo PR. Adapte os campos ao tipo de projeto - um projeto de API tem necessidades diferentes de um app mobile.

Se o projeto tem tipos muito diferentes de PR (feature, bug fix, chore), você pode ter **múltiplos templates** usando o diretório `.github/PULL_REQUEST_TEMPLATE/` com um arquivo por tipo. O autor escolhe qual template usar na hora de abrir o PR.

Documentação completa: [Criando template de PR - GitHub Docs](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)

## Code Review

Para exigir que toda mudança passe por revisão antes de entrar em `main`, ative as regras no painel de proteção de branches:

- Marque **Require a pull request before merging**
- Marque **Require approvals** e defina o mínimo (ex: 1)
- Considere **Dismiss stale pull request approvals when new commits are pushed** - invalida aprovações antigas se novos commits forem adicionados após o approve

Com isso, ninguém consegue dar merge sem ao menos uma aprovação, mesmo que seja dono do repositório.

**CODEOWNERS:**

O arquivo CODEOWNERS define quem é responsável por revisar quais partes do código. Quando um PR toca um arquivo coberto pelo CODEOWNERS, o GitHub solicita automaticamente a revisão das pessoas ou times definidos.

Crie o arquivo em `.github/CODEOWNERS`:

```
# Sintaxe: padrão   @responsável
```

**Configurando por usuário:**

```
# Qualquer arquivo no repositório
*   @tech-lead

# Diretório específico
src/payments/   @dev1   @dev2

# Arquivo específico
src/auth/config.ts   @responsavel-seguranca

# Por extensão de arquivo
*.sql   @dba-username
```

**Configurando por grupo (time da organização):**

Em organizações do GitHub, você pode usar times como responsáveis:

```
src/   @minha-org/time-backend
*.css  @minha-org/time-design
docs/  @minha-org/tech-writers
```

O time inteiro recebe a solicitação de revisão. Qualquer membro aprovado conta para a regra de required approvals.

**Outros padrões úteis:**

```
# Arquivos de configuração e infraestrutura
.github/    @devops
*.yml       @devops

# Padrão mais específico tem prioridade sobre o mais genérico
src/        @time-backend
src/api/v2/ @lead-api    # só ele para esse subdiretório
```

Se um padrão mais específico vier depois de um genérico no arquivo, o mais específico prevalece.

**Extensão GitHub Pull Requests para VS Code:**

A extensão [GitHub Pull Requests](https://code.visualstudio.com/blogs/2018/09/10/introducing-github-pullrequests#_review-and-manage-pull-requests) permite abrir, revisar e aprovar PRs diretamente dentro do VS Code. Você lê o diff, deixa comentários linha a linha e finaliza a review sem precisar sair do editor.

Para instalar: busque "GitHub Pull Requests" na aba de extensões do VS Code (Ctrl+Shift+X).

## Referências

- [Sobre merges de pull request](https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges) - GitHub Docs, pt-BR
- [Criar um fork de um repositório](https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) - GitHub Docs, pt-BR
- [Pro Git - GitHub: Contribuindo para um Projeto](https://git-scm.com/book/pt-br/v2/GitHub-Contribuindo-para-um-Projeto) - Scott Chacon e Ben Straub, pt-BR
