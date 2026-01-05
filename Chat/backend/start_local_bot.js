// MICRO-SERVER LOCAL PARA MINECRAFT BOT (LiraOS)
import express from 'express';
import cors from 'cors';
import { minecraftBot } from './modules/gamer/minecraft/botClient.js';
import './modules/gamer/brain/minecraftBrain.js'; // Load Brain listeners

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*' })); // Aceita comandos do Frontend (seja localhost ou nuvem)
app.use(express.json());

console.log("🎮 LiraOS Minecraft Local Module Starting...");

// Connect Route
app.post('/minecraft/connect', (req, res) => {
    const { host, port, username } = req.body;
    console.log(`[LOCAL] Connecting to ${host}:${port}...`);
    
    try {
        minecraftBot.connect({
            host: host || 'localhost',
            port: port || 25565,
            username: username || 'LiraBot',
            version: '1.20.4' 
        });
        res.json({ success: true, message: "Local Bot Launching..." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/minecraft/stop', (req, res) => {
    if(minecraftBot) minecraftBot.disconnect();
    res.json({ success: true });
});

app.get('/ping', (req, res) => {
    res.json({ status: 'LOCAL_READY', bot: minecraftBot.bot ? 'CONNECTED' : 'IDLE' });
});

app.listen(PORT, () => {
    console.log(`\n✅ Módulo Minecraft rodando localmente em: http://localhost:${PORT}`);
    console.log(`   (Mantenha essa janela aberta enquanto joga)`);
});
