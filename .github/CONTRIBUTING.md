# Guia de Contribuição

Obrigado por querer contribuir com o Web Dev Labs!

## O que pode ser contribuído

- Melhorias e correções nas anotações (`/notes`)
- Novos exemplos práticos em `/examples`
- Exercícios adicionais em `/exercicios`
- Projetos práticos em `/projetos`

## Processo

1. Crie uma branch a partir de `main` seguindo o padrão:

   ```
   feature/descricao-curta
   fix/descricao-curta
   docs/descricao-curta
   ```

2. Faça commits atômicos com mensagens no padrão de Conventional Commits:

   ```
   feat: adicionar anotações sobre JavaScript
   fix: corrigir exemplo de seletor CSS
   docs: melhorar introdução sobre HTML semântico
   ```

   Tipos válidos: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`

3. Abra um Pull Request usando o template disponível e aguarde revisão.

4. Após aprovação, o merge será feito por um mantenedor.

## Padrões de conteúdo

### Anotações (Markdown)

- Escreva em português
- Use títulos hierárquicos (`##`, `###`)
- Prefira exemplos curtos e diretos
- Inclua o "por quê", não apenas o "como"
- Nomeie os arquivos com prefixo numérico sequencial: `05-nome-do-topico.md`
- Atualize `notes/README.md` ao adicionar um novo tópico

### Exemplos (`/examples`)

- Um conceito por pasta
- Inclua um `README.md` com objetivo e resultado esperado
- Use apenas as tecnologias ensinadas até aquele ponto da trilha

### Exercícios (`/exercicios`)

- Descreva claramente o objetivo
- Indique o nível de dificuldade (iniciante / intermediário / avançado)
- Inclua critérios de sucesso em formato de checklist

### Projetos (`/projetos`)

- Descreva o objetivo e o contexto
- Liste os requisitos em formato de checklist
- Inclua ao menos um exemplo de entregável esperado

## Dúvidas?

Abra uma issue com a tag `question`.
