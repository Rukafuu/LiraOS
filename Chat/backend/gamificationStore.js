import prisma from './prismaClient.js';
import { isAdmin } from './user_store.js';

// Helper for BigInt fields
const toInt = (n) => Number(n); 

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function generateDailyQuests() {
  return {
    date: getTodayDate(),
    quests: [
      { id: 'daily_login', title: 'Login Diário', desc: 'Entre no sistema hoje', target: 1, progress: 1, reward: 50, claimed: false, type: 'login' },
      { id: 'msg_10', title: 'Conversador', desc: 'Envie 10 mensagens', target: 10, progress: 0, reward: 100, claimed: false, type: 'message_count' },
      { id: 'xp_200', title: 'Evolução', desc: 'Ganhe 200 XP', target: 200, progress: 0, reward: 150, claimed: false, type: 'xp_gain' }
    ]
  };
}

async function checkDailyRotation(userId, currentStats) {
    const today = getTodayDate();
    let stats = currentStats || {};
    let quests = stats.dailyQuests;

    if (!quests || quests.date !== today) {
        quests = generateDailyQuests();
        stats = { ...stats, dailyQuests: quests };
        
        try {
            await prisma.gamification.update({
                where: { userId },
                data: { statsStr: JSON.stringify(stats) }
            });
        } catch (e) {
            // Ignore if record doesn't exist yet (handled by saveState)
        }
    }
    return stats;
}

export const getState = async (userId) => {
  try {
    const isAdm = await isAdmin(userId);
    const row = await prisma.gamification.findUnique({
      where: { userId }
    });
    
    // Helper to safely parse JSON strings
    const safeParse = (value, fallback = {}) => {
      if (!value) return fallback;
      if (typeof value === 'object') return value;
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    };
    
    if (isAdm) {
        const adminStats = safeParse(row?.statsStr, {});
        const adminThemes = safeParse(row?.unlockedThemesStr, []);
        const adminPersonas = safeParse(row?.unlockedPersonasStr, []);
        const adminAchievements = safeParse(row?.achievementsStr, []);
        
        return {
          userId,
          xp: 9999999,
          coins: 9999999,
          level: 1000, 
          stats: adminStats, 
          unlockedThemes: adminThemes, 
          unlockedPersonas: adminPersonas,
          achievements: adminAchievements,
          activePersonaId: row?.activePersonaId || 'default',
          updatedAt: Date.now()
        };
    }

    if (!row) return null;
    
    // Parse all JSON string fields
    const parsedStats = safeParse(row.statsStr, {});
    const stats = await checkDailyRotation(userId, parsedStats);

    return {
      userId: row.userId,
      xp: row.xp || 0,
      coins: row.coins || 0,
      level: row.level || 1,
      stats: stats, 
      unlockedThemes: safeParse(row.unlockedThemesStr, []),
      unlockedPersonas: safeParse(row.unlockedPersonasStr, []),
      achievements: safeParse(row.achievementsStr, []),
      activePersonaId: row.activePersonaId || 'default',
      updatedAt: toInt(row.updatedAt)
    };
  } catch (e) {
    console.error('Gamification Get Error:', e);
    return null;
  }
};

export const saveState = async (userId, data) => {
  try {
    const existing = await getState(userId);
    const now = Date.now();
    
    // Construct data
    const upsertData = {
      xp: data.xp !== undefined ? data.xp : (existing?.xp || 0),
      coins: data.coins !== undefined ? data.coins : (existing?.coins || 0),
      level: data.level !== undefined ? data.level : (existing?.level || 1),
      statsStr: JSON.stringify(data.stats || existing?.stats || {}),
      unlockedThemesStr: JSON.stringify(data.unlockedThemes || existing?.unlockedThemes || []),
      unlockedPersonasStr: JSON.stringify(data.unlockedPersonas || existing?.unlockedPersonas || []),
      achievementsStr: JSON.stringify(data.achievements || existing?.achievements || []),
      activePersonaId: data.activePersonaId || existing?.activePersonaId || 'default',
      updatedAt: now
    };

    const row = await prisma.gamification.upsert({
      where: { userId },
      update: upsertData,
      create: {
        userId,
        ...upsertData
      }
    });
    
    // Helper to safely parse JSON strings for return value
    const safeParse = (value, fallback = {}) => {
      if (!value) return fallback;
      if (typeof value === 'object') return value;
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    };
    
    return {
      userId: row.userId,
      xp: row.xp,
      coins: row.coins,
      level: row.level,
      stats: safeParse(row.statsStr, {}),
      unlockedThemes: safeParse(row.unlockedThemesStr, []),
      unlockedPersonas: safeParse(row.unlockedPersonasStr, []),
      achievements: safeParse(row.achievementsStr, []),
      activePersonaId: row.activePersonaId,
      updatedAt: toInt(row.updatedAt)
    };
  } catch (e) {
    console.error('Gamification Save Error:', e);
    throw e;
  }
};

