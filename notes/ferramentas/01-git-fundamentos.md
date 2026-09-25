# Git: Fundamentos

Git é um sistema de controle de versão distribuído que rastreia mudanças no código ao longo do tempo. GitHub é uma plataforma que hospeda repositórios Git e adiciona ferramentas de colaboração como pull requests e code review.

## Conceitos fundamentais

### Repositório

Um repositório (ou repo) é o diretório do projeto com toda a história de versões armazenada. O histórico fica em uma pasta oculta `.git` na raiz do projeto.

Há dois tipos:

- **Local:** na sua máquina
- **Remoto:** em um servidor (GitHub, GitLab, etc.)

### Branches

Uma branch é uma linha independente de desenvolvimento. O trabalho em uma branch não afeta outras até ser mesclado (merge).

```
main           ──●──●──●──────────●──
                       \          /
feature/login   ────────●──●──●──
```

A branch principal costuma se chamar `main` (antes era `master`).

### Staging Area

Git tem três áreas:

1. **Working directory** - arquivos que você edita
2. **Staging area (index)** - alterações preparadas para o próximo commit
3. **Repository** - histórico de commits

```
Editar arquivo → git add → git commit
(working dir)  (staging)  (repository)
```

## Configuração inicial

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
git config --global core.editor "code --wait"  # VS Code como editor padrão
```

## Comandos essenciais

### Começar um projeto

```bash
# Iniciar repositório em um diretório existente
git init

# Clonar repositório remoto
git clone https://github.com/usuario/repositorio.git

# Clonar em um diretório específico
git clone https://github.com/usuario/repositorio.git meu-projeto
```

### Verificar estado

```bash
git status              # mostra arquivos modificados, staged, untracked
git log                 # histórico de commits
git log --oneline       # uma linha por commit
git log --oneline --graph --all  # visualizar branches
git diff                # alterações não staged
git diff --staged       # alterações staged (prontas para commit)
```

### Registrar alterações

```bash
git add arquivo.java          # adiciona arquivo específico
git add src/                  # adiciona diretório
git add .                     # adiciona tudo no diretório atual

git commit -m "feat: adicionar validação de email"

# Adicionar e commitar em um comando (só arquivos rastreados)
git commit -am "fix: corrigir cálculo de imposto"
```

Convenção de mensagens de commit (Conventional Commits):

| Prefixo     | Quando usar                               |
| ----------- | ----------------------------------------- |
| `feat:`     | Nova funcionalidade                       |
| `fix:`      | Correção de bug                           |
| `docs:`     | Documentação                              |
| `refactor:` | Refatoração sem mudança de funcionalidade |
| `test:`     | Adição ou correção de testes              |
| `chore:`    | Tarefas de manutenção (build, deps)       |

### Trabalhar com branches

```bash
git branch                    # listar branches locais
git branch -a                 # listar locais e remotas

git branch feature/login      # criar branch
git checkout feature/login    # mudar para branch
git checkout -b feature/login # criar e mudar em um comando

# Forma moderna (Git 2.23+)
git switch feature/login      # mudar para branch
git switch -c feature/login   # criar e mudar

git branch -d feature/login   # deletar branch (segura - bloqueia se não mesclada)
git branch -D feature/login   # deletar branch (forçado)
```

### Guardar alterações temporariamente (stash)

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

### Sincronizar com remoto

```bash
git remote -v                              # listar remotos configurados
git remote add origin https://github.com/usuario/repo.git

git push origin feature/login             # enviar branch para remoto
git push -u origin feature/login          # enviar e configurar upstream (primeira vez)
git push                                  # enviar para upstream configurado

git pull origin main                      # buscar e mesclar do remoto
git fetch origin                          # buscar sem mesclar
git merge origin/main                     # mesclar após fetch
```

### Desfazer alterações

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

## Merge

Merge combina o histórico de duas branches.

```bash
git checkout main
git merge feature/login
```

Git tenta fazer o merge automaticamente. Se houver alterações no mesmo trecho de código em ambas as branches, ocorre um conflito.

### Fast-forward merge

Quando `main` não teve commits desde que a branch foi criada, Git apenas avança o ponteiro:

```
Antes:  main ──●──●
                    \
        feature       ●──●

Depois: main ──●──●──●──●
```

### Three-way merge

Quando ambas avançaram, Git cria um commit de merge:

```
        main    ──●──●──●──────●
                       \      /
        feature  ────────●──●
