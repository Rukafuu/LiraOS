# 🚀 Deploy Guide - LiraOS Production

**Data:** 2026-01-11T14:11:57-03:00  
**Objetivo:** Deploy completo do backend (Railway) e frontend (Vercel)

---

## 📋 Checklist Pré-Deploy

### ✅ **Arquivos Críticos Verificados**

- [x] `backend/package.json` - Configurado corretamente
- [x] `backend/server.js` - Todas as rotas montadas
- [x] `backend/prisma/schema.prisma` - Schema atualizado
- [x] `Chat/package.json` - Build configurado
- [x] Gamification bugs corrigidos
- [x] Trae Mode implementado

### ⚠️ **Problemas Conhecidos**

1. ~~Gamification 500 error~~ ✅ RESOLVIDO
2. Backend error em produção (a investigar)
3. `.metadata` error (não crítico)

---

## 🔧 **1. Deploy Backend (Railway)**

### **Configurações Necessárias**

#### **Environment Variables (Railway)**

```bash
# Database
DATABASE_URL=postgresql://...

# API Keys
GEMINI_API_KEY=your_key_here
MINIMAX_API_KEY=your_key_here
MINIMAX_GROUP_ID=your_group_id_here
HUGGINGFACE_ACCESS_TOKEN=your_token_here

# Services
RESEND_API_KEY=your_key_here
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_key_here
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name

# OAuth
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_secret
DISCORD_REDIRECT_URI=https://your-backend.railway.app/api/auth/discord/callback

GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=https://your-backend.railway.app/api/auth/google/callback

# Frontend URL
FRONTEND_URL=https://your-app.vercel.app

# Node Environment
NODE_ENV=production
PORT=4000
```

### **Build Command (Railway)**

```bash
npm install && npx prisma generate && npx prisma db push
```

### **Start Command (Railway)**

```bash
npm start
```

### **Nixpacks Config (railway.toml)**

Criar arquivo `backend/railway.toml`:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

---

## 🌐 **2. Deploy Frontend (Vercel)**

### **Environment Variables (Vercel)**

```bash
VITE_API_BASE_URL=https://your-backend.railway.app
```

### **Build Settings (Vercel)**

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Node Version:** 20.x

### **vercel.json**

Criar arquivo `Chat/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 🐛 **3. Debugging Backend Errors**

### **Logs do Railway**

```bash
# Acessar logs
railway logs

# Logs em tempo real
railway logs --follow
```

### **Erros Comuns e Soluções**

#### **1. Prisma Database Error**

```bash
# Erro: Can't reach database server
# Solução: Verificar DATABASE_URL

# Rodar migration manualmente
railway run npx prisma db push
```

#### **2. Module Not Found**

```bash
# Erro: Cannot find module 'X'
# Solução: Verificar package.json e reinstalar

railway run npm install
```

#### **3. Port Already in Use**

```bash
# Erro: EADDRINUSE
# Solução: Railway define PORT automaticamente
# Usar: process.env.PORT || 4000
```

#### **4. CORS Errors**

```bash
# Erro: CORS policy blocked
# Solução: Verificar FRONTEND_URL no .env
# E configuração CORS no server.js
```

#### **5. 500 Internal Server Error**

```bash
# Verificar logs específicos
railway logs | grep "500"

# Adicionar mais logging
console.error('[ERROR]', error.stack);
```

---

## 🔍 **4. Monitoramento Pós-Deploy**

### **Health Checks**

```bash
# Backend
curl https://your-backend.railway.app/health

# Gamification
curl https://your-backend.railway.app/api/gamification \
  -H "Authorization: Bearer YOUR_TOKEN"

# Trae Mode
curl https://your-backend.railway.app/api/trae/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Endpoints Críticos**

```
✅ GET  /health
✅ POST /api/auth/login
✅ GET  /api/gamification
✅ POST /api/chat
✅ GET  /api/trae/tools
✅ POST /api/trae/execute
```

---

## 📊 **5. Checklist de Deploy**

### **Backend (Railway)**

