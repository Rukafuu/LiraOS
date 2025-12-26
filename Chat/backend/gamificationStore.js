import db from './db/index.js';

export const getState = (userId) => {
  try {
    const row = db.prepare('SELECT * FROM gamification WHERE userId = ?').get(userId);
    if (!row) return null;
    return {
      ...row,
      stats: JSON.parse(row.stats || '{}'),
      unlockedThemes: JSON.parse(row.unlockedThemes || '[]'),
      unlockedPersonas: JSON.parse(row.unlockedPersonas || '[]'),
      achievements: JSON.parse(row.achievements || '[]')
    };
  } catch (e) {
    console.error('Gamification Get Error:', e);
    return null;
  }
};

export const saveState = (userId, data) => {
  try {
    const existing = getState(userId);
    const now = Date.now();
    
    const newState = {
      userId,
      xp: data.xp !== undefined ? data.xp : (existing?.xp || 0),
      coins: data.coins !== undefined ? data.coins : (existing?.coins || 0),
      level: data.level !== undefined ? data.level : (existing?.level || 1),
      stats: JSON.stringify(data.stats || existing?.stats || {}),
      unlockedThemes: JSON.stringify(data.unlockedThemes || existing?.unlockedThemes || []),
      unlockedPersonas: JSON.stringify(data.unlockedPersonas || existing?.unlockedPersonas || []),
      achievements: JSON.stringify(data.achievements || existing?.achievements || []),
      activePersonaId: data.activePersonaId || existing?.activePersonaId || 'default',
      updatedAt: now
    };

    const stmt = db.prepare(`
      INSERT INTO gamification (userId, xp, coins, level, stats, unlockedThemes, unlockedPersonas, achievements, activePersonaId, updatedAt)
      VALUES (@userId, @xp, @coins, @level, @stats, @unlockedThemes, @unlockedPersonas, @achievements, @activePersonaId, @updatedAt)
      ON CONFLICT(userId) DO UPDATE SET
        xp = @xp,
        coins = @coins,
        level = @level,
        stats = @stats,
        unlockedThemes = @unlockedThemes,
        unlockedPersonas = @unlockedPersonas,
        achievements = @achievements,
        activePersonaId = @activePersonaId,
        updatedAt = @updatedAt
    `);
    
    stmt.run(newState);
    return getState(userId);
  } catch (e) {
    console.error('Gamification Save Error:', e);
    throw e;
  }
};

export const getOrCreateDefault = (userId) => {
  const existing = getState(userId);
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
  saveState(userId, def);
  return def;
};

export const award = (userId, rewards) => {
  const state = getOrCreateDefault(userId);
  let { xp, coins } = state;
  
  if (rewards.xp) xp += rewards.xp;
  if (rewards.coins) coins += rewards.coins;
  
  // Simple level up logic: level = 1 + floor(sqrt(xp)/10) or similar
  // Let's stick to simple: level up every 1000 XP
  const level = 1 + Math.floor(xp / 1000);
  
  const updates = {
    ...state,
    xp,
    coins,
    level
  };
  
  return saveState(userId, updates);
};

export const getLeaderboard = () => {
  try {
    // Top 10 by XP (Excluding Admins/God Mode users with Level >= 50)
    const rows = db.prepare('SELECT userId, xp, level, avatar, username FROM gamification JOIN users ON gamification.userId = users.id WHERE gamification.level < 50 ORDER BY xp DESC LIMIT 10').all();
    return rows;
  } catch (e) {
    // If join fails (maybe user deleted?), fallback to just gamification
    const rows = db.prepare('SELECT userId, xp, level FROM gamification WHERE level < 50 ORDER BY xp DESC LIMIT 10').all();
    return rows;
  }
};
