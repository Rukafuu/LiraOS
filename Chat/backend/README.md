# 🎮 LIRA BACKEND - Gaming Copilot API

**Versão**: 2.0 Gaming Edition  
**Deploy**: Railway (`liraos-production.up.railway.app`)

---

## 🎯 O QUE É?

Backend API para o **Lira Companion** com:

- 🎮 **Gaming Service** - Perfis de jogos e detecção
- 👁️ **Vision API** - Análise de screenshots com Gemini
- 🎙️ **TTS API** - ElevenLabs + Minimax + Google fallback
- 🔌 **WebSocket** - Comunicação real-time com Companion
- 🗄️ **Database** - Firestore para persistência

---

## 🚀 DEPLOYMENT (RAILWAY)

### **Variáveis de Ambiente Necessárias**:

```env
# 🤖 AI Services
GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxxx

# 🎙️ TTS (Premium - Opcional)
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
MINIMAX_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
MINIMAX_GROUP_ID=xxxxxxxxxxxxxxxxxxxxx

# 🗄️ Database
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# 🌐 CORS
FRONTEND_URL=https://seu-frontend.com

# 🔧 Outras (Railway configura automaticamente)
PORT=4000
NODE_ENV=production
```

### **Deploy**:

```bash
git push origin main
# Railway detecta e faz deploy automático
```

---

## 📡 ENDPOINTS

### **1. WebSocket `/companion`**

Comunicação real-time com Companion.

**URL**: `wss://liraos-production.up.railway.app/companion`

**Mensagens**:

**Cliente → Servidor**:

```json
{
  "type": "ping"
}

{
  "type": "request-game-profile",
  "gameId": "league-of-legends",
  "gameName": "League of Legends"
}
```

**Servidor → Cliente**:

```json
{
  "type": "welcome",
  "message": "Connected to Lira Backend!"
}

{
  "type": "game-detected",
  "game": "league-of-legends",
  "profile": { "visionInterval": 5000, ... }
}

{
  "type": "proactive",
  "content": "Detectei League of Legends! Vamos jogar?",
  "emotion": "happy"
}
```

---

### **2. Vision API `/api/vision/tick`**

Análise de screenshots com Gemini Vision.

**POST** `/api/vision/tick`

**Request**:

```json
{
  "screenshot": "base64_encoded_image",
  "gameContext": {
    "game": "league-of-legends",
    "gameName": "League of Legends"
  }
}
```

**Response**:

```json
{
  "success": true,
  "description": "HP baixo! Inimigos próximos, recue!",
  "gameContext": { "game": "league-of-legends", ... }
}
```

**Prompts por Jogo**:

- **LOL**: Análise de HP, mana, lane state
- **Valorant**: HP/armor, inimigos, posição
- **osu!**: Combo, accuracy, encorajamento
- **Corinthians**: Placar, lances, gols! ⚽🖤🤍

---

### **3. TTS API `/api/voice/tts`**

Text-to-Speech com fallback inteligente.

**POST** `/api/voice/tts`

**Request**:

```json
{
  "text": "Olá! Sou a Lira!",
  "voiceId": "lira-local"
}
```

**Response**: `audio/mpeg` (MP3 buffer)

**Prioridade**:

1. ElevenLabs (se `ELEVENLABS_API_KEY` configurada)
2. Minimax (se `MINIMAX_API_KEY` configurada)
3. Google TTS (sempre disponível)

**Voice IDs**:

- `lira-local`, `xtts-local` → Tenta ElevenLabs → Minimax → Google
- `eleven-VOICE_ID` → Força ElevenLabs
- `minimax-VOICE_ID` → Força Minimax

---

## 🎮 GAMING SERVICE

### **Perfis de Jogos**

**Localização**: `config/gameProfiles.json`

**Estrutura**:

```json
{
  "league-of-legends": {
    "displayName": "League of Legends",
    "processNames": ["League of Legends.exe"],
    "windowTitles": ["League of Legends"],
    "visionInterval": 5000,
    "commentaryStyle": "strategic",
    "events": ["kill", "death", "dragon"],
    "clipDuration": 15,
    "priority": "high"
  }
}
```

