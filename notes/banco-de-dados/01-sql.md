# SQL

SQL (Structured Query Language) é a linguagem padrão para interagir com bancos de dados relacionais. Independentemente do banco que você usa - PostgreSQL, MySQL, SQLite, SQL Server - o núcleo do SQL é praticamente o mesmo.

## SGBD e as sublinguagens do SQL

Quem realmente guarda os dados, resolve as consultas, controla o acesso concorrente e cuida de backup é o **SGBD** (Sistema de Gerenciamento de Banco de Dados), o programa servidor. PostgreSQL, MySQL, SQLite e SQL Server são SGBDs. Quando eles organizam os dados em tabelas com linhas e colunas e permitem relacionar essas tabelas, são chamados de **SGBDs relacionais**.

O SQL é só a linguagem que você usa para conversar com esse servidor. Ele não é um banco de dados, é o idioma. Cada SGBD implementa o padrão SQL com pequenas variações de sintaxe, mas o núcleo é o mesmo em todos.

Os comandos do SQL são agrupados em sublinguagens, de acordo com o que fazem:

| Sublinguagem              | Serve para                                             | Comandos                                   |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| DDL (Data Definition)     | Definir a estrutura: bancos, tabelas, colunas, índices | `CREATE`, `ALTER`, `DROP`, `TRUNCATE`      |
| DML (Data Manipulation)   | Mexer nos dados guardados                              | `INSERT`, `UPDATE`, `DELETE`               |
| DQL (Data Query)          | Consultar dados                                        | `SELECT`                                   |
| DCL (Data Control)        | Dar e tirar permissões                                 | `GRANT`, `REVOKE`                          |
| TCL (Transaction Control) | Delimitar transações                                   | `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT` |

Na prática ninguém decora essa tabela, mas ela ajuda a entender por que `CREATE TABLE` e `SELECT` parecem coisas tão diferentes: são responsabilidades separadas dentro da mesma linguagem. Alguns materiais tratam o `SELECT` como parte do DML em vez de separar o DQL, os dois jeitos aparecem por aí.

## Estrutura de um banco relacional

Dados são organizados em **tabelas** (como planilhas), com **colunas** (campos) e **linhas** (registros). As relações entre tabelas são feitas por chaves.

- **Chave primária (PK):** identifica cada linha de forma única
- **Chave estrangeira (FK):** referencia a PK de outra tabela

## DDL - Definição de Estrutura

### Criar banco de dados

```sql
CREATE DATABASE loja;
```

```sql
-- Para evitar erro se já existir
CREATE DATABASE IF NOT EXISTS loja;
```

### Criar tabela

