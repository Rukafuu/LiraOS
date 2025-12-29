const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

// Load Env
const envPath = path.join(__dirname, 'backend', '.env');
dotenv.config({ path: envPath });

console.log("🔑 API Key presente:", !!process.env.GEMINI_API_KEY);

async function testGen() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ Sem chave API.");
        return;
    }

    const modelName = 'gemini-3-pro-image-preview'; // Nome que estamos tentando usar
    
    console.log(`🚀 Testando geração com modelo: ${modelName}`);

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        console.log("⏳ Enviando request...");
        const result = await model.generateContent("A cute robot painting a canvas");
        
        console.log("✅ Resposta recebida!");
        const response = await result.response;
        // console.log("📦 Resposta raw:", JSON.stringify(response, null, 2));

        if (response.candidates && response.candidates[0].content.parts) {
            console.log("🎉 Imagem gerada com sucesso (base64 recebida)!");
        } else {
             console.log("⚠️ Resposta recebida mas sem partes de conteúdo esperadas.");
        }

    } catch (e) {
        console.error("❌ Falha na geração:");
        console.error(e.message);
        if (e.message.includes("404")) {
            console.error("📌 O modelo não foi encontrado. Verifique o nome ou permissões.");
        }
    }
}

testGen();
