
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carregar .env do backend
dotenv.config({ path: path.join(__dirname, 'Chat/backend/.env') });

async function testHuggingFace() {
    const apiKey = process.env.HF_API_KEY;
    console.log("🔑 HF_API_KEY:", apiKey ? `Presente (${apiKey.substring(0, 5)}...)` : "AUSENTE ❌");

    if (!apiKey) {
        console.error("❌ Por favor, defina HF_API_KEY no arquivo Chat/backend/.env");
        process.exit(1);
    }

    const model = 'facebook/mms-tts-por';
    console.log(`🌸 Testando modelo: ${model}...`);

    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: "Olá! Testando a voz da Lira em Português." })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`HTTP ${response.status}: ${err}`);
        }

        const buffer = await response.arrayBuffer();
        fs.writeFileSync('test_audio.mp3', Buffer.from(buffer));
        console.log("✅ SUCESSO! Áudio salvo em 'test_audio.mp3'. Escute para verificar.");

    } catch (e) {
        console.error("❌ FALHA:", e.message);
    }
}

testHuggingFace();
