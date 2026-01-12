# 🎮 Discord Rich Presence - Guia de Configuração

## ⚠️ Importante: Rich Presence só funciona LOCALMENTE

O Discord Rich Presence **NÃO funciona** no servidor Railway (produção) porque:

- Precisa se conectar ao Discord Desktop rodando na **mesma máquina**
- Usa IPC (Inter-Process Communication) local
- Railway é um servidor remoto sem acesso ao seu Discord

## ✅ Como Fazer Funcionar

### Opção 1: Rodar Backend Localmente (Recomendado para Dev)

1. **Clone o repositório** (se ainda não tem):

```bash
git clone https://github.com/Rukafuu/LiraOS
cd LiraOS/Chat/backend
```

2. **Configure as variáveis de ambiente** (`.env`):

```env
NODE_ENV=development
DISCORD_CLIENT_ID=seu_application_id_aqui
DISCORD_APPLICATION_ID=seu_application_id_aqui
```

3. **Rode o backend localmente**:

```bash
npm install
npm run dev
```

4. **Abra o Discord Desktop** na mesma máquina

5. **Aguarde** ~15 segundos e o Rich Presence deve aparecer!

---

### Opção 2: Desktop App (Tauri) - FUTURO

Quando rodar a versão Desktop (Tauri) do LiraOS, o Rich Presence funcionará automaticamente porque:

- O app roda localmente
- Tem acesso direto ao Discord
- Não depende do servidor

---

## 🎨 Configurar Imagens no Discord Dev Portal

Para as imagens aparecerem no Rich Presence:

1. Acesse: https://discord.com/developers/applications
2. Selecione sua aplicação
3. Vá em **Rich Presence** → **Art Assets**
4. Faça upload das imagens:

   - `lira_logo` - Logo principal da Lira (512x512)
   - `coding` - Ícone pequeno de código (256x256)

5. Aguarde ~15 minutos para as imagens propagarem

---

## 🐛 Troubleshooting

### Rich Presence não aparece?

**Checklist:**

- [ ] Discord Desktop está aberto?
- [ ] Backend rodando **localmente** (não no Railway)?
- [ ] `DISCORD_CLIENT_ID` configurado no `.env`?
- [ ] `NODE_ENV` está como `development` (não `production`)?
- [ ] Aguardou 15-30 segundos após iniciar?

**Logs para verificar:**

```
[RPC] 🎮 Rich Presence active for user: SeuNome
[RPC] ✅ Activity updated successfully
```

Se ver:

```
[RPC] ❌ Failed to connect to local Discord client
```

= Discord não está aberto ou não está na mesma máquina

---

## 📊 O que aparece no Rich Presence

Quando funcionando, mostra:

- **Detalhes:** "💻 Pair Programming with Lira"
- **Estado:** "🚀 Building the Future"
- **Tempo:** Quanto tempo está usando
- **Botões:**
  - 🌐 Visit LiraOS (link para o site)
  - ⭐ GitHub (repositório)

---

## 🔮 Futuro: Rich Presence Dinâmico

Planejado para mostrar:

- Arquivo atual sendo editado
- Linguagem de programação
- Modo ativo (Chat, L.A.P, Gamer, etc.)
- Estatísticas de uso

---

**Desenvolvido com ❤️ para LiraOS**
