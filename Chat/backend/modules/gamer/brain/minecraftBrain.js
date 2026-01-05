
import { GoogleGenerativeAI } from '@google/generative-ai';
import { minecraftBot } from '../minecraft/botClient.js';

export class MinecraftBrain {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }) : null;
        this.autoMode = false;
        this.lastDecisionTime = 0;
        
        // Connect Senses (Listeners)
        minecraftBot.on('chat', (data) => this.handleChat(data));
        minecraftBot.on('status', (perception) => this.autoLoop(perception));
    }

    async handleChat({ username, message }) {
        const msg = message.toLowerCase();
        
        // Priority Override: User manually calling checks
        if (msg.includes("lira come here") || msg.includes("vem aqui")) {
            this.autoMode = false; 
            this.currentObjective = null;
            minecraftBot.bot?.pathfinder?.stop();
            
            // Debugging player finding
            const player = minecraftBot.bot.players[username];
            
            if (!player || !player.entity) {
                 minecraftBot.chat(`Não te vejo, ${username}! Tem certeza que está perto?`);
                 console.log(`[MC_BOT_DEBUG] Player '${username}' not found in perception.`);
                 return;
            }

            minecraftBot.chat(`Indo até você, ${username}! (Manterei distância segura)`);
            
            // Use dynamic follow with safe range (4 blocks)
            minecraftBot.follow(player.entity, 4);
            return;
        }

        // ... existing handleChat logic ...
        
        this.currentObjective = null;

        // Emergency Stop
        if (msg.includes("lira stop") || msg.includes("lira pare") || msg.includes("lira fica quieta")) {
            this.autoMode = false;
            this.currentObjective = null;
            minecraftBot.stopMoving(); // Use new stop helper
            minecraftBot.bot?.clearControlStates();
            minecraftBot.chat("Parei tudo! Aguardando ordens.");
            return;
        }

        // Custom Objective / Force Action
        if (msg.startsWith("lira faça ") || msg.startsWith("lira objective ")) {
             const objective = msg.replace("lira faça ", "").replace("lira objective ", "");
             this.currentObjective = objective;
             this.autoMode = true; // Auto-activate brain to execute objective
             minecraftBot.chat(`Entendido! Meu foco agora é: ${objective}`);
             this.decideNextMove(); // Force immediate thought
             return;
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
            this.currentObjective = null; // Reset to default survival
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
        if (perception.status.health < 10) {} 

        // Auto Mode Logic (Every 6 seconds)
        if (this.autoMode && (Date.now() - this.lastDecisionTime > 6000)) {
            this.decideNextMove(this.currentObjective);
        }
    }

    async decideNextMove(customObjective) {
        if (this.isThinking || !this.model) return;
        this.isThinking = true;
        this.lastDecisionTime = Date.now();

        const perception = minecraftBot.getPerception();
        if (!perception) { this.isThinking = false; return; }

        // --- Dynamic Objective System ---
        let currentGoal = customObjective;
        if (!currentGoal) {
            const inventory = perception.inventory.join(', ');
            const hasWood = inventory.includes('log') || inventory.includes('plank');
            const hasPickaxe = inventory.includes('pickaxe');
            const hasCrafting = perception.status.nearCraftingTable;
             
            if (perception.status.food < 10) {
                currentGoal = "URGENT: Find food.";
            } else if (!hasWood && !hasPickaxe) {
                currentGoal = "Gather 3 logs to craft planks -> crafting table -> pickaxe.";
            } else if (hasWood && !hasPickaxe) {
                 if (hasCrafting) {
                     currentGoal = "Use nearby Crafting Table to make a Wooden Pickaxe.";
                 } else {
                     currentGoal = "Place Crafting Table (if have one) or Craft one with planks, then make Pickaxe.";
                 }
            } else if (hasPickaxe) {
                currentGoal = "Now I have a pickaxe! Find Stone or Coal to mine.";
            }
        }

        // Create a SIMPLE High-Level Prompt
        
        const prompt = `
        ROLE: Autonomous Minecraft Player.
        NAME: Lira.
        GOAL: ${customObjective || "Play the game normally. Gather resources (Wood -> Stone -> Iron), kill mobs for food if hungry, exploring."}

        STATUS: Health ${perception.status.health}, Food ${perception.status.food}.
        INVENTORY: ${JSON.stringify(perception.inventory)}
        SURROUNDINGS: ${JSON.stringify(perception.surroundings)}
        
        AVAILABLE ACTIONS:
        - { "action": "collect", "target": "log" } (High Level: Finds, paths, and mines the block. Will craft tools if needed automatically.)
        - { "action": "collect", "target": "iron_ore" }
        - { "action": "chat", "message": "hello" }
        - { "action": "follow", "target": "player_name" }
        - { "action": "wander" } (Explore randomly)
        
        INSTRUCTIONS:
        - Do NOT worry about crafting pickaxes manually. Just ask to "collect" the block you want.
        - If you have wood, try getting stone. If you have stone, try iron.
        - If hungry, collect food (or hunt).
        
        RESPONSE (JSON):
        { "thought": "I need stone tools, I will get stone.", "action": "collect", "target": "stone" }
        `;

        try {
             console.log('[MC_BRAIN] Thinking (Auto Mode)...');
             const result = await this.model.generateContent(prompt);
             const text = await result.response.text();
             
             const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
             const decision = JSON.parse(cleanText);
             
             console.log(`[MC_BRAIN] Action: ${decision.action} (${decision.thought})`);

             if (decision.action === 'chat') {
                 minecraftBot.chat(decision.message);
                 this.speak(decision.message); // 🗣️ Vocalize (Francisca)
             } else if (decision.action === 'follow') {
                  const targetName = decision.target;
                  const player = minecraftBot.bot.players[targetName];
                  if(player) {
                      minecraftBot.follow(player.entity, 4);
                      const msg = `Seguindo ${targetName}!`;
                      minecraftBot.chat(msg);
                      this.speak(msg);
                  }
             } else if (decision.action === 'collect') {
                 const res = await minecraftBot.collect(decision.target, 1);
                 if (res.error) {
                     minecraftBot.chat(`⚠️ ${res.error}`);
                 } else {
                     const msg = `Pegando ${decision.target}...`;
                     minecraftBot.chat(msg);
                     this.speak(msg);
                 }
             } else if (decision.action === 'wander') {
                 // ... existing wander ...
                 const x = Math.round(minecraftBot.bot.entity.position.x + (Math.random() * 20 - 10));
                 const z = Math.round(minecraftBot.bot.entity.position.z + (Math.random() * 20 - 10));
                 minecraftBot.goTo(x, minecraftBot.bot.entity.position.y, z);
             }

        } catch(e) {
            // ...
            console.error('[MC_BRAIN_ERR]', e);
        } finally {
            this.isThinking = false;
        }
    }
}

export const minecraftBrain = new MinecraftBrain();
