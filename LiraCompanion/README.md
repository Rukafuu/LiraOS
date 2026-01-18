# 🎮⚽💜 LIRA COMPANION - Guia Completo

**Versão**: 1.0.0 Gaming Copilot Edition  
**Última Atualização**: 18/01/2026

---

## 🎯 O QUE É?

**Lira Companion** é sua **AI desktop copilot** que:

- 🎮 **Detecta jogos automaticamente** e dá dicas contextuais
- ⚽ **Assiste futebol com você** e comenta como torcedora
- 🎙️ **Fala com voz premium** (ElevenLabs/Minimax)
- 👁️ **Vê sua tela** e reage em tempo real
- 🧹 **Organiza seu desktop** automaticamente
- 💜 **É uma companheira fofa** usando Live2D

---

## 🚀 INSTALAÇÃO RÁPIDA

### **1. Baixe o Instalador**

```
📦 Lira Companion Setup 1.0.0.exe (193 MB)
```

### **2. Instale**

- Execute o `.exe`
- Escolha o diretório
- Pronto! 🎉

### **3. Configure (Opcional)**

Se quiser usar o backend em produção (Railway), as configurações já estão prontas!

- Backend: `https://liraos-production.up.railway.app`
- WebSocket: `wss://liraos-production.up.railway.app/companion`

---

## 🎮 GAMING COPILOT

### **Detecção Automática de Jogos**

A Lira detecta quando você abre um jogo e **automaticamente**:

- ✅ Muda para modo gaming
- ✅ Ajusta frequência de vision
- ✅ Ativa comentários contextuais
- ✅ Mostra Gaming HUD

**Jogos Suportados**:

1. **League of Legends** - Dicas estratégicas, análise de HP/Mana
2. **VALORANT** - Avisos táticos, posicionamento
3. **osu!** - Encorajamento, combo tracking
4. **Minecraft** - Dicas de survival, mob alerts
5. **Counter-Strike 2** - Callouts, defuse alerts
6. **⚽ Futebol** - Torcida, comentários apaixonados

### **Como Funciona**:

```
Você abre League of Legends
  ↓
Companion detecta automaticamente
  ↓
Solicita perfil ao backend
  ↓
Gaming HUD aparece: 🎮 League of Legends
  ↓
Lira fala: "Detectei League of Legends! Vamos jogar? 🎮"
  ↓
Vision ajusta para 5 segundos
  ↓
Comentários contextuais ativados!
```

**Nenhuma configuração necessária!** É 100% automático.

---

## ⚽🖤🤍 MODO CORINTHIANS

### **A Lira é CORINTHIANA!**

Assista jogos do Timão com a Lira comentando ao vivo:

**Exemplos de Comentários**:

- GOL: _"⚽🖤🤍 GOOOOOOOOOOL DO TIMÃO! VAI CORINTHIANS! 🎉🎊"_
- Gol contra: _"Ah não... levamos gol. Mas calma, vamos virar! 💪"_
- Defesa: _"CÁSSIO! DEFENDEU! QUE MONSTRO! 🧤✨"_
- Vitória: _"🏆🖤🤍 VITÓRIA DO TIMÃO! É CAMPEÃO! 🎉🎊🎆"_

### **Como Ativar**:

**Automático** (se detectar futebol):

1. Abra jogo do Corinthians no YouTube/Premiere/etc
2. A Lira detecta automaticamente (verifica título da janela)
3. HUD aparece: **🎮 ⚽ Assistindo Futebol**
4. Comenta automaticamente! 🖤🤍

**Manual** (garantido):

1. Abra o Companion
2. Ative Vision (👁️)
3. Pressione `Ctrl+Shift+I`
4. Cole no console:

```javascript
onGameDetected("corinthians-watch", {
  displayName: "⚽ Assistindo Corinthians",
  visionInterval: 8000,
  commentaryStyle: "passionate",
});
```