**Jogos Configurados**:

- League of Legends (5s)
- VALORANT (3s)
- osu! (2s)
- Minecraft (10s)
- CS2 (3s)
- ⚽ Corinthians (8s)

### **Adicionar Novo Jogo**:

1. Edite `config/gameProfiles.json`
2. Adicione perfil
3. Push para Railway
4. Companion detecta automaticamente!

---

## 🔧 DESENVOLVIMENTO LOCAL

### **Setup**:

```bash
cd Chat/backend
npm install
cp .env.example .env
# Configure .env
npm run dev
```

### **.env Local**:

```env
GEMINI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
MINIMAX_API_KEY=your_key_here
MINIMAX_GROUP_ID=your_group_id
FIREBASE_SERVICE_ACCOUNT_JSON=...
PORT=4000
NODE_ENV=development
```

### **Testar**:

```bash
# TTS
curl -X POST http://localhost:4000/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Teste"}' \
  --output test.mp3

# Vision
curl -X POST http://localhost:4000/api/vision/tick \
  -H "Content-Type: application/json" \
  -d '{"screenshot":"base64..."}'

# WebSocket (via Companion)
npm start # Em outra aba
```

---

## 📊 MONIT ORAMENTO

### **Logs Railway**:

```bash
# Ver logs em tempo real
railway logs

# Filtrar por serviço
railway logs -f
```

### **Health Check**:

```bash
curl https://liraos-production.up.railway.app/health
```

### **Métricas**:

- CPU/RAM usage: Railway Dashboard
- Request count: Railway Analytics
- Error rate: Logs

---

## 🐛 TROUBLESHOOTING

### **"Companion não conecta WebSocket"**

- ✅ Railway está online?
- ✅ URL correta no Companion config?
- ✅ Firewall bloqueando WSS?

### **"Vision sempre falha"**

- ✅ `GEMINI_API_KEY` configurada?
- ✅ Quota excedida?
- ✅ Screenshot em base64 válido?

### **"TTS sem áudio"**

- ✅ Keys configuradas?
- ✅ Google fallback funciona sempre
- ✅ Ver logs: `[TTS] ✨ Attempting...`

### **"Deploy falhou"**

- ✅ Ver logs build no Railway
- ✅ `.env` vars configuradas?
- ✅ Dependencies instaladas?

---

## 💰 CUSTOS ESTIMADOS

### **Railway** (Hosting):

- Free tier: $5 crédito/mês
- Hobby: $5/mês (suficiente)
- Pro: $20/mês (escala alta)

### **APIs**:

- **Gemini**: Grátis (até 60 req/min)
- **ElevenLabs**: $5-22/mês
- **Minimax**: Pay-as-you-go

**Total**: **~$5-15/mês** para uso moderado

---

## 📝 ARQUITETURA

```
┌─────────────────────────────┐
│   COMPANION (Windows)       │
│   - gameDetection.js        │
│   - Vision capture          │
└──────────┬──────────────────┘
           │ WebSocket
           ↓
┌─────────────────────────────┐
│   RAILWAY (Backend)         │
│   - Gaming Service          │
│   - Vision API (Gemini)     │
│   - TTS API (3-tier)        │
│   - WebSocket Server        │
└──────────┬──────────────────┘
           │
           ↓
┌─────────────────────────────┐
│   EXTERNAL APIs             │
│   - Gemini Vision 2.0       │
│   - ElevenLabs TTS          │
│   - Minimax TTS             │
└─────────────────────────────┘
```

---

## 🔒 SEGURANÇA

- ✅ CORS configurado para FRONTEND_URL
- ✅ API keys em env vars (não no código)
- ✅ Rate limiting (TODO)
- ✅ Input validation
- ✅ Error handling

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- `TTS_SETUP_GUIDE.md` - Configuração TTS detalhada
- `services/gamingService.js` - Código Gaming Service
- `routes/visionTick.js` - Código Vision API
- `routes/voice.js` - Código TTS API

---

**Desenvolvido com 💜 por Rukafuu**  
**VAI CORINTHIANS! 🖤🤍⚽**
