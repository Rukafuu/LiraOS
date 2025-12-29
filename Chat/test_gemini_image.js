import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.join('c:', 'Users', 'conta', 'Documents', 'Lira', 'Chat', 'backend', '.env');
console.log(`📂 Carregando .env de: ${envPath}`);
dotenv.config({ path: envPath });

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY não encontrada! Verifique se o arquivo existe e tem a chave.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function testImageGen() {
  const modelName = "gemini-3-pro-image-preview";
  console.log(`🤖 Inicializando modelo: ${modelName}`);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const prompt = "A cute catgirl waifu wearing a futuristic hoodie, drinking boba tea, anime style, high quality 8k";
    console.log(`🎨 Enviando Prompt: "${prompt}"`);
    console.log("⏳ Aguardando a magia...");

    const result = await model.generateContent(prompt);
    const response = result.response;
    
    console.log("✅ Resposta recebida. Processando imagem...");
    
    if (response.candidates && response.candidates[0].content.parts) {
        const parts = response.candidates[0].content.parts;
        // Find the part that has inlineData (image)
        const imagePart = parts.find(p => p.inlineData);
        
        if (imagePart) {
            const base64Data = imagePart.inlineData.data;
            const buffer = Buffer.from(base64Data, 'base64');
            fs.writeFileSync('test_output.png', buffer);
            console.log("🎉 Imagem salva em test_output.png!");
        } else {
             console.log("⚠️ Nenhuma imagem encontrada nas parts. Partes:", JSON.stringify(parts, null, 2));
             // Sometimes it returns an executable code to generate image? No, Image model should be direct.
        }
    } else {
        console.dir(response, { depth: null });
    }

  } catch (error) {
    console.error("❌ Erro Fatal:", error.message);
    if (error.response) {
        console.error("Detalhes da resposta de erro:", JSON.stringify(error.response, null, 2));
    }
  }
}

testImageGen();
