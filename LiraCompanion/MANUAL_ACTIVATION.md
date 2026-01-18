# 🎮⚽ Lira Companion - Ativação Manual de Modos

Para ativar modos manualmente quando a detecção automática não funcionar:

## ⚽ Modo Corinthians (Assistir Jogos)

**Atalho Rápido:**

1. Abra o Companion
2. Pressione `Ctrl+Shift+I` (abre Developer Tools)
3. Vá na aba **Console**
4. Cole e execute:

```javascript
// Ativar Modo Corinthians
onGameDetected("corinthians-watch", {
  displayName: "⚽ Assistindo Corinthians",
  visionInterval: 8000,
  commentaryStyle: "passionate",
  priority: "MÁXIMA",
});
```

5. A Lira vai dizer: _"Detectei ⚽ Assistindo Corinthians! Vamos jogar? 🎮"_
6. O HUD vai mostrar: **🎮 ⚽ Assistindo Corinthians**
7. Pronto! Agora é só assistir o jogo! 🖤🤍

## 🎮 Modo League of Legends

```javascript
onGameDetected("league-of-legends", {
  displayName: "League of Legends",
  visionInterval: 5000,
  commentaryStyle: "strategic",
});
```

## 🔫 Modo VALORANT

```javascript
onGameDetected("valorant", {
  displayName: "VALORANT",
  visionInterval: 3000,
  commentaryStyle: "tactical",
});
```

## 🎵 Modo osu!

```javascript
onGameDetected("osu", {
  displayName: "osu!",
  visionInterval: 2000,
  commentaryStyle: "energetic",
});
```

## ⛏️ Modo Minecraft

```javascript
onGameDetected("minecraft", {
  displayName: "Minecraft",
  visionInterval: 10000,
  commentaryStyle: "chill",
});
```

## ❌ Desativar Modo Ativo

```javascript
onGameClosed();
```

Isso volta a Lira para o modo idle (30s de intervalo).

## 🔥 Criar Modo Personalizado

```javascript
onGameDetected("meu-modo-custom", {
  displayName: "🎯 Meu Modo",
  visionInterval: 7000, // Intervalo em ms (7 segundos)
  commentaryStyle: "energetic", // ou 'chill', 'strategic', 'tactical', 'passionate'
});
```

## ⚡ Atalhos Úteis

### Verificar modo ativo

```javascript
console.log("Game atual:", currentGame);
console.log("Profile:", currentGameProfile);
```

### Forçar análise imediata

```javascript
// Dispara uma análise de vision agora
startVisionLoop();
```

### Verificar se Vision está ativo

```javascript
console.log("Vision ativo?", visionModeActive);
```

## 🎯 Dicas

- **Sempre ative Vision primeiro** (botão 👁️) antes de ativar um modo
- Use `Ctrl+Shift+I` para abrir/fechar o console rapidamente
- Os comandos funcionam mesmo sem o backend detectar o processo
- Perfeito para assistir streams, vídeos, ou qualquer coisa na tela!

---

**Vai Corinthians! 🖤🤍⚽**
