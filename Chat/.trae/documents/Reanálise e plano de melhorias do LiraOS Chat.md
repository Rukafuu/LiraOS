# Diagnóstico Atual

* Frontend React + Vite com contexts (Tema, Gamificação, Toast) e componentes de chat.

* Streaming via SSE: `services/ai.ts:226` chama `/api/chat/stream`; backend em `backend/server.js:124`.

* Memória: servidor JSON (`backend/memoryStore.js`) + cliente (`services/ai.ts:68`), com heurísticas duplicadas.

* Autenticação: localStorage em `services/userService.ts` (sem hash/sessões de servidor).

* Atalhos: `hooks/useKeyboardManager.ts` cobre novo chat, sidebar, settings, shortcuts e easter‑eggs.

* Modelo de IA no front usa `'mistral' | 'google'` (`components/ChatHeader.tsx:12`), enquanto o backend espera `'mistral' | 'groq'` (`backend/server.js:151,175`).

* Avatar da Lira: atualmente usa `constants.ts:1` (URL remota). Há asset local em `components/assets/lira-pfp.jpeg`.

* Erro reportado: `[plugin:vite:react-babel] App.tsx: Unexpected token (432:0)` próximo a `<Sidebar>` (`App.tsx:454`). Código JSX ali está válido; provável causa:

  1. conflito de importações ou edição parcial anterior; 2) caractere invisível/merge incorreto; 3) import duplicada de `React` ao tentar usar `Suspense`.

# Correções Rápidas (prioridade)

1. Corrigir erro do Babel em `App.tsx`:

   * Garantir uma única importação default de `React` no topo; mover quaisquer `import React, { Suspense }` para a primeira linha (mesclar com a existente).

   * Verificar e remover caracteres invisíveis na região do JSX retornado (`App.tsx:441–468` e `App.tsx:468–501`).

   * Rodar verificação rápida de sintaxe (build local) após ajustes.
2. Alinhar tipos de modelo no front com o backend:

   * Trocar `'google'` por `'groq'` em `components/ChatHeader.tsx:12,13,55,161,183` e em qualquer uso (ex.: `hooks/useChatActions.ts:14`).

   * Manter UI labels (ex.: “Gemini/Groq”) mas enviar `model='groq'` ao backend.
3. Usar avatar local da Lira:

   * Alterar `constants.ts:1` para importar `components/assets/lira-pfp.jpeg` e garantir fallback para `.png` se existir.

# Melhorias Frontend

* Lazy‑load de modais pesados com `React.lazy` e `Suspense` em `App.tsx` (Settings/Store/Dashboard/Shortcuts/Cookies).

* Auto‑scroll com debounce e indicador “pensando” mais preciso em `components/MessageList.tsx`.

* Metadados e acessibilidade nos anexos em `components/ChatInput.tsx` (nome, tipo, tamanho, aria‑labels, erros visíveis).

* Atalhos adicionais úteis em `hooks/useKeyboardManager.ts`:

  * Parar geração (`Cmd/Ctrl + .`), focar input (`Cmd/Ctrl + J`), editar última mensagem (`Cmd/Ctrl + E`), abrir Store (`Cmd/Ctrl + Shift + S`), abrir Dashboard (`Cmd/Ctrl + Shift + D`), alternar modelo (`Cmd/Ctrl + M`).

  * Refletir no `components/ShortcutsModal.tsx`.

* Busca por conteúdo das mensagens no `components/Sidebar.tsx` (título OU texto da conversa).

# Melhorias Backend

* Rate limiting por IP/usuário em `/api/chat/stream` (`backend/server.js:124`), com resposta 429.

* Heartbeats SSE e timeout para conexões ociosas (`backend/server.js:132–136`).

* Unificação da heurística de memórias (compartilhar categorias/tags) entre `backend/intelligentMemory.js` e `services/ai.ts:68`.

* Endpoint `/metrics` com contadores básicos.

# Validação

* Subir dev server (Vite) e backend, testar:

  * Streaming com ambos modelos.

  * Atalhos, lazy‑load, busca no sidebar, anexos com erros.

  * Avatar local renderizando.

* Corrigir qualquer warning/diagnóstico (TypeScript e ESLint).

# Entregáveis

* Ajustes de código em App.tsx (erro Babel), ChatHeader (modelos), constants (avatar local), KeyboardManager/ShortcutsModal (atalhos), Sidebar (busca), MessageList/ChatInput (UX).

