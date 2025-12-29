<div align="center">

![Lira Banner](./Chat/assets/lira-banner.png)

# 🌟 LiraOS - Advanced AI Companion Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Uma plataforma de IA conversacional de próxima geração com personalidade, memória e capacidades multimodais.**

[🌐 Demo ao Vivo](https://liraos.xyz) • [📖 Documentação](#-features) • [🚀 Deploy](#-deployment) • [💬 Discord](https://discord.gg/liraos)

</div>

---

## 📋 Índice

- [Sobre](#-sobre)
- [Features](#-features)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Deployment](#-deployment)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Reference](#-api-reference)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre

**LiraOS** é uma plataforma de IA conversacional avançada que combina múltiplos modelos de linguagem (Gemini, Mistral, OpenRouter) com capacidades multimodais, sistema de memória inteligente, gamificação e integração com serviços externos.

### 🌟 Destaques

- 🧠 **Múltiplos Modelos de IA**: Suporte para Gemini 2.0 Flash, Mistral Large, Pixtral Vision
- 🎨 **Geração de Imagens**: Integração com Gemini 3, Pollinations.ai, Prodia e HuggingFace
- 🎥 **Geração de Vídeos**: Suporte para Luma Dream Machine e Minimax Hailuo
- 🗣️ **Text-to-Speech**: XTTS v2 local com voz neural customizada
- 💾 **Memória Inteligente**: Sistema de memória episódica com categorização automática
- 🎮 **Gamificação**: Sistema de XP, níveis, conquistas e moedas
- 🌍 **i18n**: Suporte para 5 idiomas (PT, EN, ES, FR, DE)
- 🎭 **Live2D**: Avatar animado com sincronização labial
- 🔐 **Autenticação**: OAuth (Discord, GitHub) e autenticação tradicional
- 📱 **PWA**: Instalável como aplicativo nativo

---

## ✨ Features

### 🤖 Capacidades de IA

- **Chat Conversacional**: Streaming em tempo real com efeito typewriter
- **Visão Computacional**: Análise de imagens com Pixtral e Gemini Vision
- **Geração de Arte**: Múltiplos provedores com fallback automático
- **Geração de Vídeos**: Criação de vídeos a partir de prompts de texto
- **Code Analysis**: Análise e execução de código com ferramentas integradas
- **PC Control**: Controle do sistema via comandos naturais (Admin mode)

### 🎨 Interface & UX

- **Design Moderno**: Interface dark mode com glassmorphism e animações fluidas
- **Responsive**: Otimizado para desktop, tablet e mobile
- **Widgets Interativos**: To-do lists, confirmações, status cards
- **Progressive Image Loading**: Carregamento progressivo com shimmer effect
- **Virtual Scrolling**: Performance otimizada para conversas longas
- **Markdown Rendering**: Suporte completo para markdown com syntax highlighting

### 🔧 Sistema

- **Memória Persistente**: PostgreSQL com Prisma ORM
- **Session Management**: Múltiplas conversas com títulos automáticos
- **File Uploads**: Suporte para imagens, PDFs e documentos
- **Rate Limiting**: Proteção contra abuso
- **Content Moderation**: Sistema de moderação com infrações e bans
- **Logging**: Winston para logs estruturados

### 🎮 Gamificação

- **Sistema de XP**: Ganhe experiência por interações
- **Níveis**: Sistema de progressão com 100 níveis
- **Conquistas**: Desbloqueie achievements especiais
- **Moedas**: Sistema de economia virtual
- **Temas**: Desbloqueie temas visuais customizados
- **Personas**: Múltiplas personalidades de IA

### 🌐 Integrações

- **Discord Bot**: Bot integrado para servidores Discord
- **Instagram**: Integração com Instagram Graph API
- **GitHub OAuth**: Login via GitHub
- **Osu! Game Bridge**: Controle de jogos via visão computacional
- **RVC Voice Cloning**: Clonagem de voz com Retrieval-based Voice Conversion

---

## 🛠️ Tecnologias

### Frontend

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite 6** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Markdown** - Markdown rendering
- **React Virtuoso** - Virtual scrolling
- **i18next** - Internationalization

### Backend

- **Node.js** - Runtime
- **Express** - Web framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Winston** - Logging
- **JWT** - Authentication
- **Multer** - File uploads
- **Node-fetch** - HTTP client

### AI & ML

- **Google Gemini 2.0** - Primary LLM
- **Mistral AI** - Alternative LLM
- **OpenRouter** - Model routing
- **XTTS v2** - Text-to-Speech
- **PaddleOCR** - Optical Character Recognition
- **OpenCV** - Computer Vision (Python)

### DevOps

- **Railway** - Backend hosting
- **Vercel** - Frontend hosting
- **GitHub Actions** - CI/CD
- **Docker** - Containerization (optional)

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Git

### Clone o Repositório

```bash
git clone https://github.com/Rukafuu/LiraOS.git
cd LiraOS
```

### Instalação do Frontend

```bash
cd Chat
npm install
```

### Instalação do Backend

```bash
cd Chat/backend
npm install
```

### Instalação do Python (Opcional - para OCR e Game Bridge)

```bash
cd Chat/backend/python
pip install -r requirements.txt
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` em `Chat/backend/`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# AI APIs
GEMINI_API_KEY="your_gemini_api_key"
MISTRAL_API_KEY="your_mistral_api_key"
OPENROUTER_API_KEY="your_openrouter_api_key"
HUGGINGFACE_ACCESS_TOKEN="your_hf_token"

# Authentication
JWT_SECRET="your_jwt_secret_min_32_chars"
JWT_REFRESH_SECRET="your_refresh_secret_min_32_chars"

# OAuth
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"

# SMTP (Password Recovery)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"

# URLs
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"

# Optional
PIXTRAL_AGENT_ID="your_pixtral_agent_id"
MISTRAL_PREMIUM_AGENT_ID="your_premium_agent_id"
DISCORD_TOKEN="your_discord_bot_token"
```

### 2. Configuração do Banco de Dados

```bash
cd Chat/backend
npx prisma generate
npx prisma db push
```

### 3. Iniciar Desenvolvimento

**Terminal 1 - Frontend:**

```bash
cd Chat
npm run dev
```

**Terminal 2 - Backend:**

```bash
cd Chat/backend
node server.js
```

Acesse `http://localhost:5173` 🚀

---

## 🚀 Deployment

### Frontend (Vercel)

1. Conecte seu repositório ao Vercel
2. Configure o diretório raiz como `Chat`
3. Build command: `npm run build`
4. Output directory: `dist`

### Backend (Railway)

1. Instale o Railway CLI:

```bash
npm install -g @railway/cli
```

2. Faça login e link o projeto:

```bash
railway login
railway link -p your-project-id
```

3. Configure as variáveis de ambiente no Railway Dashboard

4. Deploy:

```bash
railway up
```

### Database (Railway PostgreSQL)

1. Adicione o PostgreSQL plugin no Railway
2. Copie a `DATABASE_URL` para as variáveis de ambiente
3. Execute as migrations:

```bash
railway run npx prisma db push
```

---

## 📁 Estrutura do Projeto

```
LiraOS/
├── Chat/                          # Frontend React
│   ├── components/                # Componentes React
│   │   ├── chat/                  # Componentes de chat
│   │   ├── iris/                  # Sistema de vídeos Iris
│   │   └── ui/                    # Componentes UI reutilizáveis
│   ├── contexts/                  # React Contexts
│   ├── hooks/                     # Custom React Hooks
│   ├── locales/                   # Arquivos de tradução i18n
│   ├── services/                  # Serviços API
│   ├── types/                     # TypeScript types
│   ├── assets/                    # Imagens e assets
│   └── App.tsx                    # Componente principal
│
├── Chat/backend/                  # Backend Node.js
│   ├── routes/                    # Express routes
│   │   ├── chat.js                # Chat streaming
│   │   ├── auth.js                # Autenticação
│   │   ├── images.js              # Geração de imagens
│   │   └── iris.js                # Geração de vídeos
│   ├── services/                  # Serviços backend
│   │   ├── imageGeneration.js     # Geração de imagens
│   │   ├── pcControllerService.js # Controle do PC
│   │   └── discordService.js      # Bot Discord
│   ├── middlewares/               # Express middlewares
│   ├── utils/                     # Utilitários
│   ├── prisma/                    # Prisma schema
│   ├── python/                    # Scripts Python
│   │   ├── game_bridge.py         # Controle de jogos
│   │   └── ocr_service.py         # OCR service
│   ├── data/                      # Arquivos de dados
│   └── server.js                  # Entry point
│
└── README.md                      # Este arquivo
```

---

## 🔌 API Reference

### Chat Endpoints

#### `POST /api/chat/stream`

Stream de resposta da IA em tempo real.

**Request:**

```json
{
  "messages": [{ "role": "user", "content": "Olá!" }],
  "model": "gemini",
  "temperature": 0.7,
  "localDateTime": "2025-12-29T04:00:00-03:00"
}
```

**Response:** Server-Sent Events (SSE)

```
data: {"content": "Olá"}
data: {"content": "! Como"}
data: {"content": " posso"}
data: [DONE]
```

### Image Generation

#### `POST /api/images/generate`

Gera uma imagem a partir de um prompt.

**Request:**

```json
{
  "prompt": "A beautiful sunset over mountains",
  "tier": "free"
}
```

**Response:**

```json
{
  "jobId": "uuid-here",
  "status": "queued"
}
```

#### `GET /api/images/:jobId`

Verifica o status de uma geração de imagem.

**Response:**

```json
{
  "id": "uuid",
  "status": "ready",
  "progress": 100,
  "result": "data:image/png;base64,..."
}
```

### Authentication

#### `POST /api/auth/register`

Registra um novo usuário.

#### `POST /api/auth/login`

Faz login e retorna JWT tokens.

#### `POST /api/auth/refresh`

Renova o access token.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Guidelines

- Siga o estilo de código existente
- Adicione testes para novas features
- Atualize a documentação
- Mantenha commits atômicos e descritivos

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🙏 Agradecimentos

- **Google Gemini** - Modelo de IA principal
- **Mistral AI** - Modelos alternativos
- **Pollinations.ai** - Geração de imagens gratuita
- **Railway** - Hosting do backend
- **Vercel** - Hosting do frontend
- **Comunidade Open Source** - Por todas as bibliotecas incríveis

---

## 📧 Contato

**Lucas Frischeisen (Reskyume)**

- GitHub: [@Rukafuu](https://github.com/Rukafuu)
- Email: lucas.frischeisen@gmail.com
- Discord: [LiraOS Community](https://discord.gg/liraos)

---

<div align="center">

**Feito com 💜 por Reskyume**

⭐ Se este projeto te ajudou, considere dar uma estrela!

</div>
