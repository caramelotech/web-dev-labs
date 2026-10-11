# Princípios SOLID

SOLID é um acrônimo para cinco princípios de design orientado a objetos: **S**ingle Responsibility, **O**pen/Closed, **L**iskov Substitution, **I**nterface Segregation e **D**ependency Inversion. Eles não nasceram juntos como um pacote fechado: Robert C. Martin (o "Uncle Bob") reuniu e descreveu esses princípios no artigo "Design Principles and Design Patterns", de 2000, e foi Michael Feathers quem, alguns anos depois (por volta de 2004), percebeu que as iniciais formavam a palavra SOLID e batizou o conjunto assim.

O objetivo dos cinco não é deixar o código com "cara de profissional" ou empilhar abstração por empilhar. É baixar o custo de mudar, testar, estender e entender um sistema conforme ele cresce. Um código que segue SOLID não é necessariamente menor ou mais rápido de escrever na primeira versão, é mais barato de alterar na quinta versão, quando o time já não é o mesmo e ninguém lembra todos os detalhes de quando aquilo foi escrito.

## S - Princípio da Responsabilidade Única

Uma classe deve ter um, e só um, motivo para mudar.

Repare que o princípio fala em "motivo para mudar", não em "fazer uma coisa só" no sentido literal. Uma classe pode ter vários métodos e ainda respeitar o SRP, desde que todos esses métodos sirvam ao mesmo motivo de mudança. O problema aparece quando dois motivos de mudança completamente diferentes ficam amarrados na mesma classe: mudar um força a mexer na outra, mesmo que ela não tenha nada a ver com o que motivou a mudança.

```ts
// Viola o SRP: login, persistência, analytics e notificação
// mudam por motivos diferentes, mas estão presos na mesma classe
class UserManager {
  login(credentials: Credentials) {
    /* ... */
  }
  saveUser(user: User) {
    /* ... */
  }
  trackSignupEvent(user: User) {
    /* ... */
  }
  sendWelcomeEmail(user: User) {
    /* ... */
  }
}
```

Se o time de marketing pede uma métrica nova de analytics, alguém mexe em `UserManager` e corre o risco de quebrar o fluxo de login, que não tinha nada a ver com o pedido. Separando por responsabilidade, cada mudança fica isolada no lugar certo:

```ts
class LoginUseCase {
  execute(credentials: Credentials) {
    /* ... */
  }
}
class UserRepository {
  save(user: User) {
    /* ... */
  }
}
class AnalyticsTracker {
  trackSignup(user: User) {
    /* ... */
  }
}
class WelcomeEmailSender {
  send(user: User) {
    /* ... */
  }
}
```

Nenhuma dessas classes cresce por um motivo que não seja o próprio: `AnalyticsTracker` só muda se a estratégia de rastreamento mudar, `UserRepository` só muda se a forma de persistir usuário mudar. É o mesmo raciocínio de separação de responsabilidade que aparece em [Arquitetura em Camadas](/labs/web-dev/engenharia-de-software/02-arquitetura-em-camadas/), aplicado agora dentro de uma única camada, entre classes.

## O - Princípio Aberto/Fechado

O código deve estar aberto para extensão, mas fechado para modificação: dá para adicionar comportamento novo sem alterar código que já existe e já está testado.

O exemplo clássico é um sistema que processa pagamentos. Sem o princípio, cada método de pagamento novo vira um `if`/`else` a mais dentro da mesma função:

```ts
// Fechado para extensão: cada método novo exige editar esta função
function processPayment(type: string, amount: number) {
  if (type === "card") {
    /* cobra no cartão */
  } else if (type === "pix") {
    /* cobra via Pix */
  }
  // um método novo = editar esta função de novo
}
```

Com uma abstração no meio, adicionar um método de pagamento vira escrever uma classe nova, sem tocar em nada que já funcionava:

```ts
interface PaymentProcessor {
  pay(amount: number): void;
}

class CardPayment implements PaymentProcessor {
  pay(amount: number) {
    /* cobra no cartão */
  }
}

class PixPayment implements PaymentProcessor {
  pay(amount: number) {
    /* cobra via Pix */
  }
}

// método novo? uma classe nova, ninguém mexe nas duas de cima
class BoletoPayment implements PaymentProcessor {
  pay(amount: number) {
    /* gera boleto */
  }
}
```

Isso importa porque código antigo e testado é código de baixo risco. Toda vez que alguém edita uma função que já está em produção há meses, existe uma chance real de quebrar um caso que ninguém lembra de testar de novo. Extensão via classe nova não corre esse risco, porque não toca no que já existia.

## L - Princípio da Substituição de Liskov

Uma subclasse deve poder substituir sua classe base em qualquer lugar que espera a classe base, sem que o comportamento observado quebre.

O nome vem de Barbara Liskov, cientista da computação que apresentou essa ideia numa palestra de 1987 chamada "Data Abstraction and Hierarchy". A formulação dela é mais formal (fala em pré-condições, pós-condições e invariantes), mas a versão prática do dia a dia é: se o código que usa uma interface confia num certo comportamento, toda implementação dessa interface precisa entregar esse comportamento, não só a assinatura do método.

