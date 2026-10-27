# DOM e eventos

## Tipos do DOM

O TypeScript traz tipos para toda a API do navegador: elementos, eventos, `fetch`, `localStorage` e assim por diante. Eles vêm da biblioteca `dom`, ativada pela opção `lib` do tsconfig:

```json
{
  "compilerOptions": {
    "lib": ["es2022", "dom", "dom.iterable"]
  }
}
```

Sem `lib` explícita, o TypeScript inclui o `dom` automaticamente junto com a versão do `target`. Em projetos só de Node.js, faz sentido remover o `dom` para que `document` e `window` deem erro, já que não existem lá.

Os tipos que você mais vai encontrar:

| Tipo                | O que representa                                        |
| ------------------- | ------------------------------------------------------- |
| `HTMLElement`       | Qualquer elemento HTML                                  |
| `HTMLInputElement`  | `<input>` (tem `value`, `checked`...)                   |
| `HTMLFormElement`   | `<form>` (tem `elements`, `reset()`...)                 |
| `HTMLButtonElement` | `<button>`                                              |
| `Event`             | Evento genérico                                         |
| `MouseEvent`        | Clique, movimento do mouse (tem `clientX`, `button`...) |
| `KeyboardEvent`     | Teclas (tem `key`, `ctrlKey`...)                        |
| `SubmitEvent`       | Envio de formulário                                     |

Eles formam uma hierarquia: um `HTMLInputElement` é um `HTMLElement`, que é um `Element`, que é um `Node`.

## Selecionando elementos

`document.getElementById` retorna `HTMLElement | null`. O `null` está lá porque o elemento pode não existir: um id digitado errado, um elemento que ainda não foi renderizado, ou o script rodando antes de o HTML ser carregado. Com `strictNullChecks`, você precisa lidar com esse caso:

```ts
const titulo = document.getElementById("titulo");
titulo.textContent = "Oi"; // erro: 'titulo' is possibly 'null'.

if (titulo) {
  titulo.textContent = "Oi"; // ok
}
```

Outro problema: `HTMLElement` é genérico demais. Um `<input>` tem `value`, mas um `HTMLElement` qualquer não:

```ts
const campo = document.getElementById("email");
campo.value; // erro: Property 'value' does not exist on type 'HTMLElement'.
```

A forma segura é estreitar com `instanceof`, que resolve o `null` e o tipo do elemento de uma vez:

```ts
const campo = document.getElementById("email");

if (campo instanceof HTMLInputElement) {
  console.log(campo.value); // campo: HTMLInputElement
}
```

`querySelector` é mais esperto: com um seletor de tag simples, ele já infere o tipo do elemento.

```ts
const input = document.querySelector("input"); // HTMLInputElement | null
const botao = document.querySelector("button"); // HTMLButtonElement | null
const qualquer = document.querySelector(".destaque"); // Element | null
```

Com seletores por classe ou id, o TypeScript não sabe que elemento vem. Você pode informar com um genérico, `document.querySelector<HTMLInputElement>("#email")`, mas repare que isso é uma afirmação, não uma checagem, e tem o mesmo risco do `as` (veja [Narrowing e type guards](/labs/web-dev/typescript/06-narrowing-e-type-guards/)). O `instanceof` continua sendo a opção que verifica de verdade.

## Eventos tipados

`addEventListener` usa o nome do evento para descobrir o tipo do objeto de evento. Você não precisa anotar nada:

```ts
const botao = document.querySelector("button");

botao?.addEventListener("click", (e) => {
  console.log(e.clientX); // e: MouseEvent
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharModal(); // e: KeyboardEvent
});
```

Uma diferença que confunde muita gente: `target` vs `currentTarget`.

- `e.target` é o elemento onde o evento **começou** (pode ser um filho, como um `<span>` dentro do botão). Por isso o TypeScript o tipa como `EventTarget | null`, sem saber que elemento é.
- `e.currentTarget` é o elemento em que o **listener foi registrado**.

Para ler o valor de um input dentro do próprio listener, `currentTarget` é o mais confiável. Ainda assim, ele é tipado de forma genérica, então um estreitamento é necessário:

```ts
input?.addEventListener("input", (e) => {
  const el = e.currentTarget;
  if (el instanceof HTMLInputElement) {
    console.log(el.value);
  }
});
```

## Exemplo: formulário tipado

Um handler de envio que lida com todos os casos sem `!` nem `as`:

```ts
const form = document.getElementById("cadastro");

if (!(form instanceof HTMLFormElement)) {
  throw new Error("Formulário #cadastro não encontrado");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const dados = new FormData(form);
  const email = dados.get("email"); // FormDataEntryValue | null (string ou File)

  if (typeof email !== "string" || email.trim() === "") {
    console.warn("E-mail vazio");
    return;
  }

  console.log("E-mail:", email.trim());
});
```

O `throw` no começo é um _early exit_: depois dele, o TypeScript sabe que `form` é um `HTMLFormElement` no resto do arquivo, inclusive dentro do callback. `FormData.get` pode devolver `null` (campo inexistente) ou um `File` (num `<input type="file">`), por isso a checagem com `typeof`.

## Erros comuns

O primeiro é calar o `null` com a _non-null assertion_ (`!`) em todo lugar:

```ts
const el = document.getElementById("preco")! as HTMLInputElement;
el.value = "10"; // se #preco não existir, TypeError em runtime
```

O código compila e o erro só aparece no navegador, com uma mensagem como "Cannot set properties of null". O `null` no tipo estava avisando de um problema real.

O segundo é rodar o script antes de o DOM existir. Um `<script>` no `<head>` executa antes do `<body>` ser lido, e todo `getElementById` volta `null`. A solução é carregar o script com `defer` (ou `type="module"`, que já é adiado por padrão), ou colocá-lo no fim do `<body>`:

```html
<script type="module" src="/main.js"></script>
```

## Prévia: TypeScript com React

Em React, os mesmos conceitos aparecem com outra roupagem. As props de um componente são descritas com `type` ou `interface`, e os eventos têm tipos próprios do React:

```tsx
type CampoProps = {
  rotulo: string;
  valor: string;
  onChange: (novoValor: string) => void;
};

function Campo({ rotulo, valor, onChange }: CampoProps) {
  return (
    <label>
      {rotulo}
      <input
        value={valor}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
      />
    </label>
  );
}
```

Em JSX, o tipo do evento costuma ser inferido, então a anotação de `e` acima é opcional; ela foi escrita só para mostrar o nome do tipo. Para ir além (hooks, context, componentes genéricos), o React TypeScript Cheatsheet, mantido pela comunidade, é a referência mais usada.

## Referências

- [Manipulação do DOM](https://www.typescriptlang.org/pt/docs/handbook/manipulacao-dom.html) - typescriptlang.org, pt-BR
- [Document.getElementById()](https://developer.mozilla.org/pt-BR/docs/Web/API/Document/getElementById) - MDN, pt-BR
- [Event.currentTarget](https://developer.mozilla.org/pt-BR/docs/Web/API/Event/currentTarget) - MDN, pt-BR
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/) - comunidade React TypeScript, en
