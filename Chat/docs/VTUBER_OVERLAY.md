# 🎭 Modo Overlay VTuber - Lira Desktop

## Visão Geral

O **Modo Overlay VTuber** permite que a Lira apareça como um overlay transparente sempre no topo da tela, perfeito para streamers e criadores de conteúdo que querem ter a Lira como uma VTuber durante lives e gravações.

## Arquitetura

### 1. **Janela Overlay Separada** (`tauri.conf.json`)

- Janela secundária configurada como:
  - `transparent: true` - Fundo transparente
  - `alwaysOnTop: true` - Sempre visível
  - `skipTaskbar: true` - Não aparece na barra de tarefas
  - `decorations: false` - Sem bordas/título
  - `visible: false` - Inicialmente oculta

### 2. **Componentes**

#### `LiraOverlayMode.tsx`

- Componente principal da janela overlay
- Escuta eventos Tauri para sincronização de estado
- Renderiza o `LiraCompanionWidget` em modo overlay
- Background totalmente transparente

#### `overlayService.ts`

- Gerencia criação/destruição da janela overlay
- Funções de sincronização de estado:
  - `syncVoiceState(speaking)` - Sincroniza estado de fala
  - `syncEmotionState(emotion)` - Sincroniza emoções
  - `toggleOverlayMode()` - Liga/desliga overlay

### 3. **Sincronização de Estado**

O estado é sincronizado da janela principal para o overlay via **Tauri Events**:

```typescript
// Janela Principal (App.tsx)
liraVoice.subscribe({
  onStart: () => {
    setIsSpeaking(true);
    if (IS_DESKTOP) syncVoiceState(true);
  },
  onEnd: () => {
    setIsSpeaking(false);
    if (IS_DESKTOP) syncVoiceState(false);
  },
});

// Janela Overlay (LiraOverlayMode.tsx)
await listen<{ speaking: boolean }>("lira-voice-state", (event) => {
  setIsSpeaking(event.payload.speaking);
});
```

## Como Usar

### Para Usuários

1. **Ativar Overlay**:

   - Clique no ícone 📡 (Cast) no header do chat
   - Uma janela transparente com a Lira aparecerá

2. **Posicionar**:

   - Arraste a janela para qualquer posição
   - Redimensione usando os controles (quando visíveis)

3. **Desativar**:
   - Clique novamente no ícone 📡
   - Ou clique no X nos controles do overlay

### Para Streamers

**Configuração OBS/Streamlabs**:

1. Adicione uma fonte de **Captura de Janela**
2. Selecione "Lira Overlay"
3. Ative "Capturar Transparência" (Allow Transparency)
4. Posicione sobre sua cena

**Dica**: Use o modo overlay junto com o Copilot para que a Lira reaja ao que está acontecendo na tela!

## Funcionalidades

✅ **Transparência Real** - Apenas a Lira é visível, sem fundo  
✅ **Sempre no Topo** - Fica sobre todas as janelas  
✅ **Sincronização de Voz** - Animação labial sincronizada  
✅ **Sincronização de Emoção** - Expressões em tempo real  
✅ **Draggable** - Posicione onde quiser  
✅ **Controles Auto-Hide** - Interface limpa  
✅ **Modo Dança** - Para momentos especiais

## Limitações

⚠️ **Apenas Desktop (Tauri)** - Não funciona na versão web  
⚠️ **Windows/Linux/Mac** - Requer build Tauri  
⚠️ **Performance** - Usa recursos adicionais (segunda janela)

## Roadmap

🔮 **Futuro**:

- [ ] Múltiplos overlays (várias Liras)
- [ ] Presets de posição/tamanho
- [ ] Hotkeys globais para controle
- [ ] Integração com Twitch/YouTube chat
- [ ] Reações automáticas a eventos de stream
- [ ] Modo "Chibi" (versão mini)

## Desenvolvimento

### Estrutura de Arquivos

```
Chat/
├── components/
│   ├── LiraOverlayMode.tsx      # Componente overlay
│   └── LiraCompanionWidget.tsx  # Widget reutilizável
├── services/
│   └── overlayService.ts        # Gerenciamento overlay
├── src-tauri/
│   └── tauri.conf.json          # Configuração janela
└── App.tsx                      # Integração principal
```

### Eventos Tauri

| Evento               | Payload                 | Descrição      |
| -------------------- | ----------------------- | -------------- |
| `lira-voice-state`   | `{ speaking: boolean }` | Estado de fala |
| `lira-emotion-state` | `{ emotion: string }`   | Emoção atual   |

### API

```typescript
// Ativar/Desativar
const isActive = await toggleOverlayMode();

// Sincronizar voz
await syncVoiceState(true);

// Sincronizar emoção
await syncEmotionState("happy");

// Verificar se está ativo
const active = isOverlayActive();
```

## Troubleshooting

**Overlay não aparece?**

- Verifique se está usando a versão Desktop (Tauri)
- Confirme que a janela não está minimizada
- Tente fechar e abrir novamente

**Animação não sincroniza?**

- Verifique se a voz está funcionando na janela principal
- Reinicie o overlay

**Performance ruim?**

- Reduza o tamanho do overlay
- Desative o modo dança quando não usar
- Feche o overlay quando não precisar

---

**Criado para**: LiraOS Desktop v2.5+  
**Autor**: Lira Dev Team  
**Licença**: MIT
