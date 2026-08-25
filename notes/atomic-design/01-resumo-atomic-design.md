# Atomic Design: uma arquitetura para organização de componentes e interfaces

## Artigos

- [Pelo criador, Brad Frost](https://atomicdesign.bradfrost.com/)
- [Por Jéssica Araújo](https://medium.com/pretux/atomic-design-o-que-%C3%A9-como-surgiu-e-sua-import%C3%A2ncia-para-a-cria%C3%A7%C3%A3o-do-design-system-e3ac7b5aca2c)

## O que a química e esse System Design têm em comum?

| - | Química | Frontend |
| - | - | - |
| Átomo | Possui propriedades distintas e não pode ser quebrado sem perder seu significado | Componentes simples como botões, labels, inputs |
| Molécula | Dois ou mais átomos mantidos juntos por ligações químicas | Combinação de átomos com função básica como um campo de texto |
| Organismo | Conjunto de moléculas que funcionam como uma unidade | Agrupamento de moléculas e/ou átomos para formar seções complexas de interface como um cabeçalho de página |

## Tabela periódica dos elementos HTML
[allthetags.com](https://allthetags.com/)

## Outras estruturas para interfaces

### Template

Layout que organiza os organismos. Focado na estrutura. Possui placeholders que podem ser modificados.

Ex: Página de blog sem texto real.

### Páginas

Instância real do template. Onde o conteúdo é inserido. Possui as regras de negócio necessárias para o uso.

Ex: Página inicial com todo conteúdo carregado (dados, textos e imagens).

## Estrutura de pastas

```
src/
├── componentes/
|   ├── atomos/
|   ├── moleculas/
|   ├── organismos/
|   ├── paginas/
|   ├── templates/
```

## Vantagens e desvantagens

- Vantagens:
    - Reutilização
    - Escalabilidade
    - Manutenção

- Desvantagens
    - Prop drilling
    - Confusão semântica entre moléculas e organismos

## Comentários

- Átomos são os componentes mais básicos: Muitas vezes eles podem se tornar apenas o encapsulamento de componentes de bibliotecas, por exemplo. Porém, assim como componentes feitos do zero, eles tendem a nascer mais simples e irem escalando conforme novas funcionalidades (normalmente propriedades) são acrescentadas: O importante aqui é manter o comportamento anterior como padrão para que as alterações não atinjam locais que já utilizavam o átomo anteriormente.

- Confusão semântica de moléculas e organismos: A complexidade do componente deve ser a chave. Organismos vão possuir uma quantidade maior de moléculas agrupadas e funcionalidades distintas que pertencem a um mesmo contexto.

- Importante lembrar que todo system design tem suas vantagens e desvantagens e cabe ao desenvolvedor a criatividade para lidar com as desvantagens de acordo com a necessidade do projeto.