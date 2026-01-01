import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

class DecisionEngine {
    constructor() {
        // Initialize Gemini
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("[DECISION] No GEMINI_API_KEY found in environment variables.");
        }
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }) : null;
        this.kbCache = {};
    }

    async decide(state) {
        if (!this.model) {
            return { thought: "System Offline: AI Model not initialized.", action: "wait" };
        }
        if (!state.visual.screenshot) {
            return { thought: "Blind: No visual input available.", action: "wait" };
        }

        // 1. Load Knowledge Cache
        const gameId = state.gameId || "minecraft"; // Default to Minecraft if unknown
        if (!this.kbCache[gameId]) {
            try {
                // Try multiple paths for knowledge base
                const possiblePaths = [
                    path.join(process.cwd(), 'data', 'knowledge', 'games', `${gameId}.txt`),
                    path.join(process.cwd(), 'backend', 'data', 'knowledge', 'games', `${gameId}.txt`)
                ];

                let loaded = false;
                for (const p of possiblePaths) {
                    if (fs.existsSync(p)) {
                        this.kbCache[gameId] = fs.readFileSync(p, 'utf-8');
                        loaded = true;
                        break;
                    }
                }

                if (!loaded) {
                    this.kbCache[gameId] = "Objective: Play the game intelligently. Explore, survive, and progress.";
                }
            } catch (e) {
                console.warn(`[KNOWLEDGE] Failed to load KB for ${gameId}: ${e.message}`);
                this.kbCache[gameId] = "";
            }
        }
        const knowledge = this.kbCache[gameId];

        // 2. Build Prompt
        // We instruct Gemini to act as the Gamer
        const prompt = `
SYSTEM_MODE: AUTONOMOUS_GAMER_V2
IDENTITY: You are Lira, an advanced AI playing ${gameId}.
OBJECTIVE: Analyze the visual frame and execute the optimal next move.

KNOWLEDGE_BASE:
${knowledge}

CONTEXT:
Last Action: ${state.context.lastAction || "None"}
Last Thought: ${state.context.lastThought || "Initializing..."}

 INSTRUCTIONS:
1. Scan the image for immediate threats and resources.
2. Determine your short-term goal.
3. Select ONE primitive action.
4. IMPORTANT - MOVEMENT MECHANICS:
   - To WALK: Use "type": "key", "key": "w", "duration": 2.0 (or higher). Short taps (0.1s) do nothing!
   - To MINE/ATTACK: You MUST HOLD left_click. Use "type": "mouse", "subtype": "left_click", "duration": 3.0 (to break a block).
   - To LOOK: Use SMALL mouse values (x: 0.1) prevents spinning.

AVAILABLE ACTIONS (JSON):
- Moving: { "type": "key", "key": "w", "duration": 2.5 } (Keys: w, a, s, d, space, shift, e, esc)
- Aiming: { "type": "mouse", "x": 0.2, "y": 0.0 } (Relative: -0.5 to 0.5. Right is +X, Down is +Y)
- Mining/Attacking: { "type": "mouse", "subtype": "left_click", "duration": 3.0 } (Hold longer to break blocks!)
- Using Item/Place: { "type": "mouse", "subtype": "right_click", "duration": 0.2 }

RESPONSE FORMAT (Strict JSON):
{
  "thought": "Reasoning. Ex: 'Tree ahead, walking forward for 3 seconds to reach it.'",
  "action_payload": { ... one of the available actions ... }
}
`;

        try {
            // 3. Generate Decision
            const start = Date.now();
            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: state.visual.screenshot,
                        mimeType: "image/jpeg"
                    }
                }
            ]);
            const response = await result.response;
            const text = response.text();

            // console.log(`[GEMINI] Thinking time: ${Date.now() - start}ms`);

            // 4. Parse & Validate
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const decision = JSON.parse(cleanText);

            // Backwards compatibility mapping if AI hallucinates format
            if (decision.action && !decision.action_payload) {
                // Convert old format to new payload format
                decision.action_payload = {
                    type: decision.action === 'key' ? 'key' : 'mouse',
                    key: decision.key,
                    duration: decision.duration,
                    x: decision.x,
                    y: decision.y
                };
            }

            return decision;

        } catch (e) {
            console.error(`[BRAIN_FREEZE] ${e.message}`);
            // Fallback: Just wait and observe
            return {
                thought: `Cortex Glitch: ${e.message}. Holding position.`,
                action_payload: { type: "chat", text: "err" }
            };
        }
    }
}

export const decisionEngine = new DecisionEngine();