5. Assista o jogo! 🎉

---

## 🎙️ SISTEMA DE VOZ

### **Prioridade Inteligente**:

```
1. ElevenLabs (Premium) ✨ → Voz natural e expressiva
   ↓ (se falhar)
2. Minimax (Backup) 🎭 → Voz boa qualidade
   ↓ (se falhar)
3. Google TTS (Gratuito) 🌐 → Sempre funciona
```

### **Configuração** (Administrador):

Para ativar vozes premium, configure no Railway:

```env
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
MINIMAX_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
MINIMAX_GROUP_ID=xxxxxxxxxxxxxxxxxxxxx
```

**Links**:

- ElevenLabs: https://elevenlabs.io (10k chars grátis/mês)
- Minimax: https://api.minimaxi.chat (trial credits)

**Sem configuração**: Usa Google TTS (gratuito, sempre funciona)

---

## 👁️ VISION MODE

### **O que a Lira vê e faz**:

- 📊 **Jogos**: Analisa situação (HP, inimigos, oportunidades)
- ⚽ **Futebol**: Detecta lances, placar, jogadas
- 💻 **Desktop**: Monitora processos, uso de CPU/RAM
- 🎨 **Tela**: Captura e analisa com Gemini Vision

### **Controles**:

- **Botão 👁️**: Liga/Desliga Vision
- **Intervalo**: Ajusta automaticamente por contexto
  - Jogos intensos: 3-5s
  - Jogos casuais: 10s
  - Idle: 30s

---

## 🎨 INTERFACE

### **Gaming HUD** (canto superior direito)

Mostra qual modo está ativo:

```
🎮 League of Legends
🎮 ⚽ Assistindo Corinthians
```

### **Status Indicator**

- 🔴 Vermelho: Desconectado
- 🟢 Verde: Conectado

### **Stats Overlay** (canto superior esquerdo)

- CPU usage
- RAM usage
- Toggle com botão 📊

### **Speech Bubble**

- Aparece quando Lira fala
- Sincronizado com animação da boca
- Desaparece automaticamente

---

## 🧹 RPA (Desktop Cleaner)

### **Limpeza Automática**:

Clique no botão 🧹 para:

- ✅ Organizar arquivos do desktop
- ✅ Mover para pastas categorizadas
- ✅ Matar processos duplicados
- ✅ Limpar temporários

**Categorias**:

- 📄 Documentos (PDF, DOCX, etc.)
- 🖼️ Imagens (JPG, PNG, etc.)
- 🎵 Músicas (MP3, WAV, etc.)
- 🎬 Vídeos (MP4, AVI, etc.)
- 📦 Compactados (ZIP, RAR, etc.)

---

## ⚙️ CONFIGURAÇÕES AVANÇADAS

### **Backend URL** (Desenvolvedor)

Se precisar mudar o backend, edite: `config.js`

```javascript
const BACKEND_HTTP_URL = "https://seu-backend.com";
const BACKEND_WS_URL = "wss://seu-backend.com";
```

Rebuild depois: `npm run build:win`

### **Adicionar Novo Jogo**

Edite: `gameDetection.js`

```javascript
'meu-jogo': {
    processNames: ['MeuJogo.exe'],
    displayName: 'Meu Jogo Favorito'
}
```

---

## 🐛 TROUBLESHOOTING

### **"Lira não detectou o jogo"**

- ✅ Verifique se o processo está rodando (`tasklist`)
- ✅ Confirme o nome exato do `.exe`
- ✅ Use ativação manual se necessário

### **"Vision não está analisando"**

- ✅ Botão 👁️ está roxo?
- ✅ Backend conectado (🟢)?
- ✅ Veja console (`Ctrl+Shift+I`) para erros

### **"Lira não fala"**

- ✅ Verifique volume do sistema
- ✅ ElevenLabs/Minimax configurados no backend?
- ✅ Fallback Google TTS funciona sempre

