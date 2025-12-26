
import db from '../db/index.js';
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
export function getUserStatus(userId) {
  try {
    const stmt = db.prepare('SELECT * FROM bans WHERE userId = ?');
    const ban = stmt.get(userId);
    
    if (!ban) return { allowed: true };
    
    // Check expiration
    if (ban.until && Date.now() > ban.until) {
      // Auto-expire
      db.prepare('DELETE FROM bans WHERE userId = ?').run(userId);
      return { allowed: true };
    }
    
    return { 
      allowed: false, 
      status: ban.status, 
      until: ban.until,
      reason: ban.reason,
      message: getBanMessage(ban) 
    };
  } catch (e) {
    console.error('getUserStatus error:', e);
    return { allowed: true }; // Fail open or close? Fail open for now to avoid accidental DOS
  }
}

function getBanMessage(ban) {
  const dateStr = ban.until ? new Date(ban.until).toLocaleString() : 'Permanente';
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
  
  // 1. Audit Log (Always log, even if no action taken)
  const eventId = crypto.randomUUID();
  try {
     const auditStmt = db.prepare(`
       INSERT INTO audit_logs (eventId, userId, actionTaken, category, contentHash, excerpt, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)
     `);
     auditStmt.run(
       eventId, 
       userId, 
       'flagged_' + levelStr, 
       category, 
       hashContent(content), 
       redactSensitiveData(content).substring(0, 200), 
       now
     );
  } catch(e) { console.error('Audit log failed', e); }

  // 2. Record Infraction
  try {
    db.prepare(`
      INSERT INTO infractions (userId, level, category, reason, timestamp)
      VALUES (?, ?, ?, 'Automated detection', ?)
    `).run(userId, levelStr, category, now);
  } catch (e) { console.error('Infraction save failed', e); return { allowed: false }; }

  // 3. Check Escalation (Three strikes logic)
  // Count valid infractions of this level in the window
  // Clean up old ones first? Or just filter in query.
  // We'll define window based on level.
  // Simplification: Check last N infractions.
  
  const timeframe = levelConfig.expireDays * 24 * 60 * 60 * 1000; // Lookback
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count FROM infractions 
    WHERE userId = ? AND level = ? AND timestamp > ?
  `);
  const count = countStmt.get(userId, levelStr, now - timeframe).count;
  
  let actionTaken = null;
  
  if (count >= levelConfig.limit) {
    // Apply Action
    const until = levelConfig.duration ? now + levelConfig.duration : null;
    const action = levelConfig.action; // cooldown, suspend, ban
    
    // Upsert ban
    const banStmt = db.prepare(`
      INSERT INTO bans (userId, status, until, reason, lastUpdated)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET
        status = excluded.status,
        until = excluded.until,
        reason = excluded.reason,
        lastUpdated = excluded.lastUpdated
    `);
    
    banStmt.run(userId, action, until, `Limit reached for ${levelStr} (${category})`, now);
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
export function createAppeal(userId, message) {
  // Check rate limit (1 per 7 days)
  const lastAppeal = db.prepare('SELECT createdAt FROM appeals WHERE userId = ? ORDER BY createdAt DESC LIMIT 1').get(userId);
  if (lastAppeal && (Date.now() - lastAppeal.createdAt) < 7 * 24 * 60 * 60 * 1000) {
    return { error: 'Rate limit: You can only appeal once every 7 days.' };
  }
  
  const id = crypto.randomUUID();
  const safeMessage = redactSensitiveData(message);
  
  db.prepare(`
    INSERT INTO appeals (id, userId, message, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, safeMessage, Date.now(), Date.now());
  
  return { success: true, id };
}

export function getAppeals() {
  return db.prepare('SELECT * FROM appeals ORDER BY createdAt DESC LIMIT 50').all();
}

// Proxy for old calls (Compatibility)
export function isUserBanned(userId) {
  const status = getUserStatus(userId);
  return !status.allowed;
}

/**
 * Resolve Appeal (Admin)
 */
export function resolveAppeal(appealId, status, adminNote) {
  if (!['approved', 'denied'].includes(status)) return { error: 'Invalid status' };

  try {
    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(appealId);
    if (!appeal) return { error: 'Appeal not found' };
    
    // Update Appeal
    const upd = db.prepare('UPDATE appeals SET status = ?, adminNote = ?, updatedAt = ? WHERE id = ?');
    upd.run(status, adminNote, Date.now(), appealId);
    
    // If approved, lift ban
    if (status === 'approved') {
       db.prepare('DELETE FROM bans WHERE userId = ?').run(appeal.userId);
       // Optionally reset infractions?
       // db.prepare('DELETE FROM infractions WHERE userId = ?').run(appeal.userId);
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
export function cleanupExpiredBans() {
  const now = Date.now();
  const info = db.prepare('DELETE FROM bans WHERE until IS NOT NULL AND until < ?').run(now);
  return info.changes;
}

export function getModerationLogs() {
   return db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50').all();
}
