import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

class DecisionEngine {
    constructor() {
        this.genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
        // Using flash for speed/cost balance in loop
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;
        this.kbCache = {};
    }

    async decide(state) {
        if (!this.model) {
            console.error("[DECISION] No API Key or Model initialized.");
            return null;
        }
        if (!state.visual.screenshot) {
            return null; // Can't see, can't play
        }

        // 1. Load Knowledge Base (Cached)
        const gameId = state.gameId;
        if (!this.kbCache[gameId]) {
            try {
                const kbPath = path.join(process.cwd(), 'data', 'knowledge', 'games', `${gameId}.txt`);
                if (fs.existsSync(kbPath)) {
                    this.kbCache[gameId] = fs.readFileSync(kbPath, 'utf-8');
                } else {
                    this.kbCache[gameId] = "Objective: Play the game. Survive and win.";
                }
            } catch (e) {
                this.kbCache[gameId] = "";
            }
        }
        const knowledge = this.kbCache[gameId];

        // 2. Construct Prompt
        const prompt = `
ROLE: You are Lira, an AI Gamer playing ${gameId}.
YOUR GOAL: Analyze the screen visualization and execute the Best Next Move.

KNOWLEDGE BASE:
${knowledge}

CURRENT CONTEXT:
Last Thought: ${state.context.lastThought || "Just started."}

INSTRUCTIONS:
1. Analyze the image. Identify UI elements, enemies, resources, and player status.
2. Decide a single immediate action (duration < 1s).
3. If unsure, look around (mouseMove) or wait.

AVAILABLE ACTIONS:
- { "action": "key", "key": "w", "duration": 0.5 }  (for movement: w,a,s,d, space, shift)
- { "action": "mouseMove", "x": 500, "y": 300 } (x,y are relative 0-1000, 500,500 is center)
- { "action": "mouseClick", "duration": 0.1 } (attack/use)
- { "action": "wait", "duration": 0.5 }

OUTPUT FORMAT:
Return ONLY a valid JSON object. No markdown.
{
  "thought": "I see a Creeper to the left. I will strafe right.",
  "action": "key",
  "key": "d",
  "duration": 0.3
}
`;

        try {
            // 3. Call Gemini
            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: state.visual.screenshot,
                        mimeType: "image/jpeg"
                    }
                }
            ]);

            const response = result.response;
            const text = response.text();

            // 4. Parse JSON
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const decision = JSON.parse(cleanText);

            return decision;

        } catch (e) {
            console.error(`[DECISION] Brain Freeze: ${e.message}`);
            return { thought: `Error: ${e.message}`, action: "wait" };
        }
    }
}

export const decisionEngine = new DecisionEngine();
