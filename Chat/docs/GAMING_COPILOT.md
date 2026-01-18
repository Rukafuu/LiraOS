# 🎮 Lira Gaming Copilot - Arquitetura V2

## Visão Geral

Transformar a Lira de uma desktop mate simples em uma **verdadeira copiloto de jogos** com IA, capaz de:

- Detectar automaticamente o jogo que você está jogando
- Ver e entender o que está acontecendo na tela
- Dar dicas, estratégias e comentários em tempo real
- Reagir a eventos do jogo (kills, deaths, victories)
- Criar clips automáticos de momentos épicos
- Fornecer overlay de performance e estatísticas

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    LIRA COMPANION                       │
│                  (Electron Window)                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Live2D     │  │  Stats HUD   │  │  Speech Box  │ │
│  │  Animation   │  │  FPS/Ping    │  │  + Voice     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Gaming Copilot Controller               │   │
│  │  - Game Detection                               │   │
│  │  - Vision Analysis (Gemini)                     │   │
│  │  - Event Detection                              │   │
│  │  - Clip Recording                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└────────────────────┬────────────────────────────────────┘
                     │ IPC
┌────────────────────┴────────────────────────────────────┐
│              BACKEND (Node.js + Python)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────┐  ┌───────────────────────┐  │
│  │  Game Bridge Service │  │  Vision Service       │  │
│  │  - Process Monitor   │  │  - Screenshot OCR     │  │
│  │  - Memory Reading    │  │  - Gemini Analysis    │  │
│  │  - Window Focus      │  │  - Event Recognition  │  │
│  └──────────────────────┘  └───────────────────────┘  │
│                                                         │
│  ┌──────────────────────┐  ┌───────────────────────┐  │
│  │  Clip Service        │  │  LLM Strategy Engine  │  │
│  │  - OBS Integration   │  │  - Context Builder    │  │
│  │  - Instant Replay    │  │  - Tip Generator      │  │
│  │  - Highlight Export  │  │  - Multi-Game Profiles│  │
│  └──────────────────────┘  └───────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Features Detalhadas

### 1. **Game Detection System**

**Como funciona:**

- Monitora processos ativos (e.g., `League of Legends.exe`, `VALORANT.exe`)
- Detecta qual janela está em foco
- Carrega perfil específico do jogo detectado

**Perfis de Jogo:**

```json
{
  "league-of-legends": {
    "processNames": ["League of Legends.exe", "LeagueClient.exe"],
    "visionInterval": 5000,
    "commentaryStyle": "strategic",
    "events": ["kill", "death", "dragon", "baron"],
    "clipDuration": 15
  },
  "valorant": {
    "processNames": ["VALORANT.exe"],
    "visionInterval": 3000,
    "commentaryStyle": "tactical",
    "events": ["ace", "clutch", "plant", "defuse"],
    "clipDuration": 20
  }
}
```

### 2. **Real-Time Vision Analysis**

**Frequência:**

- **Idle**: 30s (economia de tokens)
- **Gaming**: 3-5s (dependendo do jogo)
- **Critical Moment**: 1s (durante combates/clutches)

**Pipeline:**

1. Captura screenshot da janela do jogo
2. Envia para Gemini Vision com prompt específico do jogo
3. Extrai informações relevantes (HP, ammo, score, etc.)
4. Detecta eventos (kill, death, objective)
5. Gera contexto para comentários

**Exemplo de Prompt (League of Legends):**

```
Você é a Lira, uma copiloto de jogos. Analise esta screenshot de League of Legends:
- Qual é o HP/Mana do jogador?
- Há inimigos próximos? Quais?
- Qual é o estado da lane (pushing/freezing)?
- Há oportunidades de gank ou recuo?
- Dê UMA dica curta (máx 15 palavras) se necessário.

Responda em JSON:
{
  "hp": 80,
  "mana": 60,
  "enemies_visible": ["Yasuo"],
  "threat_level": "medium",
  "tip": "Cuidado, Yasuo tem ult pronto!"
}
```

### 3. **Proactive Commentary System**

**Tipos de Comentário:**

| Situação   | Exemplo                            | Frequência          |
| ---------- | ---------------------------------- | ------------------- |
| **Kill**   | "Boaaa! +1! 🔥"                    | Sempre              |
| **Death**  | "Eita, acontece! Vamos recuperar!" | Sempre              |
| **Low HP** | "Cuidado! HP baixo, recua!"        | Quando HP < 20%     |
| **Win**    | "VITÓRIA! GG WP! 🏆"               | Fim de partida      |
| **Lose**   | "Próxima a gente pega! 💪"         | Fim de partida      |
| **Streak** | "RAMPAGE! Você tá ON FIRE! 🔥🔥"   | 3+ kills sem morrer |

