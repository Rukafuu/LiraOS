import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

// In production, ENCRYPTION_KEY should be a 32-byte string
// If not provided, we fallback to AUTH_SECRET
const SECRET = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET || 'lira-default-encryption-key-32-chars-long-!!!';
// Derive a 32-byte key from the secret
const KEY = crypto.createHash('sha256').update(SECRET).digest();

/**
 * Encrypts text using AES-256-CBC
 * @param {string} text
 * @returns {string} Encrypted text in format iv:encryptedData
 */
export function encrypt(text) {
    if (!text) return text;

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (e) {
        console.error('[ENCRYPTION] Encryption failed:', e.message);
        return text;
    }
}

/**
 * Decrypts text using AES-256-CBC
 * @param {string} encryptedText format iv:encryptedData
 * @returns {string} Decrypted text
 */
export function decrypt(encryptedText) {
    if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
        return encryptedText;
    }

    try {
        const [ivHex, encryptedHex] = encryptedText.split(':');
        if (ivHex.length !== 32) return encryptedText; // Not a valid IV hex

        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        // If decryption fails, it's likely not encrypted or encrypted with a different key
        // We return the original text to avoid breaking existing unencrypted tokens
        return encryptedText;
    }
}
