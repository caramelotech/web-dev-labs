# HTML

HTML (HyperText Markup Language) é a linguagem padrão usada para criar páginas e documentos na web. Ele define a estrutura básica do conteúdo de uma página web por meio de _tags_, que são usadas para formatar texto, adicionar imagens, criar links, formulários e muito mais. Essas _tags_ dizem ao navegador como exibir o conteúdo.

## Tags

### 1. Estruturação e Conteúdo

- **`<html>`**: Elemento raiz de um documento HTML. Tudo o que está no HTML deve estar dentro desta tag.
- **`<head>`**: Contém metadados (informações sobre o documento), como o título e links para arquivos CSS.
- **`<title>`**: Define o título da página que aparece na aba do navegador.
- **`<body>`**: Contém todo o conteúdo visível da página, como textos, imagens e links.
- **`<header>`**: Representa o cabeçalho de uma seção ou página, incluindo títulos e navegação.
- **`<nav>`**: Define um bloco de navegação, normalmente usado para links de menus.
- **`<main>`**: Representa o conteúdo principal da página.
- **`<footer>`**: Contém o rodapé da página ou seção, como créditos e informações de contato.
- **`<section>`**: Define uma seção temática dentro de um documento.
- **`<article>`**: Representa um conteúdo independente que pode ser distribuído ou reutilizado, como artigos de blog.
- **`<aside>`**: Define um conteúdo relacionado, mas não essencial, como barras laterais.
- **`<div>`**: Um contêiner genérico de bloco, usado para agrupar outros elementos.

### 2. Texto

- **`<h1>` a `<h6>`**: Definem títulos, sendo `<h1>` o mais importante e `<h6>` o menos.
- **`<p>`**: Define um parágrafo de texto.
- **`<span>`**: Um contêiner genérico em linha, usado para estilizar ou manipular partes do texto.
- **`<br>`**: Insere uma quebra de linha.
- **`<hr>`**: Insere uma linha horizontal, usada para separar conteúdo.
- **`<strong>`**: Define texto com ênfase forte (geralmente em negrito).
- **`<em>`**: Define texto com ênfase (geralmente em itálico).
- **`<b>`**: Define texto em negrito sem semântica de ênfase.
- **`<i>`**: Define texto em itálico sem semântica de ênfase.

### 3. Imagens e Mídia

- **`<img>`**: Insere uma imagem.
- **`<audio>`**: Insere um arquivo de áudio com controles.
- **`<video>`**: Insere um vídeo com controles.
- **`<source>`**: Define fontes de mídia alternativas para os elementos `<audio>` ou `<video>`.
- **`<figure>`**: Agrupa conteúdo de mídia (imagem ou vídeo) e legendas.
- **`<figcaption>`**: Define uma legenda para o conteúdo do `<figure>`.

### 4. Links e Navegação

- **`<a>`**: Define um link para outra página ou recurso.
- **`<link>`**: Define a relação entre o documento atual e um recurso externo (normalmente usado para CSS).

### 5. Tabelas

- **`<table>`**: Define uma tabela.
- **`<tr>`**: Define uma linha de tabela.
- **`<td>`**: Define uma célula de dados em uma tabela.
- **`<th>`**: Define uma célula de cabeçalho em uma tabela.
- **`<thead>`**: Agrupa cabeçalhos de tabela.
- **`<tbody>`**: Agrupa o corpo de uma tabela.
- **`<tfoot>`**: Agrupa o rodapé de uma tabela.

### 6. Formulários

- **`<form>`**: Define um formulário para coleta de dados do usuário.
- **`<input>`**: Define um campo de entrada de dados.
- **`<textarea>`**: Define uma área de texto multilinha.
- **`<button>`**: Define um botão interativo.
- **`<select>`**: Define uma lista suspensa.
- **`<option>`**: Define uma opção dentro de um `<select>`.
- **`<label>`**: Define um rótulo para um elemento `<input>`.
- **`<fieldset>`**: Agrupa elementos relacionados dentro de um formulário.
- **`<legend>`**: Fornece uma legenda para o `<fieldset>`.

