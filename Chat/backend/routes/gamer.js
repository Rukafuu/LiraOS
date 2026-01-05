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



router.get('/ping', (req, res) => {
    // Safe Ping for Lazy Load
    let status = 'LAZY_STANDBY';
    try {
        // We can't easily check internal state of lazy module without importing.
        // For now, just say UP.
        status = 'SERVER_UP_LAZY';
    } catch(e) {}
    res.json({ pong: true, time: Date.now(), botStatus: status });
});

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

// REMOVE TOP LEVEL IMPORTS
// import { minecraftBot } from '../modules/gamer/minecraft/botClient.js';
// import '../modules/gamer/brain/minecraftBrain.js'; 

router.post('/minecraft/connect', async (req, res) => {
    const { host, port, username } = req.body;
    console.log(`[GAMER] Request to connect MC to ${host}:${port}`);

    // RESPOND FIRST
    res.json({ success: true, message: `Init sequence for ${host}...` });

    // ASYNC INIT & CONNECT
    setTimeout(async () => {
        try {
            // Lazy Load Bot Client
            console.log('[GAMER] Lazy loading Mineflayer...');
            const { minecraftBot } = await import('../modules/gamer/minecraft/botClient.js');
            // Ensure Brain is active
            await import('../modules/gamer/brain/minecraftBrain.js');

            if (!minecraftBot) throw new Error("Bot module failed to load");

            console.log(`[GAMER] Launching Bot for ${host}:${port}...`);
            minecraftBot.connect({ 
                host: host || 'localhost', 
                port: port || 25565, 
                username: username || 'LiraBot',
                version: '1.20.4' 
            });
        } catch (innerErr) {
            console.error(`[GAMER] Lazy Connect Crash:`, innerErr);
        }
    }, 100);
});

router.post('/minecraft/stop', async (req, res) => {
    try {
        const { minecraftBot } = await import('../modules/gamer/minecraft/botClient.js');
        if(minecraftBot) minecraftBot.disconnect();
        res.json({ success: true, message: "Bot Disconnected." });
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});

// NEW V2 ROUTE TO BYPASS CACHE
router.post('/v2/connect', async (req, res) => {
    const { host, port, username } = req.body;
    console.log(`[GAMER V2] Connect Request: ${host}:${port}`);
    
    // Immediate Success Response
    res.json({ success: true, message: `V2 Init: Connecting to ${host}...` });

    // Async Logic
    setTimeout(async () => {
        try {
            const { minecraftBot } = await import('../modules/gamer/minecraft/botClient.js');
            await import('../modules/gamer/brain/minecraftBrain.js');
            
            if (!minecraftBot) return console.error("V2: Bot module missing");

            minecraftBot.connect({ 
                host: host || 'localhost', 
                port: port || 25565, 
                username: username || 'LiraBot',
                version: '1.20.4'
            });
        } catch(e) {
            console.error("V2 Async Error:", e);
        }
    }, 500);
});

export default router;