export const getOrCreateDefault = async (userId) => {
  const existing = await getState(userId);
  if (existing) return existing;
  
  const def = {
    userId,
    xp: 0,
    coins: 0,
    level: 1,
    stats: { dailyQuests: generateDailyQuests() },
    unlockedThemes: [],
    unlockedPersonas: [],
    activePersonaId: 'default'
  };
  await saveState(userId, def);
  return def;
};

export const claimQuest = async (userId, questId) => {
    const state = await getOrCreateDefault(userId);
    let { xp, coins, stats } = state;
    
    stats = await checkDailyRotation(userId, stats);
    
    const quests = stats.dailyQuests.quests;
    const questIndex = quests.findIndex(q => q.id === questId);
    
    if (questIndex === -1) return { success: false, message: 'Quest not found' };
    
    const quest = quests[questIndex];
    if (quest.claimed) return { success: false, message: 'Already claimed' };
    if (quest.progress < quest.target) return { success: false, message: 'Not completed' };
    
    // Grant Reward
    quest.claimed = true;
    coins += quest.reward;
    
    // Save
    await saveState(userId, { coins, stats });
    return { success: true, reward: quest.reward };
};

export const award = async (userId, rewards, plan = 'free') => {
  const multipliers = {
    free: 1.0,
    observer: 1.0, 
    vega: 1.1,
    sirius: 1.5,
    antares: 2.0,
    supernova: 5.0,
    singularity: 10.0
  };
  const mult = multipliers[plan.toLowerCase()] || 1.0;

  const state = await getOrCreateDefault(userId);
  let { xp, coins, stats } = state;
  let newStats = await checkDailyRotation(userId, stats);
  
  // Calculate Generic Rewards
  const xpGain = rewards.xp ? Math.round(rewards.xp * mult) : 0;
  if (rewards.xp) xp += xpGain;
  if (rewards.coins) coins += rewards.coins;
  
  // Update Quests Progress
  const todayQuests = newStats.dailyQuests?.quests || [];
  let questUpdated = false;

  todayQuests.forEach(q => {
      if (q.claimed) return;
      if (q.progress >= q.target) return;
      
      let increment = 0;
      if (q.type === 'message_count' && rewards.xp > 0) increment = 1; 
      if (q.type === 'xp_gain' && xpGain > 0) increment = xpGain;
      // Login is auto-1 on generation

      if (increment > 0) {
          q.progress = Math.min(q.target, q.progress + increment);
          questUpdated = true;
      }
  });
  
  const level = 1 + Math.floor(xp / 1000);
  
  const updates = {
    xp,
    coins,
    level,
    stats: newStats
  };
  
  return await saveState(userId, updates);
};

export const getLeaderboard = async () => {
  try {
    // Manual join to avoid schema dependency for now
    const topGamers = await prisma.gamification.findMany({
      where: { level: { lt: 50 } },
      orderBy: { xp: 'desc' },
      take: 10
    });
    
    // Fetch users
    const results = [];
    for (const g of topGamers) {
      const user = await prisma.user.findUnique({
        where: { id: g.userId },
        select: { username: true, avatar: true }
      });
      if (user) {
        results.push({
          userId: g.userId,
          xp: g.xp,
          level: g.level,
          username: user.username,
          avatar: user.avatar
        });
      }
    }
    return results;
  } catch (e) {
    console.error('getLeaderboard error', e);
    return [];
  }
};
