# Web Dev Labs

Bem-vindo ao **Web Dev Labs**, a trilha aberta do Caramelo Tech sobre **desenvolvimento web**.

Este repositório existe para ajudar pessoas curiosas a aprender, construir e compartilhar conhecimento em comunidade. A ideia é estudar com calma, praticar com exemplos reais e evoluir junto com outras pessoas que também gostam de tecnologia.

As notas deste repositório são publicadas no site do [Caramelo Labs](https://caramelotech.com.br/labs/web-dev/).

## O que você vai encontrar

- Conteúdo didático em português, pensado para estudo progressivo
- Notas em Markdown publicadas no hub do Caramelo Labs
- Exemplos de código e projetos implementados em `examples/`
- Exercícios e ideias de projetos em `notes/pratica/`
- Espaço aberto para contribuições da comunidade

## Conteúdo

| Seção                | Escopo                                                                   |
| -------------------- | ------------------------------------------------------------------------ |
| Fundamentos Web      | HTML, CSS e base da plataforma web                                       |
| Front-end e Design   | Atomic Design, front-end avançado e organização de interfaces            |
| Engenharia e Backend | Algoritmos, engenharia de software, APIs e bancos de dados               |
| Arquitetura e Escala | System design, mensageria, microsserviços, resiliência e observabilidade |
| Ferramentas          | Git, Conventional Commits, Pull Requests, fluxos e GPG                   |
| Prática              | Exercícios e projetos para aplicar os conteúdos do lab                   |

## Estrutura do repositório

```text
web-dev-labs/
├── notes/           -> Notas em Markdown puro publicadas no Caramelo Labs
│   └── pratica/     -> Exercícios e projetos propostos
├── examples/        -> Exemplos de código e projetos implementados de desenvolvimento web
├── sidebar.json     -> Ordem das seções no hub
├── .github/         -> Templates e guias de contribuição
└── LICENSE
```

Este repositório contém conteúdo e exemplos. A estrutura web que publica os labs vive no repositório hub [labs](https://github.com/caramelotech/labs), que busca as notas daqui e monta o site.

## Como estudar

1. Comece pelo [site do lab](https://caramelotech.com.br/labs/web-dev/) ou pelas notas em `notes/`
2. Siga a ordem sugerida em `sidebar.json`
3. Use `examples/` para ver implementações prontas
4. Pratique com os [exercícios](notes/pratica/01-exercicios.md)
5. Aplique os aprendizados nos [projetos](notes/pratica/02-projetos.md)

## Escrevendo notas

As notas em `notes/` são Markdown puro, sem frontmatter:

- A primeira linha da nota deve ser o título: `# Título da Nota`
- Use prefixo numérico no nome do arquivo para controlar a ordem: `01-introducao.md`, `02-conceitos.md`
- Agrupe conteúdos por tema em subpastas
- Imagens ficam junto das notas e usam caminho relativo
- Links internos publicados no hub usam o caminho completo: `/labs/web-dev/<secao>/<arquivo-com-prefixo>/`

Ao criar uma nova subpasta de tema, adicione a seção correspondente em `sidebar.json`.
