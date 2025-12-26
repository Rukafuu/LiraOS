import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'lira.db');
const db = new Database(dbPath);

console.log(`\nDatabase path: ${dbPath}\n`);

console.log('\n=== Users in Database ===\n');

try {
  const users = db.prepare('SELECT id, email, username, created_at FROM users').all();
  
  if (users.length === 0) {
    console.log('No users found in database!');
  } else {
    console.log(`Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });
  }
} catch (error) {
  console.error('Error reading database:', error.message);
}

db.close();
