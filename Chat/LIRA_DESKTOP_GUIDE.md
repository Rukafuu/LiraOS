# 🚀 Lira Desktop - Guia Completo de Funcionalidades

## 📑 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Implementadas](#funcionalidades-implementadas)
3. [Como Usar](#como-usar)
4. [Troubleshooting](#troubleshooting)
5. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

A Lira Desktop é uma versão nativa da Lira que roda diretamente no Windows, sem depender de navegador. Isso permite funcionalidades exclusivas que o SaaS web não pode oferecer.

### Por que Desktop?

- ✅ **Sempre disponível** - Atalho global Alt+L de qualquer lugar
- ✅ **Offline Mode** - Conversas salvas localmente em SQLite
- ✅ **Transparência** - Efeito glassmorphism (vidro fosco)
- ✅ **Clipboard nativo** - Copiar/colar otimizado
- ✅ **Auto-start** - Inicia com o Windows
- ✅ **Sem limites** - Anexar arquivos grandes, processar localmente

---

## ✨ Funcionalidades Implementadas

### 1. **Janela Transparente com Glassmorphism**

A janela tem fundo semi-transparente com blur, criando um efeito de vidro fosco moderno.

**Como funciona:**

- `body { background-color: transparent; }` no CSS
- `transparent: true` no `tauri.conf.json`
- Blur de 20px aplicado no `#root`

**Personalizável:**

```css
/* Em index.css */
#root {
  background: rgba(9, 9, 11, 0.85); /* Ajuste a opacidade aqui */
  backdrop-filter: blur(20px); /* Ajuste o blur aqui */
}
```

---

### 2. **Window Controls Customizados**

Botões Minimize, Maximize/Restore e Close no estilo Windows 11.

**Funcionalidades:**

- ✅ Minimize → Minimiza para barra de tarefas
- ✅ Maximize/Restore → Alterna entre tela cheia e janela
- ✅ Close → Fecha o app (ou minimiza para tray se implementado)
- ✅ Drag region → Arraste a janela pela área superior

**Sincronização de estado:**

- Listener `onResized` mantém o ícone correto
- Funciona com atalhos do Windows (Win+Up, Win+Down)

---

### 3. **Global Shortcut: Alt+L**

Atalho global que funciona mesmo quando o app está em segundo plano.

**Como usar:**

1. Pressione `Alt+L` de qualquer lugar do Windows
2. Se a janela estiver visível → esconde
3. Se estiver escondida → mostra e foca

**Código Rust:**

```rust
app.handle().global_shortcut().register("Alt+L")?;
```

**Adicionar mais atalhos:**

```rust
// Exemplo: Ctrl+Shift+L para screenshot
app.handle().global_shortcut().register("Ctrl+Shift+L")?;
```

---

### 4. **SQLite Local Storage (Offline Mode)**

Banco de dados local que salva conversas mesmo sem internet.

**Localização:**

```
C:\Users\<SEU_USUARIO>\AppData\Roaming\com.liraos.desktop\lira_local.db
```

**Tabelas:**

- `messages` - Todas as mensagens (user + assistant)
- `sessions` - Metadados das conversas

**Como usar no Frontend:**

```typescript
import { saveMessageLocal, getMessagesLocal } from "./services/desktopService";

// Salvar mensagem
await saveMessageLocal("session-123", "user", "Olá Lira!");
await saveMessageLocal("session-123", "assistant", "Olá! Como posso ajudar?");

// Carregar mensagens de uma sessão
const messages = await getMessagesLocal("session-123");
console.log(messages);
// [
//   { role: 'user', content: 'Olá Lira!', timestamp: 1704585600 },
//   { role: 'assistant', content: 'Olá! Como posso ajudar?', timestamp: 1704585601 }
// ]
```

**Auto-save automático:**

```typescript
// No seu handleSendMessage
const handleSendMessage = async (content: string) => {
  const sessionId = currentSessionId || "default";

  // Salva mensagem do usuário
  if (IS_DESKTOP) {
    await autoSaveMessage(sessionId, "user", content);
  }

  // ... envia para backend ...

  // Salva resposta da Lira
  if (IS_DESKTOP && response) {
    await autoSaveMessage(sessionId, "assistant", response);
  }
};
```

**Benefícios:**

- ✅ Conversas funcionam offline
- ✅ Histórico local mesmo se o backend cair
- ✅ Sincronização futura (merge local + cloud)

---

### 5. **Clipboard Manager**

Acesso nativo à área de transferência do Windows.

**Como usar:**

```typescript
import { copyToClipboard, getClipboardText } from "./services/desktopService";

// Copiar texto
await copyToClipboard("Código copiado!");

// Ler clipboard
const text = await getClipboardText();
console.log("Clipboard:", text);
```

**Exemplo prático - Copiar código:**

```typescript
const handleCopyCode = async (code: string) => {
  if (IS_DESKTOP) {
    await copyToClipboard(code);
    addToast("✅ Código copiado!", "success");
  } else {
    // Fallback para web
    navigator.clipboard.writeText(code);
  }
};
```

**Futuro - Clipboard Monitor:**

```typescript
// Detectar quando usuário copia algo
// "Copiou código? Quer que eu explique?"
// "Copiou erro? Quer que eu debugue?"
```

---

### 6. **Auto-Start no Boot**

Lira inicia automaticamente quando você liga o PC.

**Como ativar/desativar:**

```typescript
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

// Ativar
await enable();

// Desativar
await disable();

// Verificar status
const enabled = await isEnabled();
console.log("Auto-start:", enabled);
```

**Configuração:**

- Inicia minimizado (flag `--minimized`)
- Não abre janela automaticamente
- Fica disponível via Alt+L

---

## 🛠️ Como Usar

### Desenvolvimento (Dev Mode)

```bash
# Terminal 1 - Frontend + Tauri
npm run tauri dev

# A janela abre automaticamente
# Hot reload funciona normalmente
```

### Build de Produção (Instalador)

```bash
# 1. Build do frontend
npm run build

# 2. Build do Tauri (gera .exe/.msi)
npm run tauri build

# 3. Instalador gerado em:
# src-tauri/target/release/bundle/msi/Lira Desktop_0.1.0_x64_en-US.msi
```

**⚠️ Problemas com build?**
Se der erro `os error 32` (arquivo em uso):

1. Adicione exclusão no Windows Defender:

   - Abra **Segurança do Windows**
   - **Proteção contra vírus** → **Gerenciar configurações**
   - **Exclusões** → Adicionar pasta
   - `C:\Users\<SEU_USER>\Documents\Lira\Chat\src-tauri\target`

2. Ou rode:

```bash
cargo clean
npm run tauri build
```

---

## 🎨 Personalização

### Ajustar Transparência

```css
/* index.css */
#root {
  background: rgba(9, 9, 11, 0.7); /* Mais transparente */
  /* ou */
  background: rgba(9, 9, 11, 0.95); /* Mais opaco */
}
```

### Ajustar Blur

```css
#root {
  backdrop-filter: blur(30px); /* Mais blur */
  /* ou */
  backdrop-filter: blur(10px); /* Menos blur */
}
```

### Mudar Tamanho Inicial da Janela

```json
// src-tauri/tauri.conf.json
{
  "app": {
    "windows": [
      {
        "width": 1400, // Largura
        "height": 900 // Altura
      }
    ]
  }
}
```

---

## 🐛 Troubleshooting

### Janela não abre transparente

**Causa:** CSS não aplicado ou `transparent: false` no config.

**Solução:**

1. Verifique `tauri.conf.json`: `"transparent": true`
2. Verifique `index.css`: `body { background-color: transparent; }`
3. Reinicie o app

---

### Alt+L não funciona

**Causa:** Permissões não configuradas.

**Solução:**

1. Verifique `src-tauri/capabilities/default.json`:

```json
{
  "permissions": [
    "global-shortcut:allow-register",
    "global-shortcut:allow-is-registered"
  ]
}
```

2. Reinicie o app

---

### Botões de janela não funcionam

**Causa:** Permissões faltando.

**Solução:**
Adicione em `capabilities/default.json`:

```json
{
  "permissions": [
    "core:window:allow-minimize",
    "core:window:allow-maximize",
    "core:window:allow-unmaximize",
    "core:window:allow-close"
  ]
}
```

---

### SQLite não salva mensagens

**Causa:** Comandos Tauri não registrados.

**Solução:**
Verifique `main.rs`:

```rust
.invoke_handler(tauri::generate_handler![
    save_message_local,
    get_messages_local
])
```

---

## 🚀 Próximos Passos

### Funcionalidades Planejadas

#### 1. **System Tray (Bandeja do Sistema)**

- Ícone na bandeja
- Clicar no X → minimiza para tray (não fecha)
- Menu: "Abrir", "Nova Conversa", "Sair"

#### 2. **Screenshot Capture (Ctrl+Shift+L)**

```rust
// Captura tela e envia para análise
app.handle().global_shortcut().register("Ctrl+Shift+L")?;
```

#### 3. **Notificações Nativas**

```typescript
import { sendNotification } from "@tauri-apps/plugin-notification";

await sendNotification({
  title: "Lira",
  body: "Sua análise está pronta!",
});
```

#### 4. **Clipboard Monitor**

Detecta quando você copia algo e oferece ações:

- Código → "Quer que eu explique?"
- Erro → "Quer que eu debugue?"
- URL → "Quer que eu resuma?"

#### 5. **Webcam Access**

Análise de vídeo em tempo real para tutoriais/apresentações.

#### 6. **Local AI Models**

Rodar Llama.cpp localmente para respostas offline.

---

## 📝 Checklist de Implementação

### Integrar no App.tsx

```typescript
import { useEffect } from "react";
import {
  listenForNewChatRequest,
  autoSaveMessage,
} from "./services/desktopService";
import { IS_DESKTOP } from "./src/config";

function App() {
  // 1. Listener para eventos do tray (futuro)
  useEffect(() => {
    if (!IS_DESKTOP) return;

    const unlisten = listenForNewChatRequest(() => {
      handleNewChat();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // 2. Auto-save em cada mensagem
  const handleSendMessage = async (content: string) => {
    if (IS_DESKTOP) {
      await autoSaveMessage(currentSessionId, "user", content);
    }

    // ... lógica de envio ...

    if (IS_DESKTOP && response) {
      await autoSaveMessage(currentSessionId, "assistant", response);
    }
  };

  // 3. Carregar mensagens offline ao abrir sessão
  useEffect(() => {
    if (!IS_DESKTOP || !currentSessionId) return;

    getMessagesLocal(currentSessionId).then((messages) => {
      if (messages.length > 0) {
        console.log("Loaded offline messages:", messages.length);
        // Merge com estado...
      }
    });
  }, [currentSessionId]);
}
```

---

## 🎓 Recursos Adicionais

### Documentação Oficial

- [Tauri v2 Docs](https://v2.tauri.app/)
- [Tauri Plugins](https://v2.tauri.app/plugin/)
- [Rusqlite Docs](https://docs.rs/rusqlite/)

### Arquivos Importantes

```
Chat/
├── src-tauri/
│   ├── src/main.rs              # Lógica Rust
│   ├── Cargo.toml               # Dependências Rust
│   ├── tauri.conf.json          # Configuração do app
│   └── capabilities/default.json # Permissões
├── services/
│   └── desktopService.ts        # API TypeScript
├── src/
│   └── config.ts                # Configuração (IS_DESKTOP, API_URL)
└── index.css                    # Estilos globais (transparência)
```

---

## 💡 Dicas Pro

### 1. Detectar se está rodando no Desktop

```typescript
import { IS_DESKTOP } from "./src/config";

if (IS_DESKTOP) {
  // Usar funcionalidades nativas
  await copyToClipboard(text);
} else {
  // Fallback para web
  navigator.clipboard.writeText(text);
}
```

### 2. Debug no Dev Mode

```bash
# Abrir DevTools
Ctrl+Shift+I (ou F12)

# Ver logs Rust
# Aparecem no terminal onde rodou `npm run tauri dev`
```

### 3. Testar Build sem Instalar

```bash
# Executável direto (sem instalador)
.\src-tauri\target\release\lira-desktop.exe
```

---

## 🎉 Conclusão

A Lira Desktop transforma a experiência de "site" para "assistente sempre presente". Com SQLite local, clipboard nativo e atalhos globais, você tem uma IA que está realmente integrada ao seu sistema.

**Próximo passo:** Quando o build terminar, teste todas as funcionalidades e me avise se encontrar bugs! 🐛

---

_Guia criado em 06/01/2026 - Lira Desktop v0.1.0_
