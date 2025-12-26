import pg from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
  const dataDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.resolve(dataDir, 'lira.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  initSQLiteTables();
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
        password_salt TEXT,
        avatar TEXT,
        created_at BIGINT NOT NULL,
        last_login BIGINT DEFAULT 0,
        login_count INTEGER DEFAULT 0,
        preferences JSONB,
        warnings INTEGER DEFAULT 0,
        is_banned INTEGER DEFAULT 0,
        plan TEXT DEFAULT 'free'
      )
    `);

    // Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        personaId TEXT,
        createdAt BIGINT NOT NULL,
        updatedAt BIGINT NOT NULL,
        messages JSONB NOT NULL
      )
    `);

    // Memories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        userId TEXT,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        createdAt BIGINT NOT NULL,
        tags JSONB NOT NULL,
        importance INTEGER DEFAULT 1,
        embedding TEXT
      )
    `);

    // Refresh tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        token TEXT PRIMARY KEY,
        userId TEXT,
        createdAt BIGINT,
        expiresAt BIGINT,
        revoked INTEGER DEFAULT 0
      )
    `);

    // Recover codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recover_codes (
        email TEXT,
        code TEXT,
        expiresAt BIGINT,
        used INTEGER DEFAULT 0
      )
    `);

    // Gamification table
    await client.query(`
      CREATE TABLE IF NOT EXISTS gamification (
        userId TEXT PRIMARY KEY,
        xp INTEGER DEFAULT 0,
        coins INTEGER DEFAULT 100,
        level INTEGER DEFAULT 1,
        stats JSONB,
        unlockedThemes JSONB,
        unlockedPersonas JSONB,
        achievements JSONB,
        activePersonaId TEXT,
        updatedAt BIGINT
      )
    `);

    // Feedback table
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        userId TEXT,
        feedback TEXT,
        type TEXT,
        rating INTEGER,
        context JSONB,
        status TEXT DEFAULT 'new',
        createdAt BIGINT
      )
    `);

    // Knowledge table
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge (
        id TEXT PRIMARY KEY,
        userId TEXT,
        name TEXT,
        type TEXT,
        language TEXT,
        size INTEGER,
        content TEXT,
        createdAt BIGINT
      )
    `);

    // Infractions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS infractions (
        id SERIAL PRIMARY KEY,
        userId TEXT,
        level TEXT,
        category TEXT,
        reason TEXT,
        timestamp BIGINT
      )
    `);

    // Bans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bans (
        userId TEXT PRIMARY KEY,
        status TEXT,
        until BIGINT,
        reason TEXT,
        lastUpdated BIGINT
      )
    `);

    // Audit logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        eventId TEXT,
        userId TEXT,
        actionTaken TEXT,
        category TEXT,
        contentHash TEXT,
        excerpt TEXT,
        timestamp BIGINT
      )
    `);

    // Appeals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appeals (
        id TEXT PRIMARY KEY,
        userId TEXT,
        message TEXT,
        status TEXT DEFAULT 'pending',
        adminNote TEXT,
        createdAt BIGINT,
        updatedAt BIGINT
      )
    `);

    // Iris videos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS iris_videos (
        id TEXT PRIMARY KEY,
        userId TEXT,
        videoUrl TEXT,
        thumbnailUrl TEXT,
        prompt TEXT,
        model TEXT,
        aspectRatio TEXT,
        resolution TEXT,
        createdAt BIGINT
      )
    `);

    console.log('[DB] PostgreSQL tables initialized');
  } finally {
    client.release();
  }
}

function initSQLiteTables() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      username TEXT,
      password_hash TEXT,
      password_salt TEXT,
      avatar TEXT,
      created_at INTEGER,
      last_login INTEGER DEFAULT 0,
      login_count INTEGER DEFAULT 0,
      preferences TEXT,
      warnings INTEGER DEFAULT 0,
      is_banned INTEGER DEFAULT 0,
      plan TEXT DEFAULT 'free'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT,
      title TEXT,
      personaId TEXT,
      createdAt INTEGER,
      updatedAt INTEGER,
      messages TEXT
    );

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      userId TEXT,
      content TEXT,
      category TEXT,
      priority TEXT,
      createdAt INTEGER,
      tags TEXT,
      importance INTEGER DEFAULT 1,
      embedding TEXT
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      userId TEXT,
      createdAt INTEGER,
      expiresAt INTEGER,
      revoked INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS recover_codes (
      email TEXT,
      code TEXT,
      expiresAt INTEGER,
      used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS gamification (
      userId TEXT PRIMARY KEY,
      xp INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      stats TEXT,
      unlockedThemes TEXT,
      unlockedPersonas TEXT,
      achievements TEXT,
      activePersonaId TEXT,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      userId TEXT,
      feedback TEXT,
      type TEXT,
      rating INTEGER,
      context TEXT,
      status TEXT DEFAULT 'new',
      createdAt INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS knowledge (
      id TEXT PRIMARY KEY,
      userId TEXT,
      name TEXT,
      type TEXT,
      language TEXT,
      size INTEGER,
      content TEXT,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS infractions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT,
      level TEXT,
      category TEXT,
      reason TEXT,
      timestamp INTEGER
    );

    CREATE TABLE IF NOT EXISTS bans (
      userId TEXT PRIMARY KEY,
      status TEXT,
      until INTEGER,
      reason TEXT,
      lastUpdated INTEGER
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId TEXT,
      userId TEXT,
      actionTaken TEXT,
      category TEXT,
      contentHash TEXT,
      excerpt TEXT,
      timestamp INTEGER
    );

    CREATE TABLE IF NOT EXISTS appeals (
      id TEXT PRIMARY KEY,
      userId TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      adminNote TEXT,
      createdAt INTEGER,
      updatedAt INTEGER
    );

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
    );
  `;

  db.exec(schema);
}

export default USE_POSTGRES ? pool : db;
export { USE_POSTGRES };
