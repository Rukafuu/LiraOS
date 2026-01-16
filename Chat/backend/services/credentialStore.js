import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
        console.error('Failed to create data directory:', e);
    }
}

const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');

class CredentialStore {
    constructor() {
        this.cache = null;
        this.load();
    }

    load() {
        try {
            if (fs.existsSync(CREDENTIALS_FILE)) {
                this.cache = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
            } else {
                this.cache = {};
            }
        } catch (error) {
            console.error('[CREDENTIALS] Failed to load credentials file:', error);
            this.cache = {}; // Fallback to empty
        }
    }

    save() {
        try {
            fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(this.cache, null, 2), 'utf-8');
            return true;
        } catch (error) {
            console.error('[CREDENTIALS] Failed to save credentials file:', error);
            return false;
        }
    }

    /**
     * Get credentials for a user
     * @param {string} userId 
     * @returns {object} { githubToken, githubOwner, githubRepo, ... }
     */
    get(userId) {
        if (!this.cache) this.load();
        return this.cache[userId] || {};
    }

    /**
     * Set credentials for a user (merges with existing)
     * @param {string} userId 
     * @param {object} data { githubToken, githubOwner, ... }
     */
    set(userId, data) {
        if (!this.cache) this.load();
        
        const current = this.cache[userId] || {};
        this.cache[userId] = { ...current, ...data };
        
        this.save();
        console.log(`[CREDENTIALS] Updated credentials for user ${userId} in ${CREDENTIALS_FILE}`);
        return this.cache[userId];
    }
    
    /**
     * Delete specific credential key for user
     */
    deleteKey(userId, key) {
        if (!this.cache) this.load();
        if (this.cache[userId]) {
            delete this.cache[userId][key];
            this.save();
        }
    }
}

export const credentialStore = new CredentialStore();
