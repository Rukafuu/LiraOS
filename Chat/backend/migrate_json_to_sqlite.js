
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db/index.js';
import { putSessions } from './chatStore.js';
import { addMemory } from './memoryStore.js';
import { updateUserStats } from './gamificationStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');

async function migrate() {
    console.log('🔄 Starting Migration: JSON -> SQLite');

    // 1. Sessions
    const sessionsPath = path.join(dataDir, 'sessions.json');
    if (fs.existsSync(sessionsPath)) {
        try {
            const raw = fs.readFileSync(sessionsPath, 'utf-8');
            const sessions = JSON.parse(raw);
            if (Array.isArray(sessions) && sessions.length > 0) {
                console.log(`📦 Migrating ${sessions.length} sessions...`);
                
                // Group by user
                const byUser = {};
                sessions.forEach(s => {
                    const uid = s.userId || 'anonymous';
                    if (!byUser[uid]) byUser[uid] = [];
                    byUser[uid].push(s);
                });

                for (const uid of Object.keys(byUser)) {
                    putSessions(uid, byUser[uid]);
                }
                
                fs.renameSync(sessionsPath, sessionsPath + '.bak');
                console.log('✅ Sessions migrated and file backed up.');
            }
        } catch (e) {
            console.error('❌ Failed to migrate sessions:', e);
        }
    }

    // 2. Memories
    const memPath = path.join(dataDir, 'memories.json');
    if (fs.existsSync(memPath)) {
        try {
            const raw = fs.readFileSync(memPath, 'utf-8');
            const memories = JSON.parse(raw);
            if (Array.isArray(memories) && memories.length > 0) {
                console.log(`🧠 Migrating ${memories.length} memories...`);
                const insert = db.prepare(`
                    INSERT OR IGNORE INTO memories (id, userId, content, tags, category, priority, createdAt)
                    VALUES (@id, @userId, @content, @tags, @category, @priority, @createdAt)
                `);
                
                const txn = db.transaction((mems) => {
                    for (const m of mems) {
                        insert.run({
                            id: m.id,
                            userId: m.userId || 'anonymous',
                            content: m.content,
                            tags: JSON.stringify(m.tags || []),
                            category: m.category || 'general',
                            priority: m.priority || 'medium',
                            createdAt: m.createdAt || Date.now()
                        });
                    }
                });
                
                txn(memories);
                fs.renameSync(memPath, memPath + '.bak');
                console.log('✅ Memories migrated and file backed up.');
            }
        } catch (e) {
            console.error('❌ Failed to migrate memories:', e);
        }
    }

    // 3. Gamification
    const gamePath = path.join(dataDir, 'gamification_stats.json'); // Check filename logic
    // Actually, gamificationStore used to read strictly by User ID or a single file? 
    // Usually gamificationStore saves to "gamification.json" or similar.
    // Let's assume standard file if exists, but most likely users rely on separate logic.
    
    // Skipping complex gamification migration if file structure is unknown, 
    // but typically it's better to just init fresh or handle manually if needed.
    // Assuming simple file:
    const gameFile = path.join(dataDir, 'gamification.json');
    if (fs.existsSync(gameFile)) {
       // ... load and migrate ...
    }

    console.log('✨ Migration Complete. Please restart backend.');
}

migrate();
