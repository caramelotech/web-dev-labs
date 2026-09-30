# HTTP, APIs e REST

Aplicações modernas raramente vivem isoladas. Elas se comunicam com outras aplicações, consomem dados de serviços externos e expõem suas próprias funcionalidades. O protocolo HTTP é o meio de transporte e REST é a arquitetura que organiza como essa comunicação acontece.

## HTTP

HTTP (Hypertext Transfer Protocol) é o protocolo de comunicação da web. Funciona no modelo **requisição-resposta**: o cliente faz uma requisição, o servidor processa e retorna uma resposta.

### Estrutura de uma requisição

```
POST /usuarios HTTP/1.1
Host: api.exemplo.com
Content-Type: application/json
Authorization: Bearer eyJhbGci...

{
  "nome": "Ana Silva",
  "email": "ana@exemplo.com"
}
```

Composta de:

- **Linha de requisição:** método, caminho e versão do HTTP
- **Headers:** metadados (tipo do conteúdo, autenticação, etc.)
- **Body:** dados enviados (presente em POST, PUT, PATCH)

### Métodos HTTP

| Método   | Uso                         | Idempotente | Tem body |
| -------- | --------------------------- | ----------- | -------- |
| `GET`    | Buscar recurso              | Sim         | Não      |
| `POST`   | Criar recurso               | Não         | Sim      |
| `PUT`    | Substituir recurso completo | Sim         | Sim      |
| `PATCH`  | Atualizar parcialmente      | Não         | Sim      |
| `DELETE` | Remover recurso             | Sim         | Não      |

**Idempotente** significa que chamar o mesmo endpoint múltiplas vezes tem o mesmo efeito que chamar uma vez. `PUT /usuarios/1` com os mesmos dados sempre resulta no mesmo estado, independentemente de quantas vezes é chamado. Por que essa propriedade importa na prática (retries de rede, API gateways, filas) está em [Idempotência](/labs/web-dev/resiliencia/02-idempotencia/).

### Outros métodos e suas propriedades

A tabela acima cobre os cinco métodos que aparecem em quase toda API REST, mas o protocolo HTTP define mais quatro:

| Método    | Uso                                                                |
| --------- | ------------------------------------------------------------------- |
| `HEAD`    | Igual ao `GET`, mas a resposta vem só com os headers, sem body      |
| `OPTIONS` | Pergunta ao servidor quais métodos e headers são aceitos naquele recurso |
| `CONNECT` | Abre um túnel através de um proxy, usado para estabelecer conexões HTTPS |
| `TRACE`   | Ecoa de volta a requisição recebida, para diagnosticar o que um proxy alterou no caminho |

Na prática, o mais comum de encontrar no dia a dia é o `OPTIONS`: é ele que o navegador dispara automaticamente antes de um `POST` ou `PUT` entre origens diferentes, o "preflight" do CORS, para checar se o servidor aceita aquela requisição antes de mandar a de verdade. `HEAD` aparece quando um cliente só quer saber se um recurso existe ou qual o tamanho dele, sem baixar o conteúdo inteiro. Já `CONNECT` e `TRACE` raramente aparecem em código de aplicação: `CONNECT` é coisa de proxy, e `TRACE` costuma vir desabilitado por padrão em servidores web, porque ecoar a requisição de volta pode vazar informação sensível de headers ou cookies.

Além do "tem body ou não" e do "idempotente ou não" que já apareceram na tabela, a RFC 9110 (a especificação atual do HTTP) define mais duas propriedades que valem a pena separar:

