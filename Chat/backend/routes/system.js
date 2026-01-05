import express from 'express';
// import { requireAuth } from '../middlewares/authMiddleware.js'; 
import { pcController } from '../services/pcControllerService.js';

const router = express.Router();

/**
 * SSE Endpoint for Local PC Agent (Lira Link)
 * Client should connect here to receive commands
 */
router.get('/connect', (req, res) => {
    // Basic formatting for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Register this connection
    pcController.addClient(res);

    // Keep alive heartbeat
    const interval = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 15000);

    req.on('close', () => clearInterval(interval));
});

router.post('/control', async (req, res) => {
    try {
        const { action, payload } = req.body;
        // action: 'open', 'volume', 'media', 'type'
        
        let result = { success: false };

        console.log(`[SYSTEM] Action: ${action}, Payload: ${payload}`);

        switch (action) {
            case 'open':
                result = await pcController.openApp(payload);
                break;
            case 'volume':
                // payload: 'up', 'down', 'mute'
                result = await pcController.setVolume(payload);
                break;
            case 'media':
                // payload: 'playpause', 'next', 'prev'
                result = await pcController.mediaControl(payload);
                break;
            case 'type':
                result = await pcController.typeText(payload);
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        res.json(result);

    } catch (error) {
        console.error('[SYSTEM CTRL ERROR]', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/stats', async (req, res) => {
    res.json({ status: 'online', uptime: process.uptime() });
});

export default router;
