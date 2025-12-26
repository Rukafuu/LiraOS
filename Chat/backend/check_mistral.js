import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: 'backend/.env' });

const API_KEY = process.env.MISTRAL_API_KEY;

async function checkMistral() {
    console.log("🔑 Checking Mistral API Key...");
    console.log(`Key length: ${API_KEY ? API_KEY.length : 0}`);

    // 1. Testar Listar Modelos (Teste básico de Auth)
    console.log("\n📡 Listing Models...");
    try {
        const res = await fetch('https://api.mistral.ai/v1/models', {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        
        if (!res.ok) {
            console.error(`❌ Lista de modelos falhou: ${res.status} ${res.statusText}`);
            console.error(await res.text());
        } else {
            console.log("✅ Auth OK! Modelos disponíveis.");
            const data = await res.json();
            // console.log(data.data.map(m => m.id)); // Listar IDs
        }

    } catch (e) {
        console.error("❌ Erro de conexão:", e.message);
    }

    // 2. Testar Agentes (Se existir endpoint de listagem, geralmente /agents, mas a doc oficial é meio vaga sobre listar agents via API pública, vamos tentar completar com o ID direto).
    
    // Na verdade, a Mistral não tem endpoint público documentado para "listar meus agentes" via API Key padrão facilmente, mas tentar usar o agente num chat é o teste real.
    
    const AGENT_ID = process.env.MISTRAL_PREMIUM_AGENT_ID;
    console.log(`\n🤖 Testing Agent ID: ${AGENT_ID}`);

    try {
        const res = await fetch('https://api.mistral.ai/v1/agents/completions', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agent_id: AGENT_ID,
                messages: [{ role: 'user', content: 'Hello!' }]
            })
        });

        if (!res.ok) {
            console.error(`❌ Agente falhou: ${res.status} ${res.statusText}`);
            console.error(await res.text());
        } else {
            const data = await res.json();
            console.log("✅ Agente respondeu:", data.choices[0].message.content);
        }

    } catch (e) {
         console.error("❌ Erro ao chamar agente:", e.message);
    }
}

checkMistral();
