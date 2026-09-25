# Índices e Planos de Execução

A nota de [SQL](/labs/web-dev/banco-de-dados/01-sql/) mostrou como criar um índice: `CREATE INDEX idx_usuarios_email ON usuarios(email)`. Esta aqui explica o que acontece por baixo quando você faz isso, por que às vezes o banco cria o índice e mesmo assim não usa, e como pedir ao banco que mostre a estratégia que ele escolheu para rodar uma query.

## Por que um índice acelera a leitura

Imagine uma tabela `usuarios` com 5 milhões de linhas e a query `SELECT * FROM usuarios WHERE email = 'ana@exemplo.com'`.

Sem índice, o banco não tem escolha: lê as 5 milhões de linhas uma por uma e compara o email de cada uma. Isso é o **sequential scan** (ou full scan). O tempo cresce junto com a tabela, de forma linear, o que os livros chamam de O(N).

Com um índice na coluna `email`, o banco consulta uma estrutura separada, já organizada por email, que o leva direto às linhas certas em poucos passos. O tempo cresce muito devagar em relação ao tamanho da tabela, algo próximo de O(log N): dobrar o número de linhas adiciona só mais um ou dois passos na busca.

```mermaid
flowchart TD
    Q["WHERE email = 'ana@exemplo.com'"] --> D{Existe índice<br/>em email?}
    D -->|não| S["Sequential scan<br/>lê as 5M linhas"]
    D -->|sim| I["Index scan<br/>desce a árvore, poucos passos"]
```

A analogia clássica é o índice remissivo no fim de um livro. Para achar onde o livro fala de "recursão", você não lê as 400 páginas, vai no índice, encontra "recursão: 45, 90" e pula direto.

## Como funciona o índice B-tree

O tipo de índice padrão em praticamente todo banco relacional é o **B-tree** (árvore B), uma árvore balanceada que mantém os valores sempre ordenados.

- Os **nós internos** funcionam como placas de sinalização: "valores até M, vá para a esquerda; acima de M, vá para a direita".
- As **folhas** guardam os valores indexados em ordem, cada um com um ponteiro para a linha na tabela.
- A árvore é **balanceada**: todas as folhas ficam à mesma distância da raiz, então toda busca custa o mesmo, não importa o valor procurado.

Como as folhas estão em ordem, o B-tree serve para mais coisa do que igualdade (`=`):

- comparação e faixa: `>`, `<`, `>=`, `<=`, `BETWEEN`
- prefixo de texto: `nome LIKE 'anel%'` (mas não `LIKE '%anel'`, ver [Busca Full-Text](/labs/web-dev/banco-de-dados/16-busca-full-text-search/))
- `ORDER BY` na mesma coluna, sem precisar de um passo extra de ordenação

Colunas com `PRIMARY KEY` e `UNIQUE` já ganham um índice B-tree automático. A forma como esse índice se relaciona com o armazenamento físico da linha muda de um banco para outro (heap no PostgreSQL, índice clusterizado no MySQL/InnoDB), e isso está detalhado em [PostgreSQL vs MySQL](/labs/web-dev/banco-de-dados/12-postgres-vs-mysql/).

## O custo de manter um índice

Índice não é de graça. Cada um que você cria cobra dois preços:

- **Espaço em disco**: o índice é uma cópia parcial e ordenada dos dados, guardada à parte. Uma tabela com oito índices pode ter mais bytes em índice do que em dados.
- **Escrita mais lenta**: todo `INSERT`, `UPDATE` que toca a coluna indexada e `DELETE` precisa atualizar cada índice da tabela para mantê-lo em dia. Cinco índices significam cinco estruturas extras para reorganizar a cada escrita.

Por isso a resposta para "quantos índices devo ter?" nunca é "quantos couberem". Indexe as colunas que aparecem de fato em `WHERE`, `JOIN` e `ORDER BY` de queries frequentes, e olhe com desconfiança para índices que nenhuma query usa: eles só custam.

## Tipos de índice por uso

Além do B-tree simples de uma coluna, os que mais aparecem no dia a dia:

