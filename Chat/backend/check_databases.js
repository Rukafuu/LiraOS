import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n=== Checking both database files ===\n');

// Check old location
const oldDbPath = path.join(__dirname, 'lira.db');
console.log(`1. OLD location: ${oldDbPath}`);
try {
  const oldDb = new Database(oldDbPath);
  const oldUsers = oldDb.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`   Users: ${oldUsers.count}`);
  
  if (oldUsers.count > 0) {
    const users = oldDb.prepare('SELECT id, email, username FROM users').all();
    users.forEach(u => console.log(`   - ${u.email} (${u.username})`));
  }
  oldDb.close();
} catch (e) {
  console.log(`   Error: ${e.message}`);
}

console.log('');

// Check new location
const newDbPath = path.join(__dirname, 'data', 'lira.db');
console.log(`2. NEW location: ${newDbPath}`);
try {
  const newDb = new Database(newDbPath);
  const newUsers = newDb.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`   Users: ${newUsers.count}`);
  
  if (newUsers.count > 0) {
    const users = newDb.prepare('SELECT id, email, username FROM users').all();
    users.forEach(u => console.log(`   - ${u.email} (${u.username})`));
  }
  newDb.close();
} catch (e) {
  console.log(`   Error: ${e.message}`);
}

console.log('');
