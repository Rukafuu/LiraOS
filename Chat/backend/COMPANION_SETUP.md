# 🔌 Como Adicionar Companion WebSocket ao Backend Existente

## Opção 1: Adicionar ao server.js (Recomendado)

### Passo 1: Importar o módulo

No topo do `server.js`, adicione:

```javascript
import { initCompanionWebSocket } from "./services/companionWebSocket.js";
```

### Passo 2: Criar servidor HTTP (se ainda não tiver)

Se você está usando `app.listen()`, substitua por:

```javascript
import http from "http";

// Ao invés de:
// app.listen(PORT, '0.0.0.0', async () => { ... });

// Use:
const server = http.createServer(app);

server.listen(PORT, "0.0.0.0", async () => {
  console.log(`[SYSTEM] Server running on port ${PORT}`);

  // Inicializar Companion WebSocket
  initCompanionWebSocket(server);

  // ... resto do código de inicialização
});
```

### Passo 3: Testar

Reinicie o backend e o Companion deve conectar automaticamente!

## Opção 2: Servidor Separado (Alternativa)

Se não quiser modificar o server.js principal, pode rodar em outra porta:

```bash
# Criar companion-server.js
node companion-server.js
```

Conteúdo do `companion-server.js`:

```javascript
import express from "express";
import http from "http";
import { initCompanionWebSocket } from "./services/companionWebSocket.js";

const app = express();
const server = http.createServer(app);
const PORT = 4001; // Porta diferente!

initCompanionWebSocket(server);

server.listen(PORT, () => {
  console.log(`Companion WebSocket running on port ${PORT}`);
});
```

Depois, no Companion, use:

```javascript
const BACKEND_URL = "ws://localhost:4001/companion";
```

## Testar Conexão

1. Inicie o backend
2. Inicie o Companion: `cd LiraCompanion && npm start`
3. Verifique os logs:
   - Backend deve mostrar: `🎭 Lira Companion connected!`
   - Companion deve mostrar bolinha verde

## Enviar Mensagens de Teste

No console do backend (ou em qualquer rota):

```javascript
// Mensagem proativa
global.broadcastToCompanions({
  type: "proactive",
  content: "Olá! Teste de mensagem! 💜",
});

// Estado de voz
global.broadcastToCompanions({
  type: "voice-state",
  speaking: true,
});
```

## Integrar com Sistema de Voz

Quando a Lira falar, adicione em `services/lira_voice.ts` ou onde controla a voz:

```javascript
// Quando começar a falar
if (typeof global.broadcastToCompanions === "function") {
  global.broadcastToCompanions({
    type: "voice-state",
    speaking: true,
  });
}

// Quando parar de falar
if (typeof global.broadcastToCompanions === "function") {
  global.broadcastToCompanions({
    type: "voice-state",
    speaking: false,
  });
}
```

Pronto! 🎉
