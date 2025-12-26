
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../data/lira.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize DB
const db = new Database(dbPath/*, { verbose: console.log }*/); // Uncomment verbose for query logging
db.pragma('journal_mode = WAL'); // Better concurrency

// Schema Migration
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
    preferences TEXT, -- JSON
    warnings INTEGER DEFAULT 0,
    is_banned INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT,
    personaId TEXT,
    createdAt INTEGER,
    updatedAt INTEGER,
    messages TEXT -- JSON array
  );

  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    userId TEXT,
    content TEXT,
    category TEXT,
    priority TEXT,
    createdAt INTEGER,
    tags TEXT, -- JSON array
    importance INTEGER DEFAULT 1,
    embedding TEXT -- Vector/JSON for semantic search
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
    stats TEXT, -- JSON
    unlockedThemes TEXT, -- JSON
    unlockedPersonas TEXT, -- JSON
    achievements TEXT, -- JSON
    activePersonaId TEXT,
    updatedAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    userId TEXT,
    feedback TEXT,
    type TEXT,
    rating INTEGER,
    context TEXT, -- JSON
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

export default db;
