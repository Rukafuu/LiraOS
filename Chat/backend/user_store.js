import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import prisma from './prismaClient.js';

// Helper to convert BigInt to Number
const toInt = (n) => Number(n || 0);

function mapUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    passwordHash: user.passwordHash,
    passwordSalt: user.passwordSalt || '',
    avatar: user.avatar,
    createdAt: toInt(user.createdAt),
    lastLogin: toInt(user.lastLogin),
    loginCount: user.loginCount || 0,
    preferences: safeParseJSON(user.preferencesStr, {}),
    plan: user.plan || 'free',
    discordId: user.discordId,
    githubToken: user.githubToken,
    githubOwner: user.githubOwner,
    githubRepo: user.githubRepo,
    stripeCustomerId: user.stripeCustomerId
  };
}

function safeParseJSON(str, fallback = {}) {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  return { salt: null, hash };
}

// ─────── USER CRUD (Prisma/PostgreSQL) ───────

export async function getUserByEmail(email) {
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return mapUser(user);
  } catch (e) {
    console.error('getUserByEmail error:', e);
    return null;
  }
}

export async function getUserByDiscordId(discordId) {
  try {
    const user = await prisma.user.findUnique({ where: { discordId } });
    return mapUser(user);
  } catch (e) {
    console.error('getUserByDiscordId error:', e);
    return null;
  }
}

export async function getUserById(userId) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return mapUser(user);
  } catch (e) {
    console.error('getUserById error:', e);
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
        lastLogin: BigInt(0),
        loginCount: 0,
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
    const user = await getUserByEmail(email);
    if (!user) return null;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: BigInt(Date.now()),
        loginCount: (user.loginCount || 0) + 1
      }
    });
    return mapUser(updated);
  } catch (e) {
    console.error('updateLoginStats error:', e);
    return null;
  }
}

export async function updateUser(userId, updates) {
  try {
    if (Object.keys(updates).length === 0) return getUserById(userId);

    // Map JS object fields to Prisma column names
    const prismaData = {};
    if (updates.email !== undefined) prismaData.email = updates.email;
    if (updates.username !== undefined) prismaData.username = updates.username;
    if (updates.avatar !== undefined) prismaData.avatar = updates.avatar;
    if (updates.plan !== undefined) prismaData.plan = updates.plan;
    if (updates.discordId !== undefined) prismaData.discordId = updates.discordId;
    if (updates.githubToken !== undefined) prismaData.githubToken = updates.githubToken;
    if (updates.githubOwner !== undefined) prismaData.githubOwner = updates.githubOwner;
    if (updates.githubRepo !== undefined) prismaData.githubRepo = updates.githubRepo;
    if (updates.googleRefreshToken !== undefined) prismaData.googleRefreshToken = updates.googleRefreshToken;
    if (updates.passwordHash !== undefined) prismaData.passwordHash = updates.passwordHash;
    if (updates.lastLogin !== undefined) prismaData.lastLogin = BigInt(updates.lastLogin);
    if (updates.loginCount !== undefined) prismaData.loginCount = updates.loginCount;
    if (updates.warnings !== undefined) prismaData.warnings = updates.warnings;
    if (updates.isBanned !== undefined) prismaData.isBanned = updates.isBanned;
    if (updates.stripeCustomerId !== undefined) prismaData.stripeCustomerId = updates.stripeCustomerId;
    if (updates.preferences !== undefined) prismaData.preferencesStr = typeof updates.preferences === 'string' ? updates.preferences : JSON.stringify(updates.preferences);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: prismaData
    });
    return mapUser(updated);
  } catch (e) {
    console.error('updateUser error:', e);
    return null;
  }
}

// ─────── REFRESH TOKENS (Prisma) ───────

export async function issueRefreshToken(userId) {
  const token = `rt_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = Date.now() + 30 * 24 * 3600 * 1000; // 30 days

  try {
    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        createdAt: BigInt(Date.now()),
        expiresAt: BigInt(expiresAt),
        revoked: 0
      }
    });
  } catch (e) {
    console.error('issueRefreshToken error:', e);
  }

  return { token, expiresAt };
}

export async function verifyRefreshToken(token) {
  try {
    const rt = await prisma.refreshToken.findUnique({ where: { token } });

    if (!rt) return null;
    if (rt.revoked) return null;
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
    return true;
  } catch (e) {
    console.error('revokeRefreshToken error:', e);
    return false;
  }
}

// ─────── PASSWORD RECOVERY (Prisma) ───────

export async function createRecoverCode(email) {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  try {
    await prisma.recoverCode.create({
      data: {
        email: email.toLowerCase(),
        code,
        expiresAt: BigInt(expiresAt),
        used: 0
      }
    });
    return { code, expiresAt };
  } catch (e) {
    console.error('createRecoverCode error:', e);
    // If unique constraint fails (same email+code), try with new code
    const newCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    try {
      await prisma.recoverCode.create({
        data: {
          email: email.toLowerCase(),
          code: newCode,
          expiresAt: BigInt(expiresAt),
          used: 0
        }
      });
      return { code: newCode, expiresAt };
    } catch (e2) {
      console.error('createRecoverCode retry error:', e2);
      return null;
    }
  }
}

export async function consumeRecoverCode(email, code) {
  try {
    const rc = await prisma.recoverCode.findUnique({
      where: {
        email_code: {
          email: email.toLowerCase(),
          code
        }
      }
    });

    if (!rc) return false;
    if (rc.used) return false;
    if (Date.now() > Number(rc.expiresAt)) return false;

    // Mark used
    await prisma.recoverCode.update({
      where: {
        email_code: {
          email: email.toLowerCase(),
          code
        }
      },
      data: { used: 1 }
    });

    return true;
  } catch (e) {
    console.error('consumeRecoverCode error:', e);
    return false;
  }
}

// ─────── ADMIN ───────

const envAdmins = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()) : [];
export const ADMIN_EMAILS = [...envAdmins];

export async function isAdmin(userId) {
  const user = await getUserById(userId);
  return user && ADMIN_EMAILS.includes(user.email);
}

// ─────── PASSWORD RESET ───────

export async function setPassword(email, newPassword) {
  try {
    const user = await getUserByEmail(email);
    if (!user) return false;

    const { hash } = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash }
    });
    return true;
  } catch (e) {
    console.error('setPassword error:', e);
    return false;
  }
}
