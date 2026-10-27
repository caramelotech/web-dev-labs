# Segurança de APIs na Prática

Esta nota é sobre os controles que aparecem no código de quem escreve a API: como o cliente se identifica, por que o navegador reclama de CORS, o que validar na entrada, como os ataques web clássicos se aplicam a uma API JSON e como guardar senhas.

A visão mais ampla fica em outras notas. As camadas de segurança, a diferença entre autenticação e autorização, RBAC e ABAC, HTTPS e mTLS, gestão de segredos e a tabela de ameaças comuns estão em [Segurança e Evolução de APIs](/labs/web-dev/apis/03-seguranca-e-evolucao-de-apis/). Os detalhes de tokens estão em [JWT na Prática](/labs/web-dev/apis/07-jwt/) e em [SSO, OAuth 2.0, OIDC e SAML](/labs/web-dev/apis/08-sso-oauth-oidc-saml/).

## Como o cliente se identifica

A forma mais comum de uma API saber quem está chamando é o header `Authorization` com o esquema **Bearer**:

```http
GET /pedidos HTTP/1.1
Host: api.exemplo.com
Authorization: Bearer eyJhbGciOiJSUzI1NiJ9...
```

"Bearer" quer dizer "portador": quem tiver o token em mãos tem o acesso, sem precisar provar mais nada. É como um ingresso de show, que não tem foto. Por isso o token precisa trafegar só por HTTPS, ter vida curta e nunca aparecer em log.

A **API key** é outra credencial comum, mas com um papel diferente. Ela identifica a **aplicação** que está chamando, não o usuário. É o que você recebe ao se cadastrar num serviço de mapas ou de envio de e-mails: uma chave que diz "esta requisição veio do sistema da loja X". Serve bem para comunicação servidor-a-servidor, para contar uso e aplicar cotas por cliente.

Alguns cuidados com API keys:

- Mande sempre num header (`Authorization` ou um header próprio como `X-API-Key`), nunca na query string. Uma URL como `/clima?key=abc123` fica registrada no log do servidor, no log do proxy, no histórico do navegador e às vezes no header `Referer` enviado a outros sites. A OWASP recomenda explicitamente não colocar senhas, tokens ou chaves na URL.
- Uma API key sozinha não deve proteger dado sensível. Ela não diz qual usuário está agindo, então não serve para decidir "esse usuário pode ver esse pedido".
- Dê a cada chave só o escopo de que ela precisa (só leitura, só um recurso), permita rotação sem downtime (duas chaves válidas ao mesmo tempo durante a troca) e guarde no banco apenas o hash da chave, como se faz com senha.

Três termos que o mercado mistura e que vale separar numa entrevista: **OAuth 2.0** é um framework de autorização delegada (uma aplicação ganha permissão para agir em nome do usuário); o "Entrar com Google" que identifica o usuário é o **OpenID Connect**, uma camada de identidade construída sobre o OAuth 2.0; e **JWT** é só um formato de token, que pode ou não ser usado nesses fluxos. Dizer "uso JWT para autenticar" descreve o formato da credencial, não o mecanismo.

## CORS

Para entender CORS é preciso começar pela **Same-Origin Policy** (política de mesma origem). O navegador não deixa um script de uma origem ler respostas de outra origem. Origem é a combinação de esquema, host e porta: `https://app.exemplo.com` e `https://api.exemplo.com` são origens diferentes, assim como `http://localhost:3000` e `http://localhost:8080`.

A política existe para te proteger. Sem ela, um site malicioso aberto numa aba poderia fazer `fetch("https://seubanco.com/extrato")`, o navegador anexaria seus cookies do banco e o script leria o extrato.

O problema é que aplicações legítimas também têm front e API em origens diferentes. **CORS** (Cross-Origin Resource Sharing) é o mecanismo para o servidor dizer ao navegador "pode deixar essa origem ler minhas respostas". O servidor declara a política por headers; quem aplica é o navegador.

### Requisição simples e preflight

Algumas requisições são consideradas **simples** e vão direto: métodos `GET`, `HEAD` ou `POST`, só com headers básicos, e `Content-Type` de formulário (`application/x-www-form-urlencoded`, `multipart/form-data` ou `text/plain`). O navegador envia, recebe a resposta e só entrega ao script se a resposta tiver o header CORS certo.

Todo o resto passa por um **preflight**: antes da requisição de verdade, o navegador manda um `OPTIONS` perguntando se pode. Um `POST` com `Content-Type: application/json`, um `PUT`, um `DELETE` ou qualquer header como `Authorization` já disparam preflight. Ou seja, quase toda chamada de um front a uma API JSON tem preflight.

