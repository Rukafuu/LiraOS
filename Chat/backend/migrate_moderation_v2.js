
import db from './db/index.js';

console.log('Applying Advanced Moderation Schema...');

const updates = [
    `CREATE TABLE IF NOT EXISTS infractions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        level TEXT, -- L1, L2, L3
        category TEXT,
        reason TEXT,
        timestamp INTEGER
    );`,
    
    `CREATE TABLE IF NOT EXISTS bans (
        userId TEXT PRIMARY KEY,
        status TEXT, -- active, cooldown, suspended, banned
        until INTEGER,
        reason TEXT,
        lastUpdated INTEGER
    );`,
    
    `CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        eventId TEXT,
        userId TEXT,
        actionTaken TEXT, -- allow, limit, block, ban
        category TEXT,
        contentHash TEXT,
        excerpt TEXT, -- Redacted
        timestamp INTEGER
    );`,
    
    `CREATE TABLE IF NOT EXISTS appeals (
        id TEXT PRIMARY KEY,
        userId TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending', -- pending, approved, denied
        adminNote TEXT,
        createdAt INTEGER,
        updatedAt INTEGER
    );`
];

for (const sql of updates) {
    try {
        db.exec(sql);
        console.log(`Executed schema update.`);
    } catch (e) {
        console.error(`Error executing SQL: ${e.message}`);
    }
}
console.log('Advanced Moderation Schema applied.');
