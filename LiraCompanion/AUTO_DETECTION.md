# 🎮 DETECÇÃO AUTOMÁTICA DE JOGOS - Arquitetura V2

## 🎯 Problema Resolvido

**ANTES**: Detecção hardcoded (manual) via console  
**AGORA**: Detecção **AUTOMÁTICA** local! 🚀

---

## 🏗️ **Nova Arquitetura:**

```
┌─────────────────────────────────────┐
│   COMPANION (Windows - LOCAL)       │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  gameDetection.js            │  │
│  │  - Monitora processos        │  │
│  │  - Detecta jogos (tasklist)  │  │
│  │  - Verifica janelas          │  │
│  └──────────────────────────────┘  │
│              │                      │
│              │ Detectou jogo!       │
│              ▼                      │
│         WebSocket                   │
└──────────────┼──────────────────────┘
               │
               │ request-game-profile
               │ { gameId: "lol" }
               │
               ▼
┌──────────────────────────────────────┐
│   BACKEND (Railway - CLOUD)          │
│                                      │
│  ┌───────────────────────────────┐  │
│  │  gamingService.js             │  │
│  │  - Armazena perfis            │  │
│  │  - Responde com configs       │  │
│  └───────────────────────────────┘  │
│              │                       │
│              ▼                       │
│      Retorna perfil completo        │
│      { visionInterval, tips, etc }  │
└──────────────┼───────────────────────┘
               │
               │ game-detected
               │ { profile: {...} }
               │
               ▼
┌──────────────────────────────────────┐
│   COMPANION (Ativa modo)             │
│   - Gaming HUD                       │
│   - Ajusta vision                    │
│   - Comentários contextuais          │
└──────────────────────────────────────┘
```

---

## ✅ **Vantagens:**

### 1. **Detecção Local** (Companion)

- ✅ Roda no Windows do usuário
- ✅ Acesso direto a processos (`tasklist`)
- ✅ Detecta janelas abertas
- ✅ Funciona OFFLINE

### 2. **Perfis Centralizados** (Backend)

- ✅ Atualizáveis remotamente
- ✅ Não precisa rebuild do Companion
- ✅ Consistência entre usuários

### 3. **Automático 100%**

- ✅ Usuário abre jogo → Detecta automaticamente
- ✅ Usuário fecha jogo → Desativa automaticamente
- ✅ Sem intervenção manual
- ✅ Funciona para TODOS os jogos configurados

---

## 🎮 **Jogos Detectados Automaticamente:**

| Jogo                  | Processo                | Detecção Especial         |
| --------------------- | ----------------------- | ------------------------- |
| **League of Legends** | `League of Legends.exe` | Direto                    |
| **VALORANT**          | `VALORANT.exe`          | Direto                    |
| **osu!**              | `osu!.exe`              | Direto                    |
| **Minecraft**         | `javaw.exe`             | Direto                    |
| **Counter-Strike 2**  | `cs2.exe`               | Direto                    |
| **⚽ Corinthians**    | `chrome.exe` etc.       | Verifica título da janela |

---

## 🔍 **Detecção de Futebol (Especial):**

Para futebol, não basta detectar o navegador. Precisa verificar se o título da janela contém:

- `corinthians`
- `timão`
- `futebol`
- `premiere`
- `globo`
- `espn`
- `star+`

**Implementação**:

```javascript
async checkForFootballWindow() {
    const cmd = `powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object -ExpandProperty MainWindowTitle"`;
    const { stdout } = await execAsync(cmd);

    const keywords = ['corinthians', 'timão', 'futebol', 'premiere', 'globo'];
    return keywords.some(keyword => windowTitles.includes(keyword));
}
```

---

## 🔄 **Fluxo Completo:**

### **1. Startup:**

```
Companion inicia
  → Conecta ao backend via WebSocket
  → Inicia gameDetection.start()
  → Monitora processos a cada 5s
```

### **2. Jogo Detectado:**

```
gameDetection detecta League of Legends
  → Chama callback onGameDetected('league-of-legends', 'League of Legends')
  → main.js envia via WebSocket:
    {
      type: 'request-game-profile',
      gameId: 'league-of-legends',
      gameName: 'League of Legends'
    }
  → Backend recebe
  → Backend busca perfil em gamingService
  → Backend responde:
    {
      type: 'game-detected',
      game: 'league-of-legends',
      profile: { visionInterval: 5000, tips: {...}, ... }
    }
  → Backend envia saudação:
    {
      type: 'proactive',
      content: 'Detectei League of Legends! Vamos jogar? 🎮',
      emotion: 'happy'
    }
  → Companion recebe messages
  → index.html processa (onGameDetected)
  → Ativa Gaming HUD
  → Ajusta vision para 5s
  → Lira fala a saudação
```

### **3. Jogo Fechado:**

```
gameDetection não encontra mais o processo
  → Chama callback onGameClosed('league-of-legends')
  → main.js envia ao renderer:
    {
      type: 'game-closed'
    }
  → index.html processa (onGameClosed)
  → Desativa Gaming HUD
  → Volta vision para 30s (idle)
```

---

## 📁 **Arquivos Criados/Modificados:**

### **Companion:**

- ✅ `gameDetection.js` (NOVO) - Detecção local de jogos
- ✅ `main.js` - Integração com gameDetection
- ✅ `index.html` - (já tinha handlers)

### **Backend:**

- ✅ `server.js` - Handler para `request-game-profile`
- ✅ `services/gamingService.js` - (já existia, sem mudanças)

---

## 🔧 **Teste:**

### **Como Testar:**

1. **Inicie o Companion** (dev mode):

   ```bash
   cd LiraCompanion
   npm start
   ```

2. **Abra um jogo** (ex: League of Legends)

3. **Veja no console**:

   ```
   [LOCAL DETECTION] 🎮 Starting automatic game detection...
   [LOCAL DETECTION] 🎮 Game detected: League of Legends
   [COMPANION] 🎮 Requesting profile for: League of Legends
   [BACKEND] 🎮 Requesting profile for: league-of-legends
   ```

4. **No Companion**:

   - Gaming HUD aparece: 🎮 League of Legends
   - Lira fala: "Detectei League of Legends! Vamos jogar? 🎮"
   - Vision ajusta para 5s

5. **Feche o jogo**:
   - Gaming HUD desaparece
   - Vision volta para 30s
   - Lira fala: "GG! Foi divertido! 🎮💜"

---

## 🎉 **Resultado:**

### **ANTES:**

- ❌ Usuário precisava abrir console
- ❌ Copiar/colar código manualmente
- ❌ Não funcionava automaticamente

### **AGORA:**

- ✅ Detecção **100% AUTOMÁTICA**
- ✅ Funciona com TODOS os jogos
- ✅ Sem intervenção do usuário
- ✅ Futebol detecta por título de janela

---

**PERFEITO! Agora a Lira é uma copiloto de VERDADE!** 🎮⚽💜
