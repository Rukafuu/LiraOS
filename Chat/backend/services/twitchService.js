import tmi from 'tmi.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { twitchInterrupts } from '../modules/gamer/twitch/interrupts.js';

dotenv.config();

const CHAT_FILE = path.join(process.cwd(), 'obs_output', 'twitch_chat.txt');
const RESPONSE_FILE = path.join(process.cwd(), 'obs_output', 'twitch_response.txt');

// Initialize Gemini (Separate instance for Twitch to allow parallel thinking)
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

class TwitchService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.lastReplyTime = 0;

        // Ensure OBS directories exist
        if (!fs.existsSync(path.dirname(CHAT_FILE))) fs.mkdirSync(path.dirname(CHAT_FILE), { recursive: true });
    }

    async connect() {
        if (!process.env.TWITCH_CHANNEL || !process.env.TWITCH_OAUTH_TOKEN) {
            console.log('[Twitch] Skipping connection (Missing credentials)');
            return;
        }

        try {
            this.client = new tmi.Client({
                options: { debug: false },
                identity: {
                    username: 'LiraOS', // Or whatever your bot name is
                    password: process.env.TWITCH_OAUTH_TOKEN
                },
                channels: [process.env.TWITCH_CHANNEL]
            });

            this.client.on('message', (channel, tags, message, self) => {
                if (self) return;
                this.handleMessage(tags, message);
            });

            await this.client.connect();
            this.isConnected = true;
            console.log(`[Twitch] Connected to ${process.env.TWITCH_CHANNEL}`);
        } catch (e) {
            console.error('[Twitch] Connection Failed:', e.message);
        }
    }

    async handleMessage(tags, message) {
        const username = tags['display-name'] || tags.username || 'Viewer';
        const isSub = tags.subscriber === true;
        const isMod = tags.mod === true;
        const isVip = tags.vip === true;
        const bits = tags.bits ? parseInt(tags.bits) : 0;

        // INJECT INTO GAMER BRAIN
        const isPriorityUser = isSub || isMod || isVip || bits > 0;
        try {
            twitchInterrupts.ingest(username, message, isPriorityUser);
        } catch (e) {
            // Should not block main thread
        }

        console.log(`[Twitch] ${username}: ${message}`);
        this.writeToObs(username, message);

        if (!genAI) return;

        // --- Streamer Logic (Auto-Reply) ---
        const now = Date.now();
        const COOLDOWN = 15000;
        const timeSinceLast = now - (this.lastReplyTime || 0);

        let isPriority = bits > 0 || isSub || isMod || isVip;

        if (isPriority) {
            if (timeSinceLast < 5000) return;
        } else {
            if (timeSinceLast < COOLDOWN) return;
            if (Math.random() > 0.2) return; // 80% chance to ignore normies
        }

        this.lastReplyTime = now;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

            let userContext = "Viewer";
            if (isSub) userContext = "Subscriber";
            if (isMod) userContext = "Moderator";
            if (bits > 0) userContext = `Supporter (${bits} bits)`;

            const prompt = `
            [SYSTEM]
            You are Lira, a virtual streamer on Twitch.
            User: ${username} (${userContext})
            Message: "${message}"
            
            Instruction:
            - Respond to the user's chat message.
            - Keep it short, fun, and in character.
            - If they are a subscriber or bit donor, be extra nice.
            
            Response (Text only):
            `;

            const result = await model.generateContent(prompt);
            const response = result.response.text();

            await this.speak(response);

        } catch (error) {
            console.error('[Twitch] AI Generation Error:', error);
        }
    }

    writeToObs(username, message) {
        const text = `${username}: ${message}`;
        try {
            fs.writeFileSync(CHAT_FILE, text);
        } catch (e) {
            console.error('[Twitch] Failed to write to OBS:', e);
        }
    }

    async speak(text) {
        if (!this.client || !this.isConnected) return;
        try {
            const channel = process.env.TWITCH_CHANNEL;
            await this.client.say(channel, text);

            // Log for OBS
            try {
                fs.writeFileSync(RESPONSE_FILE, text);
            } catch (e) { }

            // Trigger TTS (Optional)
            const pythonScript = path.join(process.cwd(), 'python', 'tts_engine.py');
            const { spawn } = await import('child_process');

            // Fire and forget TTS
            spawn('python', [pythonScript, text]); // Assuming python is in path

        } catch (e) {
            console.error('[Twitch] Failed to speak:', e);
        }
    }
}

export const twitchService = new TwitchService();
