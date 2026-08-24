# Kafka

A nota anterior, [Filas e Mensageria](/labs/web-dev/mensageria/filas-e-mensageria/), descreve o papel genérico de um broker: receber mensagens de producers e entregar para consumers. O Apache Kafka é hoje uma das implementações mais usadas desse papel, mas com um jeito próprio de organizar os dados que vale entender em detalhe, porque ele explica boa parte das decisões de projeto que aparecem ao usar Kafka na prática.

## Conceitos fundamentais

**Topic** é o nome que o Kafka dá ao canal onde as mensagens são publicadas, equivalente ao conceito de topic visto na nota anterior. Um sistema de e-commerce pode ter topics como `pedidos-criados`, `pagamentos-aprovados` ou `estoque-atualizado`.

**Partition**: aqui está a diferença que faz o Kafka escalar. Um topic não é uma fila única, ele é dividido em várias **partições**, e cada partição é uma sequência ordenada e imutável de mensagens, guardada em disco. Isso permite que várias mensagens do mesmo topic sejam escritas e lidas em paralelo, uma por partição.

```mermaid
flowchart TB
    subgraph Topic: pedidos-criados
    P0["Partição 0<br/>msg1, msg2, msg5..."]
    P1["Partição 1<br/>msg3, msg6..."]
    P2["Partição 2<br/>msg4, msg7..."]
    end
```

Quando o producer publica uma mensagem, o Kafka decide em qual partição ela cai (por padrão, com base numa chave que o producer envia, tipo o ID do pedido). Mensagens com a mesma chave sempre vão para a mesma partição, o que garante que a ordem entre elas seja preservada, isso é aprofundado na próxima nota, sobre [Garantias de Entrega](/labs/web-dev/mensageria/garantias-de-entrega/).

**Offset**: dentro de cada partição, toda mensagem recebe um número sequencial crescente, o offset (0, 1, 2, 3...). É basicamente o "número da posição" da mensagem naquela partição. O Kafka não remove uma mensagem assim que ela é lida, como uma fila tradicional faria, ele guarda a mensagem por um tempo configurável (dias, semanas) e é o consumer quem controla até qual offset já leu.

Essa é uma diferença importante de mentalidade: no Kafka, ler uma mensagem não a "consome" no sentido de apagar. Vários consumers diferentes podem ler a mesma partição, cada um na sua própria posição, e é possível até voltar o offset e reprocessar mensagens antigas.

**Producer**: quem publica mensagens num topic, o mesmo papel visto na nota anterior. No Kafka, o producer normalmente informa uma chave (para controlar a partição de destino) e o payload da mensagem.

**Consumer** e **Consumer Group**: um consumer lê mensagens de uma ou mais partições. Mas o uso comum é agrupar vários consumers num **consumer group**: o Kafka distribui as partições do topic entre os consumers daquele grupo, um consumer só, uma ou várias partições, mas cada partição só vai para um consumer do grupo por vez.

```mermaid
flowchart LR
    subgraph Topic (3 partições)
    P0[Partição 0]
    P1[Partição 1]
    P2[Partição 2]
    end
    subgraph Consumer Group A
    C1[Consumer 1]
    C2[Consumer 2]
    C3[Consumer 3]
    end
    P0 --> C1
    P1 --> C2
    P2 --> C3
```

Isso é o que dá ao Kafka a capacidade de escalar o consumo horizontalmente (veja [Escalabilidade horizontal](/labs/web-dev/escalabilidade/escalabilidade/)): quer processar mais rápido? Aumenta o número de partições e o número de consumers no grupo, até o limite de um consumer por partição. Se você tiver mais consumers do que partições, os consumers extras ficam ociosos, sem partição para ler.

Vale notar que grupos diferentes são independentes entre si: o consumer group do serviço de e-mail e o consumer group do serviço de estoque podem ler o mesmo topic `pedidos-criados` do começo ao fim, cada um no seu próprio ritmo, sem interferir um no outro.

**Replication**: cada partição não vive numa única máquina do cluster Kafka, ela é replicada em várias, uma delas é a **líder** (recebe todas as escritas e leituras) e as outras são **réplicas** que copiam os dados dela. Se a máquina líder cair, uma das réplicas assume o posto automaticamente, e o topic continua disponível sem perder mensagens já confirmadas. O nível de replicação (quantas cópias existem) é configurável por topic, e é o principal mecanismo do Kafka para tolerar falha de máquina sem perder dado.

## Evolução de schema

