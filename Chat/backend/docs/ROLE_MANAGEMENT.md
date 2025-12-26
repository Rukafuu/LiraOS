# 🎯 GUIA RÁPIDO: GERENCIAMENTO DE ROLES

## ✨ Novos Recursos

### 1. Organização Automática

O comando `!lira setup roles` agora **organiza automaticamente** as roles na ordem correta!

### 2. Atribuir Roles

Novo comando para dar roles aos membros:

```bash
!lira give role @usuario <nome_da_role>
```

### 3. Remover Roles

Novo comando para remover roles:

```bash
!lira remove role @usuario <nome_da_role>
```

---

## 🚀 Fluxo Completo

### Passo 1: Limpar Roles Antigas

```bash
!lira cleanup roles
!lira confirm cleanup
```

### Passo 2: Criar Hierarquia Nova

```bash
!lira setup roles
```

**O que acontece:**

1. 🎭 Cria 10 roles
2. 🔄 Organiza automaticamente na ordem correta
3. 👑 Você recebe "Comandante Supremo"
4. 🎨 Lira recebe "Lira Amarinth"

### Passo 3: Atribuir Roles aos Membros

```bash
# Dar role de Moderador
!lira give role @João Moderador

# Dar role de Partner
!lira give role @Maria Partners

# Dar role de Patreon
!lira give role @Pedro Supernova
```

---

## 📋 Comandos Disponíveis

| Comando                          | Descrição                      | Exemplo                         |
| -------------------------------- | ------------------------------ | ------------------------------- |
| `!lira setup roles`              | Cria e organiza todas as roles | -                               |
| `!lira give role @user <role>`   | Atribui role a um membro       | `!lira give role @João Admin`   |
| `!lira remove role @user <role>` | Remove role de um membro       | `!lira remove role @João Admin` |
| `!lira create role <nome> <cor>` | Cria uma role individual       | `!lira create role VIP #FFD700` |
| `!lira delete role <nome>`       | Deleta uma role                | `!lira delete role VIP`         |
| `!lira cleanup roles`            | Remove todas as roles          | -                               |

---

## 🎭 Hierarquia Criada

```
👑 Comandante Supremo  ← Você
Lira Amarinth          ← Bot
🛡️ Admin
🛡️ Moderador
🤝 Partners
🎮 VTubers
🏆 Supernova
🔴 Antares Red
🌠 Sirius Blue
🌌 Vega Nebula
@everyone
```

---

## 💡 Exemplos Práticos

### Configurar Equipe de Moderação

```bash
# Dar role de Admin
!lira give role @Ana Admin

# Dar role de Moderador
!lira give role @Carlos Moderador
!lira give role @Beatriz Moderador
```

### Configurar Partners

```bash
!lira give role @StreamerAmigo Partners
!lira give role @CanalParceiro Partners
```

### Configurar Patronos

```bash
# Tier Supernova
!lira give role @Patrono1 Supernova

# Tier Antares
!lira give role @Patrono2 Antares

# Tier Sirius
!lira give role @Patrono3 Sirius

# Tier Vega
!lira give role @Patrono4 Vega
```

### Remover Role

```bash
# Se alguém não é mais moderador
!lira remove role @ExModerador Moderador

# Se alguém cancelou o Patreon
!lira remove role @ExPatrono Supernova
```

---

## ⚡ Atalhos

### Nomes Parciais Funcionam

```bash
# Ao invés de digitar o nome completo:
!lira give role @João Comandante Supremo

# Você pode usar apenas parte:
!lira give role @João Comandante
# ou
!lira give role @João Supremo
```

### Case Insensitive

```bash
# Todos funcionam:
!lira give role @João MODERADOR
!lira give role @João moderador
!lira give role @João Moderador
```

---

## 🔍 Verificar Roles

### Listar Roles Disponíveis

Se você tentar dar uma role que não existe, a Lira mostra a lista:

```bash
!lira give role @João RoleInexistente

# Resposta:
❌ Role "RoleInexistente" não encontrada.

Roles disponíveis:
• 👑 Comandante Supremo
• Lira Amarinth
• 🛡️ Admin
• 🛡️ Moderador
• 🤝 Partners
• 🎮 VTubers
• 🏆 Supernova
• 🔴 Antares Red
• 🌠 Sirius Blue
• 🌌 Vega Nebula
```

---

## 🎯 Resultado Final

Após executar o setup completo:

✅ **10 roles criadas**
✅ **Organizadas automaticamente**
✅ **Você com role de Comandante**
✅ **Lira com role própria**
✅ **Pronto para atribuir aos membros**

---

**Reinicie o bot e comece a usar!** 🌌
