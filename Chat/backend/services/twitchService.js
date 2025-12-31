import { twitchInterrupts } from '../modules/gamer/twitch/interrupts.js';

// ...

    async handleMessage(tags, message) {
    const username = tags['display-name'] || tags.username || 'Viewer';
    const isSub = tags.subscriber === true;
    const isMod = tags.mod === true;
    const isVip = tags.vip === true;
    const bits = tags.bits ? parseInt(tags.bits) : 0;

    // INJECT INTO GAMER BRAIN (No cooldowns, pure raw feed)
    // High priority if Sub, Mod, Vip or Bits
    const isPriorityUser = isSub || isMod || isVip || bits > 0;
    try {
        twitchInterrupts.ingest(username, message, isPriorityUser);
    } catch (e) {
        // Should not block main thread
    }

    console.log(`[Twitch] ${username} (Sub:${isSub}|Bits:${bits}): ${message}`);
    this.writeToObs(username, message);

    if (!genAI) return;

    // --- Streamer Logic ---
    const now = Date.now();
    const COOLDOWN = 15000; // 15s global cooldown to "not fry"
    const timeSinceLast = now - (this.lastReplyTime || 0);

    // Priority Calculation
    let isPriority = false;
    if (bits > 0 || isSub || isMod || isVip) isPriority = true;

    // Filtering
    if (isPriority) {
        // Priority users: Reduced cooldown (5s) + Always pass RNG
        if (timeSinceLast < 5000) return;
    } else {
        // Normal users: Strict cooldown (15s) + 20% Chance
        if (timeSinceLast < COOLDOWN) return;
        if (Math.random() > 0.2) return; // 80% chance to ignore
    }

    this.lastReplyTime = now;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        // Context Builder
        let userContext = "Viewer";
        if (isSub) userContext = "Subscriber";
        if (isMod) userContext = "Moderator";
        if (bits > 0) userContext = `Supporter (${bits} bits)`;

        const prompt = `
            [SYSTEM]
            You are Lira, a virtual streamer (VTuber) on Twitch.
            User: ${username} (${userContext})
            Message: "${message}"
            
            Behavior:
            - You are reading this comment from your stream chat.
            - If it's a subscriber or donation (bits), acknowledge it warmly!
            - Be concise (max 2 sentences).
            - Personality: Cute, Engageable, slightly chaotic tech-savy.
            
            Current Activity: Just chatting / Coding.
            
            Respond as Lira:
            `;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        const cleanText = response.replace(/\[(HAPPY|SAD|ANGRY|SURPRISE|SHY|NEUTRAL|WINK|SMUG)\]/g, '').trim();
        await this.speak(cleanText || response);

    } catch (error) {
        console.error('[Twitch] AI Generation Error:', error);
    }
}

writeToObs(username, message) {
    const text = `${username}: ${message}`;
    try {
        // Write current chat message
        fs.writeFileSync(CHAT_FILE, text);

        // Append to a log if needed? For now just overwrite for "Current Message" caption
        // Or maybe we want a rolling log?
        // Let's stick to "Current Chat" for now as per "AI Waifu" style
    } catch (e) {
        console.error('[Twitch] Failed to write to OBS file:', e);
    }
}

    // Method for Lira to speak (send to chat + OBS response)
    async speak(text) {
    if (!this.client || !this.isConnected) return;

    try {
        const channel = process.env.TWITCH_CHANNEL;
        await this.client.say(channel, text);
        fs.writeFileSync(RESPONSE_FILE, text);

        // Trigger TTS
        const pythonScript = path.join(process.cwd(), 'python', 'tts_engine.py');
        // Use spawn to run python script
        const { spawn } = await import('child_process');

        // Sanitize text for command line (basic)
        // But better to just pass as arg.

        console.log(`[TTS] Speaking: ${text}`);
        const ttsProcess = spawn('python', [pythonScript, text]);

        ttsProcess.stderr.on('data', (data) => {
            console.error(`[TTS Error]: ${data}`);
        });

    } catch (e) {
        console.error('[Twitch] Failed to send message:', e);
    }
}
}

export const twitchService = new TwitchService();
