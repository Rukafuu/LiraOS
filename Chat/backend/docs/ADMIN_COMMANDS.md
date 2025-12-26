# 🎮 COMANDOS ADMINISTRATIVOS DA LIRA

Sistema completo de controle do servidor Discord através de comandos naturais.

**Restrição:** Apenas o dono do bot (você) pode usar estes comandos.

---

## 📋 LISTA DE COMANDOS

### 📝 Criar Canal

```
!lira create channel <nome> [categoria]
```

**Exemplos:**

```
!lira create channel sugestões
!lira create channel memes COMUNIDADE
!lira create channel vip-chat PATRONOS
```

**O que faz:**

- Cria um novo canal de texto
- Opcionalmente coloca em uma categoria específica
- Se a categoria não existir, mostra lista de categorias disponíveis

---

### 📁 Criar Categoria

```
!lira create category <nome>
```

**Exemplos:**

```
!lira create category 🎮 JOGOS
!lira create category 📚 ESTUDOS
!lira create category 🎵 MÚSICA
```

**O que faz:**

- Cria uma nova categoria (pasta de canais)
- Pode usar emojis no nome

---

### 🎭 Criar Cargo

```
!lira create role <nome> <cor>
```

**Exemplos:**

```
!lira create role Moderador #FF5733
!lira create role VIP #FFD700
!lira create role Desenvolvedor #00BFFF
```

**Cores Comuns:**

- Vermelho: `#FF0000`
- Azul: `#0000FF`
- Verde: `#00FF00`
- Roxo: `#9370DB`
- Dourado: `#FFD700`
- Turquesa: `#00CED1`
- Rosa: `#FF69B4`

**O que faz:**

- Cria um novo cargo
- Define a cor em hexadecimal
- Cargo fica "hoisted" (separado na lista de membros)
- Cargo é mencionável

---

### 🗑️ Deletar Canal

```
!lira delete channel <nome>
```

**Exemplos:**

```
!lira delete channel sugestões
!lira delete channel memes
```

**O que faz:**

- Deleta um canal existente
- Busca por nome parcial (não precisa ser exato)
- ⚠️ **Ação irreversível!**

---

### 🗑️ Deletar Cargo

```
!lira delete role <nome>
```

**Exemplos:**

```
!lira delete role Moderador
!lira delete role VIP
```

**O que faz:**

- Deleta um cargo existente
- Busca por nome parcial
- ⚠️ **Ação irreversível!**

---

### 💬 Enviar Mensagem

```
!lira send <canal> <mensagem>
```

**Exemplos:**

```
!lira send avisos Bem-vindos ao servidor!
!lira send chat-geral Olá a todos!
!lira send regras Leia as regras antes de participar
```

**O que faz:**

- Envia uma mensagem em um canal específico
- A Lira aparece como autora da mensagem
- Útil para enviar mensagens em canais read-only

---

### 📢 Fazer Anúncio

```
!lira announce <mensagem>
```

**Exemplos:**

```
!lira announce Novo update disponível!
!lira announce Manutenção programada para amanhã
!lira announce Evento especial neste fim de semana!
```

**O que faz:**

