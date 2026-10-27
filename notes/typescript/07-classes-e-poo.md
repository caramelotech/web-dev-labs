# Classes e POO

## Classes tipadas

As classes do TypeScript são as classes do JavaScript (ES2015+) com checagem de tipos em campos, construtor e métodos:

```ts
class Usuario {
  id: string;
  nome: string;

  constructor(id: string, nome: string) {
    this.id = id;
    this.nome = nome;
  }

  saudacao(): string {
    return `Olá, ${this.nome}`;
  }
}

const u = new Usuario("1", "Ana");
u.saudacao();
```

Os campos são declarados no corpo da classe com seus tipos. Com `strict`, a opção `strictPropertyInitialization` exige que todo campo seja inicializado na declaração ou no construtor:

```ts
class Conta {
  saldo: number; // erro: Property 'saldo' has no initializer and is not definitely assigned in the constructor.
}

class Conta2 {
  saldo = 0; // ok, e o tipo number é inferido
}
```

Se o campo é preenchido por outro mecanismo (um framework de injeção de dependência, por exemplo), o `!` na declaração (`saldo!: number`) avisa ao compilador que ele vai estar lá. Use com parcimônia.

## Modificadores de acesso

| Modificador       | Quem acessa                |
| ----------------- | -------------------------- |
| `public` (padrão) | Qualquer um                |
| `private`         | Só a própria classe        |
| `protected`       | A classe e suas subclasses |

```ts
class ContaBancaria {
  public titular: string;
  private saldo = 0;
  protected readonly agencia: string;
  static readonly banco = "Caramelo Bank";

  constructor(titular: string, agencia: string) {
    this.titular = titular;
    this.agencia = agencia;
  }

  depositar(valor: number) {
    this.saldo += valor; // ok, dentro da classe
  }
}

const conta = new ContaBancaria("Ana", "0001");
conta.saldo = 1_000_000; // erro: Property 'saldo' is private and only accessible within class 'ContaBancaria'.
ContaBancaria.banco; // "Caramelo Bank"
```

`readonly` permite atribuir o campo só na declaração ou no construtor. `static` pertence à classe, não às instâncias: você acessa por `ContaBancaria.banco`, não por `conta.banco`.

### private vs #campo

Aqui mora uma pegadinha clássica de entrevista. O `private` do TypeScript é **só de compilação**. Depois que os tipos são apagados, o campo é uma propriedade comum do objeto:

```ts
(conta as any).saldo; // funciona em runtime
conta["saldo"]; // o próprio TS permite acesso com colchetes
```

O JavaScript tem campos privados de verdade desde o ES2022, com `#`. Eles são inacessíveis fora da classe também em runtime:

```ts
class Cofre {
  #segredo = "1234";

  conferir(tentativa: string) {
    return tentativa === this.#segredo;
  }
}

const c = new Cofre();
c.#segredo; // erro de sintaxe: não existe forma de acessar de fora
```

Use `private` quando o objetivo é organizar o código e guiar quem usa a classe. Use `#` quando a privacidade precisa ser garantida (bibliotecas, dados sensíveis em memória).

## Parameter properties

Declarar o campo, receber no construtor e atribuir é repetitivo. As _parameter properties_ fazem as três coisas de uma vez, bastando colocar um modificador no parâmetro:

```ts
class Usuario {
  constructor(
    public readonly id: string,
    public nome: string,
    private email: string,
  ) {}
}
// equivale a declarar id, nome e email e atribuir cada um no construtor
```

Elas são populares (muito usadas em NestJS e Angular), mas têm um porém atual: geram código JavaScript (as atribuições `this.id = id`), então **não são sintaxe apagável**. Não rodam com o type stripping padrão do Node.js e são barradas pela opção `erasableSyntaxOnly`. Se o projeto adota essa opção, a forma explícita (campos declarados + atribuição) é o caminho. Mais contexto em [Introdução e configuração](/labs/web-dev/typescript/01-introducao-e-configuracao/).

## implements e extends

`implements` faz a classe prometer que segue o formato de uma interface. Se faltar algo, o erro aparece na classe:

```ts
interface Identificavel {
  id: string;
}

interface Serializavel {
  toJSON(): string;
}

class Produto implements Identificavel, Serializavel {
  constructor(
    public id: string,
    public preco: number,
  ) {}

  toJSON() {
    return JSON.stringify({ id: this.id, preco: this.preco });
  }
}
```

Uma classe pode implementar várias interfaces, mas estender (herdar de) só uma classe. Com `extends`, a subclasse herda campos e métodos, e chama o construtor da classe pai com `super()`:

```ts
class Admin extends Usuario {
  constructor(
    id: string,
    nome: string,
    email: string,
    public nivel: number,
  ) {
    super(id, nome, email); // obrigatório antes de usar this
  }

  override toString() {
    return `[admin] ${this.nome}`;
  }
}
```

A palavra `override` deixa explícito que o método substitui um da classe pai. Com a opção `noImplicitOverride`, ela se torna obrigatória, e o compilador avisa se o método da classe pai for renomeado ou removido.

## Classes abstratas

Uma classe `abstract` não pode ser instanciada diretamente; ela existe para ser estendida. Métodos `abstract` não têm corpo e precisam ser implementados pelas subclasses:

```ts
abstract class Forma {
  abstract area(): number;

  descrever() {
    return `Forma com área ${this.area().toFixed(2)}`;
  }
}

class Circulo extends Forma {
  constructor(private raio: number) {
    super();
  }

  area() {
    return Math.PI * this.raio ** 2;
  }
}

new Forma(); // erro: Cannot create an instance of an abstract class.
new Circulo(2).descrever();
```

A diferença para uma interface: a interface só descreve o formato e some na compilação; a classe abstrata pode trazer implementação compartilhada (como `descrever`) e existe em runtime. Se você só precisa de um contrato, a interface basta.

## Quando usar classes

Classes fazem sentido quando você tem estado e comportamento que andam juntos e precisa controlar o acesso a esse estado: uma conexão com banco, um cliente HTTP configurado, uma entidade de domínio com regras. Para dados simples (o que chega de uma API, props de um componente), um objeto descrito por `type` ou `interface` é mais leve e funciona igual.

Outra recomendação que vale para qualquer linguagem: prefira composição a herança. Herança cria um acoplamento forte ("é um"), e hierarquias com três, quatro níveis ficam frágeis, porque mudar a classe base afeta todo mundo abaixo dela. Composição ("tem um") monta o comportamento a partir de peças menores:

```ts
// herança: Relatorio "é um" Exportador
class RelatorioPDF extends ExportadorPDF {}

// composição: Relatorio "tem um" exportador, que pode ser trocado
class Relatorio {
  constructor(private exportador: Exportador) {}

  gerar() {
    return this.exportador.exportar(this.dados());
  }

  private dados() {
    return "...";
  }
}
```

Essa ideia aparece também nos princípios SOLID, em [SOLID](/labs/web-dev/engenharia-de-software/01-solid/).

## Referências

- [Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html) - TypeScript Handbook, en
- [TypeScript para programadores OOP](https://www.typescriptlang.org/pt/docs/handbook/typescript-in-5-minutes-oop.html) - typescriptlang.org, pt-BR
- [Classes](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Classes) - MDN, pt-BR
- [Private elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements) - MDN, en