```mermaid
sequenceDiagram
    participant B as Navegador (app.exemplo.com)
    participant A as API (api.exemplo.com)
    B->>A: OPTIONS /pedidos<br/>Origin: https://app.exemplo.com<br/>Access-Control-Request-Method: PUT<br/>Access-Control-Request-Headers: Authorization, Content-Type
    A-->>B: 204<br/>Access-Control-Allow-Origin: https://app.exemplo.com<br/>Access-Control-Allow-Methods: GET, POST, PUT<br/>Access-Control-Allow-Headers: Authorization, Content-Type<br/>Access-Control-Max-Age: 600
    B->>A: PUT /pedidos/7 (requisição real)
    A-->>B: 200 + Access-Control-Allow-Origin
```

### Os headers

| Header                             | Para que serve                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `Access-Control-Allow-Origin`      | Qual origem pode ler a resposta (uma origem exata, ou `*`)                     |
| `Access-Control-Allow-Methods`     | Métodos permitidos na requisição real (resposta do preflight)                  |
| `Access-Control-Allow-Headers`     | Headers que o cliente pode enviar (resposta do preflight)                      |
| `Access-Control-Allow-Credentials` | `true` para permitir cookies ou autenticação HTTP na requisição                |
| `Access-Control-Max-Age`           | Por quantos segundos o navegador pode reaproveitar o resultado do preflight    |
| `Access-Control-Expose-Headers`    | Headers da resposta que o script pode ler além dos básicos (ex: `Location`)    |

Dois erros de configuração aparecem muito. O primeiro é tentar usar `Access-Control-Allow-Origin: *` com `Access-Control-Allow-Credentials: true`: o navegador recusa, porque com credenciais a origem precisa ser explícita. O segundo é o "conserto" do primeiro: pegar o header `Origin` da requisição e devolvê-lo sempre no `Allow-Origin`. Isso equivale a liberar qualquer site do mundo para fazer requisições autenticadas com os cookies do usuário. O certo é manter uma lista de origens permitidas e só devolver a origem se ela estiver na lista. Se a API não é chamada por navegador de outra origem, não habilite CORS.

### CORS não protege o servidor

Esse ponto confunde muita gente. CORS é uma regra do navegador para proteger o usuário. curl, Postman, um script Python ou outro backend ignoram CORS completamente, e a requisição chega ao servidor do mesmo jeito. Por isso CORS não substitui autenticação, autorização ou rate limiting.

Quando aparece no console algo como "blocked by CORS policy", vale olhar a aba Network do DevTools: veja se houve um `OPTIONS` antes, qual status ele recebeu (um 401 ou 404 no preflight é comum quando o middleware de autenticação roda antes do CORS) e quais headers `Access-Control-*` vieram na resposta. O JavaScript não recebe os detalhes do erro, só o console mostra.

## Validação de entrada

A validação feita no front-end é para a experiência do usuário: avisar que o e-mail está errado antes de enviar. Ela não protege nada, porque qualquer pessoa pode mandar uma requisição direto para a API com curl. A validação que vale é a do servidor.

O que checar em cada entrada:

- tipo (número é número, data é data);
- campos obrigatórios presentes;
- tamanho mínimo e máximo de strings e listas;
- formato (e-mail, CPF, UUID), de preferência com regex ancorada e simples;
- faixa de valores (quantidade entre 1 e 100, data não futura);
- tamanho máximo do body inteiro, recusando o excesso com `413 Content Too Large` antes de fazer parse.

Prefira **allowlist** a denylist: defina o que é aceito e recuse o resto, em vez de tentar listar tudo o que é perigoso. Uma lista de caracteres proibidos sempre esquece algum.

Na prática ninguém escreve esses `if` à mão. Bibliotecas de validação por schema fazem isso de forma declarativa: Bean Validation (`@NotNull`, `@Size`, `@Email`) em Java, Zod ou Joi em Node, Pydantic em Python. E se a API tem uma especificação OpenAPI, os mesmos schemas podem validar as requisições automaticamente, o que mantém contrato e validação alinhados.

Quando a validação falha, responda 400 ou 422 com um corpo no formato Problem Details listando os campos com problema, como mostrado em [Status Codes e Tratamento de Erros](/labs/web-dev/apis/02-status-codes-e-tratamento-de-erros/).

## Mass assignment

Muitos frameworks deixam converter o JSON da requisição direto numa entidade e salvar. É prático e é exatamente onde mora o problema. Imagine uma entidade `Usuario` com os campos `nome`, `email` e `role`, e um endpoint de "editar meu perfil":

```js
// perigoso: tudo o que vier no body vai para o banco
app.patch("/me", async (req, res) => {
  await Usuario.update(req.body, { where: { id: req.user.id } });
  res.sendStatus(204);
});
```

O formulário do front só envia `nome` e `email`, mas nada impede alguém de mandar:

```json
{ "nome": "Ana", "role": "admin" }
```

e virar administradora. Isso é **mass assignment**: o cliente atribui valores a campos que nunca deveria controlar (`role`, `saldo`, `isAdmin`, `verificado`).

A defesa é nunca bindar a requisição direto na entidade. Use um **DTO de entrada** (Data Transfer Object, um objeto só com os campos que aquele endpoint aceita) ou uma allowlist explícita:

```js
app.patch("/me", async (req, res) => {
  const { nome, email } = schemaPerfil.parse(req.body); // só esses dois passam
  await Usuario.update({ nome, email }, { where: { id: req.user.id } });
  res.sendStatus(204);
});
```

O mesmo problema tem um espelho na saída: devolver a entidade inteira e deixar o front escolher o que mostrar, vazando hash de senha, CPF ou campos internos. A defesa é a mesma, um DTO de saída com só o que o cliente precisa ver. No OWASP API Security Top 10 de 2023 os dois problemas foram fundidos numa categoria só, a API3 (Broken Object Property Level Authorization), porque a raiz é a mesma: falta de controle de acesso no nível de cada propriedade do objeto.

## Injeção, XSS e CSRF em APIs

**SQL injection** acontece quando a entrada é concatenada na query e passa a ser interpretada como código. A defesa é usar queries parametrizadas (prepared statements), que todo driver e ORM oferece:

```js
// vulnerável
db.query(`SELECT * FROM usuarios WHERE email = '${email}'`);

// seguro: o valor vai separado do comando
db.query("SELECT * FROM usuarios WHERE email = $1", [email]);
```

Atenção com o que não dá para parametrizar, como nome de coluna em `ORDER BY`. Ali entra a allowlist de campos ordenáveis, como discutido em [Paginação](/labs/web-dev/apis/06-paginacao/).

**XSS** (Cross-Site Scripting) é injetar script numa página que outra pessoa vai abrir. Uma API JSON não renderiza HTML, então pode parecer que o problema não é dela. Mas ela devolve dados que um front vai renderizar: se alguém salva `<script>...</script>` no campo "nome" e o front injeta isso como HTML, o ataque roda no navegador de quem abrir a página. A defesa principal é o front fazer encoding na saída (frameworks como React já escapam por padrão, o perigo é `dangerouslySetInnerHTML` e `innerHTML`). Do lado da API, ajuda devolver sempre `Content-Type: application/json` correto, o header `X-Content-Type-Options: nosniff` (impede o navegador de "adivinhar" que a resposta é HTML) e uma CSP (Content Security Policy) nas páginas.

**CSRF** (Cross-Site Request Forgery) explora o fato de o navegador anexar cookies automaticamente. Se você está logado no banco e abre um site malicioso, ele pode disparar um `POST` para o banco e o navegador manda o cookie de sessão junto. O ataque depende de a credencial ir **sozinha**. Por isso:

- uma API que recebe o token no header `Authorization` não sofre CSRF clássico, porque o navegador não coloca esse header por conta própria e o site atacante não tem o token;
- uma API que autentica por cookie de sessão precisa se proteger: cookie com `SameSite=Lax` ou `Strict`, e um token anti-CSRF que o front envia num header e o servidor confere.

Onde guardar o token no front (e o trade-off entre localStorage e cookie, que mexe justamente com XSS e CSRF) está em [JWT na Prática](/labs/web-dev/apis/07-jwt/).

| Ameaça                     | Mitigação principal                                                      |
| -------------------------- | ------------------------------------------------------------------------ |
| SQL injection              | Queries parametrizadas, allowlist para nomes de coluna                   |
| XSS                        | Encoding na saída, `Content-Type` correto, `nosniff`, CSP                |
| CSRF                       | Token no header em vez de cookie, ou `SameSite` + token anti-CSRF        |
| Mass assignment            | DTO de entrada com allowlist de campos                                   |
| Exposição de dados         | DTO de saída, nunca devolver a entidade inteira                          |
| Autenticação quebrada      | MFA, limite de tentativas, tokens curtos, sessão invalidada no logout    |
| Configuração insegura      | Defaults seguros, CORS restrito, sem stack trace, endpoints de debug fora |

## Armazenamento de senhas

Senha nunca é guardada em texto puro, e também não com um hash rápido como MD5 ou SHA-256 puro. Hashes rápidos foram feitos para ser rápidos: uma GPU testa bilhões de SHA-256 por segundo, e um banco vazado vira uma lista de senhas em pouco tempo.

O que se usa são funções de hash de senha, feitas para serem lentas e caras de propósito, e que geram um **salt** aleatório por senha (assim duas pessoas com a mesma senha têm hashes diferentes e tabelas pré-calculadas não funcionam). A ordem recomendada pela OWASP:

