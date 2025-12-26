import pg from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
const USE_POSTGRES = !!DATABASE_URL;

let db;
let pool;

if (USE_POSTGRES) {
  console.log('[DB] Using PostgreSQL');
  pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Initialize tables
  await initPostgresTables();
} else {
  console.log('[DB] Using SQLite');
  const dbPath = path.join(__dirname, 'lira.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
}

async function initPostgresTables() {
  const client = await pool.connect();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT,
        created_at BIGINT NOT NULL,
        last_login BIGINT
      )
    `);

    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        messages JSONB NOT NULL,
        persona_id TEXT,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `);

    // Memories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        content TEXT NOT NULL,
        tags JSONB NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);

    // Gamification table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gamification (
        user_id TEXT PRIMARY KEY,
        xp INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 100,
        level INTEGER DEFAULT 1,
        stats JSONB,
        quests JSONB,
        unlocked_themes JSONB,
        unlocked_personas JSONB,
        active_persona_id TEXT,
        achievements JSONB
      )
    `);

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        user_id TEXT PRIMARY KEY,
        selected_model TEXT,
        is_deep_mode BOOLEAN,
        is_sidebar_open BOOLEAN,
        theme_id TEXT
      )
    `);

    // Bans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bans (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        banned_at BIGINT NOT NULL,
        expires_at BIGINT,
        is_permanent BOOLEAN DEFAULT FALSE
      )
    `);

    console.log('[DB] PostgreSQL tables initialized');
  } finally {
    client.release();
  }
}

// Unified query interface
export async function query(sql, params = []) {
  if (USE_POSTGRES) {
    // Convert SQLite-style ? placeholders to PostgreSQL $1, $2, etc.
    let pgSql = sql;
    let pgParams = params;
    
    if (sql.includes('?')) {
      let index = 1;
      pgSql = sql.replace(/\?/g, () => `$${index++}`);
    }
    
    const result = await pool.query(pgSql, pgParams);
    return result.rows;
  } else {
    const stmt = db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all(...params);
    } else {
      return stmt.run(...params);
    }
  }
}

export async function get(sql, params = []) {
  if (USE_POSTGRES) {
    let pgSql = sql;
    let index = 1;
    if (sql.includes('?')) {
      pgSql = sql.replace(/\?/g, () => `$${index++}`);
    }
    const result = await pool.query(pgSql, params);
    return result.rows[0];
  } else {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  }
}

export async function run(sql, params = []) {
  if (USE_POSTGRES) {
    let pgSql = sql;
    let index = 1;
    if (sql.includes('?')) {
      pgSql = sql.replace(/\?/g, () => `$${index++}`);
    }
    await pool.query(pgSql, params);
  } else {
    const stmt = db.prepare(sql);
    stmt.run(...params);
  }
}

export function getDb() {
  return USE_POSTGRES ? pool : db;
}

export { USE_POSTGRES };
