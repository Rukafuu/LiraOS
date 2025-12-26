import db from '../db/index.js';

try {
  console.log('Adding columns to users table...');
  try {
    db.prepare('ALTER TABLE users ADD COLUMN plan TEXT DEFAULT "free"').run();
    console.log('Added plan column.');
  } catch (e) {
    if (e.message.includes('duplicate column')) console.log('Column plan already exists.');
    else throw e;
  }

  try {
    db.prepare('ALTER TABLE users ADD COLUMN discordId TEXT').run();
    console.log('Added discordId column.');
  } catch (e) {
    if (e.message.includes('duplicate column')) console.log('Column discordId already exists.');
    else throw e;
  }
  
  console.log('Migration successful.');
} catch (e) {
  console.error('Migration failed:', e);
}
