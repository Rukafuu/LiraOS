import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { decisionEngine } from '../modules/gamer/brain/decisionEngine.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const router = express.Router();

router.post('/decide', async (req, res) => {
    try {
        const { image, gameId, context } = req.body; // image: base64, context: { lastThought, etc }

        if (!image) {
            return res.status(400).json({ error: "No image provided" });
        }

        // console.log(`[GAMER:DECIDE] Processing frame for ${gameId || 'Unknown'}...`);

        // 1. Construct State Object
        const state = {
            gameId: gameId || 'minecraft',
            visual: {
                screenshot: image
            },
            context: context || {}
        };

        // 2. Ask Brain
        const decision = await decisionEngine.decide(state);

        // 3. Return Decision
        res.json(decision);

    } catch (e) {
        console.error('[GAMER] Route Error:', e);
        res.status(500).json({
            thought: "Brain Freeze (Server Error)",
            action_payload: null,
            error: e.message
        });
    }
});

// --- Mineflayer Bot Routes ---
import { minecraftBot } from '../modules/gamer/minecraft/botClient.js';
// Ensure Brain is loaded to listen to events
import '../modules/gamer/brain/minecraftBrain.js'; 

router.post('/minecraft/connect', (req, res) => {
    const { host, port, username } = req.body;
    try {
        minecraftBot.connect({ 
            host: host || 'localhost', 
            port: port || 25565, 
            username: username || 'LiraBot' 
        });
        res.json({ success: true, message: `Connecting to ${host}...` });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/minecraft/stop', (req, res) => {
    minecraftBot.disconnect();
    res.json({ success: true, message: "Bot Disconnected." });
});

export default router;
