# Web Dev Labs

> Base de conhecimento sobre desenvolvimento web da Caramelo Tech, com foco em aprendizado pratico para iniciantes.

Bem-vindo ao **Web Dev Labs**. Este repositorio reune notas publicadas com Astro + Starlight, exercicios e projetos para apoiar a jornada de quem esta aprendendo fundamentos da web e topicos de system design.

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue)](https://caramelotech.github.io/web-dev-labs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](.github/CONTRIBUTING.md)

## Sobre o projeto

O Web Dev Labs foi pensado para combinar teoria e pratica em uma trilha progressiva:

- Notas sobre HTML, CSS, JavaScript e system design
- Exercicios hands-on para fixacao
- Projetos pequenos para aplicar conceitos
- Material publicado em um site com navegacao organizada

## Estrutura do repositorio

```text
web-dev-labs/
|- src/content/docs/   -> Anotacoes e estudos publicados no site
|- examples/           -> Exemplos de codigo, exercicios e projetos praticos
|- public/assets/      -> Imagens e arquivos estaticos publicados no site
`- .github/            -> Workflows, templates e guias de contribuicao
```

## Como usar

1. Comece pela trilha em [src/content/docs/indice.md](src/content/docs/indice.md)
2. Leia a primeira nota disponivel: [HTML](src/content/docs/02-html.md)
3. Avance para [CSS](src/content/docs/03-css.md)
4. Resolva os desafios em [examples/exercises.md](examples/exercises.md)
5. Aplique os conceitos em [examples/projects.md](examples/projects.md)
6. Consulte o site publicado para navegar pelo conteudo em formato Starlight

## Conteudo atual

### Notas publicadas

- [Indice das anotacoes](src/content/docs/indice.md)
- [HTML](src/content/docs/02-html.md)
- [CSS](src/content/docs/03-css.md)
- [Consistencia Transacional](src/content/docs/10-system-design-consistencia-transacional.md)
- [Encurtador de URL](src/content/docs/11-system-design-encurtador-de-url.md)
- [Dual-Write Problem](src/content/docs/12-system-design-escrita-dupla.md)

### Pratica

- [Exercicios](examples/exercises.md)
- [Projetos](examples/projects.md)

## Rodando localmente

```bash
npm install
npm run dev
```

O servidor local fica em `http://localhost:4321`.

Outros comandos uteis:

```bash
npm run build
npm run preview
```

Versao publicada:

`https://caramelotech.github.io/web-dev-labs`

## Adicionando notas

Novas anotacoes devem ser criadas em `src/content/docs/`. Use nomes claros e prefixos numericos quando fizer parte da trilha.

Exemplo de frontmatter padrao Starlight:

```md
---
title: "Titulo da nota"
description: "Resumo curto explicando o foco da pagina."
lastUpdated: 2026-01-01
sidebar:
  order: 4
tags: ["web", "tema", "iniciante"]
---
```

Boas praticas:

- Escreva em portugues
- Comece pelo conceito antes do detalhamento tecnico
- Use links relativos entre notas quando houver continuidade
- Coloque imagens publicas em `public/assets/`

## Contribuicao

Contribuicoes sao bem-vindas. Voce pode ajudar com:

- Melhorias nas notas em `src/content/docs/`
- Novos exemplos em `examples/`
- Novos exercicios em `examples/exercises.md`
- Novos projetos em `examples/projects.md`
- Melhorias no site Astro + Starlight

Veja o [Guia de Contribuicao](.github/CONTRIBUTING.md) para detalhes.

## Licenca

MIT
