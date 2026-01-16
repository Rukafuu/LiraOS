
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  console.log('[MIGRATE] Checking and fixing critical tables...');
  const client = await pool.connect();
  
  try {
    // 1. Sessions Table
    console.log(' -> Checking sessions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "personaId" TEXT,
        "createdAt" BIGINT NOT NULL,
        "updatedAt" BIGINT NOT NULL,
        "messages" TEXT NOT NULL,
        CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
      );
    `);

    // 2. Gamification Table
    console.log(' -> Checking gamification table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "gamification" (
        "userId" TEXT NOT NULL,
        "xp" INTEGER DEFAULT 0,
        "coins" INTEGER DEFAULT 100,
        "level" INTEGER DEFAULT 1,
        "stats" TEXT,
        "unlocked_themes" TEXT,
        "unlocked_personas" TEXT,
        "achievements" TEXT,
        "activePersonaId" TEXT,
        "updatedAt" BIGINT,
        CONSTRAINT "gamification_pkey" PRIMARY KEY ("userId")
      );
    `);

    // 3. GitHub Columns in Users (Redundant but safe)
    console.log(' -> Checking github columns...');
    await client.query(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_token" TEXT;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_owner" TEXT;
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_repo" TEXT;
    `);

    console.log('[MIGRATE] Success!');
  } catch (err) {
    console.error('[MIGRATE] Failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
