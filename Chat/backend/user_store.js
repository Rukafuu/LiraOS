import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { firestoreService } from './services/firestoreService.js';

// Collection Names
const USERS_COLLECTION = 'users';
const REFRESH_TOKENS_COLLECTION = 'refreshTokens';
const RECOVER_CODES_COLLECTION = 'recoverCodes';

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
    // GitHub new fields
    githubToken: user.githubToken,
    githubOwner: user.githubOwner,
    githubRepo: user.githubRepo
  };
}

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  return { salt: null, hash };
}

export async function getUserByEmail(email) {
  try {
    const user = await firestoreService.findOne(USERS_COLLECTION, 'email', email.toLowerCase());
    return mapUser(user);
  } catch (e) {
    console.error('getUserByEmail error:', e);
    return null;
  }
}

export async function getUserByDiscordId(discordId) {
  try {
    const user = await firestoreService.findOne(USERS_COLLECTION, 'discordId', discordId);
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

  const userData = {
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
  };

  try {
    await firestoreService.setDoc(USERS_COLLECTION, id, userData);
    return mapUser(userData);
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

    const updates = {
      lastLogin: Date.now(),
      loginCount: (user.loginCount || 0) + 1
    };

    await firestoreService.setDoc(USERS_COLLECTION, user.id, updates, true);
    return { ...user, ...updates };
  } catch (e) {
    console.error('updateLoginStats error:', e);
    return null;
  }
}

export async function getUserById(userId) {
  try {
    const user = await firestoreService.getDoc(USERS_COLLECTION, userId);
    return mapUser(user);
  } catch (e) {
    console.error('getUserById error:', e);
    return null;
  }
}

export async function updateUser(userId, updates) {
  try {
    if (Object.keys(updates).length === 0) return getUserById(userId);

    await firestoreService.setDoc(USERS_COLLECTION, userId, updates, true); // Merge
    return getUserById(userId);
  } catch (e) {
    console.error('updateUser error:', e);
    return null;
  }
}

// Refresh Tokens (Stored in sub-collection or separate collection)
export async function issueRefreshToken(userId) {
  const token = `rt_${crypto.randomBytes(32).toString('hex')}`;
  const expiresAt = Date.now() + 30 * 24 * 3600 * 1000; // 30 days

  const tokenData = {
    token,
    userId,
    createdAt: Date.now(),
    expiresAt,
    revoked: 0
  };

  try {
    await firestoreService.setDoc(REFRESH_TOKENS_COLLECTION, token, tokenData);
  } catch (e) {
    console.error('issueRefreshToken DB error:', e);
  }

  return { token, expiresAt };
}

export async function verifyRefreshToken(token) {
  try {
    const rt = await firestoreService.getDoc(REFRESH_TOKENS_COLLECTION, token);

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
    await firestoreService.setDoc(REFRESH_TOKENS_COLLECTION, token, { revoked: 1 }, true);
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
  const id = `${email}_${code}`; // Composite ID for easier lookup/dedup if needed

  try {
    await firestoreService.addDoc(RECOVER_CODES_COLLECTION, {
      email: email.toLowerCase(),
      code,
      expiresAt,
      used: 0
    });
    return { code, expiresAt };
  } catch (e) {
    console.error('createRecoverCode error:', e);
    return null;
  }
}

export async function consumeRecoverCode(email, code) {
  try {
    // Firestore query needs index for compound queries, so we do simpler logical check in code if vol is low,
    // or use exact query.
    // Query: email == email AND code == code
    // Since we don't have compound index guaranteed, let's find by email and filter in memory (safe for small scale)
    // OR better: Since codes are random, finding by code is usually unique enough.
    
    // Let's rely on findOne (which uses limit 1).
    // But we need to check usage.
    
    // Better strategy for NoSQL:
    // Query collection where email == email.
    
    const snapshot = await firestoreService.db.collection(RECOVER_CODES_COLLECTION)
        .where('email', '==', email.toLowerCase())
        .where('code', '==', code)
        .limit(1)
        .get();

    if (snapshot.empty) return false;
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    if (data.used) return false;
    if (Date.now() > Number(data.expiresAt)) return false;

    // Mark used
    await doc.ref.update({ used: 1 });
    return true;

  } catch (e) {
    console.error('consumeRecoverCode error:', e);
    return false;
  }
}

const envAdmins = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim()) : [];
export const ADMIN_EMAILS = [...envAdmins];

export async function isAdmin(userId) {
  const user = await getUserById(userId);
  return user && ADMIN_EMAILS.includes(user.email);
}

export async function setPassword(email, newPassword) {
  try {
    const user = await getUserByEmail(email);
    if (!user) return false;
    
    const { hash } = await hashPassword(newPassword);
    
    await firestoreService.setDoc(USERS_COLLECTION, user.id, { passwordHash: hash }, true);
    return true;
  } catch (e) {
    console.error('setPassword error:', e);
    return false;
  }
}
