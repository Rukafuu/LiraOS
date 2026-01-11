# 🔧 TROUBLESHOOTING - Deploy Issues

**Data:** 2026-01-11T16:10:50-03:00  
**Status:** Backend online, mas com erros de database

---

## ✅ **O Que Está Funcionando**

1. ✅ Backend iniciou com sucesso
2. ✅ Discord bot conectado
3. ✅ S3 storage inicializado
4. ✅ Servidor rodando na porta 8080

---

## ❌ **Problemas Atuais**

### **1. Gamification 500 Error**

```
POST /api/gamification 500 (Internal Server Error)
GET /api/gamification?userId=... 500 (Internal Server Error)
```

**Causa:** Tabelas do Prisma não existem no database

```
The table `main.gamification` does not exist
The table `main.users` does not exist
```

### **2. Frontend Metadata Error**

```
TypeError: Cannot read properties of undefined (reading 'metadata')
```

**Causa:** Provavelmente relacionado ao erro de gamification - o frontend está tentando acessar dados que não existem.

---

## 🔍 **Diagnóstico**

### **Verificar se Migrations Rodaram**

Nos logs do Railway, procure por:

```
[PRISMA] Running database migrations...
✅ Database synchronized
```

Se **NÃO** aparecer, as migrations não rodaram.

### **Verificar DATABASE_URL**

No Railway, verifique se a variável `DATABASE_URL` está configurada corretamente:

```
postgresql://user:password@host:port/database?schema=public
```

---

## ✅ **Soluções**

### **Solução 1: Rodar Migrations Manualmente (RÁPIDO)**

```bash
# Conectar no Railway
railway login
railway link

# Rodar migrations
railway run npx prisma db push

# Verificar se funcionou
railway logs --tail 50
```

### **Solução 2: Verificar DATABASE_URL**

```bash
# Ver variáveis de ambiente
railway variables

# Se DATABASE_URL estiver errado, corrigir:
railway variables set DATABASE_URL="postgresql://..."
```

### **Solução 3: Restart com Migrations**

O Dockerfile já tem o script de migrations, mas pode não ter rodado. Force um restart:

```bash
# Via Railway CLI
railway up --detach

# Ou via Dashboard
# Railway > Service > Settings > Restart
```

---

## 🐛 **Debugging Passo a Passo**

### **1. Verificar Logs do Container**

```bash
railway logs --tail 100
```

Procure por:

- `[PRISMA] Running database migrations...`
- Erros de conexão com database
- Erros de Prisma

### **2. Testar Conexão com Database**

```bash
# Conectar no container
railway run bash

# Dentro do container
npx prisma db push
npx prisma studio
```

### **3. Verificar Tabelas Criadas**

```bash
# Conectar no PostgreSQL
railway run psql $DATABASE_URL

# Listar tabelas
\dt

# Deve mostrar:
# - users
# - gamification
# - sessions
# - etc
```

---

## 🚨 **Se Nada Funcionar**

### **Opção Nuclear: Recreate Database**

```bash
# CUIDADO: Isso apaga todos os dados!

# 1. Deletar todas as tabelas
railway run npx prisma migrate reset --force

# 2. Criar tudo de novo
railway run npx prisma db push

# 3. Restart
railway restart
```

---

## 📋 **Checklist de Validação**

```
ENVIRONMENT:
[ ] DATABASE_URL está configurado
[ ] DATABASE_URL é válido (PostgreSQL)
[ ] Todas as env vars necessárias estão setadas

MIGRATIONS:
[ ] Logs mostram "[PRISMA] Running database migrations..."
[ ] Sem erros de Prisma nos logs
[ ] Tabelas criadas no database

BACKEND:
[ ] Servidor iniciou sem erros
[ ] /health retorna 200
[ ] /api/gamification retorna 200 (não 500)

FRONTEND:
[ ] Site carrega
[ ] Sem erros de metadata
[ ] Login funciona
[ ] Gamification carrega
```

---

## 🎯 **Próximos Passos**

1. **Verificar logs do Railway** - Ver se migrations rodaram
2. **Rodar migrations manualmente** - `railway run npx prisma db push`
3. **Testar endpoints** - Verificar se gamification funciona
4. **Rebuild frontend** - Se necessário

---

## 📞 **Comandos Úteis**

```bash
# Ver logs em tempo real
railway logs --follow

# Rodar comando no container
railway run <comando>

# Ver variáveis de ambiente
railway variables

# Restart serviço
railway restart

# Rebuild e redeploy
railway up --detach
```

---

**Status:** 🔧 **AGUARDANDO MIGRATIONS**

Execute `railway run npx prisma db push` para resolver!
