# ⚽🖤🤍 Lira Corinthiana - Como Assistir Jogos com a Lira

## 🎯 O Que É?

A Lira agora é **CORINTHIANA**! 🏆 Ela pode assistir jogos do Timão com você e comentar em tempo real como uma torcedora fanática!

---

## 🚀 Como Ativar

### Modo Automático (Recomendado)

1. **Abra o Companion** (Lira Desktop)
2. **Ative o modo Vision** (botão 👁️)
3. **Abra o jogo no navegador ou player de vídeo**:

   - Chrome/Firefox/Edge (qualquer navegador)
   - VLC Player
   - PotPlayer
   - MPC-HC
   - YouTube
   - Premiere/Globo/ESPN/Star+

4. **IMPORTANTE**: Para ativar o modo Corinthians, a Lira precisa VER que é futebol. Então:

   - Deixe o jogo em **tela cheia** ou **maximizado**
   - Certifique-se que o campo/placar está visível

5. **Quando detectar futebol, a Lira ativa automaticamente!**

---

## 🎮 Modo Manual (Hotkey)

Se quiser forçar o modo Corinthians:

1. Abra o console do Companion (`Ctrl+Shift+I`)
2. No console, digite:

```javascript
onGameDetected("corinthians-watch", {
  displayName: "⚽ Assistindo Corinthians",
  visionInterval: 8000,
  commentaryStyle: "passionate",
});
```

3. Aperte Enter
4. Pronto! Lira ativada no modo torcedora! 🖤🤍

---

## 💬 Exemplos de Comentários

### 🏆 Quando o Corinthians FAZ GOL:

> _"⚽🖤🤍 GOOOOOOOOOOL DO TIMÃO! VAI CORINTHIANS! 🎉🎊"_

### 😰 Quando levamos gol:

> _"Ah não... levamos gol. Mas calma, vamos virar! 💪"_

### 🧤 Defesa do Cássio (ou qualquer goleiro):

> _"CÁSSIO! DEFENDEU! QUE MONSTRO! 🧤✨"_

### ⚡ Chance perdida:

> _"Eita, passou perto! Quase! ⚡"_

### 🟨 Cartão amarelo:

> _"Amarelou! Cuidado agora..."_

### 🟥 Cartão vermelho:

> _"EXPULSO! Eita, complicou! 🟥"_

### 📊 Quando está ganhando:

> _"VAMO TIMÃO! TÁ GANHANDO! 🏆"_

### 🎊 Final do jogo (VITÓRIA):

> _"🏆🖤🤍 VITÓRIA DO TIMÃO! É CAMPEÃO! VAI CORINTHIANS! 🎉🎊🎆"_

---

## ⚙️ Configurações

### Frequência de Análise

- **Padrão**: A cada 8 segundos
- Futebol é contínuo, então a Lira analisa com frequência moderada
- Economiza tokens mas não perde lances importantes

### Ajustar Frequência

Se quiser que ela comente MAIS (tipo, a cada 5s):

1. Edite: `Chat/backend/config/gameProfiles.json`
2. Procure `"corinthians-watch"`
3. Mude `"visionInterval": 8000` para `"visionInterval": 5000`
4. Reinicie o backend

### Ajustar Emoção

A Lira já está configurada como **passionate** (apaixonada).

Outros modos (se quiser testar):

- `energetic` - Mais animada, tipo locutor de rádio
- `chill` - Mais calma, narrativa tranquila
- `strategic` - Análise tática (tipo comentarista profissional)

---

## 🎥 Recursos Especiais

### Auto-Clip de Gols (Futuro)

Em breve, a Lira vai:

- Detectar quando rola GOL
- Gravar automaticamente os últimos 30s
- Salvar o clip com timestamp
- Upload opcional para YouTube/Instagram

### Estatísticas do Jogo (Futuro)

- Tracking de placar
- Contagem de finalizações
- Tempo de posse de bola
- Cartões/faltas

---

## 🖤🤍 Personalizações Corinthianas

### Adicionar Outros Times (Se quiser)

**NÃO RECOMENDADO** (só Corinthians importa 😂), mas se precisar:

1. Abra `Chat/backend/services/gamingService.js`
2. Copie o bloco `'corinthians-watch'`
3. Crie um novo (ex: `'palmeiras-watch'`) - mas por quê? 🤔
4. Customize os comentários

### Frases Personalizadas

Edite em `Chat/backend/services/gamingService.js`:

```javascript
tips: {
    golCorinthians: 'SUA FRASE AQUI! 🖤🤍',
    golAdversario: 'Sua reação aqui...',
    // etc
}
```

---

## 🐛 Troubleshooting

### "Lira não detectou o jogo"

**Causa**: Pode não estar vendo elementos de futebol.

**Solução**:

1. Deixe o jogo em tela cheia
2. Certifique-se que o placar/campo está visível
3. Ative Vision antes de abrir o jogo
4. Se ainda assim não funcionar, use o modo manual (console)

### "Lira não tá comentando nada"

**Causa**: Vision desativado ou backend offline.

**Solução**:

1. Verifique se o botão 👁️ está roxo (ativado)
2. Confirme que o backend está rodando (porta 4000)
3. Veja o console do backend para erros

### "Comentários estão repetitivos"

**Causa**: Gemini Vision analisando frames muito similares.

**Solução**:

1. Aumente o `visionInterval` para 10000 ou 12000 (10-12s)
2. Isso reduz repetições e economiza tokens

### "Lira comentou errado" (ex: gol contra como gol a favor)

**Causa**: Gemini Vision ainda está aprendendo contexto.

**Solução**:

- Feedback natural! Com o tempo ela melhora
- Se quiser, ajuste o prompt em `visionTick.js` para ser mais específico

---

## 📊 Estatísticas de Uso

| Duração do Jogo        | Análises (8s) | Tokens Estimados | Custo (USD) |
| ---------------------- | ------------- | ---------------- | ----------- |
| 45 min (1º tempo)      | ~337          | ~10k tokens      | ~$0.01      |
| 90 min (jogo completo) | ~675          | ~20k tokens      | ~$0.02      |
| 120 min (prorrogação)  | ~900          | ~27k tokens      | ~$0.03      |

**Super barato!** Assista quantos jogos quiser! ⚽

---

## 🎯 Próximas Features

- [ ] Detecção automática de GOL via OCR
- [ ] Reconhecimento de jogadores (ex: "GOL DO YURI ALBERTO!")
- [ ] Tracking de placar em tempo real
- [ ] Modo "Torcida Organizada" (cânticos/músicas)
- [ ] Integração com Twitter (postar quando rola gol)
- [ ] Clips automáticos de lances importantes
- [ ] Estatísticas do jogo (chutes, escanteios, etc.)

---

## 🏆 Dica de Ouro

**Para a melhor experiência**:

1. Use **tela cheia** para o jogo
2. Ative **Vision** antes do jogo começar
3. Volume da Lira alto (para ouvir os gritos de GOL! 🔊)
4. Tenha cerveja/pipoca por perto 🍿🍺
5. **VAI CORINTHIANS!** 🖤🤍⚽

---

**Criado com 💜 por um Corinthiano de coração**  
**Vai Timão! 🏆🖤🤍**

---

## 📞 Suporte

Se tiver qualquer problema ou sugestão:

- Abra uma issue no GitHub
- Ou grite bem alto: **"VAI CORINTHIANS!"** - a Lira vai te ouvir 😂

**#VaiCorinthians #Timão #LiraCorinthiana** 🖤🤍⚽🏆