**Índice composto** cobre mais de uma coluna, na ordem em que você declara. `CREATE INDEX idx ON pedidos (usuario_id, status)` serve para filtrar por `usuario_id` sozinho ou por `usuario_id` e `status` juntos, mas não ajuda uma query que filtra só por `status`. A regra é pensar no índice composto como uma lista telefônica ordenada por sobrenome e depois nome: dá para achar todos os "Silva" e o "Silva, Ana", mas não dá para achar todas as "Ana" sem varrer tudo.

**Índice parcial** cobre só um subconjunto das linhas: `CREATE INDEX idx ON pedidos (criado_em) WHERE status = 'pendente'`. Fica menor e mais barato de manter quando as queries só se interessam por aquela fatia.

**Índice coberto** (covering) inclui todas as colunas que a query precisa, então o banco responde direto do índice sem nem tocar na tabela. No plano isso aparece como **index-only scan**.

**Índice único** (`UNIQUE`) tem função dupla: acelera a busca e garante que não existam dois valores repetidos.

Bancos também têm tipos especializados para casos que o B-tree não atende bem: **GIN** para texto e campos com vários valores (arrays, JSONB), **GiST** e **BRIN** para dados geográficos e faixas. O GIN é o motor da [Busca Full-Text](/labs/web-dev/banco-de-dados/16-busca-full-text-search/).

## Índices hash, bitmap e espacial

### Índice hash

O índice hash guarda o resultado de uma função de hash aplicada ao valor da coluna, e a busca vai direto ao "balde" certo, em tempo médio constante (O(1)). Pense num armário com gavetas numeradas: você calcula o número da gaveta a partir do nome e abre direto, sem folhear nada.

```sql
CREATE INDEX idx_usuarios_email_hash ON usuarios USING hash (email);

SELECT * FROM usuarios WHERE email = 'ana@exemplo.com';  -- usa o índice
SELECT * FROM usuarios WHERE email > 'a';                -- não usa
```

O preço dessa velocidade é a perda da ordem: o hash espalha os valores, então o índice não sabe dizer qual valor vem antes de qual. Ele só responde a `=`. Faixas (`>`, `BETWEEN`), `ORDER BY` e `LIKE 'abc%'` ficam de fora.

Na prática, o hash raramente compensa. O B-tree já resolve igualdade muito bem, atende faixa e ordenação, e a diferença de velocidade costuma ser pequena. Vale olhar o que cada banco oferece:

- **PostgreSQL**: tem índice hash, criado com `USING hash`. A documentação o descreve como limitado à comparação por `=`.
- **MySQL (InnoDB)**: você não cria índice hash. O InnoDB tem o _adaptive hash index_, um hash em memória que ele monta sozinho sobre páginas de B-tree muito acessadas. Índice hash declarado por você só existe na engine MEMORY.

### Índice bitmap

Um índice bitmap guarda, para cada valor distinto da coluna, uma sequência de bits com um bit por linha da tabela: `1` se a linha tem aquele valor, `0` se não. Numa coluna `status` com os valores `ativo`, `inativo` e `bloqueado`, o índice tem três sequências de bits.

```mermaid
flowchart LR
    subgraph Tabela
        L1["linha 1: ativo"]
        L2["linha 2: inativo"]
        L3["linha 3: ativo"]
        L4["linha 4: bloqueado"]
    end
    subgraph Bitmaps
        B1["ativo:     1 0 1 0"]
        B2["inativo:   0 1 0 0"]
        B3["bloqueado: 0 0 0 1"]
    end
    Tabela --> Bitmaps
```

O ponto forte é combinar filtros: `WHERE status = 'ativo' AND regiao = 'sul'` vira uma operação `AND` bit a bit entre dois bitmaps, que o processador faz muito rápido. Por isso esse índice aparece em **data warehouses e sistemas OLAP**, com colunas de **baixa cardinalidade** (poucos valores distintos, como status, sexo, flags booleanas) e dados que são mais lidos do que escritos.

