
import { GoogleGenerativeAI } from '@google/generative-ai';
import { minecraftBot } from '../minecraft/botClient.js';

export class MinecraftBrain {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }) : null;
        this.autoMode = false;
        this.lastDecisionTime = 0;
    }

    async handleChat({ username, message }) {
        const msg = message.toLowerCase();
        
        // Simple command handling via chat
        if (msg.includes("lira come here") || msg.includes("vem aqui")) {
            const player = minecraftBot.bot.players[username];
            if (player && player.entity) {
                minecraftBot.chat(`Indo até você, ${username}!`);
                const pos = player.entity.position;
                minecraftBot.goTo(pos.x, pos.y, pos.z);
            }
        }
        
        if (msg.includes("set home")) {
             const player = minecraftBot.bot.players[username];
             if (player && player.entity) {
                 minecraftBot.setHome(player.entity.position);
                 minecraftBot.chat("Casa definida! Não vou quebrar nada por aqui.");
             }
        }

        if (msg.includes("lira auto on")) {
            this.autoMode = true;
            minecraftBot.chat("Modo Autônomo ATIVADO. Tome cuidado!");
            this.decideNextMove();
        }

        if (msg.includes("lira auto off")) {
            this.autoMode = false;
            minecraftBot.chat("Modo Autônomo DESATIVADO. Fico parada.");
        }
    }

    async autoLoop(perception) {
        if (this.isThinking || !perception) return;

        // Basic survival reflex: Low Health -> Scream
        if (perception.status.health < 10) {
            // minecraftBot.chat("Ai! Tô morrendo!"); 
        }

        // Auto Mode Logic (Every 6 seconds)
        if (this.autoMode && (Date.now() - this.lastDecisionTime > 6000)) {
            this.decideNextMove();
        }
    }

    async decideNextMove(customObjective) {
        if (this.isThinking || !this.model) return;
        this.isThinking = true;
        this.lastDecisionTime = Date.now();

        const perception = minecraftBot.getPerception();
        if (!perception) { this.isThinking = false; return; }

        // Construct the prompt
        const prompt = `
        ROLE: Autonomous Minecraft Agent (Mineflayer).
        STATUS: Health ${perception.status.health}, Food ${perception.status.food}.
        POS: ${JSON.stringify(perception.status.pos)}
        INVENTORY: ${JSON.stringify(perception.inventory)}
        SURROUNDINGS: ${JSON.stringify(perception.surroundings)}
        
        OBJECTIVE: ${customObjective || "Survive, gather wood, and stay close to humans. If hungry, find food."}
        
        AVAILABLE ACTIONS:
        - { "action": "chat", "message": "text" }
        - { "action": "goto", "x": 100, "y": 64, "z": 100 }
        - { "action": "mine", "target": "log" } (Use exact block name part, e.g. 'log' matches 'oak_log')
        
        RESPONSE FORMAT (JSON ONLY):
        {
            "thought": "I see a tree nearby and I need wood.",
            "action": "mine",
            "target": "log"
        }
        `;

        try {
             console.log('[MC_BRAIN] Thinking...');
             const result = await this.model.generateContent(prompt);
             const text = await result.response.text();
             
             // Parse JSON
             const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
             const decision = JSON.parse(cleanText);
             
             console.log(`[MC_BRAIN] Action: ${decision.action} (${decision.thought})`);

             // Execute Action
             if (decision.action === 'chat') {
                 minecraftBot.chat(decision.message);
             } else if (decision.action === 'goto') {
                 await minecraftBot.goTo(decision.x, decision.y, decision.z);
             } else if (decision.action === 'mine') {
                 const res = await minecraftBot.mineBlockNearby(decision.target);
                 if (res.error) minecraftBot.chat(`Não consegui minerar: ${res.error}`);
             }

        } catch(e) {
            console.error('[MC_BRAIN_ERR]', e);
        } finally {
            this.isThinking = false;
        }
    }
}

export const minecraftBrain = new MinecraftBrain();