```ts
interface MediaPlayer {
  play(): void;
}

class Mp3Player implements MediaPlayer {
  play() {
    /* toca o áudio */
  }
}

// viola o LSP: quem recebe um MediaPlayer espera que play() funcione,
// e essa implementação quebra essa expectativa
class BrokenPlayer implements MediaPlayer {
  play() {
    throw new Error("not supported");
  }
}
```

Uma função que recebe `MediaPlayer` e chama `.play()` não tem como saber, só olhando o tipo, que `BrokenPlayer` vai estourar uma exceção. O contrato da interface prometia que tocar era uma operação válida para qualquer `MediaPlayer`, e essa implementação quebrou a promessa. Isso é um sinal de que o problema não está em quem chama o método, está no desenho da abstração: `BrokenPlayer` provavelmente não deveria implementar `MediaPlayer`, ou a interface deveria ser menor (o que já é o próximo princípio).

## I - Princípio da Segregação de Interfaces

Uma classe não deveria ser forçada a depender de métodos que ela não usa.

Interfaces grandes e genéricas acabam empurrando implementações vazias ou que lançam erro para métodos que não fazem sentido para aquele caso específico, o mesmo cheiro visto no LSP.

```ts
// Interface grande: nem todo repositório precisa de sync()
interface Repository {
  fetch(id: string): Data;
  save(data: Data): void;
  delete(id: string): void;
  sync(): void;
}
```

Uma implementação somente-leitura (por exemplo, um repositório que lê de uma API externa de terceiros) é forçada a "implementar" `save`, `delete` e `sync` de algum jeito, mesmo sem sentido nenhum para ela. Quebrando a interface grande em pedaços menores e coesos, cada implementação depende só do que realmente usa:

```ts
interface Reader {
  fetch(id: string): Data;
}
interface Writer {
  save(data: Data): void;
  delete(id: string): void;
}

// só implementa o que faz sentido para o caso dela
class ThirdPartyApiRepository implements Reader {
  fetch(id: string) {
    /* ... */
  }
}
```

O ganho não é só estético. Uma interface menor também comunica melhor: quem lê `Reader` já sabe que aquele componente só lê, sem precisar abrir a implementação para descobrir que `save` lança `not implemented`.

## D - Princípio da Inversão de Dependência

Módulos de alto nível (a regra de negócio) não devem depender de módulos de baixo nível (detalhes de implementação, como qual banco de dados ou qual serviço externo está sendo usado). Os dois devem depender de uma abstração.

Repare que "inversão" aqui é literal: no código sem esse princípio, a regra de negócio depende diretamente do detalhe concreto. Com o princípio aplicado, é o detalhe concreto que passa a depender da abstração que a regra de negócio define, a direção da dependência se inverte.

```ts
// Sem inversão: LoginViewModel conhece o Firebase diretamente
class LoginViewModel {
  private repository = new FirebaseUserRepository();
}
```

Se amanhã o time decidir trocar Firebase por outra solução, ou simplesmente quiser testar `LoginViewModel` sem depender de rede, não tem como, a dependência concreta está cravada dentro da classe. Recebendo a abstração por injeção de dependência:

```ts
interface UserRepository {
  findById(id: string): User;
}

class LoginViewModel {
  constructor(private repository: UserRepository) {}
}
```

Agora `LoginViewModel` não sabe, e não precisa saber, se os dados vêm do Firebase, de uma API REST, de um banco local ou de uma implementação falsa criada só para teste. Qualquer coisa que implemente `UserRepository` serve. É por isso que ferramentas de injeção de dependência (Spring, NestJS, Hilt, entre outras) existem naturalmente ao lado de código que segue esse princípio: a técnica de passar a dependência de fora (em vez de instanciá-la por dentro) é exatamente o que viabiliza a inversão na prática.

## O erro mais comum ao aplicar SOLID

SOLID não é sobre criar o maior número possível de interfaces e classes minúsculas. Um sistema com uma interface para cada classe e uma classe para cada método não está mais "SOLID", está mais difícil de navegar, porque agora entender um fluxo simples exige pular entre dez arquivos diferentes.

O objetivo é desenhar os limites certos, os pontos onde uma mudança de um lado não deveria obrigar uma mudança do outro. Às vezes esse limite é uma interface nova, às vezes é só duas classes bem separadas sem interface nenhuma, às vezes é nem separar e deixar uma responsabilidade única mesmo que pareça "pouco abstrato" para o gosto de quem está lendo um artigo sobre design patterns. A pergunta que vale fazer antes de aplicar qualquer um dos cinco princípios é: essa abstração existe porque o sistema realmente precisa variar nesse ponto, ou só porque "é o certo a fazer"?

## Referências

- [Os princípios SOLID da Programação Orientada a Objetos explicados em bom português](https://www.freecodecamp.org/portuguese/news/os-principios-solid-da-programacao-orientada-a-objetos-explicados-em-bom-portugues/) - freeCodeCamp Brasil, pt-BR
- [SOLID: o que é e quais os 5 princípios da Programação Orientada a Objetos](https://www.alura.com.br/artigos/solid) - Alura, pt-BR