**Tom de Voz:**

- Encorajadora, nunca tóxica
- Animada em vitórias
- Solidária em derrotas
- Estratégica quando pedido

### 4. **Event Detection**

**Métodos de Detecção:**

1. **Via OCR** (pytesseract):
   - Ler texto na tela (kill feed, score, timers)
2. **Via Template Matching** (OpenCV):
   - Detectar ícones específicos (dragon, baron, towers)
3. **Via Memory Reading** (opcional, advanced):

   - Ler memória do jogo diretamente (requer permissões)

4. **Via Audio Analysis** (experimental):
   - Detectar sons de kill, death, announcer

### 5. **Clip Creation (OBS Integration)**

**Auto-Clip Triggers:**

- Ace (5 kills em Valorant)
- Pentakill (League)
- Clutch 1v4+
- Baron/Elder steal
- Ranked promotion
- Qualquer momento épico detectado

**Tecnologia:**

- OBS WebSocket API
- Buffer de 15-30s antes do evento
- Salvamento automático com timestamp
- Upload opcional (YouTube/Instagram)

### 6. **Hotkeys & Voice Commands**

**Hotkeys Globais (Electron):**

- `Ctrl + Shift + L` - Ativar/Desativar Lira
- `Ctrl + Shift + V` - Toggle Vision Mode
- `Ctrl + Shift + C` - Criar clip manual
- `Ctrl + Shift + M` - Mute/Unmute Lira

**Voice Commands (STT):**

- "Lira, status" → Mostra HP/Mana/Score
- "Lira, dica" → Gera dica estratégica
- "Lira, clip" → Salva os últimos 30s
- "Lira, silêncio" → Desativa por 5min

---

## 🛠️ Implementação

### Fase 1: Core Gaming Detection ✅

- [ ] Criar `gamingService.js` no backend
- [ ] Detectar processos de jogos ativos
- [ ] Carregar perfis de jogo (JSON)
- [ ] Notificar Companion quando jogo inicia

### Fase 2: Enhanced Vision 🔥

- [ ] Melhorar `visionService.js` para gaming
- [ ] Criar prompts específicos por jogo
- [ ] Implementar análise de eventos
- [ ] Reduzir intervalo durante gameplay

### Fase 3: Proactive Commentary 💬

- [ ] Sistema de templates de comentários
- [ ] Detecção de eventos via Vision
- [ ] Fila de comentários (não spammar)
- [ ] Sincronização de emoções com eventos

### Fase 4: OBS Integration 🎬

- [ ] Instalar `obs-websocket-js`
- [ ] Implementar auto-clip recording
- [ ] Buffer system (ultimos 30s)
- [ ] Upload automático (opcional)

### Fase 5: Advanced Features 🚀

- [ ] Hotkeys globais
- [ ] Voice commands (STT)
- [ ] Game-specific overlays
- [ ] Stats tracking & analytics

---

## 📦 Dependências Novas

```json
{
  "obs-websocket-js": "^5.0.0",
  "tesseract.js": "^5.0.0",
  "screenshot-desktop": "^1.15.0",
  "global-hotkey": "^0.5.0",
  "@google-cloud/speech": "^6.0.0"
}
```

---

## 🎮 Jogos com Suporte Planejado

| Jogo                  | Detecção       | Vision | Events            | Priority |
| --------------------- | -------------- | ------ | ----------------- | -------- |
| **League of Legends** | ✅             | 🔥     | Kill/Death/Obj    | 🔴 High  |
| **Valorant**          | ✅             | 🔥     | Ace/Clutch        | 🔴 High  |
| **Minecraft**         | ✅             | ⚡     | Death/Achievement | 🟡 Med   |
| **Osu!**              | ✅ (já existe) | ⚡     | Combo/FC          | 🟢 Low   |
| **CS2**               | ⏳             | 🔥     | Ace/Bomb          | 🟡 Med   |
| **Overwatch**         | ⏳             | 🔥     | POTG/Ult          | 🟢 Low   |

---

## 🎯 Próximos Passos Imediatos

1. **Hoje**: Criar `gamingService.js` com detecção de processos
2. **Hoje**: Melhorar vision interval durante jogos
3. **Amanhã**: Sistema de comentários proativos
4. **Semana**: OBS integration para clips

---

**Status**: 🚧 Em Desenvolvimento  
**ETA para V1**: 3-5 dias  
**Última Atualização**: 2026-01-18
