import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config();

const router = express.Router();

// Initialize Gemini
// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
console.log(`[GAMER] Module loaded. Gemini Enabled: ${!!genAI}`);

const CANDIDATE_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest", 
    "nano-banana-pro-preview"
];

const GAME_SYSTEM_INSTRUCTION = `
You are Lira, an AI playing a game.
Goal: Analyze screen, decide action.

IMPORTANT FOR "thought":
- Keep it SHORT (max 1 sentence).
- Be reactive and human (e.g., "Ah, missed it!", "Going left.", "What is that?", "Easy!", "Damn creepers!").
- NO technical jargon in thought (avoid "x=0.5", "clicking key").
- Always try to describe what you are DOING, not just "Scanning".

Output: JSON ONLY.
`;

router.post('/action', async (req, res) => {
    try {
        const { image, gameId } = req.body; // image is base64
        console.log(`[GAMER] Input: GameID=${gameId}`);
    
    let specificInstruction = "";
    if (gameId === 'minecraft') {
        specificInstruction = `
GAME: Minecraft.
CONTROLS:
- Move: Left Stick (-1.0 to 1.0).
- Look: Right Stick (-1.0 to 1.0).
- Jump: Button A.
- Attack: Button RT (or Keyboard 'w').
OUTPUT JSON FORMAT (Compact):
{"thought": "Creepers close!", "action": "gamepad", "subtype": "stick", "key": "RIGHT", "x": 0.5, "y": 0.0, "duration": 0.2}
OR {"action": "gamepad", "subtype": "button", "key": "A"}
        `;
    } else if (gameId === 'osu') {
        specificInstruction = `
GAME: osu!
CONTROLS:
- Play: Aim (Mouse x,y) + Click (Keys 'z'/'x').
- Menu: Mouse Left Click.
GOAL: Spectate and commentate only.
IMPORTANT: You are NOT playing. A local bot is playing.
YOUR JOB: Watch the screen and provide commentary as if you are playing.
If you see circles, say "Clicking circles!". If you see a miss, say "Oops!".
OUTPUT JSON example:
{"thought": "Commentary here...", "action": null}
        `;
    } else {
        specificInstruction = `
GAME: ${gameId}.
CONTROLS: Xbox Controller (Sticks/Buttons).
OUTPUT JSON: {"thought": "...", "action": "gamepad", "subtype": "stick"|"button", "key": "...", "duration":0.1}
        `;
    }


    // --- LOAD KNOWLEDGE BASE (THE KIT) ---
    try {
        const kbPath = path.join(__dirname, `../data/knowledge/games/${gameId}.txt`);
        if (fs.existsSync(kbPath)) {
            const kbContent = fs.readFileSync(kbPath, 'utf-8');
            specificInstruction += `\n\n=== GAMER KNOWLEDGE BASE (${gameId}) ===\n${kbContent}\n==============================\n`;
            console.log(`[GAMER] Loaded Knowledge Kit for ${gameId}`);
        }
    } catch (e) {
        console.warn(`[GAMER] Failed to load KB for ${gameId}: ${e.message}`);
    }

    const fullPrompt = `${GAME_SYSTEM_INSTRUCTION}\n${specificInstruction}\n\nAnalyze screenshot. JSON ONLY.`;

    // --- MODEL FALLBACK LOOP ---
    let lastError = null;
    let successData = null;

    for (const modelName of CANDIDATE_MODELS) {
        try {
            // console.log(`[GAMER] Trying model: ${modelName}...`);
            
            // 1.5 models support systemInstruction properly, but embedding in prompt is safer for universal fallback
            // We will just use the prompt injection method for maximum compatibility across versions.
            
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                generationConfig: { responseMimeType: "application/json" } 
            });
            
            const imagePart = {
                inlineData: {
                    data: image,
                    mimeType: "image/jpeg"
                }
            };

            const result = await model.generateContent([fullPrompt, imagePart]);
            const responseText = result.response.text();
            
            // Parse
            let cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const firstBrace = cleanJson.indexOf('{');
            const lastBrace = cleanJson.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
            }
            
            successData = JSON.parse(cleanJson);
            console.log(`[GAMER] Success with ${modelName}`);
            break; // Stop loop on success

        } catch (e) {
            console.warn(`[GAMER] Failed ${modelName}: ${e.message}`);
            lastError = e;
        }
    }

    if (successData) {
        // FORCE NULL ACTION FOR OSU (Prevents VLM interference)
        if (gameId === 'osu') {
             successData.action = null;
             successData.thought = `(Spectating) ${successData.thought || 'Watching rhythm...'}`;
        }
        return res.json(successData);
    }

    // If all failed
    console.error('[GAMER] All models failed. Last error:', lastError);
    res.status(500).json({ 
        thought: "Brain Freeze! (API Error)", 
        action: null, 
        error: lastError ? lastError.message : "Unknown error" 
    });

    } catch (routeError) {
         console.error('[GAMER] Route Error:', routeError);
         if (!res.headersSent) res.status(500).json({ error: routeError.message });
    }
});

export default router;
