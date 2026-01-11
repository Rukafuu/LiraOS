// Companion WebSocket Module
// Import this in server.js to enable companion support

import { WebSocketServer } from 'ws';

let wss = null;
const companions = new Set();

export function initCompanionWebSocket(server) {
    if (wss) {
        console.log('[COMPANION] WebSocket already initialized');
        return;
    }

    wss = new WebSocketServer({ noServer: true });

    wss.on('connection', (ws, request) => {
        console.log('🎭 Lira Companion connected!');
        companions.add(ws);
        
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'welcome',
            message: 'Connected to Lira Backend!',
            timestamp: Date.now()
        }));
        
        // Handle messages from companion
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('[COMPANION] Message:', message);
                
                // Handle different message types
                if (message.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                }
            } catch (e) {
                console.error('[COMPANION] Failed to parse message:', e);
            }
        });
        
        ws.on('close', () => {
            console.log('🎭 Companion disconnected');
            companions.delete(ws);
        });
        
        ws.on('error', (err) => {
            console.error('[COMPANION] WebSocket error:', err);
            companions.delete(ws);
        });
    });

    // Upgrade HTTP to WebSocket for /companion endpoint
    server.on('upgrade', (request, socket, head) => {
        if (request.url === '/companion' || request.url === '/companion/') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        }
    });

    console.log('🎭 Companion WebSocket initialized on /companion');
}

// Broadcast function for sending messages to all companions
export function broadcastToCompanions(message) {
    if (!wss) {
        console.warn('[COMPANION] WebSocket not initialized, cannot broadcast');
        return;
    }
    
    const data = JSON.stringify(message);
    let sent = 0;
    
    companions.forEach((ws) => {
        if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(data);
            sent++;
        }
    });
    
    if (sent > 0) {
        console.log(`[COMPANION] Broadcasted to ${sent} companion(s):`, message.type);
    }
}

// Make it globally available
if (typeof global !== 'undefined') {
    global.broadcastToCompanions = broadcastToCompanions;
}
