import express from 'express';
// import { requireAuth } from '../middlewares/authMiddleware.js'; // Optional security
import { pcController } from '../services/pcControllerService.js';

const router = express.Router();

// router.use(requireAuth);

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

// System Stats (CPU/RAM) - Future Expansion?
router.get('/stats', async (req, res) => {
    res.json({ status: 'online', uptime: process.uptime() });
});

export default router;
