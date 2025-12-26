
import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { pcController } from '../services/pcControllerService.js';

const router = express.Router();

router.use(requireAuth);

/**
 * POST /api/system/command
 * Execute a natural language command on the host system
 */
router.post('/command', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ error: 'Command required' });

    const result = await pcController.handleInstruction(command);
    res.json({ result });
  } catch (error) {
    console.error('System command error:', error);
    res.status(500).json({ error: 'Failed to execute command' });
  }
});

export default router;
