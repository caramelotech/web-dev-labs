# Desfazendo Alterações

Apagou o arquivo errado, commitou com a mensagem errada, mandou para o remoto um commit que quebrou o build. Acontece com todo mundo, e o Git tem uma ferramenta para cada um desses casos. A escolha depende de onde a alteração está: só no arquivo, no staging, num commit que só existe na sua máquina ou num commit que já foi compartilhado. Se as três áreas (working directory, staging e repositório) ainda estão confusas, vale reler [Git: Fundamentos](/labs/web-dev/ferramentas/01-git-fundamentos/) antes.

## Onde está a alteração que você quer desfazer

| Situação                                                        | Comando                          |
| --------------------------------------------------------------- | -------------------------------- |
| Editei um arquivo e quero voltar ao que estava no último commit | `git restore <arquivo>`          |
| Dei `git add` num arquivo que não devia ir para o commit        | `git restore --staged <arquivo>` |
| O último commit saiu com mensagem errada ou faltou um arquivo   | `git commit --amend`             |
| Quero desfazer commits que ainda não enviei                     | `git reset`                      |
| O commit errado já está no remoto, outras pessoas têm           | `git revert`                     |
| Preciso trocar de branch sem commitar o que estou fazendo       | `git stash`                      |
| Fiz um reset ou rebase e "perdi" commits                        | `git reflog`                     |

Um aviso antes de tudo: o que nunca foi commitado (nem guardado com stash) o Git nunca viu. Se você descartar uma alteração dessas com `git restore` ou `git reset --hard`, não existe comando que traga de volta. Commits, ao contrário, são difíceis de perder de verdade, como mostra a seção sobre reflog.

## Visão geral dos comandos

```bash
# Descartar alterações no working directory
git restore arquivo.java

# Remover arquivo do staging
git restore --staged arquivo.java

# Reverter commit (cria novo commit que desfaz)
git revert abc1234

# Mover HEAD para commit anterior (cuidado com --hard)
git reset --soft HEAD~1   # mantém alterações no staging
git reset --mixed HEAD~1  # mantém alterações no working directory
git reset --hard HEAD~1   # descarta alterações permanentemente
```

## Descartando alterações com git restore

O `git restore` mexe em arquivos, nunca em commits. Os três usos mais comuns:

```bash
git restore src/app.js                       # descarta a edição no arquivo (sem volta)
git restore --staged src/app.js              # tira do staging, mas mantém a edição no arquivo
git restore --source=a1b2c3d src/app.js      # traz a versão do arquivo que existia nesse commit
```

Sem opções, o arquivo volta ao conteúdo que está no staging (que, se você não deu `git add`, é o do último commit). O `--staged` é o "desfazer" do `git add`: nada se perde, a alteração só sai da lista do próximo commit. O `--source` é útil quando você quer recuperar uma versão antiga de um arquivo sem voltar o projeto inteiro.

Em material mais antigo você vai ver `git checkout -- arquivo` e `git reset HEAD arquivo` fazendo esses papéis. Funcionam, mas o próprio `git status` já sugere a forma atual:

```bash
$ git status
Changes not staged for commit:
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/app.js
```

## Corrigindo o último commit com --amend

Commitou e percebeu um erro de digitação na mensagem? Ou esqueceu de adicionar um arquivo? O `--amend` refaz o último commit:

```bash
git commit --amend -m "fix: corrigir cálculo de frete"   # só troca a mensagem

git add arquivo-esquecido.js
git commit --amend --no-edit                              # inclui o arquivo e mantém a mensagem
```

Apesar do nome, o `--amend` não edita o commit: ele cria um commit novo, com hash diferente, e descarta o antigo da branch. Se o commit original já foi enviado com `push`, o seu histórico e o do remoto passam a divergir. Use só em commits que ainda estão só na sua máquina.

## git reset: voltando a branch para um commit anterior

O `git reset <commit>` move a branch atual (e o HEAD junto) para outro commit. Os commits que ficaram "depois" deixam de fazer parte da branch. A diferença entre os três modos é o que acontece com as alterações desses commits:

| Modo               | Branch volta? | Staging                                              | Arquivos no disco                 |
| ------------------ | ------------- | ---------------------------------------------------- | --------------------------------- |
| `--soft`           | Sim           | Mantém as alterações (prontas para commitar de novo) | Intactos                          |
| `--mixed` (padrão) | Sim           | Esvaziado                                            | Alterações continuam nos arquivos |
| `--hard`           | Sim           | Esvaziado                                            | Alterações descartadas            |

Uma forma de lembrar: `--soft` desfaz só o commit, `--mixed` desfaz o commit e o `git add`, `--hard` desfaz tudo.

Dois usos do dia a dia:

```bash
# Desfazer os 2 últimos commits, mas manter o trabalho para reorganizar
git reset HEAD~2

# Juntar os 3 últimos commits num só
git reset --soft HEAD~3
git commit -m "feat: adicionar validação de cadastro"
```

Como o `reset` tira commits da branch, ele reescreve o histórico. Em commits que já estão no remoto e que outras pessoas podem ter puxado, use `git revert`.

