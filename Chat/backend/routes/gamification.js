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

router.post('/purchase', async (req, res) => {
  try {
    const userId = req.userId;
    const { type, itemId, cost } = req.body || {};
    
    if (!type || !itemId || !cost) {
      return res.status(400).json({ error: 'Missing required fields: type, itemId, cost' });
    }
    
    // Get current state
    const state = (await getState(userId)) || (await getOrCreateDefault(userId));
    
    // Check if user has enough coins
    if (state.stats.coins < cost) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    
    // Check if already unlocked
    if (type === 'theme' && state.unlockedThemes?.includes(itemId)) {
      return res.status(400).json({ error: 'Theme already unlocked' });
    }
    if (type === 'persona' && state.unlockedPersonas?.includes(itemId)) {
      return res.status(400).json({ error: 'Persona already unlocked' });
    }
    
    // Deduct coins and add item
    const updatedStats = { ...state.stats, coins: state.stats.coins - cost };
    const updatedThemes = type === 'theme' ? [...(state.unlockedThemes || []), itemId] : state.unlockedThemes;
    const updatedPersonas = type === 'persona' ? [...(state.unlockedPersonas || []), itemId] : state.unlockedPersonas;
    
    // Save to database
    const updated = await saveState(userId, {
      stats: updatedStats,
      unlockedThemes: updatedThemes,
      unlockedPersonas: updatedPersonas,
      activePersonaId: state.activePersonaId
    });
    
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/achievements', async (req, res) => {
  try {
    const userId = req.userId;
    const { achievements } = req.body || {};
    
    if (!Array.isArray(achievements)) {
      return res.status(400).json({ error: 'achievements must be an array' });
    }
    
    // Get current state
    const state = (await getState(userId)) || (await getOrCreateDefault(userId));
    
    // Save achievements
    const updated = await saveState(userId, {
      stats: state.stats,
      unlockedThemes: state.unlockedThemes,
      unlockedPersonas: state.unlockedPersonas,
      activePersonaId: state.activePersonaId,
      achievements
    });
    
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
