import express from 'express';
import { getState, saveState, getOrCreateDefault, award, getLeaderboard } from '../gamificationStore.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    // getOrCreateDefault already calls saveState internally if needed
    const state = (await getState(userId)) || (await getOrCreateDefault(userId));
    res.json(state);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { stats, unlockedThemes, unlockedPersonas, activePersonaId } = req.body || {};
    const updated = await saveState(userId, { stats, unlockedThemes, unlockedPersonas, activePersonaId });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/award', async (req, res) => {
  try {
    const userId = req.userId;
    const { xp = 0, coins = 0, bond = 0, messageInc = 0 } = req.body || {};
    const updated = await award(userId, { xp, coins, bond, messageInc });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const list = await getLeaderboard();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
