# 📁 LiraOS - Estrutura Organizada

## 🎯 Visão Geral

Esta pasta contém o **LiraOS** completamente organizado após a limpeza da estrutura bagunçada anterior. O sistema é um chat IA avançado com múltiplas funcionalidades.

## 📂 Estrutura Organizada

```
organized/
├── liraos-backend/          # 🖥️ Backend Node.js + Express
│   ├── src/
│   │   ├── lib/storage/     # Vercel Blob integration
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── database/        # PostgreSQL models
│   ├── vercel.json          # Vercel config
│   └── README_VERCEL.md     # Deploy guide
├── liraos-frontend/         # 🎨 Frontend React + Vite
│   ├── src/components/      # React components
│   ├── src/contexts/        # React contexts
│   └── src/services/        # API integration
├── liraos-config/           # ⚙️ Configurações
│   ├── .env.vercel          # Production env
│   ├── .gitignore           # Git ignore rules
│   └── DEPLOY_GUIDE.md      # Complete deploy guide
├── liraos-scripts/          # 📜 Scripts e ferramentas
│   ├── *.bat                # Windows scripts
│   ├── *.py                 # Python scripts
│   └── *.sh                 # Shell scripts
├── liraos-docs/             # 📚 Documentação
│   ├── *.md                 # Markdown docs
│   └── *.txt                # Text files
├── liraos-ai/               # 🤖 IA e modelos
│   ├── lira/                # Lira AI personality
│   ├── kokoro/              # TTS models
│   └── xtts_env/            # Voice environment
├── liraos-backups/          # 💾 Backups
│   └── lira_backups/        # Backup files
```

## 🚀 Funcionalidades do LiraOS

### 🤖 Sistema de IA
- **Mistral AI** integrado
- **5 Personalidades** da Lira (ChatGPT, Caring, Tsundere, etc.)
- **Contexto inteligente** de conversa
- **Streaming de respostas** em tempo real

### 🎨 Interface Moderna
- **8 Temas dinâmicos** (Dark, Ice, Desert, etc.)
- **Design system consistente**
- **PWA instalável**
- **Tutorial de onboarding**

### 🔐 Autenticação Completa
- **Login/Cadastro** com validação
- **Esqueci minha senha** via email
- **JWT seguro** com middleware
- **Reset password** funcional

### 🏆 Gamificação Avançada
- **XP por mensagens** (10 XP cada)
- **Sistema de níveis** progressivo
- **Missões diárias**
- **Dashboard com estatísticas**

### 📁 Sistema de Arquivos
- **Vercel Blob** para storage serverless
- **Validação de tipos** e tamanho
- **Processamento assíncrono** (OCR, thumbnails)
- **URLs públicas** automáticas

## 🛠️ Como Usar

### Desenvolvimento Local
```bash
# Backend
cd organized/liraos-backend
npm install
npm run dev

# Frontend (nova aba)
cd organized/liraos-frontend
npm install
npm run dev
```

### Deploy Vercel
```bash
# Backend
cd organized/liraos-backend
vercel --prod

# Frontend
cd organized/liraos-frontend
vercel --prod
```

## 📋 Pré-requisitos

- **Node.js 18+**
- **PostgreSQL** (local ou Vercel Postgres)
- **Mistral AI API key**
- **Conta Vercel** (para deploy)

## 🔧 Configuração

### 1. Clonar e Instalar
```bash
git clone <repo-url>
cd organized
npm install
```

### 2. Configurar Banco
```bash
# Usar Vercel Postgres (recomendado)
vercel postgres create liraos-prod
```

### 3. Variáveis de Ambiente
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
MISTRAL_API_KEY=your-mistral-key
```

### 4. Deploy
```bash
vercel --prod
```

## 🎯 Próximos Passos

1. **Configurar APIs** (Mistral, Gmail)
2. **Deploy no Vercel**
3. **Testar funcionalidades**
4. **Personalizar temas**
5. **Adicionar novas funcionalidades**

## 📞 Suporte

Para dúvidas ou problemas:
- Verificar `liraos-config/DEPLOY_GUIDE.md`
- Consultar `liraos-backend/README_VERCEL.md`
- Verificar logs do Vercel

## 🎉 Conclusão

**LiraOS** agora está completamente organizado e pronto para desenvolvimento e produção! 🚀✨

**Sistema profissional, escalável e moderno!**
