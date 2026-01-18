# 🎮 Lira Gaming Copilot - Guia Rápido

## 🚀 Como Usar

### 1. Abra o Lira Companion

- Execute o Companion (Electron app)
- A Lira aparecerá na tela

### 2. Abra um Jogo Suportado

Jogos detectados automaticamente:

- **League of Legends** (LOL, LoL Client)
- **VALORANT**
- **osu!**
- **Minecraft**
- **Counter-Strike 2**

### 3. Ative o Modo Visão

- Clique no botão 👁️ nos controles do Companion
- A Lira dirá: _"Ativando meus olhos digitais!"_

### 4. Jogue Normalmente!

A Lira irá:

- **Detectar qual jogo você está jogando** 🎮
- **Ver sua tela em intervalos inteligentes**:
  - League/Valorant: A cada 3-5 segundos
  - Minecraft: A cada 10 segundos
  - Idle (sem jogo): A cada 30 segundos
- **Dar dicas contextuais** baseadas no que ela vê
- **Reagir a eventos** (kills, deaths, objectives)
- **Encorajar você** durante o gameplay

---

## 🎯 Exemplos de Comentários

### League of Legends

- _"Cuidado! HP baixo, recua!"_ (quando HP < 20%)
- _"Boaaa! +1! 🔥"_ (quando mata inimigo)
- _"Vi um Yasuo próximo, cuidado com a ult!"_

### VALORANT

- _"ACE! VOCÊ É UM DEMÔNIO! 👹🔥"_
- _"Eliminou! Continua!"_
- _"HP baixo, procura cover!"_

### osu!

- _"FULL COMBO! VOCÊ É INSANO! ⭐✨"_
- _"Ish, quebrou! Mas continua!"_
- _"Tá indo muito bem! Keep going!"_

### Minecraft

- _"Achievement desbloqueado! Nice! 🏆"_
- _"Cuidado! Tem creepers por perto!"_
- _"HP baixo, come alguma coisa!"_

---

## ⚙️ Indicadores Visuais

### Gaming HUD (canto superior direito)

Quando um jogo é detectado, aparece:

```
🎮 League of Legends
```

Com efeito de pulse roxo/azul.

### Status Indicator (canto superior direito, ao lado do HUD)

- 🔴 Vermelho: Desconectado do backend
- 🟢 Verde: Conectado e funcionando

### Vision Button

- Normal (cinza): Vision desativado
- **Roxo brilhante**: Vision ativado

---

## 🎨 Personalização

### Adicionar Novo Jogo

1. Abra: `Chat/backend/config/gameProfiles.json`
2. Adicione o perfil:

```json
{
  "meu-jogo": {
    "displayName": "Meu Jogo Favorito",
    "processNames": ["MeuJogo.exe"],
    "windowTitles": ["Meu Jogo"],
    "visionInterval": 5000,
    "commentaryStyle": "energetic",
    "events": ["win", "lose", "score"],
    "clipDuration": 15,
    "priority": "high",
    "tips": {
      "win": "VITÓRIA! GG! 🏆",
      "lose": "Próxima a gente pega!",
      "score": "Nice score! Continue assim!"
    }
  }
}
```

3. Reinicie o backend
4. A Lira detectará automaticamente!

---

## 🔥 Recursos Avançados

### Click-Through Mode

- Ativa: 🖱️ → 👓
- Permite clicar "através" do Companion
- Útil durante gameplay intenso

### Stats Overlay

- Mostra CPU/RAM usage
- Toggle com botão 📊

### Desktop Cleanup (RPA)

- Botão 🧹
- Organiza arquivos do desktop automaticamente

---

## 🐛 Troubleshooting

### "Jogo não detectado"

**Solução:**

1. Verifique se o jogo está na lista de processos (`tasklist`)
2. Confirme o nome exato do `.exe`
3. Adicione manualmente ao `gameProfiles.json`

### "Vision não está analisando"

**Solução:**

1. Verifique se o botão 👁️ está roxo (ativado)
2. Confirme que o backend está rodando (porta 4000)
3. Veja o console do Companion (`Ctrl+Shift+I`) para erros

### "Lira não fala"

**Solução:**

1. Verifique se `MINIMAX_API_KEY` está configurado
2. Confirme que o TTS service está funcionando
3. Teste no chat principal primeiro

### "Companion não conecta ao backend"

**Solução:**

1. Inicie o backend: `cd Chat/backend && npm run dev`
2. Verifique se a porta 4000 está livre
3. Olhe o console do backend para erros

---

## 📊 Estatísticas de Performance

| Jogo              | Intervalo Vision | Tokens/hora (estimado) | Performance Impact |
| ----------------- | ---------------- | ---------------------- | ------------------ |
| League of Legends | 5s               | ~720 requests          | Baixo              |
| VALORANT          | 3s               | ~1200 requests         | Médio              |
| osu!              | 2s               | ~1800 requests         | Médio-Alto         |
| Minecraft         | 10s              | ~360 requests          | Muito Baixo        |
| Idle (sem jogo)   | 30s              | ~120 requests          | Mínimo             |

**Dica**: Para economizar tokens, desative Vision quando não precisar de comentários.

---

## 🎯 Próximas Features (Roadmap)

- [ ] **Detecção de Eventos** (kills, deaths, wins via OCR)
- [ ] **OBS Integration** (auto-clip de highlights)
- [ ] **Hotkeys Globais** (Ctrl+Shift+L para ativar/desativar)
- [ ] **Voice Commands** ("Lira, dica!" / "Lira, clip!")
- [ ] **Multi-Monitor Support**
- [ ] **Game-Specific Overlays** (HP bars, timers)
- [ ] **Stats Tracking** (Win rate, KDA, etc.)
- [ ] **Live Streaming Integration** (Twitch/YouTube chat reactions)

---

## 💜 Créditos

**Desenvolvido por**: Rukafuu  
**Tecnologias**:

- Electron (Companion Desktop App)
- Node.js + Express (Backend)
- Gemini Vision (AI Analysis)
- Live2D (Lira Avatar)
- Minimax (TTS Voice)

**Versão**: 2.0 Gaming Copilot Edition  
**Última Atualização**: 2026-01-18

---

**Bora jogar com a Lira! 🎮💜**
