# SQL

SQL (Structured Query Language) é a linguagem padrão para interagir com bancos de dados relacionais. Independente do banco que você usa - PostgreSQL, MySQL, SQLite, SQL Server - o SQL core é praticamente o mesmo.

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