- [ ] Environment variables configuradas
- [ ] DATABASE_URL correto
- [ ] Prisma migrations rodadas
- [ ] Build bem-sucedido
- [ ] Server iniciado sem erros
- [ ] Health check respondendo
- [ ] Logs sem erros críticos

### **Frontend (Vercel)**

- [ ] VITE_API_BASE_URL configurado
- [ ] Build bem-sucedido
- [ ] Deploy completo
- [ ] Site acessível
- [ ] API calls funcionando
- [ ] Login funcionando
- [ ] Chat funcionando

---

## 🚨 **6. Troubleshooting Rápido**

### **Backend não inicia**

```bash
# 1. Verificar logs
railway logs --tail 100

# 2. Verificar variáveis
railway variables

# 3. Rebuild
railway up --detach
```

### **Frontend não conecta ao backend**

```bash
# 1. Verificar VITE_API_BASE_URL
echo $VITE_API_BASE_URL

# 2. Verificar CORS no backend
# server.js deve ter:
res.header("Access-Control-Allow-Origin", FRONTEND_URL);

# 3. Rebuild frontend
vercel --prod
```

### **Gamification 500 Error**

```bash
# Verificar se as correções foram deployadas
# Arquivos modificados:
# - backend/gamificationStore.js
# - backend/routes/gamification.js

# Verificar logs
railway logs | grep "gamification"
```

---

## 🎯 **7. Comandos de Deploy**

### **Deploy Backend (Railway CLI)**

```bash
cd backend
railway login
railway link
railway up
railway logs --follow
```

### **Deploy Frontend (Vercel CLI)**

```bash
cd Chat
vercel login
vercel --prod
vercel logs
```

### **Deploy via Git (Automático)**

```bash
# Commit todas as mudanças
git add .
git commit -m "fix: gamification serialization + trae mode implementation"
git push origin main

# Railway e Vercel fazem deploy automático
```

---

## 📝 **8. Notas Importantes**

### **Mudanças Recentes (Incluir no Deploy)**

1. ✅ **Gamification Fix** - JSON serialization corrigida
2. ✅ **Trae Mode** - Backend + Frontend completo
3. ✅ **Server.js** - Rota `/api/trae` adicionada
4. ✅ **Prisma** - Schema atualizado

### **Arquivos Críticos Modificados**

```
backend/gamificationStore.js
backend/routes/gamification.js
backend/routes/trae.js
backend/services/traeMode/
backend/server.js
Chat/components/TraePanel.tsx
Chat/components/Sidebar.tsx
Chat/App.tsx
```

### **Verificar Após Deploy**

1. Login funciona
2. Chat funciona
3. Gamification carrega sem 500
4. Trae Mode aparece para admins
5. Todas as APIs respondem

---

## ✅ **9. Deploy Checklist Final**

```
BACKEND (Railway):
[ ] git push origin main
[ ] Railway auto-deploy iniciado
[ ] Build completo (verificar logs)
[ ] Prisma migrations aplicadas
[ ] Server rodando
[ ] Health check OK
[ ] Testar endpoints principais

FRONTEND (Vercel):
[ ] git push origin main
[ ] Vercel auto-deploy iniciado
[ ] Build completo
[ ] Deploy bem-sucedido
[ ] Site acessível
[ ] Conecta ao backend
[ ] Login funciona
[ ] Chat funciona

VALIDAÇÃO:
[ ] Criar conta nova
[ ] Fazer login
[ ] Enviar mensagem
[ ] Verificar gamification
[ ] Abrir Trae Mode (admin)
[ ] Testar ferramentas
```

---

## 🆘 **10. Se Algo Der Errado**

### **Rollback Rápido**

```bash
# Railway
railway rollback

# Vercel
vercel rollback
```

### **Logs Detalhados**

```bash
# Railway - últimas 1000 linhas
railway logs --tail 1000 > railway-logs.txt

# Vercel - logs de build
vercel logs --follow
```

### **Contato de Emergência**

- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Logs em tempo real disponíveis em ambos

---

**Status:** 📋 **PRONTO PARA DEPLOY**

Execute os comandos e monitore os logs! 🚀
