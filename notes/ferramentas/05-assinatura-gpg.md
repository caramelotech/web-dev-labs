# Assinatura de Commits com GPG

Por padrão, o Git não verifica a identidade de quem faz um commit - qualquer pessoa pode criar um commit usando o seu nome e e-mail. A assinatura com GPG resolve isso: cada commit assinado carrega uma prova criptográfica de autoria, e o GitHub exibe um selo "Verified" nesses commits.

## Por que assinar commits?

Quando você roda `git config --global user.email "voce@email.com"`, o Git simplesmente confia no que você digitou. Não existe nenhuma verificação. Isso significa que qualquer pessoa pode criar um commit usando o seu nome e e-mail - e no histórico do repositório vai aparecer como se fosse você.

A assinatura de commits resolve isso usando **criptografia de chave pública**. Cada commit assinado carrega uma prova matemática de que foi você quem o criou. O GitHub exibe um selo "Verified" nesses commits.

### Como funciona a chave pública e privada

Você gera um par de chaves:

- **Chave privada** - fica só na sua máquina. Nunca é compartilhada. É ela que "assina" os commits.
- **Chave pública** - pode ser compartilhada com qualquer um. Você a registra no GitHub.

Quando você faz um commit assinado, o Git usa sua chave privada para gerar uma assinatura. O GitHub usa sua chave pública cadastrada para verificar que essa assinatura é legítima. Se bater, aparece o "Verified". Se não bater (ou não existir), aparece "Unverified".

```
Você        →  [chave privada]  →  assina o commit
GitHub      →  [chave pública]  →  verifica a assinatura
```

## Instalando o GPG

O GPG (GNU Privacy Guard) é a ferramenta que gerencia as chaves e faz as assinaturas.

**Windows:**

Baixe e instale o [Gpg4win](https://www.gpg4win.org/). Ele inclui o Kleopatra (interface gráfica) e integra automaticamente com o GPG no terminal do Git Bash ou PowerShell.

**macOS:**

```bash
brew install gnupg
brew install pinentry-mac
```

O `pinentry-mac` é necessário para que a janela de senha apareça corretamente no macOS.

**Linux (Debian/Ubuntu):**

```bash
sudo apt install gnupg
```

Na maioria das distribuições o GPG já vem instalado.

## Verificando chaves existentes

Antes de gerar uma nova chave, verifique se você já tem alguma:

```bash
gpg --list-secret-keys --keyid-format LONG
```

Se o comando não retornar nada, você ainda não tem chaves GPG.

## Gerando uma nova chave GPG

```bash
gpg --full-generate-key
```

O GPG vai te fazer algumas perguntas. Recomendações:

- **Tipo:** RSA and RSA (opção padrão)
- **Tamanho:** 4096 bits (mais seguro)
- **Validade:** 0 se não quiser expiração, ou um período como `1y` para 1 ano
- **Nome e e-mail:** use os mesmos que estão no seu `git config`

## Configurando o Git para assinar commits

Primeiro, liste as chaves para pegar o ID:

```bash
gpg --list-secret-keys --keyid-format LONG
```

A saída vai ser algo assim:

```
sec   rsa4096/3AA5C34371567BD2 2024-01-01 [SC]
      ABCDEF1234567890ABCDEF1234567890ABCDEF12
uid   [ultimate] Seu Nome <voce@email.com>
```

O ID da chave é o valor depois de `rsa4096/` - no exemplo acima, `3AA5C34371567BD2`.

Agora configure o Git:

```bash
git config --global user.signingkey 3AA5C34371567BD2
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

Com `commit.gpgsign true`, todo commit vai ser assinado automaticamente. Com `tag.gpgsign true`, o mesmo vale para tags anotadas.

## Exportando a chave pública para o GitHub

```bash
gpg --armor --export 3AA5C34371567BD2
```

Copie toda a saída (incluindo as linhas `-----BEGIN PGP PUBLIC KEY BLOCK-----` e `-----END PGP PUBLIC KEY BLOCK-----`) e adicione no GitHub em:

**Settings > SSH and GPG keys > New GPG key**

A partir daí, seus commits assinados vão exibir o selo "Verified" no GitHub.

## Configurando o GPG_TTY (Linux e macOS)

Em sistemas Unix, o GPG precisa saber qual terminal usar para exibir a janela de senha. Sem isso, o comando pode travar ou dar erro.

Adicione esta linha no arquivo de configuração do seu shell:

**macOS (zsh):** `~/.zshrc`

**macOS (bash):** `~/.bash_profile`

**Linux:** `~/.bashrc` ou `~/.bash_profile`

```bash
export GPG_TTY=$(tty)
```

Após adicionar, recarregue o arquivo:

```bash
source ~/.zshrc   # ou ~/.bashrc, dependendo do seu shell
```

**Windows:** não é necessário - o Kleopatra e o gpg-agent do Gpg4win gerenciam isso automaticamente.

**Observação:** se você usa macOS com `pinentry-mac` configurado corretamente, o `GPG_TTY` pode não ser necessário - mas adicioná-lo não causa nenhum problema.

## Assinando um commit específico (sem ativar o modo global)

Se preferir não ativar a assinatura automática, use a flag `-S` manualmente:

```bash
git commit -S -m "mensagem do commit"
```

## Iniciando o agente GPG manualmente

Se você receber erros como `gpg: signing failed: No secret key` ou o agente não responder:

```bash
gpgconf --launch gpg-agent
```

Isso inicia o processo em segundo plano que gerencia as chaves e o cache de senha.

## Adicionando outro e-mail à chave

Se você usa mais de um e-mail (ex: trabalho e pessoal) e quer que a mesma chave cubra os dois:

```bash
gpg --edit-key 3AA5C34371567BD2
```

Dentro do prompt interativo do GPG:

```
gpg> adduid
```

Siga as instruções para digitar o novo nome e e-mail. Ao terminar:

```
gpg> save
```

Depois exporte e atualize a chave pública no GitHub.
