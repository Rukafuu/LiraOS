import express from 'express';
import { getState, saveState, getOrCreateDefault, award, getLeaderboard, claimQuest } from '../gamificationStore.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

async function ensureDailyQuests(userId, state) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  const currentQuests = state.stats?.dailyQuests?.quests || [];
  const lastUpdate = state.stats?.dailyQuests?.lastUpdate || '';

  // Return if already have today's quests
  if (currentQuests.length > 0 && lastUpdate === today) {
    return state;
  }

  // Generate 3 random quests
  const pool = [
    { id: 'q_msg_5', title: 'Faladora!', desc: 'Envie 5 mensagens no chat', target: 5, reward: 50, type: 'messages' },
    { id: 'q_img_1', title: 'Visão Artística', desc: 'Peça para gerar 1 imagem artística', target: 1, reward: 100, type: 'image' },
    { id: 'q_pro_2', title: 'Busca Profunda', desc: 'Faça 2 perguntas no modo Profundo', target: 2, reward: 80, type: 'pro' },
    { id: 'q_mood_1', title: 'Status Emocional', desc: 'Pergunte como a Lira está se sentindo', target: 1, reward: 30, type: 'chat' },
    { id: 'q_style_1', title: 'Estilista', desc: 'Abra a loja e mude seu tema', target: 1, reward: 40, type: 'settings' }
  ];

  // Shuffle and pick 3
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3).map(q => ({ ...q, progress: 0, claimed: false }));

  const newState = {
    ...state,
    stats: {
      ...state.stats,
      dailyQuests: {
        quests: selected,
        lastUpdate: today
      }
    }
  };

  await saveState(userId, newState);
  return newState;
}

router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    let state = (await getState(userId)) || (await getOrCreateDefault(userId));
    
    // Ensure daily quests are populated
    state = await ensureDailyQuests(userId, state);
    
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
    // Pass the entire body to award() so it can handle xp, coins, bond, messages, image, pro, etc.
    const updated = await award(userId, req.body || {});
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
    if (state.coins < cost) {
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
    const newCoins = state.coins - cost;
    const updatedThemes = type === 'theme' ? [...(state.unlockedThemes || []), itemId] : state.unlockedThemes;
    const updatedPersonas = type === 'persona' ? [...(state.unlockedPersonas || []), itemId] : state.unlockedPersonas;
    
    // Save to database
    const updated = await saveState(userId, {
      coins: newCoins,
      stats: state.stats,
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


router.post('/claim', async (req, res) => {
  try {
    const userId = req.userId;
    const { questId } = req.body;
    
    if (!questId) {
      return res.status(400).json({ error: 'Missing questId' });
    }
    
    const result = await claimQuest(userId, questId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    res.json(result);
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