## git revert: desfazendo um commit já compartilhado

O `git revert` não apaga nada. Ele cria um commit novo que faz o contrário do commit escolhido: se o original adicionou uma linha, o revert remove essa linha.

```bash
git revert a1b2c3d
# abre o editor com a mensagem "Revert "feat: novo cálculo de frete"" e cria o commit
```

Como o histórico só cresce, quem já tinha os commits anteriores continua em sincronia, e um `git push` normal resolve. É o jeito certo de desfazer algo que já chegou na `main`.

Reverter um commit de merge pede uma informação extra: um merge tem dois pais, e o Git precisa saber qual lado considerar como "o certo". Normalmente é o primeiro pai, a branch onde o merge foi feito:

```bash
git revert -m 1 <hash-do-merge>
```

|                     | `git reset`                         | `git revert`                    |
| ------------------- | ----------------------------------- | ------------------------------- |
| O que faz           | Move a branch para trás             | Cria commit que desfaz outro    |
| Histórico           | Reescrito (commits somem da branch) | Preservado (só ganha um commit) |
| Commit já no remoto | Exige force push, atrapalha o time  | Push normal                     |
| Melhor para         | Commits locais                      | Commits compartilhados          |

## git reflog: a rede de segurança

Fez um `reset --hard` no commit errado, ou um rebase que bagunçou tudo? Respire: o Git anota cada posição por onde o HEAD passou (commits, resets, rebases, trocas de branch), e o `git reflog` mostra essa lista.

```bash
$ git reflog
e4f5g6h HEAD@{0}: reset: moving to HEAD~3
a1b2c3d HEAD@{1}: commit: feat: adicionar validação de cadastro
9f8e7d6 HEAD@{2}: commit: test: cobrir cadastro inválido
```

O commit `a1b2c3d` saiu da branch, mas continua no repositório. Para voltar para ele:

```bash
git reset --hard HEAD@{1}         # volta a branch para onde estava antes do reset
# ou, para só resgatar sem mexer na branch atual:
git branch resgate a1b2c3d
```

O reflog tem limites claros. Ele é local (não vai para o remoto, então não ajuda a recuperar algo de outra máquina), as entradas expiram com o tempo (por padrão, 90 dias para entradas alcançáveis e 30 para as que não são mais) e, como todo o resto do Git, ele não conhece alterações que nunca foram commitadas.

## Guardar alterações temporariamente (stash)

Cenário comum: você está no meio de uma alteração, sem terminar, quando precisa trocar de branch para resolver outra coisa. Comitar um código quebrado só para trocar de branch não é opção, e o Git também não deixa trocar de branch se isso for sobrescrever arquivos modificados.

O `git stash` guarda o estado do working directory e da staging area numa pilha, sem exigir commit, e devolve uma árvore limpa:

```bash
git stash                     # guarda alterações e limpa a árvore
git switch outra-branch       # agora pode trocar sem conflito
# resolve o que precisava
git switch feature/login      # volta para a branch original
git stash pop                 # reaplica as alterações guardadas
```

Dá para guardar várias vezes seguidas; cada `git stash` empilha uma entrada nova, e `git stash list` mostra a pilha inteira.

`pop` e `apply` reaplicam o mesmo jeito, a diferença é o que sobra na pilha depois:

| Comando           | O que faz                                         |
| ----------------- | ------------------------------------------------- |
| `git stash pop`   | Aplica a última entrada e **remove** ela da pilha |
| `git stash apply` | Aplica a última entrada e **mantém** ela na pilha |

Use `apply` quando quiser aplicar o mesmo stash em mais de uma branch, ou quando não tem certeza se vai precisar dele de novo. Se der conflito ao aplicar, o Git não remove a entrada da pilha automaticamente, então você resolve o conflito e depois roda `git stash drop` para descartar.

Por padrão, `git stash` só guarda arquivos que o Git já rastreia. Um arquivo novo, criado mas nunca adicionado com `git add`, fica de fora e continua sentado no working directory. Isso é intencional: stashear cada arquivo novo por padrão poderia varrer coisas que você nem queria tocar ainda. Quando esse arquivo novo também faz parte do que você quer guardar, use `-u`:

```bash
git stash -u        # inclui arquivos untracked também
git stash push -u   # mesma coisa, forma mais explícita
```

## Referências

- [Pro Git - Desfazendo Coisas](https://git-scm.com/book/pt-br/v2/Fundamentos-do-Git-Desfazendo-Coisas) - Scott Chacon e Ben Straub, pt-BR
- [Pro Git - Reset Desmistificado](https://git-scm.com/book/pt-br/v2/Ferramentas-do-Git-Reset-Desmistificado) - Scott Chacon e Ben Straub, pt-BR
- [Pro Git - Fazendo Stash e Limpando](https://git-scm.com/book/pt-br/v2/Ferramentas-do-Git-Fazendo-Stash-e-Limpando) - Scott Chacon e Ben Straub, pt-BR
- [git-reflog - Git Documentation](https://git-scm.com/docs/git-reflog) - Git, en
- [git-stash - Git Documentation](https://git-scm.com/docs/git-stash) - Git, en
