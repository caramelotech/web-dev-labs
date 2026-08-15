# AGENTS.md

Orientações para agentes de IA trabalhando neste repositório. Este é o único arquivo de orientação do projeto - não existe `CLAUDE.md` separado.

## Visão geral

Repositório de **conteúdo puro** do Web Dev Labs (Caramelo Tech). Contém apenas notas em Markdown - não há build, dependências, testes ou linting.

As notas são publicadas no site do Caramelo Labs em `https://caramelotech.com.br/labs/web-dev/`. Quem monta e publica o site é o repositório hub [labs](https://github.com/caramelotech/labs): a cada push em `main` que altere `notes/` ou `sidebar.json`, o workflow `.github/workflows/notify-hub.yml` dispara o rebuild do hub via `repository_dispatch`.

## Estrutura

```
notes/           # Notas em Markdown puro - cada arquivo vira uma página no site
  index.md                    # Página de entrada do lab no site
  fundamentos/                # HTML e CSS
  engenharia-de-software/     # Design de código, princípios SOLID
  apis/                       # HTTP e REST
  banco-de-dados/             # SQL e ACID
  escalabilidade/             # Escala vertical, horizontal e organizacional
  transacoes-distribuidas/    # Consistência entre microsserviços, Sagas, dual-write
  estudos-de-caso/            # System design na prática (ex: encurtador de URL)
  ferramentas/                # Git, commits, PRs, fluxos, GPG
sidebar.json     # Seções da barra lateral no site (labels e ordem)
examples/        # Exercícios e projetos práticos (não publicados no site)
ROADMAP.md       # Backlog de próximos tópicos a abordar (não publicado no site)
```

A ordem das seções segue uma progressão de estudo pensada para entrevistas de backend: da escrita de código (Fundamentos, Engenharia de Software, APIs, Databases) até sistemas distribuídos em escala (Escalabilidade, Transações Distribuídas, System Design na Prática).

## Padrão de nomenclatura de pastas e arquivos

- **kebab-case**, sempre em minúsculas
- **Sem acentos, cedilha ou caracteres especiais** mesmo quando o nome é em português (ex: `transacoes-distribuidas`, não `transações-distribuídas`)
- **Nomes de pasta em português**, já que o conteúdo é pt-BR. Exceção: termos técnicos consagrados em inglês no jargão de backend (ex: `apis`, `saga`) podem ser mantidos sem tradução quando a tradução soaria artificial
- Pastas já existentes que fujam do padrão devem ser renomeadas na próxima vez que forem tocadas, não é preciso um esforço dedicado só para isso

## Tarefas Comuns

### Adicionar uma nova nota

1. **Escolha o local:** `fundamentos/`, `engenharia-de-software/`, `apis/`, `banco-de-dados/`, `escalabilidade/`, `transacoes-distribuidas/`, `estudos-de-caso/` ou `ferramentas/`
2. **Nomeie com prefixo numérico** para controlar a ordem na barra lateral: `01-nome.md`, `02-nome.md`
3. **Primeira linha = título:** comece o arquivo com `# Título da Nota` - o site usa esse H1 como título da página
4. **Sem frontmatter:** escreva direto o Markdown (frontmatter ainda é aceito para campos extras como `description` e `tags`, mas o padrão é não usar)

Exemplo de nota nova (`notes/fundamentos/03-javascript.md`):

```markdown
# JavaScript

## Introdução

Conteúdo aqui...
```

### Criar nova seção de tema

1. Crie a subpasta em `notes/nova-secao/` com ao menos uma nota, seguindo o [padrão de nomenclatura](#padrão-de-nomenclatura-de-pastas-e-arquivos)
2. Adicione a seção em `sidebar.json`:
   ```json
   { "label": "Título da Seção", "directory": "nova-secao" }
   ```

## Regras de Conteúdo

- Idioma: português brasileiro (pt-BR)
- Use **hífens (-)**, não travessões (—)
- NÃO use `---` para separar seções (exceto para notas/atribuições no final do arquivo)
- Apenas um `# H1` por arquivo, na primeira linha
- Imagens ficam junto das notas (ex: `notes/secao/assets/img.png`), referenciadas com caminho relativo em sintaxe Markdown: `![descrição](./assets/img.png)` - nunca use tags HTML `<img>` nem caminhos absolutos
- Links para outras notas do site usam o caminho completo: `/labs/web-dev/<secao>/<nota>/`

## Publicação

- Push em `main` alterando `notes/` ou `sidebar.json` dispara o workflow `notify-hub.yml`, que aciona o rebuild do site no hub
- O workflow requer o secret `HUB_DISPATCH_TOKEN` configurado no repositório
- Para validar como a nota fica no site, rode no clone do hub: `npm run fetch:local && npm run build`

## Git Conventions

- **NUNCA** fazer `git commit` ou `git push` automaticamente
- Apenas executar comandos git quando explicitamente solicitado pelo usuário
- Comunicar claramente o que será commitado antes de executar

## Recursos úteis

- [labs (hub)](https://github.com/caramelotech/labs) - estrutura do site, script de fetch e deploy
- [ROADMAP.md](ROADMAP.md) - próximos tópicos a abordar