```

## Rebase

O merge junta o histórico de duas branches criando um commit de junção. O rebase faz outra coisa: pega os commits da sua branch e reaplica eles, um por um, como se você tivesse escrito cada um a partir de um ponto de partida diferente.

```
Antes:
              A───B───C  feature
             /
main   ──D───E───F───G

Depois de "git rebase main" em feature:
                      A'──B'──C'  feature
                     /
main   ──D───E───F───G
```

Reparou no apóstrofo? `A'`, `B'` e `C'` não são os commits `A`, `B` e `C` movidos de lugar, são commits **novos**, com conteúdo parecido mas hash diferente, porque o hash de um commit depende do commit pai. Rebase reescreve o histórico.

```bash
git switch feature/login
git rebase main
```

Isso importa na hora de decidir quando usar rebase:

- **Seguro**: rebase numa branch local, que só existe na sua máquina, antes de abrir o PR. Ninguém mais tem esse histórico, então reescrevê-lo não afeta ninguém além de você.
- **Arriscado**: rebase numa branch que já foi enviada com `push` e que outra pessoa já baixou. Como os commits mudam de hash, seu histórico local e o histórico remoto divergem completamente aos olhos do Git. Você precisaria forçar o push (`git push --force`), e quem já tinha puxado aquela branch fica com um histórico que não bate mais com o remoto, precisando corrigir a própria árvore na mão para continuar trabalhando.

Na prática, a regra costuma ser: rebase a vontade na sua própria branch de feature antes do PR existir. Depois que o PR está aberto e outras pessoas podem ter puxado a branch para revisar ou continuar o trabalho, prefira merge.

### Rebase interativo

O `git rebase -i` abre um editor com a lista de commits e deixa você reescrever a história antes de aplicá-la de novo:

```bash
git rebase -i HEAD~3
```

```
pick a1b2c3d adicionar validação de email
pick e4f5g6h corrigir typo na mensagem de erro
pick i7j8k9l ajustar teste que quebrou
```

Trocando a palavra no começo da linha, você decide o que fazer com cada commit:

| Comando  | O que faz                                                 |
| -------- | --------------------------------------------------------- |
| `pick`   | Aplica o commit como está                                 |
| `reword` | Aplica, mas deixa editar a mensagem                       |
| `edit`   | Para nesse commit para você alterar o conteúdo            |
| `squash` | Junta com o commit anterior, mantendo as duas mensagens   |
| `fixup`  | Junta com o commit anterior, descartando a mensagem deste |
| `drop`   | Remove o commit                                           |

Um uso comum: três commits de "correção de typo" que só poluem o histórico virando um só, antes do PR:

```
pick a1b2c3d adicionar validação de email
fixup e4f5g6h corrigir typo na mensagem de erro
fixup i7j8k9l ajustar teste que quebrou
```

Depois de salvar, os três viram um commit único com a mensagem "adicionar validação de email".

Se der conflito no meio do rebase (seja ele interativo ou não), o Git para no commit problemático:

```bash
# resolve o conflito no arquivo, depois:
git add arquivo.java
git rebase --continue   # segue para o próximo commit da lista

git rebase --skip       # pula esse commit específico
git rebase --abort      # cancela tudo, volta pro estado de antes do rebase
```

## Resolução de conflitos

Quando duas branches modificam o mesmo trecho de código, Git marca o conflito no arquivo:

```
<<<<<<< HEAD
    return saldo - taxa;
=======
    return saldo * (1 - taxa);
>>>>>>> feature/calculo-taxa
```

Para resolver:

1. Abra o arquivo e edite manualmente para manter o código correto
2. Remova os marcadores `<<<<<<<`, `=======` e `>>>>>>>`
3. Adicione ao staging e faça commit:

```bash
git add arquivo.java
git commit -m "merge: resolver conflito no cálculo de taxa"
```

IDEs como IntelliJ e VS Code têm interfaces visuais para resolução de conflitos que facilitam bastante.

## .gitignore

O arquivo `.gitignore` lista padrões de arquivos que o Git deve ignorar:

```gitignore
# Compilados Java
*.class
*.jar
target/

# Ambientes
.env
*.local

# IDEs
.idea/
.vscode/
*.iml

# SO
.DS_Store
Thumbs.db
```

Arquivos já rastreados não são afetados pelo `.gitignore`. Para parar de rastrear um arquivo:

```bash
git rm --cached arquivo-sensivel.env
```

## Referências

- [git-rebase - Git Documentation](https://git-scm.com/docs/git-rebase) - Git, en
- [git-stash - Git Documentation](https://git-scm.com/docs/git-stash) - Git, en
