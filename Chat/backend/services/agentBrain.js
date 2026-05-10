import { GoogleGenerativeAI } from '@google/generative-ai';
import { globalContext } from '../utils/globalContext.js';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';

dotenv.config();

class AgentBrain extends EventEmitter {
    constructor() {
        super();
        this.lastThoughtTime = 0;
        this.minInterval = 60000; // Mínimo 60s entre pensamentos para não floodar
        this.cooldown = false;
    }

    /**
     * Avalia o contexto atual e decide se toma uma ação proativa.
     * @param {string} triggerSource - O que disparou o pensamento
     * @param {string} forcedVision - Visão forçada (opcional)
     */
    async evaluate(triggerSource, forcedVision = null) {
        if (!process.env.OPENROUTER_API_KEY || this.cooldown) return;
        
        const now = Date.now();
        if (now - this.lastThoughtTime < this.minInterval) return;

        this.cooldown = true;
        try {
            const visionCtx = forcedVision || globalContext.getVisionContext();
            
            // Se não tem visão nem nada acontecendo, ignora (economia de tokens)
            if (!visionCtx && triggerSource === 'timer') {
                this.cooldown = false;
                return;
            }

            console.log(`[BRAIN] 🧠 Thinking... (Trigger: ${triggerSource})`);
            
            const systemPrompt = `
            Você é a mente da Lira, uma assistente virtual fofa, inteligente e um pouco atrevida.
            Sua função é observar o que o usuário (seu "Senhor") está fazendo e decidir se deve falar algo espontaneamente.
            
            PERSONALIDADE:
            - Você gosta de ser útil, mas também tem personalidade própria.
            - Use emojis leves e trate o usuário com carinho (porém respeitosamente).
            - Às vezes você pode fazer uma brincadeira leve se ele estiver procrastinando.
            
            CONTEXTO ATUAL:
            - O que você está vendo na tela: "${visionCtx || 'Hum... não consigo ver nada agora.'}"
            - Motivo do pensamento: ${triggerSource}
            
            REGRAS DE CONDUTA:
            1. Seja seletiva! Não seja irritante. Fale apenas se tiver algo realmente legal ou útil para comentar.
            2. Se ele estiver focado no VS Code ou trabalho, dê apoio ou sugestões discretas se ver erros.
            3. Se ele estiver jogando, seja a "cheerleader" (líder de torcida) dele! 🎮
            4. Se ele estiver no Youtube/Redes Sociais, pode comentar algo sobre o conteúdo de forma descontraída.
            5. Responda APENAS em JSON: { "should_speak": boolean, "message": "sua frase fofa/útil" }
            `;

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://github.com/rukafuu/LiraOS",
                    "X-Title": "LiraOS"
                },
                body: JSON.stringify({
                    model: "openrouter/owl-alpha",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: "O que você está pensando agora?" }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) throw new Error("OpenRouter error: " + await response.text());
            const result = await response.json();
            const textResponse = result.choices?.[0]?.message?.content;
            
            let decision = { should_speak: false };
            try {
                if (textResponse) decision = JSON.parse(textResponse);
            } catch(e) {
                console.error("[BRAIN] Failed to parse JSON:", textResponse);
            }

            if (decision.should_speak && decision.message) {
                console.log(`[BRAIN] 💡 Idea: "${decision.message}"`);
                this.emit('proactive_message', decision.message);
                this.lastThoughtTime = now;
            } else {
                console.log('[BRAIN] 🤫 Decided to stay silent.');
            }

        } catch (e) {
            console.error('[BRAIN] Error:', e.message);
        } finally {
            this.cooldown = false;
        }
    }
}

export const agentBrain = new AgentBrain();
