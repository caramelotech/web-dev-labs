---
title: "Git: Fundamentos"
description: "Conceitos essenciais de versionamento, comandos básicos do Git, merge, resolução de conflitos e .gitignore."
lastUpdated: 2026-04-26
sidebar:
  order: 1
tags: ["git", "github", "versionamento", "controle-de-versão"]
---

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