- **Método seguro (safe):** não muda estado nenhum no servidor. `GET`, `HEAD`, `OPTIONS` e `TRACE` são seguros, o que quer dizer que um cliente (ou um crawler, ou um proxy) pode chamá-los livremente sem risco de causar um efeito colateral. `POST`, `PUT`, `PATCH` e `DELETE` não são seguros, porque criam, alteram ou removem alguma coisa.
- **Método cacheável:** a resposta pode ser guardada e reaproveitada numa próxima requisição igual, sem precisar ir ao servidor de novo. `GET` é o cacheável de longe mais usado, e `HEAD` também é cacheável (faz sentido: se o `GET` daquele recurso pode ser cacheado, saber só os headers dele também pode). O `Cache-Control` que apareceu na seção de [Headers importantes](#headers-importantes) é justamente o header que controla esse comportamento.

Vale reparar que "seguro" e "idempotente" não são a mesma coisa, mesmo sendo fácil confundir os dois. Seguro fala sobre *causar* efeito colateral; idempotente fala sobre o efeito ser *o mesmo* não importa quantas vezes a chamada se repete. Por isso todo método seguro é idempotente (não fazer nada, repetido, continua não fazendo nada), mas nem todo idempotente é seguro: `DELETE /usuarios/42` muda o estado do servidor (não é seguro), mas chamar duas vezes tem o mesmo efeito de chamar uma vez só, o usuário continua removido (é idempotente).

É aqui que o `PATCH` foge do padrão da tabela. A RFC 5789, que define o `PATCH`, é explícita: ele não é seguro nem idempotente *por definição*, mas pode ser implementado de um jeito que seja. Depende inteiramente da semântica do patch que a API aceita:

```
# idempotente: sempre resulta no mesmo estado final
PATCH /usuarios/42
{ "status": "ativo" }

# não idempotente: cada chamada muda o resultado
PATCH /carrinho/7
{ "operacao": "incrementar", "campo": "quantidade" }
```

O primeiro exemplo define um valor absoluto, chamar duas vezes deixa o usuário com `status: "ativo"` do mesmo jeito. O segundo descreve uma operação relativa, cada chamada soma mais um na quantidade, então dez chamadas iguais não têm o mesmo efeito de uma só. Ao desenhar um endpoint `PATCH`, vale decidir de propósito qual dos dois comportamentos a API está assumindo, porque quem consome a API vai presumir idempotência a menos que a documentação diga o contrário.

Essas propriedades não são só categorização acadêmica: são o que permite a um cliente HTTP, um proxy ou um API gateway reenviar uma requisição automaticamente depois de uma falha de rede sem medo de duplicar um efeito. [Idempotência](/labs/web-dev/resiliencia/02-idempotencia/) aprofunda esse uso prático, com o padrão de idempotency key que sistemas de pagamento usam para tornar até um `POST` seguro de repetir.

### Status codes

O código de status indica o resultado da requisição.

**2xx - Sucesso**

| Código | Nome       | Quando usar                               |
| ------ | ---------- | ----------------------------------------- |
| 200    | OK         | Requisição bem-sucedida (GET, PUT, PATCH) |
| 201    | Created    | Recurso criado com sucesso (POST)         |
| 204    | No Content | Sucesso sem corpo de resposta (DELETE)    |

**3xx - Redirecionamento**

| Código | Nome              | Quando usar                 |
| ------ | ----------------- | --------------------------- |
| 301    | Moved Permanently | URL mudou permanentemente   |
| 302    | Found             | Redirecionamento temporário |
| 304    | Not Modified      | Cache ainda válido          |

**4xx - Erro do cliente**

| Código | Nome              | Quando usar                                   |
| ------ | ----------------- | --------------------------------------------- |
| 400    | Bad Request       | Dados inválidos ou malformados                |
| 401    | Unauthorized      | Não autenticado (sem token ou token inválido) |
| 403    | Forbidden         | Autenticado mas sem permissão                 |
| 404    | Not Found         | Recurso não encontrado                        |
| 409    | Conflict          | Conflito (ex: email já cadastrado)            |
| 422    | Unprocessable     | Dados válidos mas com erros de validação      |
| 429    | Too Many Requests | Rate limit atingido                           |

**5xx - Erro do servidor**

| Código | Nome                  | Quando usar                   |
| ------ | --------------------- | ----------------------------- |
| 500    | Internal Server Error | Erro inesperado no servidor   |
| 502    | Bad Gateway           | Serviço upstream com problema |
| 503    | Service Unavailable   | Serviço indisponível          |

## APIs

API (Application Programming Interface) é um contrato que define como sistemas se comunicam. Uma API web expõe endpoints HTTP que outros sistemas podem chamar.

Exemplos do cotidiano:

- Aplicativo de clima chama API do INMET para buscar previsão
- E-commerce chama API do banco para processar pagamento
- App de delivery chama API do Maps para calcular rota

### Formato de dados

A maioria das APIs modernas usa **JSON** (JavaScript Object Notation):

```json
{
  "id": 1,
  "nome": "Ana Silva",
  "email": "ana@exemplo.com",
  "endereco": {
    "rua": "Av. Paulista",
    "numero": "1000",
    "cidade": "São Paulo"
  },
  "pedidos": [101, 102, 105]
}
```

## REST

REST (Representational State Transfer) é um estilo arquitetural para APIs, não um protocolo. Define um conjunto de restrições que, quando seguidas, produzem APIs previsíveis e fáceis de consumir.

### Princípios do REST

**Stateless:** cada requisição deve conter todas as informações necessárias para ser processada. O servidor não mantém estado de sessão entre requisições.

**Recursos:** a API é organizada em torno de recursos (substantivos), não ações. O recurso é identificado pela URL.

**Verbos HTTP para ações:** as operações sobre os recursos são expressas pelos métodos HTTP.

### Design de rotas RESTful

```
GET    /usuarios          → listar todos os usuários
POST   /usuarios          → criar novo usuário
GET    /usuarios/42       → buscar usuário de id 42
PUT    /usuarios/42       → substituir usuário de id 42
PATCH  /usuarios/42       → atualizar parcialmente
DELETE /usuarios/42       → remover usuário de id 42

GET    /usuarios/42/pedidos     → pedidos do usuário 42
POST   /usuarios/42/pedidos     → criar pedido para o usuário 42
GET    /usuarios/42/pedidos/7   → pedido 7 do usuário 42
```

URLs devem usar **substantivos no plural** e **kebab-case** para múltiplas palavras:

```
✅ /produtos-destaque
✅ /categorias/eletrônicos/produtos
❌ /buscarProdutos
❌ /produto/listar
```

### Modelo de Maturidade de Richardson

Define níveis de "aderência" ao REST:

- **Nível 0 - POX (Plain Old XML/HTTP):** HTTP como transporte, tudo via POST em um único endpoint
- **Nível 1 - Recursos:** URLs diferentes para recursos diferentes, mas sem uso correto dos métodos
- **Nível 2 - Verbos HTTP:** Uso correto dos métodos HTTP e status codes - o nível mínimo para se chamar RESTful
- **Nível 3 - HATEOAS:** Respostas incluem links para ações disponíveis (pouco adotado na prática)

A maioria das APIs comerciais opera no nível 2.

## Consumindo APIs

### JavaScript - fetch

```javascript
// GET
fetch("https://api.exemplo.com/usuarios")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Erro: " + response.status);
    }
    return response.json();
  })
  .then((usuarios) => console.log(usuarios))
  .catch((error) => console.error(error));

// POST com async/await
async function criarUsuario(dados) {
  const response = await fetch("https://api.exemplo.com/usuarios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar usuário");
  }

  return response.json();
}
```

### Java - HttpClient (Java 11+)

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();

// GET
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.exemplo.com/usuarios"))
    .header("Authorization", "Bearer " + token)
    .GET()
    .build();

HttpResponse<String> response = client.send(request,
    HttpResponse.BodyHandlers.ofString());

System.out.println(response.statusCode()); // 200
System.out.println(response.body());       // JSON como String

// POST
String json = "{\"nome\": \"Ana\", \"email\": \"ana@exemplo.com\"}";

HttpRequest postRequest = HttpRequest.newBuilder()
    .uri(URI.create("https://api.exemplo.com/usuarios"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();

HttpResponse<String> postResponse = client.send(postRequest,
    HttpResponse.BodyHandlers.ofString());
```

## Headers importantes

```
Content-Type: application/json        → tipo do body enviado
Accept: application/json              → tipo de resposta esperado
Authorization: Bearer <token>         → autenticação JWT
Authorization: Basic <base64>         → autenticação básica
Cache-Control: no-cache               → sem cache
X-Request-ID: uuid-aqui              → rastreabilidade
Accept-Encoding: gzip, br             → algoritmos de compressão que o cliente aceita
Content-Encoding: br                  → algoritmo usado na resposta
```

## Compressão de resposta

Um JSON de listagem com 200 KB de texto vira uns 30 KB depois de comprimido. Essa economia de banda é negociada entre cliente e servidor a cada requisição: o cliente manda `Accept-Encoding` dizendo quais algoritmos sabe descomprimir, o servidor escolhe um e devolve a resposta comprimida com o header `Content-Encoding` indicando qual foi usado. Se o cliente não anuncia nada, a resposta vai sem compressão.

```
Requisição:  Accept-Encoding: gzip, br, zstd
Resposta:    Content-Encoding: br
```

Os três algoritmos que aparecem hoje:

- **gzip**: suportado por todo cliente e servidor HTTP que existe. É o padrão seguro, e na dúvida é ele.
- **brotli** (`br`): criado pelo Google, comprime cerca de 15% a 25% melhor que o gzip com um custo de CPU parecido. É bem suportado em navegadores.
- **zstd**: criado pelo Facebook, tem razão de compressão parecida com a do gzip, mas comprime várias vezes mais rápido. Útil quando o gargalo é a CPU do servidor, não a banda.

O ganho aparece em conteúdo textual: JSON, HTML, CSS, JavaScript encolhem de 60% a 80%. Comprimir tem um custo de CPU dos dois lados, então para uma resposta minúscula (poucas centenas de bytes) não compensa, o trabalho de comprimir custa mais que o byte economizado. E não adianta comprimir o que já vem comprimido: JPEG, PNG, MP4 e arquivos `.zip` não encolhem, só gastam CPU.

Existe um cuidado de segurança. O ataque **BREACH** explora a compressão de uma resposta dinâmica servida sob HTTPS quando ela mistura, no mesmo corpo, um segredo (como um token CSRF) e um trecho que o atacante consegue influenciar. Observando o tamanho da resposta comprimida em várias tentativas, dá para deduzir o segredo byte a byte. A mitigação prática é não comprimir esse tipo específico de resposta (as que carregam token de sessão ou CSRF junto de entrada refletida); comprimir assets estáticos e listagens públicas segue tranquilo.

## Boas práticas de design de API

- Use versioning: `/v1/usuarios`, `/v2/usuarios`
- Retorne erros com mensagens úteis:

```json
{
  "erro": "VALIDACAO",
  "mensagem": "Email já cadastrado",
  "campo": "email"
}
```

- Implemente paginação para listagens grandes:

```
GET /produtos?page=2&size=20&sort=nome,asc
```

```json
{
  "conteudo": [...],
  "pagina": 2,
  "tamanho": 20,
  "total": 347,
  "totalPaginas": 18
}
```

As estratégias de paginação (offset, cursor, keyset), quando usar cada uma e o problema do OFFSET profundo estão em [Paginação](/labs/web-dev/apis/05-paginacao/).

- Documente com OpenAPI/Swagger - gera documentação interativa automaticamente

## Referências

- [Métodos de requisição HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Methods) - MDN Web Docs, pt-BR
- [Idempotente - Glossário MDN](https://developer.mozilla.org/pt-BR/docs/Glossary/Idempotent) - MDN Web Docs, pt-BR
- [RFC 9110 - HTTP Semantics, §9 Method Definitions](https://www.rfc-editor.org/rfc/rfc9110.html#name-method-definitions) - IETF, en
- [RFC 5789 - PATCH Method for HTTP](https://www.rfc-editor.org/rfc/rfc5789.html) - IETF, en
