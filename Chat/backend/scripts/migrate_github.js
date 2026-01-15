
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  console.log('Running manual migration for GitHub credentials...');
  
  const client = await pool.connect();
  
  try {
    // Check if columns exist
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='github_token';
    `);

    if (res.rows.length === 0) {
      console.log('Adding GitHub columns to users table...');
      await client.query(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_token" TEXT;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_owner" TEXT;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_repo" TEXT;
      `);
      console.log('Migration successful.');
    } else {
      console.log('GitHub columns already exist. Skipping.');
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
