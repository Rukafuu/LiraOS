import db from './db/index.js';

console.log('\n=== Ensuring all required columns exist ===\n');

const requiredColumns = {
  'password_salt': 'TEXT',
  'last_login': 'INTEGER DEFAULT 0',
  'login_count': 'INTEGER DEFAULT 0'
};

try {
  const tableInfo = db.prepare('PRAGMA table_info(users)').all();
  const existingColumns = tableInfo.map(col => col.name);
  
  for (const [colName, colType] of Object.entries(requiredColumns)) {
    if (!existingColumns.includes(colName)) {
      console.log(`Adding column: ${colName} (${colType})`);
      try {
        db.prepare(`ALTER TABLE users ADD COLUMN ${colName} ${colType}`).run();
        console.log(`✓ Added: ${colName}`);
      } catch (e) {
        if (e.message.includes('duplicate column')) {
          console.log(`✓ Already exists: ${colName}`);
        } else {
          console.error(`✗ Failed to add ${colName}:`, e.message);
        }
      }
    } else {
      console.log(`✓ Already exists: ${colName}`);
    }
  }
  
  console.log('\n=== Final schema ===\n');
  const finalInfo = db.prepare('PRAGMA table_info(users)').all();
  finalInfo.forEach(col => {
    console.log(`  ${col.name.padEnd(20)} ${col.type}`);
  });
  
  console.log('\n✓ Database schema is now up to date!');
  
} catch (e) {
  console.error('Error:', e);
}
