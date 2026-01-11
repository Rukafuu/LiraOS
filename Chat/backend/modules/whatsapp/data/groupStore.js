import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.resolve('config/whatsapp_groups.json');

async function init() {
    const dir = path.dirname(DB_PATH);
    try { await fs.access(dir); } catch { await fs.mkdir(dir, { recursive: true }); }
    try { await fs.access(DB_PATH); } catch { await fs.writeFile(DB_PATH, JSON.stringify({}, null, 2)); }
}

async function load() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch { return {}; }
}

async function save(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export const groupStore = {
    async getGroup(groupId) {
        await init();
        const db = await load();
        return db[groupId] || null;
    },

    async initGroup(groupId) {
        await init();
        const db = await load();
        if (!db[groupId]) {
            // New Group: 24h Trial
            db[groupId] = {
                id: groupId,
                joinedAt: Date.now(),
                expiration: Date.now() + (24 * 60 * 60 * 1000), // 24h from now
                plan: 'trial',
                welcomeParams: { enabled: true }
            };
            await save(db);
            return { isNew: true, group: db[groupId] };
        }
        return { isNew: false, group: db[groupId] };
    },

    async extendTrial(groupId, days) {
        await init();
        const db = await load();
        if (db[groupId]) {
            const currentExp = Math.max(db[groupId].expiration || 0, Date.now());
            db[groupId].expiration = currentExp + (days * 24 * 60 * 60 * 1000);
            await save(db);
        }
    },

    async updateGroup(groupId, updates) {
        await init();
        const db = await load();
        if (db[groupId]) {
            db[groupId] = { ...db[groupId], ...updates };
            await save(db);
        }
    }
};
