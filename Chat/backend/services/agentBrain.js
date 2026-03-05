import { GoogleGenerativeAI } from '@google/generative-ai';
import { globalContext } from '../utils/globalContext.js';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';

dotenv.config();

class AgentBrain extends EventEmitter {
    constructor() {
        super();
        this.gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
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
        if (!this.gemini || this.cooldown) return;
        
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

            const model = this.gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
            
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

            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: "O que você está pensando agora?" }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { responseMimeType: "application/json" }
            });

            const response = result.response.text();
            let decision = JSON.parse(response);

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
