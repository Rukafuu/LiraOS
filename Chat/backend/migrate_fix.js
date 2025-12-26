import db from './db/index.js';

console.log('--- Database Migration Fix ---');

function addColumn(table, col, type) {
    try {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`).run();
        console.log(`[OK] Added ${col} to ${table}`);
    } catch (e) {
        if (e.message.includes('duplicate column')) {
            console.log(`[SKIP] Column ${col} already exists in ${table}`);
        } else {
            console.error(`[ERROR] Failed to add ${col} to ${table}:`, e.message);
        }
    }
}

// Fix Users Table
addColumn('users', 'username', 'TEXT');
addColumn('users', 'avatar', 'TEXT');
addColumn('users', 'preferences', 'TEXT');
addColumn('users', 'password_salt', 'TEXT');

console.log('Migration complete.');
