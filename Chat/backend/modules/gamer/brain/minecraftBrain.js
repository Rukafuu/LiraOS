
import { GoogleGenerativeAI } from '@google/generative-ai';
import { minecraftBot } from '../minecraft/botClient.js';

export class MinecraftBrain {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }) : null;
        this.isThinking = false;
        
        // Listen to bot events
        minecraftBot.on('chat', (data) => this.handleChat(data));
        minecraftBot.on('status', (perception) => this.autoLoop(perception));
    }

    async handleChat({ username, message }) {
        // Simple command handling via chat
        if (message.includes("lira come here") || message.includes("vem aqui")) {
            const player = minecraftBot.bot.players[username];
            if (player && player.entity) {
                minecraftBot.chat(`Indo até você, ${username}!`);
                const pos = player.entity.position;
                minecraftBot.goTo(pos.x, pos.y, pos.z);
            }
        }
        
        if (message.includes("set home")) {
             const player = minecraftBot.bot.players[username];
             if (player && player.entity) {
                 minecraftBot.setHome(player.entity.position);
                 minecraftBot.chat("Casa definida! Não vou quebrar nada por aqui.");
             }
        }
    }

    async autoLoop(perception) {
        if (this.isThinking || !perception) return;

        // Basic survival reflex: Low Health -> Scream
        if (perception.status.health < 10) {
            // minecraftBot.chat("Ai! Tô morrendo!"); 
        }

        // Here we could implement the full Autonomous Agent loop
        // asking Gemini what to do based on perception.json
        // For now, let's keep it reactive to Chat Commands to save tokens/latency
        // until 'Auto Mode' is explicitly enabled.
    }

    async decideNextMove(customObjective) {
        if (this.isThinking || !this.model) return;
        this.isThinking = true;

        const perception = minecraftBot.getPerception();
        // Construct the prompt
        const prompt = `
        ROLE: Autonomous Minecraft Agent (Mineflayer).
        STATUS: Health ${perception.status.health}, Food ${perception.status.food}.
        POS: ${JSON.stringify(perception.status.pos)}
        INVENTORY: ${JSON.stringify(perception.inventory)}
        SURROUNDINGS: ${JSON.stringify(perception.surroundings)}
        
        OBJECTIVE: ${customObjective || "Survive and gather resources. Do not wander too far."}
        
        AVAILABLE ACTIONS:
        - chat(message)
        - goto(x, y, z)
        - mine(block_name)
        - attack(entity_name)
        
        RESPONSE FORMAT (JSON):
        {
            "thought": "Reasoning...",
            "action": "goto",
            "params": [100, 64, 100]
        }
        `;

        try {
             // Call Gemini...
             // (Implementation omitted for brevity, similar to decisionEngine)
        } catch(e) {
            console.error(e);
        } finally {
            this.isThinking = false;
        }
    }
}

export const minecraftBrain = new MinecraftBrain();
