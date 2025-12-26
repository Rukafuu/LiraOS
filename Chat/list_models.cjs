const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Carregar .env da pasta backend
const envPath = path.join(__dirname, 'backend', '.env');
dotenv.config({ path: envPath });

console.log("🔑 API Key carregada:", process.env.GEMINI_API_KEY ? "SIM" : "NÃO");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listModels() {
    try {
        console.log("📡 Buscando modelos disponíveis...");
        
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.models) {
            console.log("\n✅ Modelos Disponíveis:");
            let fileContent = "Available Models:\n";
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    const line = `- ${m.name.replace('models/', '')} (${m.version}) [Methods: ${m.supportedGenerationMethods.join(', ')}]`;
                    console.log(line);
                    fileContent += line + "\n";
                }
            });
             fs.writeFileSync('models.txt', fileContent);
             console.log("✅ Lista salva em models.txt");
        } else {
            console.error("❌ Erro ao listar:", data);
        }
        
    } catch (e) {
        console.error("❌ Exceção:", e);
    }
}

listModels();
