
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'Chat/backend/.env') });

const apiKey = process.env.HF_API_KEY;
const model = 'facebook/mms-tts-por';

if (!apiKey) {
    console.error("❌ ERRO: Defina HF_API_KEY no Chat/backend/.env");
    process.exit(1);
}

const urls = [
    `https://router.huggingface.co/models/${model}`,
    `https://api-inference.huggingface.co/models/${model}`,
    `https://api-inference.huggingface.co/pipeline/text-to-speech/${model}`
];

async function tryUrl(url) {
    console.log(`\n🔍 Tentando: ${url}`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: "Teste de voz V3." })
        });

        if (!response.ok) {
            const err = await response.text();
            console.log(`❌ Falhou: ${response.status} - ${err.substring(0, 100)}...`);
            return false;
        }

        const buffer = await response.arrayBuffer();
        fs.writeFileSync('test_v3_success.mp3', Buffer.from(buffer));
        console.log(`✅ SUCESSO! URL Válida: ${url}`);
        return true;
    } catch (e) {
        console.log(`❌ Erro de Rede: ${e.message}`);
        return false;
    }
}

async function run() {
    console.log(`🔑 Token: ${apiKey.substring(0, 5)}...`);
    for (const url of urls) {
        if (await tryUrl(url)) break;
    }
}

run();
