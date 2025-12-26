# 🧹 COMANDO DE LIMPEZA DE ROLES

## Descrição

O comando `!lira cleanup roles` permite deletar **todas as roles** do servidor de uma vez, exceto:

- ✅ @everyone (role padrão do Discord)
- ✅ Roles do bot (Lira Amarinth)
- ✅ Roles gerenciadas (integrations, outros bots)

## Uso

```bash
!lira cleanup roles
```

## Fluxo de Execução

### 1. Comando Inicial

```
Você: !lira cleanup roles
```

### 2. Listagem e Confirmação

A Lira mostra todas as roles que serão deletadas e pede confirmação:

```
⚠️ ATENÇÃO: Você está prestes a deletar 15 roles!

Roles que serão deletadas:
• Moderador
• VIP
• Membro
• Visitante
• [etc...]

Para confirmar, digite: `!lira confirm cleanup`
Para cancelar, ignore esta mensagem.
```

### 3. Confirmação

Você tem **30 segundos** para confirmar:

```
Você: !lira confirm cleanup
```

### 4. Execução

A Lira inicia a limpeza:

```
🧹 Iniciando limpeza de roles...
```

### 5. Resultado

Após completar, você recebe um relatório:

```
✅ Limpeza concluída!

• Deletadas: 15 roles
• Erros: 0 roles
• Mantidas: Roles do sistema e do bot
```

## Segurança

### ✅ Proteções Implementadas

1. **Apenas o Dono**

   - Só você (DISCORD_OWNER_ID) pode usar

2. **Confirmação Obrigatória**

   - Requer comando de confirmação explícito
   - Timeout de 30 segundos

3. **Roles Protegidas**

   - @everyone nunca é deletado
   - Roles do bot são preservadas
   - Roles gerenciadas (integrations) são preservadas

4. **Listagem Prévia**
   - Mostra exatamente o que será deletado
   - Permite cancelar antes de executar

### ⚠️ Avisos

- **Ação Irreversível**: Roles deletadas não podem ser recuperadas
- **Membros Perdem Cargos**: Todos os membros perderão as roles deletadas
- **Permissões Perdidas**: Configurações de permissões das roles são perdidas

## Casos de Uso

### 1. Servidor Novo com Roles de Teste

```bash
# Você criou várias roles para testar
# Agora quer limpar tudo e começar do zero
!lira cleanup roles
!lira confirm cleanup
```

### 2. Após Importar Servidor

```bash
# Servidor importado veio com muitas roles antigas
# Limpar antes de executar o Genesis
!lira cleanup roles
!lira confirm cleanup
!lira genesis
```

### 3. Reorganização Completa

```bash
# Quer refazer toda a hierarquia de cargos
!lira cleanup roles
!lira confirm cleanup

# Depois criar as novas
!lira create role Admin #FF0000
!lira create role Mod #FFA500
# etc...
```

## Exemplo Completo

```bash
# 1. Verificar roles atuais
# (Use a interface do Discord para ver)

# 2. Iniciar limpeza
!lira cleanup roles

# 3. Lira responde:
# ⚠️ ATENÇÃO: Você está prestes a deletar 8 roles!
#
# Roles que serão deletadas:
# • Moderador
# • Helper
# • VIP
# • Ativo
# • Membro
# • Visitante
# • Silenciado
# • Bot
#
# Para confirmar, digite: `!lira confirm cleanup`
# Para cancelar, ignore esta mensagem.

# 4. Confirmar
!lira confirm cleanup

# 5. Lira executa:
# 🧹 Iniciando limpeza de roles...

# 6. Resultado:
# ✅ Limpeza concluída!
#
# • Deletadas: 8 roles
# • Erros: 0 roles
# • Mantidas: Roles do sistema e do bot
```

## Timeout

Se você **não confirmar em 30 segundos**:

```
⏱️ Tempo esgotado. Limpeza cancelada por segurança.
```

## Erros Comuns

### Erro: "Não há roles para limpar"

```
✅ Não há roles para limpar. Apenas roles do sistema e do bot estão presentes.
```

**Causa:** Servidor só tem roles protegidas

### Erro ao deletar role específica

```
✅ Limpeza concluída!

• Deletadas: 7 roles
• Erros: 1 roles
• Mantidas: Roles do sistema e do bot
```

**Causa:** Alguma role tem permissões especiais ou está em uso por integração

## Logs

Todas as ações são logadas no console:

```
[ADMIN] Role deletada: Moderador por Usuario#1234
[ADMIN] Role deletada: VIP por Usuario#1234
[ADMIN] Erro ao deletar role Premium: Missing Permissions
[ADMIN] Role deletada: Membro por Usuario#1234
```

## Combinando com Outros Comandos

### Limpeza + Genesis

```bash
# Limpar tudo primeiro
!lira cleanup roles
!lira confirm cleanup

# Depois executar Genesis para criar estrutura nova
!lira genesis
```

### Limpeza + Criação Manual

```bash
# Limpar
!lira cleanup roles
!lira confirm cleanup

# Criar hierarquia nova
!lira create role 🔴 Admin #FF0000
!lira create role 🟠 Moderador #FFA500
!lira create role 🟡 Helper #FFD700
!lira create role 🟢 Membro #00FF00
```

## Alternativa: Deletar Individual

Se preferir deletar roles uma por uma:

```bash
!lira delete role Moderador
!lira delete role VIP
!lira delete role Helper
```

---

**Desenvolvido com 💜 para facilitar a administração do servidor!**
