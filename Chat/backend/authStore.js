import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import db from './db/index.js';

async function hashPassword(password) {
  // Bcrypt generates its own salt and includes it in the hash string
  const hash = await bcrypt.hash(password, 10);
  return { salt: null, hash };
}

export function getUserByEmail(email) {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)');
    const user = stmt.get(email || '');
    if (!user) return null;
    
    // Adapt to match expected object structure
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      passwordHash: user.password_hash,
      passwordSalt: user.password_salt,
      avatar: user.avatar,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      loginCount: user.login_count,
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
      plan: user.plan || 'free',
      discordId: user.discordId
    };
  } catch (e) {
    console.error('getUserByEmail error:', e);
    return null;
  }
}

export function getUserByDiscordId(discordId) {
    try {
      const stmt = db.prepare('SELECT * FROM users WHERE discordId = ?');
      const user = stmt.get(discordId || '');
      if (!user) return null;
      
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        // ... include other fields if needed for auth check
        plan: user.plan || 'free',
        discordId: user.discordId
      };
    } catch (e) {
      console.error('getUserByDiscordId error:', e);
      return null;
    }
}

export async function createUser(email, username, password) {
  if (getUserByEmail(email)) return null;
  
  // Async hash (non-blocking)
  const { hash } = await hashPassword(password);
  const id = `usr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const now = Date.now();
  
  try {
    const stmt = db.prepare(`
      INSERT INTO users (id, email, username, password_hash, password_salt, created_at, last_login, login_count, preferences, plan)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, '{}', 'free')
    `);
    
    // Salt is now null/empty for bcrypt users
    stmt.run(id, email.toLowerCase(), username, hash, '', now);
    
    return {
      id,
      email: email.toLowerCase(),
      username,
      passwordHash: hash,
      passwordSalt: '',
      createdAt: now,
      lastLogin: 0,
      loginCount: 0,
      plan: 'free'
    };
  } catch (e) {
    console.error('createUser error:', e);
    return null;
  }
}

export async function verifyPassword(user, password) {
  try {
    return await bcrypt.compare(password, user.passwordHash);
  } catch (e) {
    console.error('verifyPassword error:', e);
    return false;
  }
}

export function updateLoginStats(email) {
  try {
    const user = getUserByEmail(email);
    if (!user) return null;
    
    const now = Date.now();
    const stmt = db.prepare(`
      UPDATE users 
      SET last_login = ?, login_count = login_count + 1 
      WHERE lower(email) = lower(?)
    `);
    stmt.run(now, email);
    
    return getUserByEmail(email);
  } catch (e) {
    console.error('updateLoginStats error:', e);
    return null;
  }
}

export function getUserById(userId) {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(userId);
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      passwordHash: user.password_hash,
      passwordSalt: user.password_salt,
      avatar: user.avatar,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      loginCount: user.login_count,
      preferences: user.preferences ? JSON.parse(user.preferences) : {},
      plan: user.plan || 'free',
      discordId: user.discordId
    };
  } catch (e) {
    console.error('getUserById error:', e);
    return null;
  }
}

export function updateUser(userId, updates) {
  try {
    const user = getUserById(userId);
    if (!user) return null;
    
    const fields = [];
    const values = [];
    
    if (updates.username !== undefined) {
      fields.push('username = ?');
      values.push(updates.username);
    }
    if (updates.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(updates.avatar);
    }
    if (updates.preferences !== undefined) {
      fields.push('preferences = ?');
      values.push(JSON.stringify(updates.preferences));
    }
    if (updates.plan !== undefined) {
      fields.push('plan = ?');
      values.push(updates.plan);
    }
    if (updates.discordId !== undefined) {
      fields.push('discordId = ?');
      values.push(updates.discordId);
    }
    
    if (fields.length === 0) return user;
    
    values.push(userId);
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
    
    return getUserById(userId);
  } catch (e) {
    console.error('updateUser error:', e);
    return null;
  }
}

// Refresh Tokens
const refreshTokens = new Map();

export function issueRefreshToken(userId) {
  const token = `rt_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = Date.now() + 30 * 24 * 3600 * 1000; // 30 days
  refreshTokens.set(token, { userId, expiresAt });
  
  try {
    const stmt = db.prepare(`
      INSERT INTO refresh_tokens (token, userId, createdAt, expiresAt, revoked)
      VALUES (?, ?, ?, ?, 0)
    `);
    stmt.run(token, userId, Date.now(), expiresAt);
  } catch (e) {
    console.error('issueRefreshToken DB error:', e);
  }
  
  return { token, expiresAt };
}

export function verifyRefreshToken(token) {
  try {
    const stmt = db.prepare('SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0');
    const rt = stmt.get(token);
    if (!rt) return null;
    if (Date.now() > rt.expiresAt) return null;
    return { userId: rt.userId, expiresAt: rt.expiresAt };
  } catch (e) {
    console.error('verifyRefreshToken error:', e);
    return null;
  }
}

export function revokeRefreshToken(token) {
  try {
    const stmt = db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?');
    stmt.run(token);
    refreshTokens.delete(token);
    return true;
  } catch (e) {
    console.error('revokeRefreshToken error:', e);
    return false;
  }
}

// Password Recovery
export function createRecoverCode(email) {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
  
  try {
    const stmt = db.prepare(`
      INSERT INTO recover_codes (email, code, expiresAt, used)
      VALUES (?, ?, ?, 0)
    `);
    stmt.run(email.toLowerCase(), code, expiresAt);
    return { code, expiresAt };
  } catch (e) {
    console.error('createRecoverCode error:', e);
    return null;
  }
}

export function consumeRecoverCode(email, code) {
  try {
    const stmt = db.prepare('SELECT * FROM recover_codes WHERE lower(email) = lower(?) AND code = ? ORDER BY expiresAt DESC LIMIT 1');
    const rc = stmt.get(email, code);
    if (!rc) return false;
    if (rc.used) return false;
    if (Date.now() > rc.expiresAt) return false;
    
    const upd = db.prepare('UPDATE recover_codes SET used = 1 WHERE email = ? AND code = ?');
    upd.run(email.toLowerCase(), code);
    
    return true;
  } catch (e) {
    console.error('consumeRecoverCode error:', e);
    return false;
  }
}

// Admin check
const ADMIN_USER_ID = 'usr_1766449245238_96a75426fe68';

export function isAdmin(userId) {
  return userId === ADMIN_USER_ID;
}

// Set new password
export async function setPassword(email, newPassword) {
  try {
    const { hash } = await hashPassword(newPassword);
    const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE lower(email) = lower(?)');
    stmt.run(hash, email);
    return true;
  } catch (e) {
    console.error('setPassword error:', e);
    return false;
  }
}
