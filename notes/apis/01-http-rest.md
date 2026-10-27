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

### Estrutura de uma resposta

A resposta espelha a requisição: uma primeira linha, os headers e, opcionalmente, um body.

```
HTTP/1.1 201 Created
Content-Type: application/json
Content-Length: 67
Date: Sun, 12 May 2024 10:30:00 GMT
Location: /usuarios/42

{
  "id": 42,
  "nome": "Ana Silva",
  "email": "ana@exemplo.com"
}
```

A primeira linha é a **status line**: versão do HTTP, código de status e uma frase curta que descreve o código (a *reason phrase*, aqui `Created`). Essa frase existe só para humanos lerem; nenhum cliente deve tomar decisão com base nela. Tanto que o HTTP/2 e o HTTP/3 aboliram a reason phrase: neles, o status viaja num pseudo-header `:status: 201`, sem texto nenhum.

Os headers de resposta mais comuns:

- `Content-Type`: formato do body (`application/json`)
- `Content-Length`: tamanho do body em bytes
- `Date`: quando a resposta foi gerada
- `Location`: para onde olhar, usado no `201 Created` (o endereço do recurso novo) e nos redirecionamentos
- `Cache-Control`: se e por quanto tempo a resposta pode ser guardada em cache

O body traz a representação devolvida pelo servidor, quase sempre JSON numa API. Algumas respostas não têm body por definição, como o `204 No Content` e o `304 Not Modified`.

### Path params, query params, headers e body

Uma requisição tem quatro lugares para carregar informação, e cada um tem um papel:

```
GET /usuarios/10/pedidos?status=pago&page=2 HTTP/1.1
    └────┬─────┘        └─────────┬───────┘
     path param           query params
Host: api.exemplo.com              ← header
Authorization: Bearer eyJhbGci...  ← header
```

- **Path param** identifica *qual* recurso: o `10` em `/usuarios/10`. Sem ele, a URL aponta para outra coisa.
- **Query param** refina a consulta sobre o recurso: filtrar, ordenar, paginar (`?status=pago&page=2`). A URL sem ele continua válida, só traz um resultado diferente. Filtros e ordenação estão em [Paginação](/labs/web-dev/apis/06-paginacao/).
- **Headers** carregam metadados sobre a requisição, não sobre o recurso: quem está chamando (`Authorization`), em que formato (`Content-Type`, `Accept`), regras de cache. Também não são opcionais: no HTTP/1.1 o header `Host` é obrigatório em toda requisição.
- **Body** carrega a representação enviada, em `POST`, `PUT` e `PATCH`. Um body num `GET` não tem significado definido pela RFC 9110, e muitos servidores, proxies e bibliotecas simplesmente o descartam. Se a busca precisa de muitos parâmetros, use query string ou um `POST` para um recurso de busca.

Uma regra prática: se a informação muda *qual* recurso é, vai no path; se muda *como* olhar para ele, vai na query; se é sobre a conversa em si (credencial, formato), vai no header; se é o conteúdo que está sendo gravado, vai no body.

Um cuidado: token, senha e API key nunca vão na URL, nem como query param. URLs ficam gravadas no log do servidor, no log de proxies, no histórico do navegador e podem vazar no header `Referer`. Credencial vai no header.

### Negociação de conteúdo

Dois headers parecidos fazem papéis opostos:

- `Content-Type` descreve o formato do body **que está sendo enviado**. Na requisição, é o que o cliente manda; na resposta, é o que o servidor devolve.
- `Accept` diz o formato que o cliente **quer receber** na resposta.

```
POST /relatorios HTTP/1.1
Content-Type: application/json    ← estou mandando JSON
Accept: text/csv                  ← quero a resposta em CSV
```

