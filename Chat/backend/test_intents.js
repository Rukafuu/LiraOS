// Usando fetch nativo do Node.js
// const fetch = require('node-fetch');

const API_URL = 'http://localhost:4000/api/chat/stream';
const ADMIN_USER_ID = 'usr_1766449245238_96a75426fe68'; // ID do admin logado

async function testIntent(name, message) {
    console.log(`\n--- Testando: ${name} ---`);
    console.log(`Mensagem: "${message}"`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                // Simulando autenticação via middleware (adicionei um hack temporário no chat.js? 
                // Ah, o chat.js pega req.userId. Na vida real vem do token. 
                // Mas para esse teste, se o backend exigir auth, vai falhar sem token.
                // O backend usa 'requireAuth'. Preciso de um token válido ou desabilitar auth temporariamente.
                // Vamos tentar sem token para ver se retorna 401, o que confirma que a rota existe.
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: message }],
                model: 'mistral', 
                attachments: [] // Sem imagem
            })
        });

        if (response.status === 401) {
            console.log("⚠️  Recebi 401 Unauthorized (Esperado se não passar token).");
            console.log("Para testar a lógica real, eu precisaria de um token válido.");
            return;
        }

        console.log(`Status: ${response.status}`);
        
        // Lendo o stream
        const body = await response.text();
        console.log("Preview da Resposta:", body.substring(0, 500));
        
        // Analisando a resposta para pistas
        if (body.includes("Gemini") || body.includes("read_project_file")) {
            console.log("✅ Roteamento: PARECE GEMINI/ADMIN (Detectou file intent)");
        } else if (body.includes("Mistral") || body.includes("agent_id")) {
             console.log("✅ Roteamento: PARECE MISTRAL AGENT");
        }

    } catch (error) {
        console.error("Erro:", error.message);
    }
}

async function run() {
    // Cenário 1: Arquivo
    await testIntent('COMANDO DE ARQUIVO', 'Lira, leia o arquivo backend/server.js por favor.');

    // Cenário 2: Conversa/Geral
    await testIntent('GERAL / IMAGEM', 'Crie uma imagem de um robô.');
}

run();