O ponto fraco é a escrita. Um único `UPDATE` pode travar muitas linhas do índice de uma vez (a documentação da Oracle avisa que ele não serve para OLTP com muitas transações concorrentes). Em coluna de alta cardinalidade o índice também perde a vantagem, porque vira milhares de sequências quase vazias.

Um detalhe que costuma confundir: **PostgreSQL e MySQL/InnoDB não têm índice bitmap persistente**. Ele existe no Oracle e em bancos analíticos. O "Bitmap Heap Scan" que aparece no plano de execução do PostgreSQL (visto em [Diagnóstico de Queries Lentas](/labs/web-dev/banco-de-dados/18-diagnostico-de-queries-lentas/)) é outra coisa: um bitmap temporário, montado em memória durante a query, para visitar as páginas da tabela em ordem.

### Índice espacial

Perguntas como "quais restaurantes estão a menos de 5 km daqui?" ou "qual motorista está mais perto do embarque?" não se resolvem com B-tree: latitude e longitude formam duas dimensões, e um índice ordenado só sabe ordenar em uma.

O índice espacial organiza os dados por região do espaço. A estrutura clássica é a **R-tree**, que agrupa pontos e formas próximos dentro de retângulos, e esses retângulos dentro de retângulos maiores. Para achar o que está perto, o banco descarta de uma vez todos os retângulos longe do ponto consultado.

```sql
-- PostgreSQL com a extensão PostGIS
CREATE INDEX idx_restaurantes_local ON restaurantes USING gist (localizacao);

SELECT nome
FROM restaurantes
WHERE ST_DWithin(localizacao, ST_MakePoint(-38.52, -3.73)::geography, 5000);
```

Os nomes mudam por banco, a ideia é a mesma: no PostgreSQL, o índice espacial é um GiST, e o PostGIS fornece as funções; no MySQL, o índice `SPATIAL`; no MongoDB, o índice `2dsphere`. A parte de busca geográfica em si, como recurso de produto, está em [Tipos de Busca](/labs/web-dev/banco-de-dados/15-tipos-de-busca/).

## Qual índice escolher

O índice certo depende do que a query faz, não só de qual coluna aparece no `WHERE`. A tabela junta os tipos vistos até aqui e o de [Busca Full-Text](/labs/web-dev/banco-de-dados/16-busca-full-text-search/):

| Se a query...                                           | Use             | Observação                                   |
| ------------------------------------------------------- | --------------- | -------------------------------------------- |
| É uma consulta comum, com igualdade, faixa ou ordenação | B-tree          | O padrão, na dúvida comece por ele           |
| Só compara por igualdade exata                          | Hash            | Ganho pequeno, raramente compensa            |
| Filtra por várias colunas juntas                        | Composto        | A ordem das colunas importa                  |
| Usa só colunas que já estão no índice                   | Coberto         | Vira index-only scan                         |
| Só interessa a um subconjunto das linhas                | Parcial         | Menor e mais barato de manter                |
| Busca palavras dentro de texto                          | Full-text (GIN) | Ver a nota de busca full-text                |
| Busca por localização ou proximidade                    | Espacial (GiST) | Precisa de PostGIS ou equivalente            |
| Faz análise sobre coluna de poucos valores              | Bitmap          | Só onde existe, e para dados pouco alterados |

Para ver o índice coberto em ação no PostgreSQL, a cláusula `INCLUDE` adiciona colunas ao índice só para serem lidas, sem participarem da ordenação:

```sql
CREATE INDEX idx_pedidos_usuario
ON pedidos (usuario_id)
INCLUDE (valor_total, criado_em);

-- responde só com o índice (Index Only Scan)
SELECT valor_total, criado_em FROM pedidos WHERE usuario_id = 42;
```

Um último lembrete: escolher o tipo certo não substitui olhar o plano de execução. Confirme com `EXPLAIN` que o banco realmente usou o índice, e lembre do custo de manter cada índice em escrita e espaço, visto no começo da nota.

## Quando o banco usa ou ignora o índice

Criar o índice não obriga o banco a usá-lo. Quem decide, query a query, é o **otimizador** (query planner): ele estima o custo de cada estratégia possível e escolhe a mais barata. Isso depende de:

