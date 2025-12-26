
import db from './db/index.js';

console.log('Applying Moderation Schema updates...');

const updates = [
    // Add columns to users table
    `ALTER TABLE users ADD COLUMN warnings INTEGER DEFAULT 0;`,
    `ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0;`,
    
    // Create moderation_logs table
    `CREATE TABLE IF NOT EXISTS moderation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        content TEXT,
        category TEXT,
        timestamp INTEGER
    );`
];

for (const sql of updates) {
    try {
        db.exec(sql);
        console.log(`Executed: ${sql}`);
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log(`Skipped (already exists): ${sql}`);
        } else {
            console.error(`Error executing: ${sql}`, e.message);
        }
    }
}

console.log('Moderation Schema applied successfully.');
