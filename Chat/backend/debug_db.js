
import db from './db/index.js';

console.log('--- Sessions in DB ---');
const sessions = db.prepare('SELECT id, userId, title FROM sessions').all();
console.log(JSON.stringify(sessions, null, 2));

console.log('--- Users in DB ---');
const users = db.prepare('SELECT id, email FROM users').all();
console.log(JSON.stringify(users, null, 2));
