import prisma from './prismaClient.js';

// Helper for BigInt fields
const toInt = (n) => Number(n); 

export const getState = async (userId) => {
  try {
    const row = await prisma.gamification.findUnique({
      where: { userId }
    });
    if (!row) return null;
    return {
      ...row,
      xp: row.xp || 0,
      coins: row.coins || 0,
      level: row.level || 1,
      stats: row.stats || {}, // Prisma handles Json
      unlockedThemes: row.unlockedThemes || [],
      unlockedPersonas: row.unlockedPersonas || [],
      achievements: row.achievements || [],
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
      stats: data.stats || existing?.stats || {},
      unlockedThemes: data.unlockedThemes || existing?.unlockedThemes || [],
      unlockedPersonas: data.unlockedPersonas || existing?.unlockedPersonas || [],
      achievements: data.achievements || existing?.achievements || [],
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
    
    // Return formatted
    return {
      ...row,
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
    stats: {},
    unlockedThemes: [],
    unlockedPersonas: [],
    activePersonaId: 'default'
  };
  // saveState handles upsert, so effectively creates it
  await saveState(userId, def);
  return def;
};

export const award = async (userId, rewards) => {
  const state = await getOrCreateDefault(userId);
  let { xp, coins } = state;
  
  if (rewards.xp) xp += rewards.xp;
  if (rewards.coins) coins += rewards.coins;
  
  const level = 1 + Math.floor(xp / 1000);
  
  const updates = {
    xp,
    coins,
    level
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