### 7. Scripts e Estilos

- **`<style>`**: Contém código CSS para estilizar a página.
- **`<script>`**: Contém ou faz referência a scripts JavaScript.
- **`<noscript>`**: Define um conteúdo alternativo a ser exibido se o JavaScript estiver desabilitado no navegador.

### 8. Listas

- **`<ul>`**: Define uma lista não ordenada (com marcadores).
- **`<ol>`**: Define uma lista ordenada (numerada).
- **`<li>`**: Define um item dentro de uma lista.
- **`<dl>`**: Define uma lista de definição (termos e descrições).
- **`<dt>`**: Define um termo dentro de uma lista de definição.
- **`<dd>`**: Define uma descrição ou valor associado a um termo em uma lista de definição.

### 9. Metadados e SEO

- **`<meta>`**: Define metadados como charset, viewport e descrições para SEO.
- **`<base>`**: Define a URL base para todos os links relativos no documento.

### 10. Outras Tags

- **`<iframe>`**: Insere um conteúdo de outra página dentro da página atual.
- **`<canvas>`**: Define uma área para gráficos, geralmente manipulada por JavaScript.
- **`<svg>`**: Define gráficos vetoriais escaláveis.

Essas são as principais tags do HTML usadas para criar e estruturar páginas web. Cada tag tem um propósito específico, ajudando a organizar e apresentar o conteúdo de maneira correta e eficiente.

## Tags Semânticas

Tags semânticas no HTML são aquelas que possuem um significado claro e específico sobre o conteúdo que elas contêm, ajudando a definir a estrutura da página de maneira mais compreensível tanto para os desenvolvedores quanto para os navegadores e motores de busca (SEO).

Antes do HTML5, a marcação de estrutura de uma página costumava ser feita com tags não semânticas, como `<div>`, que não diz nada sobre o tipo de conteúdo. Com as tags semânticas, a estrutura da página se torna mais clara, facilitando a acessibilidade e a indexação por mecanismos de busca.

### Exemplos de tags semânticas

1. **`<header>`**: Representa o cabeçalho de uma página ou seção, contendo introduções, títulos, menus de navegação.

   ```html
   <header>
     <h1>Meu Site</h1>
     <nav>
       <ul>
         <li><a href="#">Início</a></li>
         <li><a href="#">Sobre</a></li>
       </ul>
     </nav>
   </header>
   ```

2. **`<nav>`**: Indica uma seção de navegação, normalmente usada para links de navegação em menus.

   ```html
   <nav>
     <ul>
       <li><a href="#">Página 1</a></li>
       <li><a href="#">Página 2</a></li>
     </ul>
   </nav>
   ```

3. **`<article>`**: Representa um conteúdo independente, como um post de blog, artigo de jornal, ou qualquer outra unidade de conteúdo que possa ser distribuída ou reutilizada de forma independente.

   ```html
   <article>
     <h2>Título do Artigo</h2>
     <p>Texto do artigo aqui.</p>
   </article>
   ```

4. **`<section>`**: Define uma seção temática dentro de um documento. Pode ser usada para dividir conteúdo em partes lógicas, como capítulos ou blocos temáticos.

   ```html
   <section>
     <h2>Seção de Tópicos</h2>
     <p>Conteúdo relacionado ao tópico.</p>
   </section>
   ```

5. **`<aside>`**: Representa um conteúdo que está relacionado ao conteúdo principal, mas é considerado complementar, como uma barra lateral ou uma nota.

   ```html
   <aside>
     <p>Informação adicional ou anúncio relacionado ao conteúdo.</p>
   </aside>
   ```

6. **`<footer>`**: Representa o rodapé de uma página ou seção, geralmente contendo informações sobre o autor, links de rodapé, direitos autorais, etc.

   ```html
   <footer>
     <p>© 2024 Meu Site. Todos os direitos reservados.</p>
   </footer>
   ```

7. **`<main>`**: Define o conteúdo principal do documento, ou seja, o conteúdo que é único e central para a página.

   ```html
   <main>
     <h1>Bem-vindo ao nosso site!</h1>
     <p>Aqui está o conteúdo principal.</p>
   </main>
   ```