Esse acordo se chama **negociação de conteúdo**. JSON é o padrão de fato em APIs, mas não o único formato: upload de arquivo usa `multipart/form-data`, exportações usam CSV, integrações antigas usam XML. Quando não há acordo possível, existem dois códigos: `415 Unsupported Media Type` quando o servidor não aceita o formato que o cliente mandou, e `406 Not Acceptable` quando o servidor não consegue produzir nenhum dos formatos que o cliente pediu no `Accept`.

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

Os códigos menos comuns (202, 205, 303, 307, 308, 405, 504, 505), as dúvidas clássicas de entrevista (401 vs 403, 400 vs 422, 302 vs 307) e como montar um corpo de erro padronizado estão em [Status Codes e Tratamento de Erros](/labs/web-dev/apis/02-status-codes-e-tratamento-de-erros/).

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

### As seis restrições do REST

Os três princípios acima são a versão de bolso. A definição original vem do capítulo 5 da tese de doutorado de Roy Fielding, de 2000 (Fielding também foi um dos autores da especificação do HTTP). Ele descreve o REST como um conjunto de restrições: abrir mão de certas liberdades em troca de propriedades como escala e independência entre as partes. São seis:

1. **Cliente-servidor.** Interface e armazenamento de dados ficam separados. O app mobile não sabe como o banco é organizado, e o servidor não sabe como a tela é desenhada. Cada lado pode evoluir sem mexer no outro, desde que o contrato da API se mantenha.
2. **Stateless.** Cada requisição carrega tudo o que o servidor precisa para atendê-la, e o servidor não guarda contexto de sessão entre uma chamada e outra. Por isso o token vai em toda requisição. A vantagem é que qualquer instância do servidor pode atender qualquer requisição, o que facilita escalar horizontalmente, como explicado em [Stateless e Particionamento](/labs/web-dev/escalabilidade/02-stateless-e-particionamento/).
3. **Cache.** Toda resposta precisa dizer, de forma explícita ou implícita, se pode ser guardada em cache. É o papel de headers como `Cache-Control` e `ETag`. Uma resposta cacheada que um navegador ou uma [CDN](/labs/web-dev/escalabilidade/04-cdn/) reaproveita é uma requisição a menos chegando no servidor.
4. **Interface uniforme.** Todos os recursos são manipulados do mesmo jeito, e Fielding considera essa a restrição central do estilo. Ela se divide em quatro:
   - *identificação de recursos*: cada recurso tem sua URI;
   - *manipulação por representações*: o cliente altera um recurso enviando uma representação dele (o JSON do usuário), e não chamando funções remotas;
   - *mensagens autodescritivas*: cada mensagem diz como deve ser interpretada (método, `Content-Type`, status, regras de cache), sem depender de um combinado fora dela;
   - *hipermídia como motor do estado da aplicação* (HATEOAS): as respostas trazem links para as próximas ações possíveis, o nível 3 do modelo de Richardson logo abaixo.
5. **Sistema em camadas.** O cliente não sabe se está falando com o servidor final ou com um intermediário no caminho: load balancer, API gateway, cache, CDN. Isso permite colocar e tirar camadas sem mudar o cliente. O [Reverse Proxy](/labs/web-dev/escalabilidade/05-reverse-proxy/) é o exemplo mais comum.
6. **Code on demand** (opcional). O servidor pode mandar código para o cliente executar e estender o que ele faz. O JavaScript que o navegador baixa e roda é o caso clássico. É a única restrição opcional, e APIs JSON quase nunca a usam.

Essas restrições explicam por que o REST se espalhou tanto. Ele reaproveita o que o HTTP já tem (métodos, status, cache, proxies), dá para testar com qualquer cliente HTTP, funciona igual para web, mobile e servidor-a-servidor, e a natureza stateless simplifica escalar. Na prática, pouca API segue as seis à risca, em especial o HATEOAS, mas as quatro primeiras aparecem em quase todas.

### Recurso e representação

As duas palavras parecem sinônimas, mas não são.

