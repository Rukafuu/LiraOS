const nodemailer = require('./backend/node_modules/nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Carrega variáveis de ambiente
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function test() {
    console.log("🔍 Diagnóstico SMTP Gmail");
    console.log("User:", process.env.SMTP_USER);
    // Mascara a senha para log
    console.log("Pass:", process.env.SMTP_PASS ? (process.env.SMTP_PASS.length > 5 ? "******" : "CURTO/INVALIDO") : "MISSING");
    
    // 1. DNS Check
    console.log("\n📡 DNS Lookup smtp.gmail.com:");
    try {
        const addresses = await dns.promises.resolve('smtp.gmail.com');
        console.log("IPs:", addresses);
    } catch (e) {
        console.error("DNS Error:", e.message);
    }

    // 2. Transport Test (Usando config explícita em vez de 'service' para debug)
    console.log("\n📨 Testando conexão (Porta 587 STARTTLS)...");
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: { rejectUnauthorized: false }, // Ignora erro de cert self-signed se houver proxy
        debug: true,
        logger: true // Mostra logs do protocolo SMTP no console
    });

    try {
        await transporter.verify();
        console.log("✅ Conexão SMTP 587 BEM SUCEDIDA!");
    } catch (error) {
        console.error("❌ Falha na conexão 587:", error.message);
    }
}

test();