### Benefícios das tags semânticas

- **Acessibilidade**: Facilitam o uso de leitores de tela e outras ferramentas assistivas, ajudando pessoas com deficiência a navegar pelo conteúdo.
- **SEO**: Motores de busca podem entender melhor a estrutura e o conteúdo da página, o que pode melhorar a classificação nos resultados de pesquisa.
- **Manutenção e legibilidade do código**: Torna o código mais fácil de ler e entender para outros desenvolvedores.

Em resumo, as tags semânticas adicionam significado ao conteúdo da página, indo além da simples formatação ou estrutura.

## Estrutura

```html
<!-- Tag com conteúdo -->
<tag>Conteúdo</tag>

<!-- Tag com conteúdo e propiedade-->
<tag prop="value">Conteúdo</tag>

<!-- Tag com fechanto que não recebe conteúdo-->
<tag />

<!-- Tag com fechanto que não recebe conteúdo e propriedade-->
<tag prop="value" />

<!-- Tag com fechanto que não recebe conteúdo e várias propriedades-->
<tag prop="value" prop2="value" />
```

```html
<html>
  <body>
    <h1>Lista de Invenções Malucas do Professor Pardal</h1>
    <ul>
      <li>🧲 Ímã que atrai apenas boas ideias</li>
      <li>🕺 Sapatos que fazem você dançar como um profissional</li>
      <li>🍫 Máquina de transformar qualquer coisa em chocolate</li>
      <li>📚 Livro infinito com todas as histórias do mundo</li>
      <li>🌈 Pincel que pinta com as cores do arco-íris</li>
    </ul>
  </body>
</html>
```

## Tags div e span

As tags `<span>` e `<div>` no HTML são usadas principalmente para estruturar e agrupar partes do conteúdo, mas são diferentes das outras tags em sua função e comportamento:

### Propósito

- **`<div>`**: É um contêiner de bloco (_block-level element_). Ele é usado para agrupar elementos de bloco ou conteúdo que deve ser tratado como um bloco separado. Por exemplo, pode ser usado para agrupar parágrafos, imagens e seções completas da página. Um `<div>` normalmente ocupa toda a largura disponível da tela.
- **`<span>`**: É um elemento em linha (_inline element_). Ele é usado para agrupar partes menores de conteúdo dentro de outros elementos, como uma única palavra ou frase dentro de um parágrafo, sem forçar uma quebra de linha. O `<span>` só ocupa o espaço necessário para o conteúdo.

### Comportamento

- **`<div>`**: Como um elemento de bloco, ele começa em uma nova linha e pode conter outros elementos de bloco ou elementos em linha.
- **`<span>`**: Como um elemento em linha, ele não inicia uma nova linha e apenas envolve o conteúdo sem afetar o fluxo de outros elementos ao redor.

### Uso com CSS

Tanto `<div>` quanto `<span>` são frequentemente usados em conjunto com CSS para estilizar partes específicas do conteúdo. Um `<div>` geralmente é usado para estruturar grandes blocos, enquanto o `<span>` é usado para aplicar estilos a partes menores de texto ou conteúdo dentro de um elemento.

### Exemplos

- **`<div>`:**
  ```html
  <div>
    <h1>Título</h1>
    <p>Este é um parágrafo.</p>
  </div>
  ```
- **`<span>`:**
  ```html
  <p>
    Este é um <span style="color:red;">texto em vermelho</span> dentro de um
    parágrafo.
  </p>
  ```

Enquanto outras tags como `<h1>`, `<p>`, `<a>`, e `<img>` têm funções específicas (definir títulos, parágrafos, links, imagens), `<div>` e `<span>` são genéricas e usadas para organização e estilização do conteúdo.

## Referências

- [W3Schools - HTML](https://www.w3schools.com/html/)
- [O Essencial de HTML - Fundamentos Essenciais para o Desenvolvimento de Aplicações | Cod3r Cursos](https://www.youtube.com/watch?v=BRd8_yFzQiA)

**[← Voltar ao índice](README.md)**
