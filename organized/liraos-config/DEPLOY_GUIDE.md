# 🚀 LiraOS - Guia de Deploy

## 📋 Pré-requisitos

### Backend (Node.js)
- Node.js 18+
- PostgreSQL 14+
- Redis (opcional, para queue)
- Gmail App Password (para emails)

### Frontend (Vite + React)
- Node.js 18+
- NPM ou Yarn

---

## 🗄️ 1. Configuração do Banco de Dados

### PostgreSQL Setup
```bash
# Criar banco de dados
createdb liraos_prod

# Ou via SQL
CREATE DATABASE liraos_prod;
```

### Configurar .env do Backend
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/liraos_prod

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# AI (Mistral)
MISTRAL_API_KEY=your-mistral-api-key

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# File Upload (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name

# Redis (opcional)
REDIS_URL=redis://localhost:6379
```

---

## 🖥️ 2. Deploy do Backend

### Build e Upload
```bash
cd chat-lira-backend

# Instalar dependências
npm install

# Build
npm run build

# Criar arquivo .env de produção
cp .env.example .env
# Editar .env com valores de produção
```

### 🚀 Deploy no Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy backend
cd chat-lira-backend
vercel --prod

# Deploy frontend
cd ../liraos-chat-v2
vercel --prod
```

### Deploy no Railway
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Criar projeto
railway init

# Linkar ao projeto existente ou criar novo
railway link

# Deploy
railway up
```

### Deploy no Heroku
```bash
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Criar app
heroku create liraos-backend

# Configurar variáveis de ambiente
heroku config:set DATABASE_URL=postgresql://...
heroku config:set JWT_SECRET=your-secret
heroku config:set MISTRAL_API_KEY=your-key
# ... outras variáveis

# Deploy
git push heroku main
```

### Deploy no VPS (Ubuntu/Debian)
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Clonar e configurar
git clone https://github.com/your-repo/chat-lira-backend.git
cd chat-lira-backend
npm install
npm run build

# Configurar .env
cp .env.example .env
# Editar .env

# Iniciar com PM2
pm2 start dist/server.js --name "liraos-backend"
pm2 startup
pm2 save

# Configurar Nginx (opcional)
sudo apt install nginx
# Configurar reverse proxy para porta 4000
```

---

## 🌐 3. Deploy do Frontend

### Build de Produção
```bash
cd liraos-chat-v2

# Instalar dependências
npm install

# Build de produção
npm run build

# Preview local (opcional)
npm run preview
```

### Deploy no Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Ou para produção
vercel --prod
```

### Deploy no Netlify
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### Deploy no GitHub Pages
```bash
# Instalar gh-pages
npm install --save-dev gh-pages

# Adicionar ao package.json
"scripts": {
  "deploy": "gh-pages -d dist"
}

# Deploy
npm run deploy
```

---

## 🔧 4. Configurações Pós-Deploy

### Frontend - Atualizar URLs
```javascript
// Em services/api.ts
const API_BASE_URL = import.meta.env.PROD
  ? 'https://your-backend-url.com'
  : 'http://localhost:4000';
```

### CORS - Backend
```javascript
// Em server.ts ou middleware
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://your-frontend-domain.com',
    'https://your-netlify-site.netlify.app'
  ],
  credentials: true
};
```

### Environment Variables
```bash
# Frontend (Vercel/Netlify)
VITE_API_URL=https://your-backend-url.com

# Backend (Railway/Heroku)
DATABASE_URL=postgresql://...
JWT_SECRET=...
MISTRAL_API_KEY=...
```

---

## 📊 5. Monitoramento e Logs

### PM2 (se usando VPS)
```bash
# Ver logs
pm2 logs liraos-backend

# Monitor
pm2 monit

# Restart
pm2 restart liraos-backend
```

### Railway/Heroku
```bash
# Logs
railway logs
heroku logs --tail

# Variáveis de ambiente
railway variables
heroku config
```

---

## 🔒 6. Segurança

### HTTPS Obrigatório
- ✅ Configure SSL/TLS em produção
- ✅ Use HTTPS em todas as conexões
- ✅ Configure HSTS headers

### Rate Limiting
```javascript
// Em routes sensíveis
const rateLimit = require('express-rate-limit');
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }));
```

### Backup do Banco
```bash
# PostgreSQL backup
pg_dump liraos_prod > backup.sql

# Automatizar com cron
0 2 * * * pg_dump liraos_prod > /backups/backup_$(date +\%Y\%m\%d).sql
```

---

## 🚀 7. Checklist Final

### Backend ✅
- [ ] PostgreSQL configurado
- [ ] .env com variáveis corretas
- [ ] Mistral API key válida
- [ ] Gmail SMTP configurado (opcional)
- [ ] AWS S3 configurado (opcional)
- [ ] Redis configurado (opcional)
- [ ] Deploy realizado
- [ ] Logs funcionando
- [ ] Health check OK

### Frontend ✅
- [ ] Build de produção gerado
- [ ] URLs da API atualizadas
- [ ] Deploy realizado
- [ ] HTTPS configurado
- [ ] Performance testada

### Integração ✅
- [ ] Login/cadastro funcionando
- [ ] Chat IA funcionando
- [ ] Upload de arquivos (se configurado)
- [ ] Emails funcionando (se configurado)
- [ ] Responsividade testada

---

## 🎯 URLs de Produção

Após deploy, configure:

```
Frontend: https://liraos.vercel.app
Backend:  https://liraos-backend.railway.app
Database: PostgreSQL na nuvem
Storage:  AWS S3 ou similar
```

---

## 📞 Suporte

Para problemas durante o deploy:

1. **Verificar logs** do backend/frontend
2. **Testar endpoints** individualmente
3. **Verificar variáveis** de ambiente
4. **Testar conectividade** banco/API externa

**🎉 LiraOS pronto para conquistar o mundo!**
