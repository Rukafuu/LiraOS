# 🚀 LiraOS Chat - Full Stack AI Chat Application

<div align="center">

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express)](https://expressjs.com/)
[![Mistral AI](https://img.shields.io/badge/Mistral-Large-FF6B6B)](https://mistral.ai/)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4)](https://ai.google.dev/)

Uma aplicação de chat com IA moderna e cheia de recursos, com backend Node.js e frontend React + TypeScript.

[Features](#-features) • [Instalação](#-instalação-rápida) • [Uso](#-uso) • [Tecnologias](#-tecnologias) • [Arquitetura](#-arquitetura)

</div>

---

## ✨ Features

### 🤖 **IA Multi-Modelo**
- **Mistral Large** - Modelo principal com respostas rápidas e precisas
- **Google Gemini 2.0 Flash** - Suporte alternativo para visão e análise
- Streaming de respostas em tempo real
- Fallback para modo mock sem API key

### 🎭 **6 Personas Únicas**
1. **Lira Standard** - Assistente equilibrado e útil
2. **Concise Core** - Direto ao ponto, sem enrolação
3. **Lira Tsundere** - "N-não é como se eu quisesse te ajudar..."
4. **Lira Caring** - Calorosa, empática e acolhedora
5. **Unfiltered Node** - Cyberpunk rebelde e ousado
6. **Lira Poetic** - Respostas em metáforas e rimas

### 🎮 **Sistema de Gamificação Completo**
- **XP & Níveis** - Ganhe experiência a cada mensagem
- **Moedas (Coins)** - Compre temas e personas
- **Bond Level** - Construa relacionamento com a Lira
- **Quests Diárias/Semanais** - Desafios com recompensas
- **Achievements** - Conquistas desbloqueáveis
- **Leaderboard** - Compare-se com outros usuários

### 🧠 **Sistema de Memória**
- Memórias de longo prazo salvas automaticamente
- Use "remember that" para criar memórias personalizadas
- Contexto personalizado em cada conversa

### 🎨 **Temas & Customização**
- 11+ temas únicos (Aurora, Ice, Nature, Desert, Halloween, Christmas, Carnival, etc.)
- Modo escuro por padrão
- Animações fluidas com Framer Motion
- Particle background com efeitos especiais

### 🎪 **Easter Eggs**
- **Ctrl+R** - Do a barrel roll! 🔄
- **Ctrl+Shift+M** - Matrix mode 💚
- **Ctrl+Shift+G** - God mode! ⚡ (+9999 coins)

### 🎬 **UX Imersiva**
- Boot sequence temática
- Login screen personalizado
- Onboarding tour para novos usuários
- Toast notifications
- Sistema de atalhos de teclado
- Modal de preferências de cookies

---

## 🚀 Instalação Rápida

### Pré-requisitos
- Node.js 16+ instalado
- NPM ou Yarn

### Instalação

1. **Clone ou baixe o projeto**
```bash
cd "C:\Users\conta\Documents\Lira\Chat"
```

2. **Execute o launcher automático**
```bash
start.bat
```

O script automaticamente:
- ✅ Mata processos nas portas 3000 e 4000
- ✅ Instala dependências do frontend
- ✅ Instala dependências do backend
- ✅ Inicia backend na porta 4000
- ✅ Inicia frontend na porta 3000

### Configuração Manual (Opcional)

Se preferir configurar manualmente:

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
npm install
npm run dev
```

---

## 🔑 Configuração da API Key

A aplicação já vem configurada com **Mistral Large** usando a API key fornecida.

Para adicionar ou alterar as chaves:

1. Edite `backend/.env`:
```env
MISTRAL_API_KEY=X44GIBW5QmbEXftzi7GRs8twNwkXYJYb
GEMINI_API_KEY=sua_chave_gemini_aqui
```

2. Reinicie o backend

---

## 📖 Uso

### Acesso
1. Abra http://localhost:3000
2. Assista a sequência de boot
3. Faça login com seu username
4. Complete o tour de onboarding (primeira vez)
5. Comece a conversar!

### Atalhos de Teclado
- **Ctrl+N** - Nova conversa
- **Ctrl+B** - Toggle sidebar
- **Ctrl+,** - Abrir configurações
- **Ctrl+K** - Mostrar atalhos
- **Esc** - Fechar modais
- **Ctrl+R** - Barrel roll (easter egg)
- **Ctrl+Shift+M** - Matrix mode (easter egg)
- **Ctrl+Shift+G** - God mode (easter egg)

### Dicas
- Use "remember that" para criar memórias persistentes
- Desbloqueie personas na loja com moedas
- Complete quests diárias para ganhar XP e coins
- Customize com temas na loja

---

## 🛠️ Tecnologias

### Frontend
- **React 19.2** - Framework UI
- **TypeScript 5.8** - Tipagem estática
- **Vite 6.2** - Build tool ultrarrápido
- **Framer Motion 12** - Animações suaves
- **Lucide React** - Ícones modernos
- **React Markdown** - Renderização de markdown
- **UUID** - Geração de IDs únicos

### Backend
- **Express 4.18** - Framework web
- **@mistralai/mistralai** - SDK do Mistral AI
- **@google/genai** - SDK do Google Gemini
- **CORS** - Cross-origin requests
- **dotenv** - Variáveis de ambiente

---

## 🏗️ Arquitetura

```
Chat/
├── backend/              # Node.js Express API
│   ├── server.js        # Servidor principal
│   ├── package.json     # Dependências backend
│   ├── .env            # API keys (gitignored)
│   └── .env.example    # Template de configuração
│
├── src/
│   ├── App.tsx         # Componente principal
│   ├── types.ts        # TypeScript interfaces
│   ├── constants.ts    # Constantes globais
│   │
│   ├── components/     # Componentes React
│   │   ├── Sidebar.tsx
│   │   ├── ChatHeader.tsx
│   │   ├── MessageList.tsx
│   │   ├── ChatInput.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── DashboardModal.tsx
│   │   ├── StoreModal.tsx
│   │   └── ui/        # Componentes de UI
│   │
│   ├── contexts/      # React Context providers
│   │   ├── ThemeContext.tsx
│   │   ├── GamificationContext.tsx
│   │   └── ToastContext.tsx
│   │
│   ├── hooks/         # Custom React hooks
│   │   ├── useAmbientGlow.ts
│   │   └── useKeyboardManager.ts
│   │
│   └── services/      # Serviços externos
│       └── ai.ts      # Cliente da API backend
│
├── start.bat          # Launcher automático
├── package.json       # Dependências frontend
└── README.md         # Este arquivo
```

---

## 🔌 API Endpoints

### Backend (http://localhost:4000)

**Health Check**
```
GET /health
```

**Generate Chat Title**
```
POST /api/generate-title
Body: { firstMessage: string, model: 'gemini' | 'mistral' }
```

**Stream Chat Response** (SSE)
```
POST /api/chat/stream
Body: { messages: Message[], systemInstruction: string, model: string, memories: Memory[] }
```

**Text-to-Speech** (Placeholder)
```
POST /api/tts
Body: { text: string }
```

---

## 🐛 Solução de Problemas

### Porta já em uso
O `start.bat` automaticamente mata processos nas portas 3000 e 4000. Se o problema persistir:
```bash
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

### Erro de API Key
Verifique se a API key está correta em `backend/.env`

### Erro de CORS
O backend já está configurado para aceitar requisições do frontend (localhost:3000)

### Dependências não instaladas
Execute manualmente:
```bash
npm install
cd backend && npm install
```

---

## 📝 To-Do / Roadmap

- [x] Backend Express com Mistral + Gemini
- [x] Frontend React com TypeScript
- [x] Sistema de gamificação
- [x] Múltiplas personas
- [x] Sistema de memória
- [x] Launcher automático (.bat)
- [ ] Implementar TTS (Text-to-Speech)
- [ ] Regenerar mensagens
- [ ] Editar mensagens
- [ ] Export/Import de conversas
- [ ] Autenticação real (JWT)
- [ ] Banco de dados (MongoDB/PostgreSQL)
- [ ] Deploy (Vercel/Railway)
- [ ] Modo mobile responsivo aprimorado
- [ ] Suporte a mais modelos de IA

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se livre para abrir issues ou pull requests.

---

## 📄 Licença

Este projeto é de uso pessoal. Para uso comercial, consulte as licenças das APIs utilizadas.

---

## 🙏 Créditos

- **Mistral AI** - Modelo de linguagem principal
- **Google Gemini** - Modelo de linguagem alternativo
- **Lucide Icons** - Biblioteca de ícones
- **Framer Motion** - Biblioteca de animações

---

<div align="center">

**Feito com ❤️ e muita ☕**

[⬆ Voltar ao topo](#-liraos-chat---full-stack-ai-chat-application)

</div>