- Cria um embed bonito com o anúncio
- Envia automaticamente no canal de avisos
- Inclui timestamp e ícone da Lira
- Cor turquesa (#00CED1)

**Resultado:**

```
╔══════════════════════════════╗
║  📢 Anúncio Oficial          ║
║                              ║
║  [Sua mensagem aqui]         ║
║                              ║
║  LiraOS Nexus • Agora        ║
╚══════════════════════════════╝
```

---

### ✨ Criar Embed Customizado

```
!lira embed <canal> <título> | <descrição> | <cor>
```

**Exemplos:**

```
!lira embed regras Regras do Servidor | Leia com atenção | #FF5733

!lira embed boas-vindas Bem-vindo! | Seja bem-vindo ao LiraOS Nexus | #00FF00

!lira embed avisos Importante | Leia este anúncio | #FFD700
```

**O que faz:**

- Cria um embed totalmente customizado
- Define título, descrição e cor
- Envia no canal especificado
- Inclui timestamp e footer

**Formato:**

- Use `|` (pipe) para separar as partes
- Cor é opcional (padrão: turquesa)

---

### 📖 Ver Comandos Disponíveis

```
!lira admin
!lira commands
!lira help-admin
```

**O que faz:**

- Mostra lista completa de comandos administrativos
- Exibe em formato de embed bonito
- Inclui exemplos de uso

---

## 🎯 EXEMPLOS DE USO PRÁTICO

### Configurar Canal de Regras

```bash
# 1. Criar embed com as regras
!lira embed regras 📜 REGRAS DO SERVIDOR | [Cole as regras aqui] | #FF5733

# 2. Enviar mensagem adicional
!lira send regras Ao participar, você concorda com estas regras.
```

### Criar Nova Categoria com Canais

```bash
# 1. Criar categoria
!lira create category 🎮 JOGOS

# 2. Criar canais dentro dela
!lira create channel minecraft JOGOS
!lira create channel valorant JOGOS
!lira create channel geral-jogos JOGOS
```

### Configurar Sistema de Cargos

```bash
# Criar cargos de moderação
!lira create role Admin #FF0000
!lira create role Moderador #FFA500
!lira create role Helper #FFFF00

# Criar cargos de comunidade
!lira create role Ativo #00FF00
!lira create role Artista #FF69B4
!lira create role Programador #0000FF
```

### Fazer Anúncio de Evento

```bash
!lira announce 🎉 EVENTO ESPECIAL! 🎉

Participe do nosso evento de lançamento neste sábado às 20h!

Haverá sorteios, jogos e muito mais!

Não perca! 🌌
```

---

## 🔒 SEGURANÇA

- ✅ **Apenas você** pode usar estes comandos
- ✅ Todos os comandos são **logados** no console
- ✅ Validação de **permissões** antes de executar
- ✅ Mensagens de **erro claras** se algo falhar

**Logs no Console:**

```
[ADMIN] Canal criado: sugestões por Usuario#1234
[ADMIN] Cargo criado: Moderador por Usuario#1234
[ADMIN] Mensagem enviada em avisos por Usuario#1234
[ADMIN] Anúncio feito por Usuario#1234
```

---

## ⚠️ AVISOS IMPORTANTES

1. **Comandos de Delete são Irreversíveis**

   - Não há como desfazer
   - Tenha certeza antes de deletar

2. **Nomes Parciais Funcionam**

   - Não precisa digitar o nome completo
   - "avi" encontra "avisos"
   - "mod" encontra "Moderador"

3. **Case Insensitive**

   - Maiúsculas/minúsculas não importam
   - `!lira SEND` = `!lira send`

4. **Embeds Precisam de Pipe (|)**
   - Use `|` para separar título, descrição e cor
   - Exemplo: `título | descrição | #FF0000`

---

## 🚀 COMBINANDO COM GENESIS

Você pode usar os comandos admin para **personalizar** o servidor após o Genesis:

```bash
# Após executar !lira genesis

# Adicionar canais extras
!lira create channel sugestões COMUNIDADE
!lira create channel bugs COMUNIDADE

# Criar cargos de moderação
!lira create role Moderador #FF5733
!lira create role Helper #FFA500

# Enviar mensagens de boas-vindas
!lira embed boas-vindas Bem-vindo ao Nexus! | Leia as regras e divirta-se! | #00CED1

# Fazer primeiro anúncio
!lira announce Servidor oficial da LiraOS está no ar! 🎉
```

---

## 📞 SUPORTE

**Algo não funcionou?**

- Verifique se a Lira tem permissão de **Administrador**
- Confira se o nome do canal/cargo está correto
- Veja os logs no console do backend para mais detalhes

**Quer adicionar novos comandos?**

- Edite o arquivo `adminCommands.js`
- Adicione novos métodos e rotas
- Reinicie o bot

---

**Desenvolvido com 💜 para facilitar sua vida, Comandante!**