**Recurso** é a coisa em si: o usuário 1, a lista de pedidos, o produto 10. Ele é identificado por uma URI (`/usuarios/1`, `/pedidos`, `/produtos/10`) e existe independentemente de qualquer formato.

**Representação** é um retrato do estado do recurso num momento, num formato específico. O mesmo usuário 1 pode ser representado como JSON, como XML, ou como uma página HTML:

```
GET /usuarios/1
Accept: application/json   →  { "id": 1, "nome": "Ana Silva" }

GET /usuarios/1
Accept: application/xml    →  <usuario><id>1</id><nome>Ana Silva</nome></usuario>
```

É o mesmo recurso, com duas representações escolhidas pela negociação de conteúdo. O nome "Representational State Transfer" vem daí: cliente e servidor nunca trocam o recurso, trocam representações do estado dele. Quando você faz um `PUT` com um JSON, está mandando uma representação nova e pedindo ao servidor que deixe o recurso com aquele estado.

### REST vs SOAP

Essa comparação aparece em entrevista com frequência, e começa por uma diferença de natureza: REST é um **estilo arquitetural**, um conjunto de restrições; SOAP é um **protocolo**, com formato de mensagem definido (o envelope XML) e contrato formal descrito em WSDL.

|                     | REST                                                       | SOAP                                                                       |
| ------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| O que é             | Estilo arquitetural                                        | Protocolo padronizado pelo W3C                                             |
| Uso do HTTP         | Usa a semântica do HTTP: métodos, status, headers, cache   | Usa o HTTP só como transporte (quase tudo é `POST`); aceita outros, como SMTP |
| Formato             | Livre: JSON na maioria, mas também XML, CSV, texto         | XML no envelope                                                            |
| Contrato            | Opcional (OpenAPI)                                         | Obrigatório e rígido (WSDL)                                                |
| Estado              | Stateless                                                  | Stateless no protocolo; estado vem de extensões WS-* ou da aplicação       |
| Peso                | Mensagens enxutas                                          | Mensagens verbosas, com custo de processar o envelope                      |
| Onde aparece        | Web, mobile, APIs públicas e internas                      | Integrações corporativas e reguladas: bancos, seguradoras, governo         |

Dois pontos costumam vir errados em resumos por aí. Um é dizer que SOAP é "stateful": o protocolo em si não guarda estado, quem adiciona sessão são extensões do ecossistema WS-* ou a própria aplicação. O outro é dizer que SOAP "tem performance ruim" como se fosse uma propriedade absoluta: o custo vem do XML verboso e do processamento do envelope, e em troca ele oferece um contrato formal e padrões prontos de segurança e transação que fazem sentido em domínios regulados. Por que SOAP ainda sobrevive nesses setores está em [Classificação de APIs por Público](/labs/web-dev/apis/05-classificacao-de-apis-por-publico/).

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

As estratégias de paginação (offset, cursor, keyset), quando usar cada uma e o problema do OFFSET profundo estão em [Paginação](/labs/web-dev/apis/06-paginacao/).

- Documente com OpenAPI/Swagger - gera documentação interativa automaticamente

## Referências

- [Métodos de requisição HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Methods) - MDN Web Docs, pt-BR
- [Idempotente - Glossário MDN](https://developer.mozilla.org/pt-BR/docs/Glossary/Idempotent) - MDN Web Docs, pt-BR
- [RFC 9110 - HTTP Semantics, §9 Method Definitions](https://www.rfc-editor.org/rfc/rfc9110.html#name-method-definitions) - IETF, en
- [RFC 5789 - PATCH Method for HTTP](https://www.rfc-editor.org/rfc/rfc5789.html) - IETF, en
- [Mensagens HTTP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Guides/Messages) - MDN Web Docs, pt-BR
- [Negociação de conteúdo](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Guides/Content_negotiation) - MDN Web Docs, pt-BR
- [Architectural Styles and the Design of Network-based Software Architectures, cap. 5](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm) - Roy Fielding, en
