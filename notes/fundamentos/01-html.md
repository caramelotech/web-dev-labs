# HTML

HTML (HyperText Markup Language) é a linguagem padrão usada para criar páginas e documentos na web. Ele define a estrutura básica do conteúdo de uma página por meio de tags usadas para formatar texto, adicionar imagens, criar links, formulários e muito mais.

## Tags

### 1. Estruturação e Conteúdo

- **`<html>`**: Elemento raiz de um documento HTML.
- **`<head>`**: Contém metadados, como título da página e links para CSS.
- **`<title>`**: Define o título exibido na aba do navegador.
- **`<body>`**: Contém o conteúdo visível da página.
- **`<header>`**: Representa o cabeçalho de uma seção ou página.
- **`<nav>`**: Define um bloco de navegação.
- **`<main>`**: Representa o conteúdo principal da página.
- **`<footer>`**: Contém o rodapé da página ou seção.
- **`<section>`**: Define uma seção temática.
- **`<article>`**: Representa um conteúdo independente.
- **`<aside>`**: Define um conteúdo relacionado, mas não essencial.
- **`<div>`**: Um contêiner genérico de bloco.

### 2. Texto

- **`<h1>` a `<h6>`**: Definem títulos com níveis de importância.
- **`<p>`**: Define um parágrafo.
- **`<span>`**: Um contêiner genérico em linha.
- **`<br>`**: Insere uma quebra de linha.
- **`<hr>`**: Insere uma linha horizontal.
- **`<strong>`**: Define texto com ênfase forte.
- **`<em>`**: Define texto com ênfase.
- **`<b>`**: Define texto em negrito sem ênfase semântica.
- **`<i>`**: Define texto em itálico sem ênfase semântica.

### 3. Imagens e Mídia

- **`<img>`**: Insere uma imagem.
- **`<audio>`**: Insere áudio com controles.
- **`<video>`**: Insere vídeo com controles.
- **`<source>`**: Define fontes alternativas de mídia.
- **`<figure>`**: Agrupa mídia e legenda.
- **`<figcaption>`**: Define uma legenda para o `<figure>`.

### 4. Links e Navegação

- **`<a>`**: Define um link.
- **`<link>`**: Define a relação entre o documento e um recurso externo.

### 5. Tabelas

- **`<table>`**: Define uma tabela.
- **`<tr>`**: Define uma linha de tabela.
- **`<td>`**: Define uma célula de dados.
- **`<th>`**: Define uma célula de cabeçalho.
- **`<thead>`**, **`<tbody>`** e **`<tfoot>`**: Agrupam as partes da tabela.

### 6. Formulários

- **`<form>`**: Define um formulário.
- **`<input>`**: Define um campo de entrada.
- **`<textarea>`**: Define uma área de texto multilinha.
- **`<button>`**: Define um botão interativo.
- **`<select>`** e **`<option>`**: Definem listas suspensas.
- **`<label>`**: Define um rótulo para um campo.
- **`<fieldset>`** e **`<legend>`**: Agrupam campos relacionados.

### 7. Scripts e Estilos

- **`<style>`**: Contém código CSS.
- **`<script>`**: Contém ou referencia scripts JavaScript.
- **`<noscript>`**: Define um conteúdo alternativo quando o JavaScript está desabilitado.

### 8. Listas

- **`<ul>`**: Define uma lista não ordenada.
- **`<ol>`**: Define uma lista ordenada.
- **`<li>`**: Define um item dentro de uma lista.
- **`<dl>`**, **`<dt>`** e **`<dd>`**: Definem listas de definição.

### 9. Metadados e SEO

- **`<meta>`**: Define metadados como charset, viewport e descrições.
- **`<base>`**: Define a URL base para links relativos.

### 10. Outras Tags

- **`<iframe>`**: Insere conteúdo de outra página.
- **`<canvas>`**: Define uma área para gráficos via JavaScript.
- **`<svg>`**: Define gráficos vetoriais escaláveis.

## Tags Semânticas

Tags semânticas são aquelas que possuem significado claro sobre o conteúdo que envolvem, ajudando navegadores, mecanismos de busca e tecnologias assistivas a entenderem melhor a estrutura da página.

### Exemplos de tags semânticas

1. **`<header>`**: Representa o cabeçalho de uma página ou seção.
2. **`<nav>`**: Indica uma seção de navegação.
3. **`<article>`**: Representa um conteúdo independente.
4. **`<section>`**: Define uma seção temática.
5. **`<aside>`**: Representa um conteúdo complementar.
6. **`<footer>`**: Representa o rodapé.
7. **`<main>`**: Define o conteúdo principal do documento.

### Benefícios das tags semânticas

- **Acessibilidade**: facilitam o uso de leitores de tela e outras tecnologias assistivas.
- **SEO**: ajudam mecanismos de busca a entender melhor a estrutura da página.
- **Legibilidade**: tornam o código mais fácil de ler e manter.

## Estrutura

```html
<!-- Tag com conteúdo -->
<tag>Conteudo</tag>

<!-- Tag com conteúdo e propriedade -->
<tag prop="value">Conteudo</tag>

<!-- Tag autocontida -->
<tag />
```

```html
<html>
  <body>
    <h1>Lista de Invencoes Malucas do Professor Pardal</h1>
    <ul>
      <li>Ima que atrai apenas boas ideias</li>
      <li>Sapatos que fazem voce dancar como um profissional</li>
      <li>Maquina de transformar qualquer coisa em chocolate</li>
      <li>Livro infinito com todas as historias do mundo</li>
      <li>Pincel que pinta com as cores do arco-iris</li>
    </ul>
  </body>
</html>
```

## Tags `div` e `span`

As tags `<div>` e `<span>` são usadas para agrupar conteúdo:

- **`<div>`**: contêiner de bloco, ideal para estruturar seções maiores.
- **`<span>`**: elemento em linha, ideal para destacar pequenos trechos de conteúdo.

## Referências

- [W3Schools - HTML](https://www.w3schools.com/html/)
- [O Essencial de HTML - Fundamentos Essenciais para o Desenvolvimento de Aplicações | Cod3r Cursos](https://www.youtube.com/watch?v=BRd8_yFzQiA)

[Voltar ao início](/labs/web-dev/)
