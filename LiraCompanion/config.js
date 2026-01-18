/**
 * 🌐 Lira Companion - Configuration
 * 
 * Suporta tanto desenvolvimento local quanto produção (Railway)
 */

// Detectar ambiente
const isDev = process.env.NODE_ENV !== 'production';

// URLs configuráveis via env ou padrões
const BACKEND_HTTP_URL = process.env.BACKEND_URL || (isDev 
    ? 'http://127.0.0.1:4000'
    : 'https://liraos-production.up.railway.app' // ← COLOQUE SEU URL DO RAILWAY AQUI
);

const BACKEND_WS_URL = process.env.BACKEND_WS_URL || (isDev
    ? 'ws://127.0.0.1:4000'
    : 'wss://liraos-production.up.railway.app' // ← COLOQUE SEU URL DO RAILWAY AQUI
);

module.exports = {
    BACKEND_HTTP_URL,
    BACKEND_WS_URL,
    isDev
};
