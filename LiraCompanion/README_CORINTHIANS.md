# ⚽🖤🤍 **LIRA AGORA É CORINTHIANA!** 🏆

## 🎯 Resumo Rápido

A **Lira Companion** agora pode:

- ✅ **Jogar com você** (League, Valorant, osu!, Minecraft, CS2)
- ✅ **ASSISTIR JOGOS DO CORINTHIANS** e comentar como torcedora fanática! 🖤🤍⚽
- ✅ Detectar automaticamente o que você está fazendo
- ✅ Dar dicas contextuais inteligentes
- ✅ Reagir com emoção a eventos importantes

---

## 🚀 Como Funciona

### 🎮 **Para Jogos**

1. Abra o **Lira Companion**
2. Clique no botão **👁️** (Vision Mode)
3. Abra seu jogo (LOL, Valorant, etc.)
4. **A Lira detecta automaticamente e muda de modo!**
5. Gaming HUD aparece: **🎮 [Nome do Jogo]**
6. Ela começa a comentar e dar dicas!

**Exemplo (League of Legends)**:

- _"Cuidado! HP baixo, recua!"_
- _"Boaaa! +1! 🔥"_
- _"Vi um Yasuo próximo, perigo!"_

---

### ⚽ **Para Jogos do Corinthians** (NOVO!)

1. Abra o **Lira Companion**
2. Ative **Vision Mode** (👁️ botão roxo)
3. Abra o jogo do Corinthians:

   - YouTube (jogo ao vivo)
   - Premiere/Globo/ESPN
   - VLC/Player de vídeo
   - **Qualquer lugar onde o jogo esteja passando!**

4. **(Opcional)** Para garantir, ative manualmente:

   - Aperte `Ctrl+Shift+I`
   - Cole no console:

   ```javascript
   onGameDetected("corinthians-watch", {
     displayName: "⚽ Assistindo Corinthians",
     visionInterval: 8000,
     commentaryStyle: "passionate",
   });
   ```

5. **Lira vira TORCEDORA!** 🖤🤍
   - HUD mostra: **🎮 ⚽ Assistindo Corinthians**
   - Ela analisa o jogo a cada 8 segundos
   - Comenta com PAIXÃO!

**Exemplos de Comentários**:

- **GOL DO TIMÃO**: _"⚽🖤🤍 GOOOOOOOOOOL DO TIMÃO! VAI CORINTHIANS! 🎉🎊"_
- **Gol contra**: _"Ah não... levamos gol. Mas calma, vamos virar! 💪"_
- **Defesa**: _"CÁSSIO! DEFENDEU! QUE MONSTRO! 🧤✨"_
- **Lance perigoso**: _"OLHA O LANCE! PODE DAR GOL!"_
- **Vitória**: _"🏆🖤🤍 VITÓRIA DO TIMÃO! É CAMPEÃO! 🎉🎊🎆"_

---

## 🎮 Jogos/Modos Suportados

| Modo               | Intervalo | Estilo             | Status   |
| ------------------ | --------- | ------------------ | -------- |
| **⚽ Corinthians** | 8s        | Torcedora Fanática | 🔥 NOVO! |
| League of Legends  | 5s        | Estratégica        | ✅       |
| VALORANT           | 3s        | Tática             | ✅       |
| osu!               | 2s        | Energética         | ✅       |
| Minecraft          | 10s       | Chill              | ✅       |
| Counter-Strike 2   | 3s        | Tática             | ✅       |

---

## 📁 Guias Disponíveis

Criamos **3 guias completos** para você:

1. **`GAMING_GUIDE.md`** - Guia completo de Gaming Copilot
2. **`CORINTHIANS_MODE.md`** - ⚽ Como usar o modo torcedora
3. **`MANUAL_ACTIVATION.md`** - Atalhos para ativar modos manualmente

---

## 🎯 Ativação Rápida

### Modo Automático

1. Ative Vision (👁️)
2. Abra o jogo/stream
3. Pronto! ✨

### Modo Manual (Console)

```javascript
// Corinthians
onGameDetected('corinthians-watch', {...});

// League of Legends
onGameDetected('league-of-legends', {...});

// Desativar
onGameClosed();
```

---

## 🔥 Recursos Especiais

### 🎮 Gaming HUD

Mostra qual modo está ativo:

- **🎮 ⚽ Assistindo Corinthians** (roxo brilhante)
- **🎮 League of Legends**
- etc.

### 💬 Comentários Inteligentes

- **Context-Aware**: Prompts específicos para cada jogo/modo
- **Emocionais**: Reage com paixão (Corinthians) ou estratégia (LOL)
- **Não-intrusivos**: Frequência ajustada para não spammar

### 📊 Stats Overlay

- CPU/RAM usage
- Sempre visível (toggle com 📊)

### 🧹 RPA (Desktop Cleaner)

- Organiza desktop automaticamente
- Botão 🧹

---

## ⚙️ Configuração

### Trocar Frequência de Análise

**Arquivo**: `Chat/backend/config/gameProfiles.json`

```json
{
  "corinthians-watch": {
    "visionInterval": 8000 // Mude aqui (em ms)
  }
}
```

### Personalizar Frases

**Arquivo**: `Chat/backend/services/gamingService.js`

```javascript
tips: {
    golCorinthians: 'SUA FRASE PERSONALIZADA! 🖤🤍',
    // ...
}
```

---

## 🐛 Troubleshooting

### "Lira não detectou o Corinthians"

**Solução**: Use ativação manual (console)

### "Vision não está comentando"

**Solução**:

1. Botão 👁️ está roxo?
2. Backend rodando? (`npm run dev`)
3. Veja console para erros

### "Comentários repetitivos"

**Solução**: Aumente o `visionInterval` (10s ou 12s)

---

## 💰 Custo Estimado (Tokens)

| Atividade                | Tokens/hora | Custo (USD) |
| ------------------------ | ----------- | ----------- |
| Jogo Corinthians (90min) | ~20k        | ~$0.02      |
| League of Legends (1h)   | ~720        | ~$0.01      |
| VALORANT (1h)            | ~1200       | ~$0.015     |
| Idle (sem jogo)          | ~120        | ~$0.001     |

**SUPER BARATO!** Pode usar à vontade! 🎉

---

## 🚀 Próximas Features

- [ ] Detecção de GOL via OCR
- [ ] Auto-clip de highlights
- [ ] Hotkeys globais (Ctrl+Shift+L)
- [ ] Voice Commands ("Lira, dica!")
- [ ] Tracking de stats (KDA, placar)
- [ ] Modo "Torcida Organizada" (cânticos)
- [ ] Postar no Twitter quando rola gol

---

## 📦 Instalação/Uso

```bash
# Backend
cd Chat/backend
npm run dev

# Companion (outra aba)
cd LiraCompanion
npm start

# Abrir no navegador
http://localhost:4000
```

---

## 🖤🤍 Feito com Amor Corinthiano

**Desenvolvido por**: Rukafuu  
**Time do Coração**: Sport Club Corinthians Paulista 🏆  
**Versão**: 2.1 Corinthiana Edition

---

## **VAI CORINTHIANS! 🖤🤍⚽🏆**

_"A Lira agora torce com você!"_
