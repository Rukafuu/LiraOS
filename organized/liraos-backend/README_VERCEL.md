# LiraOS Backend - Deploy Vercel

## Configuração do Deploy

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Login no Vercel
```bash
vercel login
```

### 3. Deploy
```bash
cd organized/liraos-backend
vercel --prod
```

### 4. Configurar Environment Variables
No painel do Vercel, adicionar:
- `DATABASE_URL`
- `JWT_SECRET`
- `MISTRAL_API_KEY`

## Estrutura
- `src/server.js` - Servidor principal
- `src/routes/` - Rotas da API
- `src/services/` - Lógica de negócio
- `src/database/` - Modelos PostgreSQL
- `vercel.json` - Configuração Vercel

## Desenvolvimento Local
```bash
npm install
npm run dev
