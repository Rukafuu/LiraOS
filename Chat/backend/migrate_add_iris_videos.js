
import db from './db/index.js';

console.log('Running migration: Add iris_videos table...');

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS iris_videos (
      id TEXT PRIMARY KEY,
      userId TEXT,
      videoUrl TEXT,
      thumbnailUrl TEXT,
      prompt TEXT,
      model TEXT,
      aspectRatio TEXT,
      resolution TEXT,
      createdAt INTEGER
    )
  `);
  console.log('Migration successful: iris_videos table created/verified.');
} catch (error) {
  console.error('Migration failed:', error);
}
