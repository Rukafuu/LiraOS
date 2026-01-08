import prisma from '../prismaClient.js';
import crypto from 'node:crypto';

// --- CONFIG ---
const LEVELS = {
  L1: { weight: 1, expireDays: 30, limit: 3, action: 'cooldown', duration: 1 * 60 * 60 * 1000 }, // 1h
  L2: { weight: 5, expireDays: 90, limit: 2, action: 'suspend', duration: 7 * 24 * 60 * 60 * 1000 }, // 7d
  L3: { weight: 10, expireDays: 365, limit: 1, action: 'ban', duration: null } // Perm
};

const MODERATION_PATTERNS = [
  // L3: Crimes, Violência, Explor.
  { pattern: /\b(matar|assassinar|estuprar|traficar|explodir|bomba|terrorismo|pedofilia|estupro|massacre|tiroteio)\b/i, category: 'violence_severe', level: 'L3' },
  { pattern: /\b(kill|murder|kidnap|rape|drug trafficking|bomb|terrorism|pedophilia|shooting)\b/i, category: 'violence_severe', level: 'L3' },

  // L2: Drogas, Assédio grave, Hate
  { pattern: /\b(vender drogas|comprar drogas|receita de droga|cocaína|heroína|crack)\b/i, category: 'illegal_drugs', level: 'L2' },
  { pattern: /\b(macaco|nigger|preto sujo|retardado|aleijado|baitola|sapatão|chink|kike|faggot)\b/i, category: 'hate_speech', level: 'L2' },
  { pattern: /\b(suicídio|me matar|cortar os pulsos)\b/i, category: 'self_harm', level: 'L2' },

  // L1: Toxicidade leve (exemplo) -> Pode ser expandido
  { pattern: /\b(seu idiota|burro|inútil)\b/i, category: 'toxicity', level: 'L1' }
];

// --- REDACTION UTILS ---
function redactSensitiveData(text) {
  if (!text) return '';
  let clean = text;
  // Emails
  clean = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  // CPF (Simple regex)
  clean = clean.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF_REDACTED]');
  // Credit Cards (Simple)
  clean = clean.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[CARD_REDACTED]');
  return clean;
}

