# 🌐 Configuração do Backend - Lira Companion

## 📝 Como Configurar

O Lira Companion agora suporta **localhost** E **Railway** (produção)!

### **Opção 1: Editar config.js** (Recomendado)

1. Abra: `LiraCompanion/config.js`
2. Substitua as URLs do Railway pelas suas:

```javascript
const BACKEND_HTTP_URL =
  process.env.BACKEND_URL ||
  (isDev ? "http://127.0.0.1:4000" : "https://SEU-PROJETO.up.railway.app"); // ← MUDE AQUI

const BACKEND_WS_URL =
  process.env.BACKEND_WS_URL ||
  (isDev ? "ws://127.0.0.1:4000" : "wss://SEU-PROJETO.up.railway.app"); // ← MUDE AQUI
```

3. Rebuild: `npm run build:win`

---

### **Opção 2: Variáveis de Ambiente** (Avançado)

Defina antes de rodar:

```bash
# Windows PowerShell
$env:BACKEND_URL="https://seu-projeto.up.railway.app"
$env:BACKEND_WS_URL="wss://seu-projeto.up.railway.app"
npm run build:win

# Linux/Mac
export BACKEND_URL="https://seu-projeto.up.railway.app"
export BACKEND_WS_URL="wss://seu-projeto.up.railway.app"
npm run build:win
```

---

## 🚀 Como Funciona

### Desenvolvimento (NODE_ENV != production):

- HTTP: `http://127.0.0.1:4000`
- WebSocket: `ws://127.0.0.1:4000/companion`

### Produção (NODE_ENV === production):

- HTTP: URL configurado em `config.js`
- WebSocket: URL configurado em `config.js`

---

## ✅ Testando

### Localhost:

```bash
cd LiraCompanion
npm start
```

Deve conectar em `http://127.0.0.1:4000`

### Railway (Build de Produção):

1. Configure `config.js` com URL do Railway
2. Build: `npm run build:win`
3. Instale o `.exe` gerado
4. Deve conectar ao Railway automaticamente!

---

## 🔍 Verificar Conexão

Ao abrir o Companion, pressione `Ctrl+Shift+I` e veja no console:

```
[CONFIG] Backend HTTP: https://seu-projeto.up.railway.app
[CONFIG] Backend WS: wss://seu-projeto.up.railway.app
✅ Connected to Lira Backend!
```

Se aparecer `❌ Disconnected`, verifique:

- URL do Railway está certa?
- Backend está online?
- Firewall/CORS configurado?

---

## 📦 Builds

### Build Local (Dev):

```bash
npm start
```

Usa localhost automaticamente.

### Build Produção:

```bash
NODE_ENV=production npm run build:win
```

Usa URLs configuradas em `config.js`.

---

## 🌐 URLs do Railway

Para encontrar sua URL do Railway:

1. Acesse: https://railway.app
2. Vá em seu projeto (LiraOS Backend)
3. Aba **Settings** → **Domains**
4. Copie a URL (ex: `liraos-production.up.railway.app`)
5. Cole em `config.js`:
   - HTTP: `https://liraos-production.up.railway.app`
   - WS: `wss://liraos-production.up.railway.app`

---

**Pronto! Agora o Companion funciona tanto local quanto em produção!** 🎉
