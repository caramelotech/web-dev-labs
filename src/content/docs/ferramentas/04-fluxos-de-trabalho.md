---
title: "Fluxos de Trabalho com Git"
description: "Feature Branch Workflow, Git Flow, GitHub Flow, GitLab Flow e Trunk-based Development: como escolher a estratégia de branching certa para cada contexto."
lastUpdated: 2026-05-21
sidebar:
  order: 4
tags: ["git", "gitflow", "github-flow", "trunk-based", "branching"]
---

Saber usar Git é só o começo. A pergunta mais importante para um time é: _como_ vamos organizar o trabalho nas branches? Esta página cobre as estratégias mais usadas, do mais simples ao mais estruturado.

## Feature Branch Workflow

O mais comum: cada funcionalidade ganha sua própria branch, mergeada via Pull Request quando pronta.

```bash
git switch -c feature/autenticacao
# ... commits ...
git push -u origin feature/autenticacao
# abrir PR no GitHub
```

Funciona bem para a maioria dos times - mas tem limites quando o ciclo de releases se torna mais rígido ou quando é preciso isolar um hotfix urgente do trabalho em andamento.

## Git Flow

O **Git Flow** é uma estratégia de branching criada por Vincent Driessen em 2010 que vai além do Feature Branch Workflow: define papéis fixos para cada tipo de branch, separando o ciclo de desenvolvimento do ciclo de release.

### O problema que ele resolve

Imagine o seguinte cenário: o time está trabalhando em 3 features ao mesmo tempo. De repente, um bug crítico aparece em produção. Como garantir que:

- O hotfix vai para produção sem arrastar as features incompletas?
- As 3 features não se atrapalham no caminho para o release?
- A versão que vai para produção passou por uma janela de estabilização?

O Feature Branch Workflow simples não tem resposta clara para isso. O Git Flow resolve dividindo o trabalho em tipos de branch com propósitos bem definidos.

### `main` e `develop`: as duas branches fixas

O Git Flow usa duas branches de longa duração:

```
main      ──────────────────────────────────────● v1.2
                                               /
develop   ──●──●──●──●──●──●──●──●──●──●──●──
              \       /    \            /
feature        ●──●──        ●──●──●──
```

- **`main`** - reflete o estado em produção. Cada commit aqui é uma release marcada com tag. Nunca se commita diretamente aqui.
- **`develop`** - branch de integração. Quando uma feature está pronta, ela entra em `develop`. É aqui que as coisas se juntam antes de ir para produção.

A ideia central: `main` nunca fica "suja" com trabalho em progresso. Você sempre sabe que o que está lá é estável.

### Os tipos de branch temporária

| Branch      | Criada de | Merge para     | Quando usar                      |
| ----------- | --------- | -------------- | -------------------------------- |
| `feature/*` | develop   | develop        | Nova funcionalidade              |
| `release/*` | develop   | develop + main | Preparar um release              |
| `hotfix/*`  | main      | develop + main | Bug urgente em produção          |
| `support/*` | main      | -              | Manter versão antiga em paralelo |

**feature/\*** - Uma branch por funcionalidade. Mesclada de volta para `develop` quando pronta.

```bash
git checkout -b feature/login develop
# ... commits da feature ...
git checkout develop
git merge --no-ff feature/login
git branch -d feature/login
```

**release/\*** - Abre uma "janela de estabilização" antes do release. Só aceita bug fixes, ajustes de documentação e bump de versão. Nenhuma feature nova entra. Quando estável, vai para `main` e `develop`.

```bash
git checkout -b release/1.2.0 develop
# ... corrige bugs, atualiza versão no package.json ...
git checkout main
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release 1.2.0"
git checkout develop
git merge --no-ff release/1.2.0
git branch -d release/1.2.0
```

**hotfix/\*** - Para quando algo quebra em produção e não pode esperar o próximo release. Parte de `main` (versão estável) e vai para `main` e `develop` ao terminar.

```bash
git checkout -b hotfix/1.2.1 main
# ... corrige o bug ...
git checkout main
git merge --no-ff hotfix/1.2.1
git tag -a v1.2.1 -m "Hotfix 1.2.1"
git checkout develop
git merge --no-ff hotfix/1.2.1
git branch -d hotfix/1.2.1
```

**support/\*** - Menos comum. Usada quando você ainda precisa manter uma versão antiga (`v1.x`) em paralelo enquanto `v2.x` já está em produção. Comum em produtos enterprise com contratos de suporte.

### A extensão gitflow-avh

Todos esses comandos de criar branch, merge, tag e deletar são repetitivos e fáceis de errar. A extensão **gitflow-avh** automatiza o fluxo com comandos simples.

**Instalação:**

```bash
# macOS
brew install git-flow-avh

# Linux (Debian/Ubuntu)
sudo apt-get install git-flow

# Windows (via Chocolatey)
choco install gitflow-avh
```

Para outros sistemas operacionais, veja o [guia de instalação oficial](https://github.com/petervanderdoes/gitflow-avh/wiki/Installation).

**Usando no dia a dia:**

```bash
# Inicializar o Git Flow no repositório (configura nomes das branches)
git flow init

# Feature
git flow feature start minha-feature        # cria feature/minha-feature a partir de develop
git flow feature finish minha-feature       # merge em develop, deleta a branch

# Release
git flow release start 1.2.0               # cria release/1.2.0 a partir de develop
git flow release finish 1.2.0              # merge em main e develop, cria tag, deleta

# Hotfix
git flow hotfix start 1.2.1               # cria hotfix/1.2.1 a partir de main
git flow hotfix finish 1.2.1              # merge em main e develop, cria tag, deleta
```

O `finish` já faz merge, cria a tag (para release e hotfix) e deleta a branch - sem precisar lembrar cada passo.

### Quando vale adaptar (ou trocar)?

O Git Flow foi criado para projetos com **releases versionados e ciclos de QA bem definidos** - pense em apps mobile, bibliotecas com versões, software com contratos de suporte.

Para outros contextos, pode ser um overhead desnecessário:

| Contexto                       | Recomendação                                    |
| ------------------------------ | ----------------------------------------------- |
| App web com deploy contínuo    | Trunk-based ou GitHub Flow                      |
| API SaaS / produto com versões | Git Flow faz sentido                            |
| Biblioteca open source         | Git Flow faz sentido                            |
| Projeto solo ou time pequeno   | GitHub Flow é mais simples                      |
| App mobile (iOS / Android)     | Git Flow - releases são cadenciados pelas lojas |
| Startup em fase inicial        | Qualquer coisa simples - não otimize cedo       |

A pergunta certa não é "devo usar Git Flow?" mas sim: **qual é o meu ciclo de release?** Se você faz deploy múltiplas vezes por dia, Git Flow vai te atrasar. Se você tem sprints com QA antes de cada release, vai te organizar.

### Outras metodologias de branching

**GitHub Flow** - O mais simples. Só uma regra prática: `main` está sempre pronto para produção. Qualquer trabalho vai numa branch com PR. Sem `develop`, sem branches de release. Ideal para deploys contínuos.

**GitLab Flow** - Meio-termo entre GitHub Flow e Git Flow. Em vez de branches de release, usa branches de ambiente (`staging`, `production`). O código flui: `feature` → `main` → `staging` → `production`.

**Trunk-based Development** - Todo mundo trabalha em branches curtíssimas (horas, não dias) e mergeiam frequente em `main`. Features incompletas ficam escondidas atrás de **feature flags**. Requer boa cobertura de testes e CI/CD maduro. É o modelo que empresas como Google e Meta usam internamente.

Leitura complementar: [Comparing Workflows - Atlassian](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
