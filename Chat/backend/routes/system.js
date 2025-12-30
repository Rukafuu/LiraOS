
import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { pcController } from '../services/pcControllerService.js';

const router = express.Router();

router.use(requireAuth);

router.get('/stats', async (req, res) => {
    try {
        // Only allow if running locally or user has permission (Singularity Tier checking logic here later)
        // For now, simple pass-through
        const stats = await pcController.getSystemStats();
        res.json(stats);
    } catch (error) {
        console.error('System Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch system stats' });
    }
});

export default router;
