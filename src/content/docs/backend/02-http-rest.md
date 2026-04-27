---
title: "HTTP, APIs e REST"
description: "Protocolo HTTP, APIs, arquitetura REST, status codes e como consumir APIs"
lastUpdated: 2026-04-26
sidebar:
  order: 2
tags: ["http", "api", "rest", "backend", "web"]
---

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

**Idempotente** significa que chamar o mesmo endpoint múltiplas vezes tem o mesmo efeito que chamar uma vez. `PUT /usuarios/1` com os mesmos dados sempre resulta no mesmo estado, independente de quantas vezes é chamado.

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
```

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

- Documente com OpenAPI/Swagger - gera documentação interativa automaticamente
