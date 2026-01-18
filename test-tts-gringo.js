
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'Chat/backend/.env') });

const apiKey = process.env.HF_API_KEY;

// Modelos 'Gringos' para testar (Opções leves para API Free)
const models = [
    'myshell-ai/MeloTTS-English', // Voz Anime (Inglês)
    'microsoft/speecht5_tts',     // Voz Neutra (Inglês - Muito leve)
    'espnet/kan-bayashi_ljspeech_vits' // Voz VITS (Inglês)
];

async function tryModel(modelName) {
    const url = `https://router.huggingface.co/models/${modelName}`; // Tentando URL Router nova
    // Se falhar, tentar api-inference
    // Mas vamos simplificar
    
    console.log(`\n🌸 Testando Modelo: ${modelName}`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: "Hello! I am Lira. Minha voz é de anime, mas falo com sotaque." })
        });

        if (!response.ok) {
            console.log(`❌ Falha (${modelName}): ${response.status} ${response.statusText}`);
            return false;
        }

        const buffer = await response.arrayBuffer();
        const filename = `test_${modelName.replace('/', '_')}.mp3`;
        fs.writeFileSync(filename, Buffer.from(buffer));
        console.log(`✅ SUCESSO! Áudio salvo: ${filename}`);
        return true;
    } catch (e) {
        console.log(`❌ Erro (${modelName}): ${e.message}`);
        return false;
    }
}

async function run() {
    if (!apiKey) { console.error("Sem chave HF_API_KEY"); return; }
    
    console.log("🚀 Iniciando Teste de Modelos Alternativos...");
    for (const model of models) {
        await tryModel(model);
    }
}

run();
