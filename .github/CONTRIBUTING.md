# Guia de Contribuicao

Obrigado por querer contribuir com o Web Dev Labs.

## O que pode ser contribuido

- Melhorias e correcoes nas anotacoes em `src/content/docs/`
- Novos exemplos praticos em `examples/`
- Exercicios adicionais em `examples/exercises.md`
- Projetos praticos em `examples/projects.md`
- Melhorias no site Astro + Starlight

## Processo

1. Crie uma branch a partir de `main` seguindo o padrao:

   ```text
   feature/descricao-curta
   fix/descricao-curta
   docs/descricao-curta
   ```

2. Faca commits atomicos com mensagens no padrao de Conventional Commits:

   ```text
   feat: adicionar anotacoes sobre javascript
   fix: corrigir exemplo de seletor css
   docs: melhorar introducao sobre html semantico
   ```

3. Abra um Pull Request usando o template do repositorio.

4. Apos aprovacao, o merge sera feito por uma pessoa mantenedora.

## Rodando o site localmente

```bash
npm install
npm run dev
```

O site fica disponivel em `http://localhost:4321`.

Para validar antes de abrir o PR:

```bash
npm run build
npm run preview
```

## Padroes de conteudo

### Anotacoes em `src/content/docs/`

- Escreva em portugues
- Use titulos hierarquicos (`##`, `###`)
- Prefira exemplos curtos e objetivos
- Explique o "por que" alem do "como"
- Nomeie os arquivos com prefixo numerico quando fizer parte da trilha
- Use frontmatter Starlight completo

Frontmatter recomendado:

```yaml
---
title: "Titulo da nota"
description: "Resumo curto explicando o foco da pagina."
lastUpdated: 2026-01-01
sidebar:
  order: 4
tags: ["web", "tema", "iniciante"]
---
```

Se precisar de imagens, coloque os arquivos em `public/assets/` e referencie com o caminho absoluto do site.

### Exemplos em `examples/`

- Um conceito por pasta ou arquivo quando fizer sentido
- Inclua um `README.md` com objetivo e resultado esperado
- Use apenas as tecnologias ensinadas ate aquele ponto da trilha

### Exercicios em `examples/exercises.md`

- Descreva claramente o objetivo
- Indique o nivel de dificuldade quando necessario
- Inclua criterios de sucesso em formato de checklist

### Projetos em `examples/projects.md`

- Descreva o objetivo e o contexto
- Liste requisitos em formato de checklist
- Inclua ao menos um exemplo de entregavel esperado

## Duvidas

Abra uma issue com a tag `question`.
