import express from 'express';
import http from 'http';
import { initCompanionWebSocket, broadcastToCompanions } from './services/companionWebSocket.js';
import { agentBrain } from './services/agentBrain.js';

const app = express();
const server = http.createServer(app);
const PORT = 4001;

let lastStats = null;

// Listen to Brain Ideas
agentBrain.on('proactive_message', (msg) => {
    console.log(`[LIRA BRAIN] Sending idea to desktop: ${msg}`);
    broadcastToCompanions({
        type: 'proactive',
        content: msg,
        emotion: 'happy',
        timestamp: Date.now()
    });
});

// JARVIS-like Phrases
const LIRA_PHRASES = [
    "Sistemas 100% operacionais! Pronta pro que der e vier! ✨",
    "Monitorando os bits e bytes... tudo sob controle, senhor! 💜",
    "A temperatura tá ok, mas você já lembrou de beber água hoje? 👀",
    "Tô aqui de olho em tudo, viu? Não esquece de mim!",
    "Se precisar de uma mãozinha (ou um processamento), é só chamar!",
    "Lira OS voando baixo hoje! Performance tá incrível!",
    "Hmmm, detecto padrões de produtividade... vamos lá! 💪",
    "Sincronizada e pronta! O que vamos fazer agora?",
    " हार्डवेयर (Hardware) tá relaxadão, tudo nos conformes! 😊"
];

const GAMER_PHRASES = [
    "Foco total na partida! Deixa que eu cuido do PC pra você! 🎮",
    "Uau, que jogada! Meu processador até deu um pulinho aqui! ✨",
    "Tô monitorando o lag... se o ping subir, eu te aviso! 📡",
    "Postura de player, senhor! Não quer ficar corcunda igual um camarão, né? 🦐",
    "Reflexos de ninja hoje! Vai que é sua!",
    "Conexão estável e hardware frio. Hora do GG! 🏆"
];

const WARNING_PHRASES = [
    "Senhor, a CPU está atingindo picos elevados. Talvez queira fechar processos em segundo plano?",
    "Detecto uma pressão incomum na memória RAM. Recomendo cautela.",
    "Alerta de recursos: O sistema está trabalhando sob carga pesada agora.",
    "Sua máquina está pedindo arrego... brincadeira, mas a CPU está alta!"
];

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

app.use(express.json({ limit: '50mb' }));

// Vision Tick from Desktop
app.post('/api/vision/tick', async (req, res) => {
    try {
        const { screenshot } = req.body; // Base64
        if (!screenshot || !genAI) return res.status(400).json({ error: 'No vision' });

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });
        const prompt = "Descreva em 1 frase curta o que o usuário está fazendo no computador (apps ativos, site, ou erro). Seja objetivo.";
        
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: screenshot, mimeType: 'image/jpeg' } }
        ]);

        const description = result.response.text();
        console.log(`[LIRA VISION] Senhor está: ${description}`);
        
        // Update Brain
        agentBrain.evaluate('vision_update', description); // Passing description here
        
        res.json({ success: true, description });
    } catch (err) {
        console.error('[Vision Tick Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Handle stats logic
app.post('/test/broadcast', (req, res) => {
    const { type, content, ...rest } = req.body;
    broadcastToCompanions({ type: type || 'proactive', content: content || 'Test', ...rest });
    res.json({ success: true });
});

initCompanionWebSocket(server);

// Capture stats from companion messages
// (Note: In a real app, the server processes the 'system-stats' message)

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎭 Companion JARVIS Server running on port ${PORT}`);
    
    // Proactive "JARVIS" Loop
    setInterval(() => {
        let message = "";
        let emotion = "neutral";
        
        const random = Math.random();
        
        // 1. Check for real stats warnings (placeholder for simulated stats)
        // If we had a global 'lastStats', we'd use it here.
        
        if (random > 0.7) {
            const isGamer = lastStats && lastStats.isGameMode;
    const phrases = isGamer ? GAMER_PHRASES : LIRA_PHRASES;
    const content = phrases[Math.floor(Math.random() * phrases.length)];
            emotion = "happy";
        } else if (random > 0.4) {
            // Contextual Time
            const hour = new Date().getHours();
            if (hour >= 22 || hour <= 5) {
                message = "Trabalhando até tarde, senhor? Meus sensores detectam dedicação elevada.";
                emotion = "neutral";
            } else {
                message = `São precisamente ${new Date().toLocaleTimeString()}. Tudo operando normalmente.`;
            }
        } else {
            // Short update
            message = "Sistemas ativos. Lira Companion ao seu serviço.";
            emotion = "happy";
        }

        broadcastToCompanions({
            type: 'proactive',
            content: message,
            emotion: emotion,
            timestamp: Date.now()
        });
        
    }, 45000); // Falar a cada 45 segundos para não ser irritante
});

console.log('JARVIS Protocol Initialized.');
