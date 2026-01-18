# 🎙️ GUIA DE CONFIGURAÇÃO TTS - ElevenLabs + Minimax

## 🎯 Sistema de Prioridade Inteligente

A Lira usa um sistema de **fallback automático** com 3 níveis:

```
1. ElevenLabs (Premium) ✨
   ↓ (se falhar)
2. Minimax (Backup) 🎭
   ↓ (se falhar)
3. Google TTS (Gratuito) 🌐
```

---

## ⚙️ CONFIGURAÇÃO NO RAILWAY

### **Passo 1: Acesse o Railway**

1. Vá em: https://railway.app
2. Entre no projeto: **liraos-production**
3. Clique em **Settings** → **Variables**

### **Passo 2: Adicione as Keys**

```env
# 🎙️ ElevenLabs (Prioridade 1 - Melhor Qualidade)
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx

# 🎭 Minimax (Prioridade 2 - Backup)
MINIMAX_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
MINIMAX_GROUP_ID=xxxxxxxxxxxxxxxxxxxxx

# 🤖 Gemini (Para Vision)
GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```

### **Passo 3: Deploy Automático**

- Railway detecta mudanças → Deploy automático
- Aguarde ~1-2 minutos
- Pronto! Vozes premium ativadas! 🎉

---

## 🔑 ONDE CONSEGUIR AS KEYS

### **ElevenLabs** (Recomendado)

1. **Acesse**: https://elevenlabs.io
2. **Sign Up** (grátis com 10k caracteres/mês)
3. **Profile** → **API Keys**
4. **Copie a key**: `sk_...`

**Voice ID Padrão**: `hzmQH8l82zshXXrObQE2`  
(Você pode clonar sua própria voz ou usar vozes pré-treinadas!)

### **Minimax**

1. **Acesse**: https://api.minimaxi.chat
2. **Sign Up** (grátis com trial credits)
3. **Dashboard** → **API Keys**
4. **Copie**:
   - API Key: `sk_...`
   - Group ID: `...`

**Voice ID Padrão**: `English_PlayfulGirl`

---

## 🎚️ QUALIDADE DAS VOZES

| Provider       | Qualidade  | Naturalidade  | Português    | Custo           |
| -------------- | ---------- | ------------- | ------------ | --------------- |
| **ElevenLabs** | ⭐⭐⭐⭐⭐ | Muito Natural | ✅ Excelente | ~$0.30/1k chars |
| **Minimax**    | ⭐⭐⭐⭐   | Natural       | ✅ Bom       | ~$0.15/1k chars |
| **Google TTS** | ⭐⭐⭐     | Robótico      | ✅ OK        | 🆓 Grátis       |

---

## 🎯 VOICE IDs PERSONALIZADOS

### **ElevenLabs:**

```javascript
// No Companion, você pode especificar:
voiceId: "eleven-hzmQH8l82zshXXrObQE2"; // Padrão Lira
voiceId: "eleven-SEU_VOICE_ID_AQUI"; // Voz customizada
```

**Como criar voz customizada**:

1. ElevenLabs → **Voice Lab**
2. **Clone sua própria voz** (30s de áudio)
3. Copie o Voice ID
4. Use no código!

### **Minimax:**

```javascript
voiceId: "minimax-English_PlayfulGirl"; // Padrão
voiceId: "minimax-Brazilian_Female"; // Português
```

---

## 📊 COMO TESTAR

### **Teste via Backend (Produção)**:

```bash
curl -X POST https://liraos-production.up.railway.app/api/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Olá! Sou a Lira testando minha voz premium!"}' \
  --output test_voice.mp3
```

### **Teste via Companion**:

1. Instale o Companion
2. Abra DevTools (`Ctrl+Shift+I`)
3. Console:

```javascript
showSpeech("Testando voz premium da Lira! 🎙️💜", 5000);
```

### **Ver logs no Railway**:

```
[TTS] ✨ Attempting ElevenLabs (Premium)...
[TTS] ✅ ElevenLabs Success!
```

ou

```
[TTS] ⚠️ ElevenLabs failed, trying Minimax...
[TTS] 🎭 Attempting Minimax (Backup)...
[TTS] ✅ Minimax Success!
```

ou

```
[TTS] ⚠️ Minimax failed, trying Google...
[TTS] 🌐 Using Google Fallback (Free)...
[TTS] ✅ Google Success!
```

---

## 🎮 CENÁRIOS DE USO

### **Cenário 1: Tudo Configurado** ✅

```
ElevenLabs key ✅
Minimax key ✅
→ Usa ElevenLabs (melhor qualidade)
```

### **Cenário 2: Só Minimax**

```
ElevenLabs key ❌
Minimax key ✅
→ Usa Minimax (boa qualidade)
```

### **Cenário 3: Sem Keys** 🆓

```
ElevenLabs key ❌
Minimax key ❌
→ Usa Google TTS (gratuito, sempre funciona)
```

---

## 💰 CUSTOS ESTIMADOS

### **ElevenLabs**:

- **Free Tier**: 10k caracteres/mês
- **Starter**: $5/mês (30k chars)
- **Creator**: $22/mês (100k chars)

**Estimativa**:

- Companion fala ~50 palavras/minuto de gameplay
- ~200 caracteres/minuto
- **1 hora de gameplay** = ~12k caracteres
- **Free tier** = ~50 minutos/mês

### **Minimax**:

- **Trial**: $10 em créditos grátis
- **Pay as you go**: ~$0.15/1k chars

**Recomendação**:

- Use **ElevenLabs free tier** (10k/mês)
- **Minimax** como backup (trial credits)
- **Google** como fallback (sempre grátis)

---

## 🔧 TROUBLESHOOTING

### **"Voz está robótica"**

➡️ Você está usando Google TTS (fallback)  
✅ Configure ElevenLabs ou Minimax no Railway

### **"Erro 401 Unauthorized"**

➡️ API Key inválida ou expirada  
✅ Verifique as keys no Railway

### **"Sem áudio"**

➡️ Verifique console do navegador  
✅ `Ctrl+Shift+I` → Console → Procure por `[TTS]`

### **"ElevenLabs sempre falha"**

➡️ Pode ter acabado os créditos/quota  
✅ Verifique dashboard ElevenLabs  
✅ Minimax assume automaticamente

---

## 🎯 RESULTADO FINAL

Com ElevenLabs + Minimax configurados:

✅ **Qualidade Superior**: Voz natural e expressiva  
✅ **Redundância**: Fallback automático se um serviço cair  
✅ **Sempre Funciona**: Google TTS como último backup  
✅ **Português Perfeito**: Todas as vozes suportam PT-BR  
✅ **Emoções**: ElevenLabs pode expressar felicidade, empolgação, etc.

---

**Configuração recomendada**:

- ✅ ElevenLabs (qualidade)
- ✅ Minimax (backup confiável)
- ✅ Google (sempre disponível)

**A Lira vai ter a melhor voz possível! 🎙️💜**