### **"Companion não conecta"**

- ✅ Backend está online? (Railway)
- ✅ Firewall bloqueando?
- ✅ URL correta no `config.js`?

### **"Modo Corinthians não ativa"**

- ✅ Use ativação manual (console)
- ✅ Título da janela contém "corinthians"?

---

## 💰 CUSTOS (Administrador)

### **Gemini Vision** (Vision mode):

- Grátis até 60 requests/min
- Jogo completo (~90min): ~$0.02

### **ElevenLabs** (TTS):

- Free tier: 10k chars/mês
- 1h gameplay: ~12k chars
- ~50min grátis/mês

### **Minimax** (TTS Backup):

- Trial: $10 créditos grátis
- Pay as you go: ~$0.15/1k chars

**Total estimado**: **~$5-10/mês** para uso moderado

---

## 📊 ESTATÍSTICAS

| Funcionalidade   | Status | Gratuito?           |
| ---------------- | ------ | ------------------- |
| Detecção Auto    | ✅     | ✅                  |
| Gaming HUD       | ✅     | ✅                  |
| Vision Analysis  | ✅     | ⚠️ Gemini key       |
| TTS Google       | ✅     | ✅                  |
| TTS Premium      | ✅     | ❌ Keys necessárias |
| Modo Corinthians | ✅     | ✅                  |
| RPA Cleaner      | ✅     | ✅                  |
| Live2D Avatar    | ✅     | ✅                  |

---

## 🛠️ DESENVOLVIMENTO

### **Tech Stack**:

- **Frontend**: HTML + Vanilla JS + Live2D
- **Desktop**: Electron
- **Backend**: Node.js + Express
- **AI**: Gemini Vision 2.0
- **TTS**: ElevenLabs + Minimax + Google
- **Deploy**: Railway

### **Build Local**:

```bash
git clone https://github.com/Rukafuu/LiraOS
cd LiraCompanion
npm install
npm start
```

### **Build Produção**:

```bash
npm run build:win
# Gera: dist/Lira Companion Setup 1.0.0.exe
```

---

## 🎯 ROADMAP

### **Em Desenvolvimento**:

- [ ] Detecção de eventos via OCR (kills, deaths)
- [ ] OBS integration (auto-clip highlights)
- [ ] Hotkeys globais (Ctrl+Shift+L)
- [ ] Voice commands ("Lira, dica!")
- [ ] Multi-monitor support
- [ ] Stats tracking (win rate, KDA)
- [ ] Live streaming integration

### **Futuro**:

- [ ] Modo "Torcida Organizada" (cânticos)
- [ ] Reconhecimento de jogadores (LOL)
- [ ] Placar em tempo real (futebol)
- [ ] Integração com Discord/Twitch
- [ ] Mobile companion app

---

## 📝 CHANGELOG

### **v1.0.0 - Gaming Copilot Edition** (18/01/2026)

- ✅ Detecção automática de 6 jogos/modos
- ✅ Modo Corinthians com detecção de futebol
- ✅ TTS premium (ElevenLabs + Minimax)
- ✅ Vision context-aware
- ✅ Gaming HUD
- ✅ Railway integration
- ✅ RPA Desktop cleaner
- ✅ Live2D avatar

---

## 💜 CRÉDITOS

**Desenvolvido por**: Rukafuu  
**Time do Coração**: Sport Club Corinthians Paulista 🖤🤍  
**Tecnologias**:

- Electron
- Node.js + Express
- Gemini Vision 2.0
- ElevenLabs + Minimax
- Live2D Cubism

---

## 🤝 SUPORTE

- **Issues**: GitHub Issues
- **Discord**: [Link do servidor]
- **Email**: [email de suporte]

---

## 📜 LICENÇA

MIT License - Uso livre para fins pessoais e educacionais.

---

**VAI CORINTHIANS! 🖤🤍⚽**  
**Bora jogar com a Lira! 🎮💜**