Um evento publicado no Kafka tem um formato: quais campos existem, que tipo cada um tem, quais são obrigatórios. Esse formato é o schema do evento, e ele raramente fica parado. Uma regra de negócio nova exige um campo a mais, um campo muda de tipo, um relacionamento fica mais complexo. O problema é que producer e consumer não fazem deploy juntos: são times diferentes, com ritmos de deploy diferentes, e no meio do caminho é comum ter um producer já publicando no schema novo enquanto um consumer ainda espera o schema antigo, ou o inverso, um consumer atualizado lendo mensagens que foram escritas há dias com o schema antigo (lembra que o Kafka guarda as mensagens por um tempo configurável, não apaga assim que alguém lê). Se essa mudança de schema não for pensada, o consumer quebra: um campo que ele espera não existe mais, um tipo não bate, a deserialização falha.

Isso é diferente de uma API REST, onde cliente e servidor costumam conversar em tempo real e dá para simplesmente forçar os dois lados a atualizar juntos. No Kafka não tem esse luxo: uma mensagem publicada hoje pode ser lida daqui a uma semana, por um consumer que nem existia quando ela foi escrita. O schema precisa aguentar esse desencontro no tempo.

**Compatibilidade** é o nome que se dá à capacidade de um schema novo conviver com um schema antigo sem quebrar quem está lendo ou escrevendo. Existem quatro tipos:

- **Backward**: um consumer com o schema novo consegue ler mensagens escritas com o schema antigo. É o tipo mais buscado na prática, porque permite atualizar o consumer sem depender do producer, e ainda deixa reprocessar o histórico de mensagens antigas com o código novo.
- **Forward**: um consumer com o schema antigo consegue ler mensagens escritas com o schema novo. Útil quando o producer precisa evoluir rápido e nem todo consumer atualizou ainda.
- **Full**: as duas garantias ao mesmo tempo, backward e forward. É o cenário mais seguro, mas também o mais restritivo sobre o que pode mudar no schema.
- **Incompatível**: a mudança quebra o contrato em pelo menos uma direção, e algum consumer (novo ou antigo, dependendo do caso) para de conseguir ler a mensagem.

| Tipo | Consumer novo lê mensagem antiga? | Consumer antigo lê mensagem nova? | Exemplo de mudança permitida |
| --- | --- | --- | --- |
| Backward | Sim | Não garantido | Remover um campo, ou adicionar um campo opcional com valor default |
| Forward | Não garantido | Sim | Adicionar um campo, ou remover um campo opcional |
| Full | Sim | Sim | Só adicionar campos opcionais com default, nunca remover nem renomear |
| Incompatível | Não | Não | Renomear um campo, mudar o tipo de um campo existente, tornar um campo opcional em obrigatório |

Na prática, a recomendação geral é mirar em compatibilidade backward como padrão. Algumas boas práticas seguem direto dessa lógica:

- **Adicionar campos em vez de remover ou renomear.** Um campo novo, se for opcional, não quebra quem ainda não sabe da existência dele. Remover ou renomear um campo existente é a mudança mais arriscada, porque qualquer consumer que dependa daquele campo quebra na hora.
- **Campos opcionais com valor default.** Quando um campo precisa ser adicionado, dar um valor default evita que mensagens antigas, que nunca tiveram esse campo, causem erro de deserialização: o consumer usa o default para o que não veio.
- **Versionar eventos** quando a mudança é grande demais para caber numa evolução compatível, como reestruturar o payload inteiro. Nesse caso, um campo de versão no próprio evento, ou até um topic novo (`pedidos-criados-v2`), deixa explícito que aquilo é um contrato diferente e dá tempo para migrar os consumers de um lado para o outro sem quebra.

Nada disso fica garantido sozinho: alguém, ou alguma ferramenta, precisa checar se uma mudança de schema realmente respeita a regra de compatibilidade antes de ir para produção. É aí que entra o **Schema Registry**, o mais usado é o Confluent Schema Registry: um serviço central que guarda todas as versões de schema de cada topic, normalmente escritas em **Avro** ou **Protobuf**, formatos binários compactos com schema bem definido, ao contrário de um JSON solto sem contrato nenhum. Antes de aceitar um schema novo, o registry valida contra a regra de compatibilidade configurada para aquele topic (backward, forward ou full) e recusa a publicação se a mudança quebrar o contrato. Isso tira a checagem de compatibilidade da cabeça de cada dev e coloca num ponto único, automatizado, que barra o problema antes dele virar incidente em produção.

