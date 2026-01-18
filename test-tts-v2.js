
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carregar .env do backend
const envPath = path.join(__dirname, 'Chat/backend/.env');
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

async function testHuggingFace() {
    const apiKey = process.env.HF_API_KEY;
    console.log("🔑 HF_API_KEY:", apiKey ? `Presente (${apiKey.substring(0, 5)}...)` : "AUSENTE ❌");

    if (!apiKey) {
        console.error("❌ ERRO: Adicione HF_API_KEY=hf_... no arquivo Chat/backend/.env");
        return;
    }

    const model = 'facebook/mms-tts-por';
    const url = `https://router.huggingface.co/models/${model}`; // Nova URL
    
    console.log(`🌸 Testando modelo: ${model}`);
    console.log(`🌐 URL: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: "Olá! A Lira está falando com a nova URL!" })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`HTTP ${response.status}: ${err}`);
        }

        const buffer = await response.arrayBuffer();
        fs.writeFileSync('test_audio_v2.mp3', Buffer.from(buffer));
        console.log("✅ SUCESSO! Áudio gerado em 'test_audio_v2.mp3'.");
        console.log("🔊 Se funcionou aqui e falha no Railway, aguarde o deploy terminar.");

    } catch (e) {
        console.error("❌ FALHA:", e.message);
    }
}

testHuggingFace();
