import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from './prismaClient.js';

// Helper to sanitize and format user object
function mapUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    passwordHash: user.passwordHash,
    passwordSalt: user.passwordSalt || '',
    avatar: user.avatar,
    createdAt: Number(user.createdAt),
    lastLogin: Number(user.lastLogin || 0),
    loginCount: user.loginCount || 0,
    preferences: user.preferences || {},
    plan: user.plan || 'free',
    discordId: user.discordId,
    googleRefreshToken: user.googleRefreshToken // Internal use, do not leak to frontend generally
  };
}

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  return { salt: null, hash };
}

export async function getUserByEmail(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    return mapUser(user);
  } catch (e) {
    console.error('getUserByEmail error:', e);
    return null;
  }
}

export async function getUserByDiscordId(discordId) {
  try {
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });
    return mapUser(user);
  } catch (e) {
    console.error('getUserByDiscordId error:', e);
    return null;
  }
}

export async function createUser(email, username, password) {
  const existing = await getUserByEmail(email);
  if (existing) return null;

  const { hash } = await hashPassword(password);
  const id = `usr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  const now = Date.now();

  try {
    const user = await prisma.user.create({
      data: {
        id,
        email: email.toLowerCase(),
        username,
        passwordHash: hash,
        passwordSalt: '',
        createdAt: now,
        lastLogin: 0,
        loginCount: 0,
        preferences: {},
        plan: 'free'
      }
    });
    return mapUser(user);
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

export async function updateLoginStats(email) {
  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        lastLogin: Date.now(),
        loginCount: { increment: 1 }
      }
    });
    return mapUser(user);
  } catch (e) {
    console.error('updateLoginStats error:', e);
    return null;
  }
}

export async function getUserById(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    return mapUser(user);
  } catch (e) {
    console.error('getUserById error:', e);
    return null;
  }
}

export async function updateUser(userId, updates) {
  try {
    const data = {};
    if (updates.username !== undefined) data.username = updates.username;
    if (updates.avatar !== undefined) data.avatar = updates.avatar;
    if (updates.preferences !== undefined) data.preferences = updates.preferences;
    if (updates.plan !== undefined) data.plan = updates.plan;
    if (updates.discordId !== undefined) data.discordId = updates.discordId;

    if (Object.keys(data).length === 0) return getUserById(userId);

    const user = await prisma.user.update({
      where: { id: userId },
      data
    });
    return mapUser(user);
  } catch (e) {
    console.error('updateUser error:', e);
    return null;
  }
}

// Refresh Tokens
const refreshTokens = new Map();

export async function issueRefreshToken(userId) {
  const token = `rt_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = Date.now() + 30 * 24 * 3600 * 1000; // 30 days
  refreshTokens.set(token, { userId, expiresAt });

  try {
    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        createdAt: Date.now(),
        expiresAt,
        revoked: 0
      }
    });
  } catch (e) {
    console.error('issueRefreshToken DB error:', e);
  }
  
  return { token, expiresAt };
}

export async function verifyRefreshToken(token) {
  try {
    const rt = await prisma.refreshToken.findFirst({
        where: { 
            token,
            revoked: 0
        }
    });

    if (!rt) return null;
    if (Date.now() > Number(rt.expiresAt)) return null;
    
    return { userId: rt.userId, expiresAt: Number(rt.expiresAt) };
  } catch (e) {
    console.error('verifyRefreshToken error:', e);
    return null;
  }
}

export async function revokeRefreshToken(token) {
  try {
    await prisma.refreshToken.update({
        where: { token },
        data: { revoked: 1 }
    });
    refreshTokens.delete(token);
    return true;
  } catch (e) {
    console.error('revokeRefreshToken error:', e);
    return false;
  }
}

// Password Recovery
export async function createRecoverCode(email) {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
  
  try {
    await prisma.recoverCode.create({
        data: {
            email: email.toLowerCase(),
            code,
            expiresAt,
            used: 0
        }
    });
    return { code, expiresAt };
  } catch (e) {
    console.error('createRecoverCode error:', e);
    return null;
  }
}

export async function consumeRecoverCode(email, code) {
  try {
    const rc = await prisma.recoverCode.findFirst({
        where: {
            email: { equals: email, mode: 'insensitive' },
            code
        },
        orderBy: {
            expiresAt: 'desc'
        }
    });

    if (!rc) return false;
    if (rc.used) return false;
    if (Date.now() > Number(rc.expiresAt)) return false;
    
    await prisma.recoverCode.updateMany({
        where: {
            email: { equals: email, mode: 'insensitive' },
            code, // assume code matches
            expiresAt: rc.expiresAt
        },
        data: { used: 1 }
    });
    
    return true;
  } catch (e) {
    console.error('consumeRecoverCode error:', e);
    return false;
  }
}

const ADMIN_USER_ID = 'usr_1766449245238_96a75426fe68';
// Load admins from ENV + Hardcoded defaults
const envAdmins = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()) : [];
export const ADMIN_EMAILS = [...envAdmins, 'lucas.frischeisen@gmail.com', 'amarinthlira@gmail.com'];

export async function isAdmin(userId) {
  if (userId === ADMIN_USER_ID) return true;
  if (userId === 'user_1734661833589') return true; // Pai/Admin override
  const user = await getUserById(userId);
  return user && ADMIN_EMAILS.includes(user.email);
}

export async function setPassword(email, newPassword) {
  try {
    const { hash } = await hashPassword(newPassword);
    await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { passwordHash: hash }
    });
    return true;
  } catch (e) {
    console.error('setPassword error:', e);
    return false;
  }
}
