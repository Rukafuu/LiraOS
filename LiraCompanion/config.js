/**
 * 🌐 Lira Companion - Configuration
 * 
 * Suporta tanto desenvolvimento local quanto produção (Railway)
 */

// Detectar ambiente
const isDev = process.env.NODE_ENV !== 'production';

// URLs configuráveis via env ou padrões
// URLs configuráveis via env ou padrões
// NOTA: Em produção (build), isDev pode ser falso negativo, então forçamos Railway como padrão se localhost não for detectado explicitamente
const BACKEND_HTTP_URL = process.env.BACKEND_URL || 'https://liraos-production.up.railway.app';
const BACKEND_WS_URL = process.env.BACKEND_WS_URL || 'wss://liraos-production.up.railway.app';

console.log('[CONFIG] Backend URL:', BACKEND_HTTP_URL);

module.exports = {
    BACKEND_HTTP_URL,
    BACKEND_WS_URL,
    isDev
};