1. **Argon2id**: primeira escolha. Parâmetros mínimos: 19 MiB de memória, 2 iterações, paralelismo 1.
2. **scrypt**: quando Argon2id não está disponível.
3. **bcrypt**: para sistemas legados. Fator de custo de pelo menos 10. Atenção ao limite: o bcrypt só considera os primeiros 72 bytes da senha.
4. **PBKDF2**: quando a conformidade FIPS-140 é exigida, com 600.000 iterações de HMAC-SHA-256.

```js
import argon2 from "argon2";

const hash = await argon2.hash(senha); // argon2id é o padrão da biblioteca
const ok = await argon2.verify(hash, tentativa);
```

O hash protege a senha depois de um vazamento. O endpoint de login precisa de proteções próprias: limitar tentativas por conta e por IP (ver [Rate Limiting](/labs/web-dev/escalabilidade/11-rate-limiting/)), oferecer MFA e responder com uma mensagem genérica como "e-mail ou senha inválidos", sem dizer qual dos dois errou, para não confirmar quais e-mails estão cadastrados.

## OWASP API Security Top 10 (2023)

A OWASP mantém uma lista específica dos riscos mais comuns em APIs, separada do Top 10 de aplicações web. É uma boa lista de checagem para revisar uma API:

| ID   | Risco                                       | Defesa em uma frase                                                                             |
| ---- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| API1 | Broken Object Level Authorization           | O IDOR: checar em todo endpoint se o objeto pedido pertence a quem pediu                        |
| API2 | Broken Authentication                       | Mecanismo de login e de token bem implementado: MFA, limite de tentativas, validação completa do token |
| API3 | Broken Object Property Level Authorization  | DTOs de entrada e saída, controlando quais propriedades cada um lê e escreve                    |
| API4 | Unrestricted Resource Consumption           | Rate limiting, tamanho máximo de página e de body, timeouts                                     |
| API5 | Broken Function Level Authorization         | Checar a função do usuário em endpoints administrativos, não só esconder o botão no front       |
| API6 | Unrestricted Access to Sensitive Business Flows | Proteger fluxos que podem ser abusados em escala (compra de ingressos, cadastro) contra automação |
| API7 | Server Side Request Forgery                 | Validar e restringir URLs que a API busca a pedido do cliente (webhooks, importar de URL)       |
| API8 | Security Misconfiguration                   | Defaults seguros, CORS restrito, headers de segurança, sem detalhes de erro                     |
| API9 | Improper Inventory Management               | Saber quais APIs e versões estão no ar e desligar as antigas e esquecidas                       |
| API10 | Unsafe Consumption of APIs                 | Tratar respostas de APIs de terceiros como entrada não confiável: validar também               |

O API1 merece destaque: ele é o primeiro da lista desde a primeira edição, em 2019. Trocar `/pedidos/123` por `/pedidos/124` e ver o pedido de outra pessoa continua sendo a falha mais comum, e nenhum gateway resolve isso por você, porque só o serviço sabe de quem é cada pedido. O API9 conversa com versionamento: a v1 que ninguém lembra que está no ar costuma ser a que não recebeu as correções de segurança da v2 (ver [Segurança e Evolução de APIs](/labs/web-dev/apis/03-seguranca-e-evolucao-de-apis/)).

## Checklist de segurança para uma API nova

- [ ] Só HTTPS, com TLS 1.2 ou superior (SSL está obsoleto há anos)
- [ ] Autenticação em toda rota que não for explicitamente pública
- [ ] Autorização por objeto: o recurso pedido pertence a quem pediu?
- [ ] Validação de entrada por schema, com limites de tamanho de body, de strings e de página
- [ ] DTOs de entrada e de saída, nunca a entidade direto
- [ ] Queries parametrizadas e allowlist para campos de ordenação e filtro
- [ ] Rate limiting, com 429 e `Retry-After`
- [ ] CORS desligado ou restrito a uma lista de origens
- [ ] Headers de segurança nas respostas que um navegador vai ler (`nosniff`, `Cache-Control: no-store` em dados sensíveis)
- [ ] Erros genéricos para o cliente, detalhe completo só no log
- [ ] Log de eventos de segurança (login, falha de autorização, troca de permissão) sem tokens, senhas ou dados pessoais desnecessários
- [ ] Senhas com Argon2id ou bcrypt, nunca hash rápido
- [ ] Segredos fora do código, num secret manager
- [ ] Dependências atualizadas e scanner de vulnerabilidades no pipeline

## Referências

- [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Guides/CORS) - MDN Web Docs, pt-BR
- [Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy) - MDN Web Docs, en
- [OWASP API Security Top 10 - 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) - OWASP, en
- [REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html) - OWASP, en
- [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) - OWASP, en
