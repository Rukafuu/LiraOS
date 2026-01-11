# 🎭 Lira Desktop Companion - JARVIS Edition

> Sua companheira AI proativa com monitoramento de sistema em tempo real!

## 🌟 Features

### 💜 Companheira Visual

- ✅ Live2D VTuber Model (Lira completa!)
- ✅ Animações de fala sincronizadas
- ✅ Expressões emocionais
- ✅ Transparência real
- ✅ Always on top
- ✅ Draggable

### 🤖 Monitoramento JARVIS

- 📊 **CPU Usage** - Monitora uso do processador
- 💾 **RAM Usage** - Acompanha memória
- ⚠️ **Alertas Proativos**:
  - "CPU está em 85%! Tá pesado aí, né?"
  - "Memória RAM em 90%! Fecha umas abas!"
  - "Tudo tranquilo! CPU: 25%, RAM: 45%"

### 🔗 Conectividade

- 🌐 WebSocket com backend
- 📡 Recebe mensagens proativas
- 🎤 Sincronização de voz
- 💬 Integração com chat principal

## 🚀 Como Usar

### Passo 1: Iniciar Backend Companion

```bash
cd c:\Users\conta\Documents\Lira\Chat\backend
node companion-server.js
```

### Passo 2: Iniciar Companion App

```bash
cd c:\Users\conta\Documents\Lira\LiraCompanion
npm start
```

### Passo 3: Aproveitar!

A Lira vai aparecer no canto da tela e começar a monitorar seu sistema!

## 🎮 Controles

**Hover sobre a Lira** - Mostra controles

- **🖱️** - Toggle click-through (atravessar cliques)
- **📊** - Toggle stats overlay
- **💬** - Abrir chat completo
- **➖** - Minimizar para tray
- **✕** - Fechar

**Click na Lira** - Frases aleatórias e interação

**System Tray** - Clique no ícone da bandeja para mostrar/esconder

## 📊 Sistema de Monitoramento

### Intervalos

- Stats update: **3 segundos**
- Backend sync: **5 segundos**
- Proactive messages: **30 segundos**

### Alertas

| Condição   | Threshold          | Mensagem              |
| ---------- | ------------------ | --------------------- |
| CPU Alta   | >80%               | ⚠️ CPU está em X%!    |
| RAM Alta   | >85%               | 💾 Memória RAM em X%! |
| Sistema OK | CPU<30% && RAM<50% | ✨ Tudo tranquilo!    |

## 🔧 Configuração

### Backend URL

Por padrão: `ws://localhost:4001/companion`

Para mudar:

```bash
set BACKEND_URL=ws://seu-servidor.com/companion
npm start
```

### Tamanho da Janela

Edite `main.js`:

```javascript
width: 300,  // Largura
height: 400, // Altura
```

### Intervalo de Monitoramento

Edite `index.html`:

```javascript
systemMonitor.start(3000); // 3 segundos
```

## 📡 Mensagens WebSocket

### Recebidas do Backend

```json
{
  "type": "proactive",
  "content": "Mensagem da Lira",
  "emotion": "happy"
}
```

```json
{
  "type": "voice-state",
  "speaking": true
}
```

### Enviadas ao Backend

```json
{
  "type": "system-stats",
  "stats": {
    "cpu": { "usage": 45, "cores": 8 },
    "ram": { "usage": 60, "total": "16.00" }
  }
}
```

```json
{
  "type": "system-alert",
  "alert": {
    "type": "warning",
    "content": "CPU está em 85%!",
    "emotion": "worried"
  }
}
```

## 🎨 Personalização

### Mudar Posição Inicial

Edite `main.js`:

```javascript
x: width - 320,  // Distância da direita
y: height - 420, // Distância de baixo
```

### Desabilitar Monitoramento

Comente em `index.html`:

```javascript
// systemMonitor.start(3000);
```

### Mudar Frases

Edite `index.html`, array `phrases`:

```javascript
const phrases = [
  "Sua frase aqui!",
  "Outra frase legal!",
  // ...
];
```

## 🐛 Troubleshooting

**Lira não aparece?**

- Verifique se o modelo foi copiado: `LiraCompanion/assets/model/lira/`
- Olhe o console do Electron para erros

**Stats não atualizam?**

- Verifique se `systemMonitor.js` existe
- Olhe o console para erros de permissão

**Não conecta ao backend?**

- Certifique-se que `companion-server.js` está rodando
- Verifique a porta 4001
- Olhe logs do servidor

**Performance ruim?**

- Aumente intervalo de monitoramento (5000ms+)
- Reduza tamanho da janela
- Desative stats overlay

## 🚀 Build para Distribuição

```bash
npm run build:win
```

Instalador será criado em `dist/`

## 📝 Próximas Features

- [ ] Detecção de processos (jogos, apps)
- [ ] Notificações do Windows
- [ ] Comandos de voz
- [ ] Integração com Spotify
- [ ] Reações a eventos do sistema
- [ ] Modo "Foco" (sem distrações)
- [ ] Temas customizáveis
- [ ] Múltiplas Liras (squad mode)

## 💡 Dicas

1. **Para Streamers**: Use com OBS Window Capture + Allow Transparency
2. **Para Trabalho**: Ative click-through e deixe stats visíveis
3. **Para Jogos**: Minimize para tray durante gameplay intenso
4. **Para Coding**: Deixe ela te avisar quando CPU/RAM ficarem altos

---

**Versão**: 1.0.0 JARVIS Edition  
**Criado**: 2026-01-08  
**Licença**: MIT
