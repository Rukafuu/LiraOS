# 🔗 Backend Integration Guide

## WebSocket Endpoint

O Companion precisa de um endpoint WebSocket no backend para comunicação em tempo real.

### Criar Endpoint no Backend

Adicione em `backend/server.js`:

```javascript
const WebSocket = require("ws");

// WebSocket Server para Companion
const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
  console.log("🎭 Lira Companion connected!");

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: "welcome",
      message: "Connected to Lira Backend!",
    })
  );

  // Handle messages from companion
  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      console.log("Message from companion:", message);

      // Handle different message types
      if (message.type === "chat") {
        // Process chat message
        handleCompanionChat(message, ws);
      }
    } catch (e) {
      console.error("Failed to parse companion message:", e);
    }
  });

  ws.on("close", () => {
    console.log("Companion disconnected");
  });
});

// Upgrade HTTP to WebSocket
server.on("upgrade", (request, socket, head) => {
  if (request.url === "/companion") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  }
});

// Broadcast to all companions
function broadcastToCompanions(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Export for use in other modules
module.exports.broadcastToCompanions = broadcastToCompanions;
```

### Integrar com Voice System

Em `services/lira_voice.ts`, adicione broadcast:

```javascript
// Quando a voz começar
onStart: () => {
  broadcastToCompanions({
    type: "voice-state",
    speaking: true,
  });
};

// Quando a voz terminar
onEnd: () => {
  broadcastToCompanions({
    type: "voice-state",
    speaking: false,
  });
};
```

### Mensagens Proativas

Para enviar mensagens proativas ao companion:

```javascript
// Em qualquer lugar do backend
const { broadcastToCompanions } = require("./server");

broadcastToCompanions({
  type: "proactive",
  content: "Oi! Você está aí há muito tempo, quer fazer uma pausa?",
  emotion: "caring",
});
```

### Atualizar URL no Companion

No `main.js` do companion, atualize:

```javascript
const BACKEND_URL = process.env.BACKEND_URL || "ws://localhost:4000/companion";
```

## Message Types

### Backend → Companion

```javascript
// Voice State
{
    type: 'voice-state',
    speaking: boolean
}

// Emotion Change
{
    type: 'emotion',
    emotion: 'happy' | 'sad' | 'excited' | 'neutral' | 'caring'
}

// Proactive Message
{
    type: 'proactive',
    content: string,
    emotion?: string,
    duration?: number  // ms to show
}

// Notification
{
    type: 'notification',
    title: string,
    body: string,
    icon?: string
}
```

### Companion → Backend

```javascript
// Chat Message
{
    type: 'chat',
    message: string,
    userId: string
}

// Status Update
{
    type: 'status',
    status: 'active' | 'idle' | 'away'
}

// Interaction
{
    type: 'interaction',
    action: 'click' | 'drag' | 'minimize'
}
```

## Testing

1. Start backend with WebSocket support
2. Run companion: `npm run dev`
3. Check console for connection status
4. Test sending messages from backend console:

```javascript
broadcastToCompanions({
  type: "proactive",
  content: "Hello from backend!",
});
```

## Production

Para produção, use WSS (WebSocket Secure):

```javascript
const BACKEND_URL = "wss://seu-backend.railway.app/companion";
```

Certifique-se que o Railway/servidor suporta WebSocket upgrades.
