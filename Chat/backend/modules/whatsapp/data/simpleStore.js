import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.resolve('data/whatsapp_gamification.json');

// Ensure data dir exists
async function init() {
    const dir = path.dirname(DB_PATH);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
    
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.writeFile(DB_PATH, JSON.stringify({ users: {} }, null, 2));
    }
}

async function load() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { users: {} };
    }
}

async function save(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export const simpleStore = {
    async getUser(userId) {
        await init();
        const db = await load();
        return db.users[userId] || null;
    },

    async createUser(userId, name) {
        await init();
        const db = await load();
        if (!db.users[userId]) {
            db.users[userId] = {
                id: userId,
                name: name,
                xp: 0,
                level: 1,
                coins: 0,
                joinedAt: Date.now(),
                registered: false // Phase 1: Not registered yet
            };
            await save(db);
        }
        return db.users[userId];
    },

    async addXp(userId, amount) {
        await init();
        const db = await load();
        if (db.users[userId]) {
            db.users[userId].xp += amount;
            db.users[userId].coins += Math.floor(amount / 5); // 1 coin per 5 XP
            await save(db);
            return db.users[userId];
        }
    },

    async getRank() {
        await init();
        const db = await load();
        return Object.values(db.users)
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10);
    },

    async updateStats(userId, type) {
        await init();
        const db = await load();
        if (!db.users[userId]) {
            // Create phantom user if not exists
            this.createUser(userId, 'Unknown');
             // Reload to get the ref
             const reloaded = await load();
             if (reloaded.users[userId]) db.users[userId] = reloaded.users[userId];
        }

        if (db.users[userId]) {
            if (!db.users[userId].stats) db.users[userId].stats = { msg: 0, image: 0, sticker: 0, cmd: 0 };
            
            if (type === 'message') db.users[userId].stats.msg++;
            if (type === 'image') db.users[userId].stats.image++;
            if (type === 'sticker') db.users[userId].stats.sticker++;
            if (type === 'command') db.users[userId].stats.cmd++;
            
            await save(db);
        }
    },

    async setName(userId, newName) {
        await init();
        const db = await load();
        if (db.users[userId]) {
            db.users[userId].name = newName;
            db.users[userId].registered = true;
            await save(db);
            return db.users[userId];
        } else {
             return this.createUser(userId, newName);
        }
    },

    async addDiamonds(userId, amount) {
        await init();
        const db = await load();
        if (db.users[userId]) {
            db.users[userId].coins = (db.users[userId].coins || 0) + amount; 
            await save(db);
            return db.users[userId].coins;
        }
    },

    async getDaily(userId) {
        await init();
        const db = await load();
        return db.users[userId]?.daily || { lastClaim: 0, streak: 0 };
    },

    async claimDaily(userId, reward) {
        await init();
        const db = await load();
        if (db.users[userId]) {
            const now = Date.now();
            
            // Init daily object if missing
            if (!db.users[userId].daily) db.users[userId].daily = { lastClaim: 0, streak: 0 };
            
            db.users[userId].daily = {
                lastClaim: now,
                streak: reward.streak
            };
            
            db.users[userId].xp += reward.xp;
            db.users[userId].coins = (db.users[userId].coins || 0) + reward.coins;
            
            await save(db);
        }
    }
};
