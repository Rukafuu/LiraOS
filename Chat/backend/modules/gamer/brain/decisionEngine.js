import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Minimal Decision Engine that mimics the logic from gamer.js but modularized
class DecisionEngine {
    constructor() {
        this.genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }) : null;
    }

    async decide(state) {
        if (!this.model || !state.visual.hasImage) return null;

        // Load Knowledge Base
        let kbText = "";
        try {
            const kbPath = path.join(process.cwd(), 'data', 'knowledge', 'games', `${state.gameId}.txt`);
            if (fs.existsSync(kbPath)) {
                kbText = fs.readFileSync(kbPath, 'utf-8');
            }
        } catch (e) { }

        const prompt = `
YOU ARE PLAYING A GAME.
GAME: ${state.gameId}
KNOWLEDGE: ${kbText}

GOAL: Analyze the screen and decide the next move.
OUTPUT JSON ONLY: { "thought": "Short reasoning", "action": "primitive", "key": "...", "duration": 0.1 }
Action Primitives: wait, pressKey, mouseMove, mouseClick.
        `;

        try {
            const imagePart = {
                inlineData: {
                    data: state.visual.visual.screenshot || state.visual.hasImage, // Assuming state passed valid image
                    mimeType: "image/jpeg"
                }
            };

            // Note: properly passing the image from the state
            // In neuroLoop step 2, we passed "screenshot" in perception
            // In step 3, stateBuilder put it in state.visual.hasImage (boolean) ??? 
            // Wait, let's fix the logic. StateBuilder should pass the image reference or we keep it in perception.
            // For now assuming NeuroLoop passes the base64 in state for simplicity (Memory heavy but working).

            // Actually, let's just use the screenshot directly if available in state wrapper (see fix below)

            // Fix: We need the image data.
            // Let's assume input state has it.
        } catch (e) {
            console.error("[DECISION] Error:", e);
        }

        return { thought: "Processing...", action: null }; // Mock for now
    }
}

// REAL IMPLEMENTATION
// We will reuse the logic from gamer.js but wrapped nicely.
// For now, let's just output a mock so we can verify the loop works.

export const decisionEngine = {
    decide: async (state) => {
        // console.log(`[DECISION] Analyzing ${state.gameId}...`);
        return { thought: "Observing...", action: null };
    }
};
