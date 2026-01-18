# 💜 LIRA OS - AI Companion Ecosystem

**Gaming Copilot Edition** | Versão 2.0  
**Deploy**: https://liraos-production.up.railway.app

---

## 🎯 O QUE É O LIRA OS?

Um ecossistema completo de AI companion com:

### **🎮 Lira Companion** (Desktop App)

Aplicação Electron com:

- Detecção automática de jogos (LOL, Valorant, osu!, Minecraft, CS2)
- Modo Corinthians (torcedora de futebol) ⚽🖤🤍
- Vision analysis (Gemini 2.0)
- TTS Premium (ElevenLabs + Minimax)
- Live2D avatar
- RPA desktop cleaner

### **💬 Lira Chat** (Web App)

Interface web com:

- Chat conversacional
- Memória inteligente (Firestore)
- Gamificação (níveis, conquistas)
- Modo Trae (AI planner)
- Multi-idioma (i18n)
- Voice chat

### **🤖 Lira Backend** (Node.js API)

API REST + WebSocket com:

- Gaming Service (perfis de jogos)
- Vision API (Gemini)
- TTS API (3-tier fallback)
- Discord bot integration
- WhatsApp integration

---

## 🚀 LINKS RÁPIDOS

| Projeto       | README                              | Deploy                                                                       |
| ------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| **Companion** | [README](./LiraCompanion/README.md) | Download .exe                                                                |
| **Chat Web**  | [README](./Chat/README.md)          | [liraos-production.up.railway.app](https://liraos-production.up.railway.app) |
| **Backend**   | [README](./Chat/backend/README.md)  | Railway auto-deploy                                                          |

---

## 📦 ESTRUTURA DO REPOSITÓRIO

```
Lira/
├── Chat/                      # Web app (Vite + React + Tauri)
│   ├── backend/              # API Node.js
│   ├── src/                  # Frontend React
│   └── src-tauri/            # Desktop build (Tauri)
│
├── LiraCompanion/            # Desktop companion (Electron)
│   ├── gameDetection.js      # Auto-detect jogos
│   ├── index.html            # UI + Live2D
│   └── main.js               # Electron main
│
├── LiraGamer/                # [Deprecated] Bot de jogos antigo
│
└── docs/                     # Documentação geral
```

---

## 🛠️ DESENVOLVIMENTO

### **Setup Completo**:

```bash
# Clone
git clone https://github.com/Rukafuu/LiraOS
cd Lira

# Backend
cd Chat/backend
npm install
cp .env.example .env
# Configure .env
npm run dev

# Frontend Web (outra aba)
cd ../
npm install
npm run dev

# Companion (outra aba)
cd LiraCompanion
npm install
npm start
```

### **Build Produção**:

```bash
# Companion (Electron)
cd LiraCompanion
npm run build:win
# → dist/Lira Companion Setup 1.0.0.exe

# Chat Desktop (Tauri)
cd Chat
npm run tauri build
# → src-tauri/target/release/

# Chat Web
npm run build
# → dist/
```

---

## 🌐 DEPLOY

### **Railway** (Backend + Web):

```bash
git push origin main
# Auto-deploy via Railway
```

**Variáveis necessárias**:

```env
GEMINI_API_KEY=...
ELEVENLABS_API_KEY=...
MINIMAX_API_KEY=...
FIREBASE_SERVICE_ACCOUNT_JSON=...
```

### **Companion** (Distribuição):

- Build: `npm run build:win`
- Upload: GitHub Releases
- Usuários: Download .exe

---

## 📚 DOCUMENTAÇÃO

### **Usuários**:

- [Companion Guide](./LiraCompanion/README.md) - Como usar
- [Chat Guide](./Chat/README.md) - Interface web
- [Troubleshooting](./Chat/docs/TROUBLESHOOTING.md) - Resolução de problemas

### **Desenvolvedores**:

- [Backend API](./Chat/backend/README.md) - Endpoints
- [Auto Detection](./LiraCompanion/AUTO_DETECTION.md) - Como funciona detecção
- [TTS Setup](./Chat/backend/TTS_SETUP_GUIDE.md) - Configurar vozes
- [Architecture](./docs/ARCHITECTURE_IDEAS.md) - Visão geral

### **Admin**:

- [Deploy Guide](./DEPLOY_GUIDE.md) - Deploy Railway
- [Railway Verification](./RAILWAY_VERIFICATION.md) - Checklist

---

## 🎯 FEATURES PRINCIPAIS

### ✅ **Implementado**:

- [x] Gaming Copilot (detecção automática)
- [x] Modo Corinthians (futebol)
- [x] TTS Premium (ElevenLabs + Minimax)
- [x] Vision Analysis (Gemini 2.0)
- [x] Live2D Avatar
- [x] RPA Desktop Cleaner
- [x] Memória Inteligente (Firestore)
- [x] Gamificação (níveis, XP)
- [x] Multi-idioma (i18n)
- [x] Discord Integration
- [x] WhatsApp Integration

### 🚧 **Roadmap**:

- [ ] OCR Event Detection (kills, deaths)
- [ ] OBS Integration (auto-clip)
- [ ] Hotkeys Globais
- [ ] Voice Commands
- [ ] Multi-monitor Support
- [ ] Mobile App

---

## 💰 CUSTOS (Produção)

| Serviço               | Custo           |
| --------------------- | --------------- |
| **Railway** (Hosting) | $5/mês          |
| **Gemini** (Vision)   | Grátis\*        |
| **ElevenLabs** (TTS)  | $5-22/mês       |
| **Firestore**         | Grátis\*        |
| **Total**             | **~$10-30/mês** |

\*Com quotas grátis suficientes para uso moderado

---

## 🤝 CONTRIBUINDO

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'Add: nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## 📝 CHANGELOG

### **v2.0 - Gaming Copilot Edition** (18/01/2026)

- ✨ Detecção automática de jogos
- ⚽ Modo Corinthians
- 🎙️ TTS Premium (3-tier)
- 👁️ Vision context-aware
- 🌐 Railway deployment

### **v1.5 - Desktop Companion** (Dez 2025)

- 🖥️ Electron app
- 🎨 Live2D avatar
- 🧹 RPA cleaner

### **v1.0 - Core** (Nov 2025)

- 💬 Chat básico
- 🤖 Gemini integration
- 🗄️ Firestore

---

## 📜 LICENÇA

MIT License - Uso livre para fins pessoais e educacionais.

---

## 💜 CRÉDITOS

**Desenvolvido por**: Rukafuu  
**Time do Coração**: Sport Club Corinthians Paulista 🖤🤍

**Tecnologias**:

- React + Vite + Tauri
- Electron + Live2D
- Node.js + Express
- Gemini Vision 2.0
- ElevenLabs + Minimax
- Firestore

---

**VAI CORINTHIANS! 🖤🤍⚽**  
**Bora jogar com a Lira! 🎮💜**
