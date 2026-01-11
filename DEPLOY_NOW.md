# 🚀 DEPLOY AGORA - Instruções Rápidas

**Data:** 2026-01-11T14:11:57-03:00  
**Status:** ✅ PRONTO PARA DEPLOY

---

## ⚡ **Deploy Rápido (3 Passos)**

### **Opção 1: Script Automático (RECOMENDADO)**

```powershell
# No terminal PowerShell (Windows)
cd C:\Users\conta\Documents\Lira\Chat
.\deploy.ps1
```

### **Opção 2: Manual**

```bash
# 1. Commit todas as mudanças
git add .
git commit -m "fix: gamification + trae mode + deploy configs"

# 2. Push para produção
git push origin main

# 3. Monitorar deploy
# Railway: https://railway.app/dashboard
# Vercel: https://vercel.com/dashboard
```

---

## 📋 **O Que Será Deployado**

### **✅ Correções Críticas**

1. **Gamification 500 Error** - RESOLVIDO

   - `backend/gamificationStore.js` - JSON serialization corrigida
   - `backend/routes/gamification.js` - Import corrigido

2. **Trae Mode** - IMPLEMENTADO
   - Backend: 33 ferramentas + 7 endpoints
   - Frontend: Interface completa
   - Integração: App.tsx + Sidebar

### **📁 Arquivos Novos**

```
backend/railway.toml              (config Railway)
Chat/vercel.json                  (config Vercel)
Chat/deploy.ps1                   (script deploy)
backend/services/traeMode/        (Trae Mode backend)
backend/routes/trae.js            (API Trae Mode)
Chat/components/TraePanel.tsx     (UI Trae Mode)
```

### **🔧 Arquivos Modificados**

```
backend/gamificationStore.js      (bug fix)
backend/routes/gamification.js    (bug fix)
backend/server.js                 (rota trae)
Chat/components/Sidebar.tsx       (botão trae)
Chat/App.tsx                      (integração trae)
```

---

## 🔍 **Após o Deploy - Verificar**

### **1. Backend (Railway)**

```bash
# Health check
curl https://your-backend.railway.app/health

# Gamification (deve retornar 200, não 500)
curl https://your-backend.railway.app/api/gamification \
  -H "Authorization: Bearer YOUR_TOKEN"

# Trae Mode
curl https://your-backend.railway.app/api/trae/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **2. Frontend (Vercel)**

```
1. Abrir https://your-app.vercel.app
2. Fazer login
3. Enviar uma mensagem no chat
4. Verificar gamification (não deve dar 500)
5. Abrir Trae Mode (botão na sidebar - admin only)
```

---

## 🐛 **Se Der Erro no Backend**

### **Erro Comum: Prisma Database**

```bash
# Conectar no Railway
railway login
railway link

# Rodar migrations
railway run npx prisma db push

# Verificar logs
railway logs --tail 100
```

### **Erro Comum: Environment Variables**

```bash
# Verificar variáveis
railway variables

# Adicionar variável faltando
railway variables set KEY=value
```

### **Erro Comum: Build Failed**

```bash
# Rebuild
railway up --detach

# Ver logs de build
railway logs --tail 500
```

---

## 📊 **Monitoramento**

### **Logs em Tempo Real**

```bash
# Backend (Railway)
railway logs --follow

# Frontend (Vercel)
vercel logs --follow
```

### **Dashboards**

- **Railway:** https://railway.app/dashboard
- **Vercel:** https://vercel.com/dashboard

---

## ✅ **Checklist Pós-Deploy**

```
BACKEND:
[ ] Health check OK
[ ] Gamification sem 500
[ ] Trae Mode health OK
[ ] Chat funcionando
[ ] Login funcionando

FRONTEND:
[ ] Site carrega
[ ] Login funciona
[ ] Chat funciona
[ ] Gamification carrega
[ ] Trae Mode aparece (admin)

VALIDAÇÃO COMPLETA:
[ ] Criar conta nova
[ ] Enviar mensagem
[ ] Verificar XP/coins
[ ] Abrir Trae Mode
[ ] Executar ferramenta
```

---

## 🆘 **Rollback de Emergência**

```bash
# Railway
railway rollback

# Vercel
vercel rollback
```

---

## 🎯 **EXECUTE AGORA**

### **Windows (PowerShell):**

```powershell
cd C:\Users\conta\Documents\Lira\Chat
.\deploy.ps1
```

### **Ou Manual:**

```bash
git add .
git commit -m "fix: critical bugs + trae mode"
git push origin main
```

---

**🚀 DEPLOY EM 3... 2... 1... GO!**