```sql
CREATE TABLE usuarios (
    id         SERIAL PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    nascimento DATE,
    ativo      BOOLEAN DEFAULT TRUE,
    criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Tipos comuns:

| Tipo             | Descrição                        |
| ---------------- | -------------------------------- |
| `INT` / `SERIAL` | Inteiro (SERIAL auto-incrementa) |
| `VARCHAR(n)`     | Texto com limite de caracteres   |
| `TEXT`           | Texto sem limite                 |
| `DECIMAL(p,s)`   | Decimal com precisão             |
| `BOOLEAN`        | Verdadeiro/falso                 |
| `DATE`           | Data (YYYY-MM-DD)                |
| `TIMESTAMP`      | Data e hora                      |

```sql
-- Tabela com chave estrangeira
CREATE TABLE pedidos (
    id         SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    valor      DECIMAL(10, 2) NOT NULL,
    status     VARCHAR(20) DEFAULT 'pendente',
    criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Restrições (constraints)

Restrições são regras que você declara na tabela e o **banco** passa a garantir em toda escrita, venha ela de qual aplicação for. É diferente de validar só no código: se um script, um estagiário no terminal ou um bug tentar gravar um dado que quebra a regra, o banco recusa.

| Restrição                    | O que garante                                                       |
| ---------------------------- | ------------------------------------------------------------------- |
| `NOT NULL`                   | A coluna não pode ficar vazia                                       |
| `UNIQUE`                     | Não podem existir dois valores iguais nessa coluna                  |
| `DEFAULT valor`              | Se ninguém informar, entra esse valor                               |
| `CHECK (condição)`           | O valor só é aceito se a condição for verdadeira                    |
| `PRIMARY KEY`                | `NOT NULL` + `UNIQUE`, e marca a coluna como identificador da linha |
| `FOREIGN KEY` / `REFERENCES` | O valor precisa existir na tabela referenciada                      |

```sql
CREATE TABLE produtos (
    id       SERIAL PRIMARY KEY,
    sku      VARCHAR(20) NOT NULL UNIQUE,
    preco    DECIMAL(10,2) NOT NULL CHECK (preco >= 0),
    estoque  INT DEFAULT 0 CHECK (estoque >= 0),
    categoria_id INT REFERENCES categorias(id)
);
```

Dá para nomear a restrição com `CONSTRAINT`:

```sql
CREATE TABLE produtos (
    id     SERIAL PRIMARY KEY,
    preco  DECIMAL(10,2) NOT NULL,
    CONSTRAINT preco_nao_negativo CHECK (preco >= 0)
);
```

Vale o trabalho porque o nome aparece na mensagem de erro. `violates check constraint "preco_nao_negativo"` diz na hora o que aconteceu; o nome automático que o banco inventa (`produtos_preco_check`) já é menos óbvio.

### Alterar tabela

```sql
ALTER TABLE usuarios ADD COLUMN telefone VARCHAR(20);
ALTER TABLE usuarios DROP COLUMN telefone;
ALTER TABLE usuarios RENAME COLUMN nome TO nome_completo;
```

### Remover tabela

```sql
DROP TABLE pedidos;
DROP TABLE IF EXISTS pedidos;
```

## DML - Manipulação de Dados

### INSERT

```sql
-- Inserir um registro
INSERT INTO usuarios (nome, email, nascimento)
VALUES ('Ana Silva', 'ana@exemplo.com', '1995-03-15');

-- Inserir múltiplos registros
INSERT INTO usuarios (nome, email) VALUES
    ('Bruno Costa', 'bruno@exemplo.com'),
    ('Carla Melo', 'carla@exemplo.com'),
    ('Daniel Rocha', 'daniel@exemplo.com');
```

### SELECT

```sql
-- Todos os dados
SELECT * FROM usuarios;

-- Colunas específicas
SELECT nome, email FROM usuarios;

-- Com filtro
SELECT nome, email FROM usuarios WHERE ativo = TRUE;

-- Múltiplas condições
SELECT * FROM usuarios
WHERE ativo = TRUE AND nascimento > '1990-01-01';

-- Ordenação
SELECT nome, email FROM usuarios ORDER BY nome ASC;
SELECT nome, email FROM usuarios ORDER BY criado_em DESC;

-- Limitar resultados
SELECT * FROM usuarios LIMIT 10;
SELECT * FROM usuarios LIMIT 10 OFFSET 20; -- paginação (página 3)

-- Busca parcial
SELECT * FROM usuarios WHERE nome LIKE '%Silva%';
SELECT * FROM usuarios WHERE email LIKE '%@gmail.com';

-- Lista de valores
SELECT * FROM usuarios WHERE id IN (1, 3, 5, 7);

-- Intervalo
SELECT * FROM pedidos WHERE valor BETWEEN 100.00 AND 500.00;
```

O `LIKE` serve para padrões simples e busca por prefixo. Para busca em texto livre (com relevância, plural e acento), ele não escala: esse é o assunto da nota de [Busca Full-Text](/labs/web-dev/banco-de-dados/16-busca-full-text-search/).

### DISTINCT

`DISTINCT` remove linhas repetidas do resultado, deixando só as combinações únicas:

```sql
-- Quais status de pedido existem na tabela
SELECT DISTINCT status FROM pedidos;

-- Combinações únicas de duas colunas (cada par cidade+estado só aparece uma vez)
SELECT DISTINCT cidade, estado FROM usuarios;

-- Contar quantos valores diferentes existem
SELECT COUNT(DISTINCT usuario_id) AS clientes_que_compraram FROM pedidos;
```

O `DISTINCT` vale para a linha inteira que foi selecionada, não para uma coluna só. `SELECT DISTINCT cidade, estado` não traz cidades únicas, traz pares únicos de cidade e estado.

Para só listar valores únicos, `DISTINCT` e `GROUP BY` chegam ao mesmo resultado:

```sql
SELECT DISTINCT status FROM pedidos;
SELECT status FROM pedidos GROUP BY status;   -- mesmo resultado
```

A diferença aparece quando você quer contar ou somar junto: aí é `GROUP BY` com função de agregação (próxima seção). Use `DISTINCT` quando só precisa da lista sem repetição.

### Funções de agregação

```sql
SELECT COUNT(*) FROM usuarios WHERE ativo = TRUE;
SELECT SUM(valor) FROM pedidos;
SELECT AVG(valor) FROM pedidos;
SELECT MIN(valor), MAX(valor) FROM pedidos;

-- Agrupar e agregar
SELECT usuario_id, COUNT(*) AS total_pedidos, SUM(valor) AS total_gasto
FROM pedidos
GROUP BY usuario_id;

-- Filtrar grupos
SELECT usuario_id, COUNT(*) AS total_pedidos
FROM pedidos
GROUP BY usuario_id
HAVING COUNT(*) > 5;
```

### Funções de string e data

Além das funções que resumem vários registros num valor, o SQL tem funções que transformam o valor de uma coluna linha a linha. As mais usadas são as de texto e de data.

Texto:

```sql
SELECT
    UPPER(nome)                    AS maiusculo,
    LOWER(email)                   AS minusculo,
    LENGTH(nome)                   AS tamanho,
    TRIM(nome)                     AS sem_espaco_nas_pontas,
    SUBSTRING(email FROM 1 FOR 3)  AS tres_primeiras_letras,
    REPLACE(telefone, '-', '')     AS so_digitos,
    nome || ' <' || email || '>'   AS contato
FROM usuarios;
```

O `||` concatena textos no PostgreSQL. No MySQL a concatenação é `CONCAT(nome, ' <', email, '>')`, e o `||` por padrão significa "ou". É a diferença de sintaxe que mais pega quem troca de banco.

Data:

```sql
SELECT
    CURRENT_DATE                              AS hoje,
    NOW()                                     AS agora,
    EXTRACT(YEAR FROM nascimento)             AS ano_nascimento,
    AGE(nascimento)                           AS idade_aproximada,
    criado_em + INTERVAL '7 days'             AS prazo,
    CURRENT_DATE - nascimento                 AS dias_de_vida
FROM usuarios;
```

Aqui a variação entre bancos é ainda maior: `NOW()` existe nos dois, mas `AGE()` e `EXTRACT` são do PostgreSQL, enquanto o MySQL usa `TIMESTAMPDIFF`, `YEAR(coluna)`, `DATE_ADD`. Quando precisar de uma função de data específica, consulte a documentação do banco que você usa, não confie na memória de outro.

### UPDATE

```sql
-- Sempre use WHERE no UPDATE para não atualizar todos os registros
UPDATE usuarios
SET email = 'novo@email.com'
WHERE id = 1;

-- Múltiplas colunas
UPDATE usuarios
SET nome = 'Ana Santos', ativo = FALSE
WHERE email = 'ana@exemplo.com';
```

### DELETE

```sql
-- Deletar registro específico
DELETE FROM usuarios WHERE id = 5;

-- Deletar com condição
DELETE FROM pedidos WHERE status = 'cancelado' AND criado_em < '2024-01-01';

-- Remover todos os dados (mantém a estrutura)
TRUNCATE TABLE logs;
```

> Diferença entre `DELETE` e `TRUNCATE`: `DELETE` remove linha por linha (pode ter `WHERE`, é mais lento em tabelas grandes). `TRUNCATE` remove tudo de uma vez, sem transação individual por linha.

## JOINs

JOINs combinam dados de múltiplas tabelas com base em uma condição de relacionamento.

### INNER JOIN

Retorna apenas os registros que têm correspondência em ambas as tabelas:

```sql
SELECT u.nome, p.valor, p.status
FROM pedidos p
INNER JOIN usuarios u ON p.usuario_id = u.id;
```

Usuários sem pedidos e pedidos sem usuário válido não aparecem.

### LEFT JOIN

Retorna todos os registros da tabela à esquerda, e os correspondentes da direita. Onde não há correspondência, as colunas da direita são `NULL`:

```sql
SELECT u.nome, COUNT(p.id) AS total_pedidos
FROM usuarios u
LEFT JOIN pedidos p ON u.id = p.usuario_id
GROUP BY u.id, u.nome;
```

Todos os usuários aparecem, mesmo os que nunca fizeram pedido (total_pedidos = 0 ou NULL).

### RIGHT JOIN

O inverso do LEFT JOIN - todos os registros da direita, correspondências ou NULL da esquerda. Menos comum (pode ser reescrito como LEFT JOIN invertendo as tabelas).

### FULL OUTER JOIN

Retorna todos os registros de ambas as tabelas, com NULL onde não há correspondência:

```sql
SELECT u.nome, p.valor
FROM usuarios u
FULL OUTER JOIN pedidos p ON u.id = p.usuario_id;
```

### SELF JOIN

Join de uma tabela com ela mesma. Útil para dados hierárquicos:

```sql
-- Tabela de funcionários com coluna gerente_id referenciando a mesma tabela
SELECT f.nome AS funcionario, g.nome AS gerente
FROM funcionarios f
LEFT JOIN funcionarios g ON f.gerente_id = g.id;
```

### Anti-join: encontrando o que ficou de fora

Os JOINs acima respondem "o que combina". Muitas perguntas do dia a dia são o contrário: **o que não combina?** Quais usuários nunca fizeram pedido? Quais pagamentos não têm pedido correspondente? Esse padrão tem nome, **anti-join**, e a forma mais comum de escrever é um LEFT JOIN seguido de um filtro `IS NULL`:

```sql
-- Usuários que nunca fizeram nenhum pedido
SELECT u.id, u.nome
FROM usuarios u
LEFT JOIN pedidos p ON p.usuario_id = u.id
WHERE p.id IS NULL;
```

O raciocínio: o LEFT JOIN mantém todos os usuários e preenche as colunas de `pedidos` com `NULL` quando não acha correspondência. O `WHERE p.id IS NULL` fica justamente com essas linhas, as que "sobraram" sem par. Filtre por uma coluna que nunca é nula numa linha real (a chave primária é a escolha segura); se usar uma coluna que pode ser `NULL` de verdade, linhas com correspondência também passam pelo filtro.

O mesmo padrão aparece em checagens de qualidade de dados, como transações sem cliente ou itens apontando para produto apagado.

#### NOT EXISTS e a armadilha do NOT IN

Dá para escrever o mesmo anti-join com subconsulta:

```sql
SELECT u.id, u.nome
FROM usuarios u
WHERE NOT EXISTS (
    SELECT 1 FROM pedidos p WHERE p.usuario_id = u.id
);
```

No PostgreSQL, `NOT EXISTS` e `LEFT JOIN ... IS NULL` costumam gerar o mesmo plano de execução (um *hash anti join*), então a escolha é de legibilidade. Muita gente acha o `NOT EXISTS` mais claro, porque ele diz literalmente "não existe pedido para este usuário".

Já o `NOT IN`, que parece a forma mais natural, esconde uma armadilha:

```sql
-- Parece certo, mas...
SELECT id, nome FROM usuarios
WHERE id NOT IN (SELECT usuario_id FROM pedidos);
```

Se **um único** pedido tiver `usuario_id` nulo, essa consulta devolve zero linhas. O motivo está na lógica de três valores do SQL: `5 NOT IN (1, 2, NULL)` não é `TRUE`, é `NULL` ("não sei", porque 5 poderia ser igual ao valor desconhecido), e o `WHERE` descarta tudo que não é `TRUE`. Ninguém recebe erro, o resultado só vem vazio. Prefira `NOT EXISTS` ou o LEFT JOIN quando a coluna da subconsulta aceita `NULL`. 🪤

#### FULL OUTER JOIN + IS NULL: divergências entre dois lados

Quando nenhum dos dois lados é a fonte da verdade, por exemplo ao comparar os pedidos do sistema de vendas com as cobranças do gateway de pagamento, o FULL OUTER JOIN com `IS NULL` mostra as diferenças nas duas direções de uma vez:

```sql
SELECT p.id AS pedido_id, c.id AS cobranca_id
FROM pedidos p
FULL OUTER JOIN cobrancas c ON c.pedido_id = p.id
WHERE p.id IS NULL OR c.id IS NULL;
```

Linhas com `pedido_id` nulo são cobranças sem pedido; linhas com `cobranca_id` nulo são pedidos que nunca foram cobrados. É a base de rotinas de **reconciliação** e de checagem de sincronização entre sistemas.

O MySQL não tem FULL OUTER JOIN. A saída é juntar um LEFT JOIN com a parte que só existe do lado direito usando `UNION ALL`:

```sql
-- Emulação de FULL OUTER JOIN no MySQL
SELECT p.id AS pedido_id, c.id AS cobranca_id
FROM pedidos p
LEFT JOIN cobrancas c ON c.pedido_id = p.id
UNION ALL
SELECT p.id, c.id
FROM cobrancas c
LEFT JOIN pedidos p ON c.pedido_id = p.id
WHERE p.id IS NULL;
```

A segunda consulta pega só as cobranças sem pedido, o que evita repetir as linhas que já casaram na primeira. Usar `UNION` simples nas duas metades sem esse filtro também funciona, mas depende de remover duplicatas, o que custa mais e ainda pode apagar linhas que eram repetidas de verdade.

### Como escolher o JOIN

Escolher o tipo de JOIN é, na prática, escolher **quais linhas você aceita perder** no resultado. É aí que mora o erro silencioso mais comum: um INNER JOIN no lugar de um LEFT JOIN não dá erro nenhum, só some com registros. Um relatório de "faturamento por vendedor" com INNER JOIN simplesmente não mostra o vendedor novo que ainda não vendeu nada, e ninguém percebe até alguém perguntar por ele.

Comece pela pergunta, não pela sintaxe:

- Se a tabela da esquerda é a **fonte da verdade** (todos os clientes, todos os funcionários), use LEFT JOIN, para garantir que ninguém dela suma.
- RIGHT JOIN faz o espelho disso, mas quase sempre é reescrito como LEFT JOIN trocando a ordem das tabelas. Ler a consulta da esquerda para a direita, com a tabela principal primeiro, é mais fácil de seguir.
- Só use INNER JOIN quando registros sem par realmente não interessam (ex: só pedidos que têm pagamento confirmado).

Uma cola mental para a pergunta que cada um responde:

| JOIN                    | Pergunta que responde                         |
| ----------------------- | --------------------------------------------- |
| INNER                   | O que bate dos dois lados?                    |
| LEFT                    | Tudo da minha base, com o que tiver do outro  |
| LEFT + `IS NULL`        | O que da minha base não tem par do outro lado?|
| FULL OUTER              | Tudo que existe em qualquer um dos lados      |
| FULL OUTER + `IS NULL`  | Onde os dois lados divergem?                  |

E sobre performance: o tipo de JOIN, sozinho, não diz se a consulta será rápida ou lenta. O que pesa é se a chave de junção tem índice, o tamanho das tabelas, como os dados estão distribuídos, os filtros aplicados antes da junção e o plano que o banco escolhe. Um LEFT JOIN bem indexado vence fácil um INNER JOIN numa coluna sem índice. Para saber de verdade, olhe o `EXPLAIN`, assunto de [Índices e Planos de Execução](/labs/web-dev/banco-de-dados/14-indices-e-planos-de-execucao/).

## UNION e UNION ALL

Enquanto o `JOIN` cola tabelas lado a lado (mais colunas), o `UNION` empilha resultados um embaixo do outro (mais linhas). Serve quando você tem duas consultas que produzem o mesmo formato de linha e quer o resultado das duas junto.

```sql
-- Todos os e-mails de contato, venham de clientes ou de fornecedores
SELECT nome, email FROM usuarios
UNION
SELECT nome, email FROM fornecedores;
```

`UNION` remove as linhas duplicadas do resultado final. Se um mesmo `nome, email` aparecer nas duas tabelas, ele sai uma vez só. Para conseguir isso o banco precisa comparar tudo, o que custa tempo.

`UNION ALL` não remove nada, só concatena. É mais rápido e é o que você quer quando sabe que não há duplicata ou quando a duplicata é informação legítima:

```sql
SELECT 'usuario' AS origem, nome FROM usuarios
UNION ALL
SELECT 'fornecedor' AS origem, nome FROM fornecedores;
```

Regras para as consultas combinarem:

- Mesmo número de colunas nas duas
- Tipos compatíveis coluna a coluna (texto com texto, número com número)
- Os nomes das colunas do resultado vêm da primeira consulta
- Um único `ORDER BY`, no fim de tudo, ordenando o resultado já unido

```sql
SELECT nome, criado_em FROM usuarios
UNION ALL
SELECT nome, criado_em FROM fornecedores
ORDER BY criado_em DESC;
```

Na dúvida entre os dois, comece com `UNION ALL` e só troque para `UNION` se realmente precisar tirar duplicata. Muita gente escreve `UNION` por hábito e paga o custo da deduplicação sem necessidade.

## Subconsultas

```sql
-- Usuários que fizeram mais de 3 pedidos
SELECT nome FROM usuarios
WHERE id IN (
    SELECT usuario_id FROM pedidos
    GROUP BY usuario_id
    HAVING COUNT(*) > 3
);

-- Pedidos com valor acima da média
SELECT * FROM pedidos
WHERE valor > (SELECT AVG(valor) FROM pedidos);
```

## Índices

Índices aceleram consultas mas aumentam espaço em disco e levemente o custo de escrita:

```sql
-- Criar índice em coluna frequentemente usada em WHERE
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Índice composto
CREATE INDEX idx_pedidos_usuario_status ON pedidos(usuario_id, status);

-- Ver índices existentes (PostgreSQL)
\d usuarios
```

Colunas com `PRIMARY KEY` e `UNIQUE` já têm índice automaticamente.

Como o índice funciona por dentro (a árvore B-tree), quando o banco decide usar ou ignorar um índice e como ler o plano de uma query com `EXPLAIN` está em [Índices e Planos de Execução](/labs/web-dev/banco-de-dados/14-indices-e-planos-de-execucao/).

## Transações

Transações agrupam operações que devem ser executadas como uma unidade - ou tudo funciona, ou nada:

```sql
BEGIN;

UPDATE contas SET saldo = saldo - 500 WHERE id = 1;
UPDATE contas SET saldo = saldo + 500 WHERE id = 2;

-- Se chegou aqui sem erro, confirmar
COMMIT;

-- Se algo deu errado, desfazer
ROLLBACK;
```

Propriedades ACID: Atomicidade, Consistência, Isolamento, Durabilidade.

## Referências

- [Joins Between Tables](https://www.postgresql.org/docs/current/tutorial-join.html) - PostgreSQL Docs, en
- [Subquery Expressions (EXISTS, NOT IN)](https://www.postgresql.org/docs/current/functions-subquery.html) - PostgreSQL Docs, en
- [NOT IN vs. NOT EXISTS vs. LEFT JOIN / IS NULL: PostgreSQL](https://explainextended.com/2009/09/16/not-in-vs-not-exists-vs-left-join-is-null-postgresql/) - Quassnoi (Explain Extended), en
