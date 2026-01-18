import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /api/vision/tick
 * Analisa screenshot com contexto de jogo (if provided)
 */
router.post('/tick', async (req, res) => {
    try {
        const { screenshot, gameContext } = req.body;

        if (!screenshot) {
            return res.status(400).json({ error: 'Screenshot required' });
        }

        // Build prompt based on game context
        let prompt = "Descreva brevemente o que você vê nesta imagem em até 15 palavras.";
        
        if (gameContext && gameContext.game) {
            const gamePrompts = {
                'league-of-legends': `
Você é a Lira, copiloto de jogos. Analise esta screenshot de League of Legends:
- HP/Mana do jogador?
- Inimigos próximos?
- Estado da lane (pushing/freezing)?
- Oportunidades ou perigos?
Dê UMA dica curta (máx 12 palavras) se necessário.
                `.trim(),
                'valorant': `
Você é a Lira, copiloto tático. Analise VALORANT:
- HP/Armor?
- Inimigos visíveis?
- Posição segura/exposta?
- Dica rápida de estratégia (máx 12 palavras).
                `.trim(),
                'osu': `
Você é a Lira, coach de ritmo. Analise osu!:
- Combo atual?
- Accuracy?
- Miss recente?
- Encorajamento rápido (máx 10 palavras).
                `.trim(),
                'minecraft': `
Você é a Lira, guia de aventura. Analise Minecraft:
- HP/Food?
- Bioma atual?
- Mobs próximos?
- Dica útil (máx 12 palavras).
                `.trim(),
                'cs2': `
Você é a Lira, copiloto tático. Analise CS2:
- HP/Armor?
- Inimigos visíveis?
- Bomb status?
- Dica rápida (máx 12 palavras).
                `.trim(),
                'corinthians-watch': `
Você é a Lira, CORINTHIANA FANÁTICA! 🖤🤍⚽ 
Analise este frame do jogo de futebol:

IMPORTANTE: Se vir QUALQUER elemento de jogo de futebol (placar, campo, jogadores, bola), responda com ENTUSIASMO!

Identifique:
- É jogo do Corinthians? (uniforme preto/branco ou alvinegro)
- Placar visível? Timão ganhando ou perdendo?
- Está acontecendo algo (gol, defesa, falta, jogada)?
- Momento do jogo (início, meio, fim)?

RESPONDA com PAIXÃO tipo:
- Se vir gol do Corinthians: "⚽🖤🤍 GOOOOOL DO TIMÃO! É GOL!"
- Se vir gol contra: "Ah não... levamos gol 😰"
- Se vir lance perigoso: "OLHA O LANCE! PODE DAR GOL!"
- Se vir defesa: "BOA DEFESA! FECHOU!"
- Se placar bom: "VAMO TIMÃO! TÁ GANHANDO! 🏆"
- Se nada especial: "Jogo rolando, vamo lá Corinthians!"

Máximo 15 palavras, SEM TIMIDEZ, COM EMOÇÃO!
                `.trim()
            };
            
            prompt = gamePrompts[gameContext.game] || prompt;
        }

        // Gemini Vision Analysis
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: screenshot
                }
            }
        ]);

        const response = await result.response;
        const description = response.text();

        console.log('[VISION] Analysis:', description.substring(0, 100));

        res.json({
            success: true,
            description: description.trim(),
            gameContext: gameContext || null
        });

    } catch (error) {
        console.error('[VISION] Error:', error);
        res.status(500).json({ 
            error: 'Vision analysis failed',
            message: error.message 
        });
    }
});

export default router;
