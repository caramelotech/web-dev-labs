---
title: "HTML"
description: "Entenda a estrutura basica do HTML, as principais tags e o uso de semantica na web."
lastUpdated: 2026-04-13
sidebar:
  order: 2
tags: ["html", "semantica", "web", "iniciante"]
---

HTML (HyperText Markup Language) e a linguagem padrao usada para criar paginas e documentos na web. Ele define a estrutura basica do conteudo de uma pagina por meio de tags usadas para formatar texto, adicionar imagens, criar links, formularios e muito mais.

## Tags

### 1. Estruturacao e Conteudo

- **`<html>`**: Elemento raiz de um documento HTML.
- **`<head>`**: Contem metadados, como titulo da pagina e links para CSS.
- **`<title>`**: Define o titulo exibido na aba do navegador.
- **`<body>`**: Contem o conteudo visivel da pagina.
- **`<header>`**: Representa o cabecalho de uma secao ou pagina.
- **`<nav>`**: Define um bloco de navegacao.
- **`<main>`**: Representa o conteudo principal da pagina.
- **`<footer>`**: Contem o rodape da pagina ou secao.
- **`<section>`**: Define uma secao tematica.
- **`<article>`**: Representa um conteudo independente.
- **`<aside>`**: Define um conteudo relacionado, mas nao essencial.
- **`<div>`**: Um conteiner generico de bloco.

### 2. Texto

- **`<h1>` a `<h6>`**: Definem titulos com niveis de importancia.
- **`<p>`**: Define um paragrafo.
- **`<span>`**: Um conteiner generico em linha.
- **`<br>`**: Insere uma quebra de linha.
- **`<hr>`**: Insere uma linha horizontal.
- **`<strong>`**: Define texto com enfase forte.
- **`<em>`**: Define texto com enfase.
- **`<b>`**: Define texto em negrito sem enfase semantica.
- **`<i>`**: Define texto em italico sem enfase semantica.

### 3. Imagens e Midia

- **`<img>`**: Insere uma imagem.
- **`<audio>`**: Insere audio com controles.
- **`<video>`**: Insere video com controles.
- **`<source>`**: Define fontes alternativas de midia.
- **`<figure>`**: Agrupa midia e legenda.
- **`<figcaption>`**: Define uma legenda para o `<figure>`.

### 4. Links e Navegacao

- **`<a>`**: Define um link.
- **`<link>`**: Define a relacao entre o documento e um recurso externo.

### 5. Tabelas

- **`<table>`**: Define uma tabela.
- **`<tr>`**: Define uma linha de tabela.
- **`<td>`**: Define uma celula de dados.
- **`<th>`**: Define uma celula de cabecalho.
- **`<thead>`**, **`<tbody>`** e **`<tfoot>`**: Agrupam as partes da tabela.

### 6. Formularios

- **`<form>`**: Define um formulario.
- **`<input>`**: Define um campo de entrada.
- **`<textarea>`**: Define uma area de texto multilinha.
- **`<button>`**: Define um botao interativo.
- **`<select>`** e **`<option>`**: Definem listas suspensas.
- **`<label>`**: Define um rotulo para um campo.
- **`<fieldset>`** e **`<legend>`**: Agrupam campos relacionados.

### 7. Scripts e Estilos

- **`<style>`**: Contem codigo CSS.
- **`<script>`**: Contem ou referencia scripts JavaScript.
- **`<noscript>`**: Define um conteudo alternativo quando o JavaScript esta desabilitado.

### 8. Listas

- **`<ul>`**: Define uma lista nao ordenada.
- **`<ol>`**: Define uma lista ordenada.
- **`<li>`**: Define um item dentro de uma lista.
- **`<dl>`**, **`<dt>`** e **`<dd>`**: Definem listas de definicao.

### 9. Metadados e SEO

- **`<meta>`**: Define metadados como charset, viewport e descricoes.
- **`<base>`**: Define a URL base para links relativos.

### 10. Outras Tags

- **`<iframe>`**: Insere conteudo de outra pagina.
- **`<canvas>`**: Define uma area para graficos via JavaScript.
- **`<svg>`**: Define graficos vetoriais escalaveis.

## Tags Semanticas

Tags semanticas sao aquelas que possuem significado claro sobre o conteudo que envolvem, ajudando navegadores, mecanismos de busca e tecnologias assistivas a entenderem melhor a estrutura da pagina.

### Exemplos de tags semanticas

1. **`<header>`**: Representa o cabecalho de uma pagina ou secao.
2. **`<nav>`**: Indica uma secao de navegacao.
3. **`<article>`**: Representa um conteudo independente.
4. **`<section>`**: Define uma secao tematica.
5. **`<aside>`**: Representa um conteudo complementar.
6. **`<footer>`**: Representa o rodape.
7. **`<main>`**: Define o conteudo principal do documento.

### Beneficios das tags semanticas

- **Acessibilidade**: facilitam o uso de leitores de tela e outras tecnologias assistivas.
- **SEO**: ajudam mecanismos de busca a entender melhor a estrutura da pagina.
- **Legibilidade**: tornam o codigo mais facil de ler e manter.

## Estrutura

```html
<!-- Tag com conteudo -->
<tag>Conteudo</tag>

<!-- Tag com conteudo e propriedade -->
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

As tags `<div>` e `<span>` sao usadas para agrupar conteudo:

- **`<div>`**: conteiner de bloco, ideal para estruturar secoes maiores.
- **`<span>`**: elemento em linha, ideal para destacar pequenos trechos de conteudo.

## Referencias

- [W3Schools - HTML](https://www.w3schools.com/html/)
- [O Essencial de HTML - Fundamentos Essenciais para o Desenvolvimento de Aplicacoes | Cod3r Cursos](https://www.youtube.com/watch?v=BRd8_yFzQiA)

[Voltar ao indice](/web-dev-labs/indice/)
