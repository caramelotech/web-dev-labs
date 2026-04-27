# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sobre o projeto

Web Dev Labs é uma base de conhecimento sobre desenvolvimento web da Caramelo Tech, voltada para iniciantes. O conteúdo cobre HTML, CSS, JavaScript, System Design, Backend e Ferramentas, publicado com Astro + Starlight no GitHub Pages em `https://caramelotech.github.io/web-dev-labs`.

## Comandos

```bash
npm install        # Instalar dependências
npm run dev        # Servidor local em http://localhost:4321
npm run build      # Build de produção
npm run preview    # Visualizar o build localmente
```

## Arquitetura

- `src/content/docs/` - Anotações publicadas no site Starlight
  - `fundamentos/` - HTML, CSS e conceitos básicos da web
  - `backend/` - SQL, HTTP/REST e tópicos de servidor
  - `system-design/` - Padrões de arquitetura e problemas clássicos
  - `ferramentas/` - Git e utilitários de desenvolvimento
  - `index.mdx` - Página inicial do site
- `examples/` - Exercícios e projetos práticos (Markdown puro, não publicados no Starlight)
- `public/assets/` - Imagens e arquivos estáticos referenciados nas notas
- `astro.config.mjs` - Configuração do Astro e do Starlight, incluindo sidebar e `base: '/web-dev-labs'`
- `src/styles/custom.css` - Customizações de estilo do Starlight

## Deployment

O site é publicado via GitHub Actions no GitHub Pages. O campo `base: '/web-dev-labs'` em `astro.config.mjs` é obrigatório para que os links e assets funcionem corretamente no subpath. Não remova esse campo.

## Convenções de conteúdo

- **Idioma:** Português (pt-BR)
- **Frontmatter** obrigatório em todas as notas Starlight:
  ```yaml
  ---
  title: "Título da nota"
  description: "Resumo curto explicando o foco da página."
  lastUpdated: 2026-01-01
  sidebar:
    order: 1
  tags: ["tema", "subtema"]
  ---
  ```
- Não repita o `title` como `# h1` - o Starlight renderiza o título automaticamente.
- Use `##` e `###` para seções dentro da nota.

## Regra de sidebar.order

**`sidebar.order` é sequencial por diretório**, não global. A ordem entre seções é controlada pelo array `sidebar` em `astro.config.mjs`. Dentro de cada pasta, numere os arquivos a partir de 1 (ex: `01-git.md`, `02-http-rest.md`).

**Seções atuais:** Fundamentos Web, Backend, System Design, Ferramentas.

Para adicionar uma nova seção:

1. Crie o diretório em `src/content/docs/nova-categoria/`
2. Adicione uma entrada `autogenerate` em `astro.config.mjs`:
   ```javascript
   {
     label: "Título da Seção",
     autogenerate: { directory: "nova-categoria" },
   }
   ```
