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
        this.minInterval = 20000; // Mínimo 20s entre pensamentos para não floodar
        this.cooldown = false;
    }

    /**
     * Avalia o contexto atual e decide se toma uma ação proativa.
     * @param {string} triggerSource - O que disparou o pensamento (ex: 'vision_update', 'timer')
     */
    async evaluate(triggerSource) {
        if (!this.gemini || this.cooldown) return;
        
        const now = Date.now();
        if (now - this.lastThoughtTime < this.minInterval) return;

        this.cooldown = true;
        try {
            const visionCtx = globalContext.getVisionContext();
            
            // Se não tem visão nem nada acontecendo, ignora (economia de tokens)
            if (!visionCtx && triggerSource === 'timer') {
                this.cooldown = false;
                return;
            }

            console.log(`[BRAIN] 🧠 Thinking... (Trigger: ${triggerSource})`);

            const model = this.gemini.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });
            
            const systemPrompt = `
            Você é o subconsciente da Lira (Assistente JARVIS).
            Sua função é decidir se você deve falar algo espontaneamente para o usuário.
            
            CONTEXTO ATUAL:
            - Visão da Tela: "${visionCtx || 'Desconhecida'}"
            - Trigger: ${triggerSource}
            
            REGRAS:
            1. Seja EXTREMAMENTE seletiva. Fale apenas se for útil, urgente ou muito interessante.
            2. Se o usuário estiver jogando, não atrapalhe (a menos que seja uma dica vital).
            3. Se o usuário estiver trabalhando (VS Code, Docs), sugira ajuda apenas se ver um erro óbvio.
            4. Se parecer tédio (Youtube, Redes Sociais), pode ser mais conversadeira.
            5. Responda em JSON: { "should_speak": boolean, "message": "texto" }
            `;

            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: "Analise o contexto e decida." }] }],
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
