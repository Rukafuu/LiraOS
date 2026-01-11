import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getScreenSnapshot } from '../services/visionBridgeService.js';
import { generateSpeechEdgeTTS } from '../services/ttsService.js';
import { createShortVideo } from '../services/videoCreatorService.js';
import { postToInstagramReel } from '../services/instagramService.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

dotenv.config();

const router = express.Router();
const geminiClient = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Store recent context to avoid repetition
let lastComment = "";

router.post('/tick', async (req, res) => {
    try {
        const { mode = 'fun', forceVideo = false } = req.body;
        
        // 1. Get Screen
        console.log('[COPILOT] Capturing screen...');
        const imageBuffer = await getScreenSnapshot();
        
        if (!imageBuffer) {
            return res.json({ status: 'no_bridge', message: "Can't see screen yet!" });
        }
        
        // 2. Analyze with Gemini
        // We need to convert Buffer to Base64 for Gemini
        const base64Image = imageBuffer.toString('base64');
        
        if (!geminiClient) {
             return res.json({ comment: "Gemini Key missing!", audio: "" });
        }

        const model = geminiClient.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            systemInstruction: "You are Lira, a funny, cute, and energetic AI Copilot watching the user play games or watch anime. React to what you see. Be brief."
        });

        // Prompt engineering for JSON
        const prompt = `
        Look at the user's screen.
        Provide a reaction in JSON format:
        {
            "comment": "Your short, spoken reaction (1-2 sentences) in Portuguese (Brazil).",
            "emotion": "happy/excited/scared/bored",
            "clip_worthy": boolean (sets to true if something amazing, funny, or intense is happening, or if it's a victory/defeat screen. Be selective, max 10% chance unless 'forceVideo' is true)
        }
        NO MARKDOWN. ONLY JSON.
        `;
        
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
        ]);
        
        const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        let thought = {};
        try {
            thought = JSON.parse(responseText);
        } catch (e) {
            thought = { comment: responseText, emotion: 'neutral', clip_worthy: false };
        }

        console.log(`[COPILOT] Thought: ${thought.comment} (Clip: ${thought.clip_worthy})`);
        
        // 3. Audio
        const audioBuffer = await generateSpeechEdgeTTS(thought.comment, 'pt-BR-FranciscaNeural');
        const audioBase64 = audioBuffer.toString('base64');
        
        // 4. Video Generation (If worthy)
        let videoResult = null;
        if (thought.clip_worthy || forceVideo) {
            console.log('[COPILOT] 🎬 Making a clip!');
            
            // Save current image to temp
            const tempImgPath = path.join(process.cwd(), 'temp_copilot.jpg');
            fs.writeFileSync(tempImgPath, imageBuffer);
            
            // Generate Video
            const vid = await createShortVideo(thought.comment, tempImgPath, 'pt-BR-FranciscaNeural');
            
            // Auto Post to Reels (Async)
            if (process.env.AUTO_POST_REELS === 'true') {
                 const publicUrl = `${process.env.NGROK_URL}/videos/${vid.filename}`;
                 postToInstagramReel(publicUrl, `${thought.comment} #LiraOS #AI #Gaming`)
                    .catch(e => console.error('AutoPost Failed:', e));
            }

            videoResult = {
                url: vid.url, // /videos/uuid.mp4
                filename: vid.filename
            };
        }

        res.json({
            comment: thought.comment,
            audio: audioBase64,
            emotion: thought.emotion,
            video: videoResult
        });
        
    } catch (error) {
        console.error('[COPILOT] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