function hashContent(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

// --- LOGIC ---

/**
 * Check if content violates rules.
 */
export function checkModeration(content) {
  for (const rule of MODERATION_PATTERNS) {
    if (rule.pattern.test(content)) {
      return { flagged: true, category: rule.category, level: rule.level };
    }
  }
  return { flagged: false };
}

/**
 * Check user ban status.
 * Returns object with access: boolean and message if blocked.
 */
export async function getUserStatus(userId) {
  try {
    const ban = await prisma.ban.findUnique({
      where: { userId }
    });
    
    /*
    if (!ban) return { allowed: true };
    
    // Check expiration
    if (ban.until && Date.now() > Number(ban.until)) {
      // Auto-expire
      await prisma.ban.delete({ where: { userId } });
      return { allowed: true };
    }
    
    return { 
      allowed: false, 
      status: ban.status, 
      until: Number(ban.until),
      reason: ban.reason,
      message: getBanMessage(ban) 
    };
    */
   return { allowed: true }; // BAN SYSTEM DISABLED BY USER REQUEST
  } catch (e) {
    console.error('getUserStatus error:', e);
    return { allowed: true }; // Fail open
  }
}

function getBanMessage(ban) {
  const when = Number(ban.until);
  const dateStr = when ? new Date(when).toLocaleString() : 'Permanente';
  if (ban.status === 'cooldown') return `Você está em cooldown temporário até ${dateStr} por flood ou infrações leves.`;
  if (ban.status === 'suspended') return `Sua conta foi suspensa até ${dateStr} devido a violações de segurança.`;
  return `Sua conta foi banida permanentemente por violações graves dos termos de uso.`;
}

/**
 * Handle a detected infraction.
 */
export async function handleInfraction(userId, content, category, levelStr = 'L1') {
  const now = Date.now();
  const levelConfig = LEVELS[levelStr];
  const eventId = crypto.randomUUID();
  
  // 1. Audit Log (Always log, even if no action taken)
  try {
     await prisma.auditLog.create({
         data: {
             eventId, 
             userId, 
             actionTaken: 'flagged_' + levelStr, 
             category, 
             contentHash: hashContent(content), 
             excerpt: redactSensitiveData(content).substring(0, 200), 
             timestamp: now
         }
     });
  } catch(e) { console.error('Audit log failed', e); }

  // 2. Record Infraction
  try {
    await prisma.infraction.create({
        data: {
            userId,
            level: levelStr,
            category,
            reason: 'Automated detection',
            timestamp: now
        }
    });
  } catch (e) { console.error('Infraction save failed', e); return { allowed: false }; }

  // 3. Check Escalation (Three strikes logic)
  const timeframe = levelConfig.expireDays * 24 * 60 * 60 * 1000; // Lookback
  
  const count = await prisma.infraction.count({
      where: {
          userId,
          level: levelStr,
          timestamp: { gt: now - timeframe }
      }
  });
  
  let actionTaken = null;
  
  if (count >= levelConfig.limit) {
    // Apply Action
    const until = levelConfig.duration ? now + levelConfig.duration : null;
    const action = levelConfig.action; // cooldown, suspend, ban
    
    // User requested NO BANS strategy (ChatGPT style).
    // We strictly LOG the infraction but do NOT ban the user account via DB.
    // Upsert ban commented out.
    /*
    await prisma.ban.upsert({
        where: { userId },
        update: {
            status: action,
            until,
            reason: `Limit reached for ${levelStr} (${category})`,
            lastUpdated: now
        },
        create: {
            userId,
            status: action,
            until,
            reason: `Limit reached for ${levelStr} (${category})`,
            lastUpdated: now
        }
    });
    */

    // We still return action so chat.js knows to block THIS request
    actionTaken = action;
  }
  
  return {
    eventId,
    action: actionTaken,
    warnings: count,
    limit: levelConfig.limit,
    isBanned: !!actionTaken
  };
}

/**
 * Appeals
 */
export async function createAppeal(userId, message) {
  // Check rate limit (1 per 7 days)
  const lastAppeal = await prisma.appeal.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
  });

  if (lastAppeal && (Date.now() - Number(lastAppeal.createdAt)) < 7 * 24 * 60 * 60 * 1000) {
    return { error: 'Rate limit: You can only appeal once every 7 days.' };
  }
  
  const id = crypto.randomUUID();
  const safeMessage = redactSensitiveData(message);
  
  await prisma.appeal.create({
      data: {
          id,
          userId,
          message: safeMessage,
          createdAt: Date.now(),
          updatedAt: Date.now()
      }
  });
  
  return { success: true, id };
}

export async function getAppeals() {
  const apps = await prisma.appeal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
  });
  return apps.map(a => ({...a, createdAt: Number(a.createdAt), updatedAt: Number(a.updatedAt)}));
}

// Proxy for old calls (Compatibility)
export async function isUserBanned(userId) {
  const status = await getUserStatus(userId);
  return !status.allowed;
}

/**
 * Resolve Appeal (Admin)
 */
export async function resolveAppeal(appealId, status, adminNote) {
  if (!['approved', 'denied'].includes(status)) return { error: 'Invalid status' };

  try {
    const appeal = await prisma.appeal.findUnique({ where: { id: appealId } });
    if (!appeal) return { error: 'Appeal not found' };
    
    await prisma.appeal.update({
        where: { id: appealId },
        data: { status, adminNote, updatedAt: Date.now() }
    });
    
    // If approved, lift ban
    if (status === 'approved') {
       await prisma.ban.delete({ where: { userId: appeal.userId } });
    }
    
    return { success: true };
  } catch (e) {
    console.error('resolveAppeal error:', e);
    return { error: e.message };
  }
}

/**
 * Cron: Cleanup
 */
export async function cleanupExpiredBans() {
  const now = Date.now();
  const info = await prisma.ban.deleteMany({
      where: {
          until: { not: null, lt: now } // Check if 'not: null' is valid in prisma? Yes. But schema defines optional.
          // BigInt vs Int conflict might happen if 'until' in DB is BigInt.
          // I pass 'now' (number/double). Prisma usually handles mapping if schema is BigInt.
      }
  });
  return info.count;
}

export async function getModerationLogs() {
   const rows = await prisma.auditLog.findMany({
       orderBy: { timestamp: 'desc' },
       take: 50
   });
   return rows.map(r => ({...r, timestamp: Number(r.timestamp)}));
}
