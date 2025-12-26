# 🎭 COMANDO SETUP ROLES

## Descrição

O comando `!lira setup roles` cria **toda a hierarquia de roles** do servidor de uma vez, incluindo:

- Roles de administração (Owner, Bot, Staff)
- Roles especiais (Partners, VTubers)
- Roles de Patreon (Supernova, Antares, Sirius, Vega)

## Uso

```bash
!lira setup roles
```

## Roles Criadas

### 👑 Tier 1: Owner & Bot

| Role                      | Cor                | Permissões    | Hoisted |
| ------------------------- | ------------------ | ------------- | ------- |
| **👑 Comandante Supremo** | Vermelho (#FF0000) | Administrator | ✅      |
| **Lira Amarinth**         | Turquesa (#00CED1) | Administrator | ✅      |

**Atribuição Automática:**

- ✅ Você recebe automaticamente "👑 Comandante Supremo"
- ✅ Lira recebe automaticamente "Lira Amarinth"

### 🛡️ Tier 2: Staff

| Role             | Cor                      | Permissões                                   | Hoisted |
| ---------------- | ------------------------ | -------------------------------------------- | ------- |
| **🛡️ Admin**     | Laranja Escuro (#FF4500) | Gerenciar Servidor, Roles, Canais, Kick, Ban | ✅      |
| **🛡️ Moderador** | Laranja (#FFA500)        | Gerenciar Mensagens, Kick, Mute              | ✅      |

### 🤝 Tier 3: Special

| Role            | Cor            | Permissões | Hoisted |
| --------------- | -------------- | ---------- | ------- |
| **🤝 Partners** | Rosa (#FF69B4) | Padrão     | ✅      |
| **🎮 VTubers**  | Roxo (#9B59B6) | Padrão     | ✅      |

### 🏆 Tier 4: Patreon

| Role               | Cor                        | Permissões | Hoisted |
| ------------------ | -------------------------- | ---------- | ------- |
| **🏆 Supernova**   | Dourado (#FFD700)          | Padrão     | ✅      |
| **🔴 Antares Red** | Vermelho Intenso (#DC143C) | Padrão     | ✅      |
| **🌠 Sirius Blue** | Azul Neon (#00BFFF)        | Padrão     | ✅      |
| **🌌 Vega Nebula** | Roxo Médio (#9370DB)       | Padrão     | ✅      |

**Total: 10 roles**

## Exemplo de Uso

```bash
# Executar o comando
!lira setup roles

# Lira responde:
# 🎭 Criando hierarquia completa de roles...
# Aguarde, isso pode levar alguns segundos.

# [Aguarda ~5 segundos]

# ✅ Hierarquia de roles criada!
#
# • Criadas: 10 roles
# • Erros: 0 roles
#
# Próximos passos:
# 1. Organize a ordem das roles manualmente (arraste no Discord)
# 2. Atribua as roles aos membros apropriados
# 3. Configure permissões adicionais se necessário
```

## Fluxo Completo: Cleanup + Setup

### Recomendado para Servidor Novo

```bash
# 1. Limpar roles antigas
!lira cleanup roles
!lira confirm cleanup

# 2. Criar hierarquia nova
!lira setup roles

# 3. Resultado: Servidor com hierarquia limpa e organizada
```

## Características

### ✅ Automático

- Cria todas as 10 roles em sequência
- Atribui automaticamente as roles principais
- Delay entre criações para evitar rate limit

### 🎨 Customizado

- Cores específicas para cada tier
- Emojis para identificação visual
- Todas as roles são "hoisted" (separadas na lista)
- Todas são mencionáveis

### 🔒 Permissões Pré-Configuradas

**Comandante Supremo & Lira:**

- ✅ Administrator (controle total)

**Admin:**

- ✅ Gerenciar Servidor
- ✅ Gerenciar Roles
- ✅ Gerenciar Canais
- ✅ Kick Membros
- ✅ Ban Membros

**Moderador:**

- ✅ Gerenciar Mensagens
- ✅ Kick Membros
- ✅ Mute Membros

**Demais:**

- Permissões padrão

## Organização Manual

Após criar as roles, organize a hierarquia no Discord:

1. **Abra Configurações do Servidor** → **Roles**
2. **Arraste as roles** na seguinte ordem (de cima para baixo):
   ```
   👑 Comandante Supremo
   Lira Amarinth
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

## Atribuir Roles aos Membros

### Via Discord (Manual)

1. Clique direito no membro
2. **Roles** → Selecione a role apropriada

### Via Comandos (Futuro)

```bash
# Ainda não implementado, mas você pode adicionar:
!lira give role @usuario Moderador
```

## Customização

Se quiser modificar as roles criadas, edite o arquivo:

```
backend/services/adminCommands.js
```

Procure por `rolesToCreate` no método `setupRoles` e modifique:

- `name`: Nome da role
- `color`: Cor em hexadecimal (0xRRGGBB)
- `hoist`: true/false (separar na lista)
- `permissions`: Array de permissões

## Comparação com Genesis

| Aspecto        | `!lira setup roles`      | `!lira genesis`      |
| -------------- | ------------------------ | -------------------- |
| **Roles**      | ✅ 10 roles customizadas | ✅ 6 roles padrão    |
| **Canais**     | ❌ Não cria              | ✅ Cria 12 canais    |
| **Categorias** | ❌ Não cria              | ✅ Cria 4 categorias |
| **Limpeza**    | ❌ Não limpa             | ✅ Limpa tudo        |
| **Uso**        | Apenas roles             | Servidor completo    |

**Recomendação:**

- Use `!lira setup roles` se só quer criar/refazer as roles
- Use `!lira genesis` para configurar o servidor inteiro

## Logs

Todas as criações são logadas:

```
[ADMIN] Role criada: 👑 Comandante Supremo por Usuario#1234
[ADMIN] Role criada: Lira Amarinth por Usuario#1234
[ADMIN] Role criada: 🛡️ Admin por Usuario#1234
[ADMIN] Role criada: 🛡️ Moderador por Usuario#1234
[ADMIN] Role criada: 🤝 Partners por Usuario#1234
[ADMIN] Role criada: 🎮 VTubers por Usuario#1234
[ADMIN] Role criada: 🏆 Supernova por Usuario#1234
[ADMIN] Role criada: 🔴 Antares Red por Usuario#1234
[ADMIN] Role criada: 🌠 Sirius Blue por Usuario#1234
[ADMIN] Role criada: 🌌 Vega Nebula por Usuario#1234
```

## Troubleshooting

### Erro: "Missing Permissions"

**Causa:** Lira não tem permissão de "Manage Roles"
**Solução:** Dê permissão de Administrator à Lira

### Erro: Rate Limit

**Causa:** Discord limita criação de roles
**Solução:** O comando já tem delay de 500ms entre cada role

### Algumas roles não foram criadas

**Causa:** Erro específico em alguma role
**Solução:** Verifique os logs e crie manualmente as que falharam

---

**Desenvolvido com 💜 para o LiraOS Nexus!**