- **Seletividade**: quão específico é o filtro. `WHERE email = ?` costuma trazer 1 linha entre milhões, ótimo para índice. `WHERE ativo = true` numa tabela onde 90% está ativo traz quase tudo, e aí ler a tabela inteira de uma vez é mais rápido do que pular do índice para a tabela milhões de vezes. Índice em coluna de baixa cardinalidade (booleano, status com 3 valores) raramente compensa.
- **Tamanho da tabela**: numa tabela de 200 linhas, o sequential scan é tão rápido que o planner nem considera o índice.
- **Estatísticas**: o banco guarda um resumo da distribuição dos dados de cada coluna e se baseia nele para estimar. Estatística desatualizada leva a plano ruim, por isso existe o `ANALYZE` (no PostgreSQL) para recalcular.

Alguns padrões no código **impedem** o uso do índice mesmo quando ele existe e seria útil:

- função ou cálculo na coluna: `WHERE lower(email) = ?` não usa o índice de `email` (a saída seria um índice sobre `lower(email)`)
- curinga à esquerda: `WHERE nome LIKE '%anel'`
- comparar tipos diferentes, forçando conversão implícita na coluna

## Lendo o plano de execução

Todo banco tem um comando que mostra a estratégia escolhida. No PostgreSQL e no MySQL é o `EXPLAIN`:

```sql
EXPLAIN
SELECT * FROM usuarios WHERE email = 'ana@exemplo.com';
```

Isso devolve o **plano estimado**, sem rodar a query. Trocando por `EXPLAIN ANALYZE`, o banco executa a query de verdade e mostra os números reais: tempo de cada etapa, quantas linhas passaram, quantas foram descartadas por filtro.

O que procurar no resultado:

- **Seq Scan**: leu a tabela inteira. Esperado em tabela pequena ou query pouco seletiva, suspeito numa tabela grande com filtro específico.
- **Index Scan**: usou um índice para achar as linhas e foi buscá-las na tabela.
- **Index Only Scan**: respondeu só com o índice, sem tocar na tabela. O mais rápido.
- **linhas estimadas vs linhas reais**: se o planner achava que viriam 10 linhas e vieram 400 mil, as estatísticas estão desatualizadas e o plano provavelmente é ruim.

A nota de [Busca Full-Text](/labs/web-dev/banco-de-dados/16-busca-full-text-search/) tem um exemplo lado a lado de `EXPLAIN ANALYZE` antes e depois de criar o índice, vale ver o efeito na prática. Para ir além do plano (buffers, esperas de lock, ordenação em disco e monitoramento em produção), veja [Diagnóstico de Queries Lentas](/labs/web-dev/banco-de-dados/18-diagnostico-de-queries-lentas/).

## Referências

- [O que são Índices em Bancos de Dados - Indexação em Tabelas](https://www.bosontreinamentos.com.br/bancos-de-dados/o-que-sao-indices-em-bancos-de-dados-indexacao-em-tabelas/) - Fábio dos Reis (Bóson Treinamentos), pt-BR
- [Índices - Documentação do PostgreSQL, capítulo 11](https://www.postgresql.org/docs/current/indexes.html) - PostgreSQL, en
- [Use The Index, Luke! - Markus Winand](https://use-the-index-luke.com/) - Markus Winand, en
- [How to Read Postgres EXPLAIN: A Guide to Scan Types](https://www.crunchydata.com/blog/postgres-scan-types-in-explain-plans) - Crunchy Data, en
- [PostgreSQL: Index Types](https://www.postgresql.org/docs/current/indexes-types.html) - PostgreSQL, en
- [PostgreSQL: Index-Only Scans and Covering Indexes](https://www.postgresql.org/docs/current/indexes-index-only-scans.html) - PostgreSQL, en
- [MySQL: Adaptive Hash Index](https://dev.mysql.com/doc/refman/8.4/en/innodb-adaptive-hash.html) - MySQL, en
- [O que é extensão espacial PostGIS para PostgreSQL](https://4linux.com.br/o-que-e-postgis/) - 4Linux, pt-BR
