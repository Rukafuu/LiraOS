import db from './db/index.js';

export async function getSessions(userId) {
  try {
    let query = 'SELECT * FROM sessions';
    const params = [];
    
    if (userId) {
      query += ' WHERE userId = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY updatedAt DESC';
    
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => ({
      ...row,
      messages: row.messages ? JSON.parse(row.messages) : []
    }));
  } catch (e) {
    console.error('getSessions error:', e);
    return [];
  }
}

export async function upsertSession(session) {
  if (!session.id) return null;
  
  const { id, userId, title, personaId, createdAt, updatedAt, messages } = session;
  const msgsJson = JSON.stringify(messages || []);
  
  try {
    const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(id);
    
    if (existing) {
      const stmt = db.prepare(`
        UPDATE sessions 
        SET title = ?, personaId = ?, updatedAt = ?, messages = ?
        WHERE id = ?
      `);
      stmt.run(title, personaId, updatedAt || Date.now(), msgsJson, id);
    } else {
      const stmt = db.prepare(`
        INSERT INTO sessions (id, userId, title, personaId, createdAt, updatedAt, messages)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, userId, title, personaId, createdAt || Date.now(), updatedAt || Date.now(), msgsJson);
    }
    return session;
  } catch (e) {
    console.error('upsertSession error:', e);
    return null;
  }
}

export async function deleteSession(id) {
  try {
    const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  } catch (e) {
    console.error('deleteSession error:', e);
    return false;
  }
}

export async function deleteSessionsByUser(userId) {
  try {
    const stmt = db.prepare('DELETE FROM sessions WHERE userId = ?');
    const info = stmt.run(userId);
    return info.changes > 0;
  } catch (e) {
    console.error('deleteSessionsByUser error:', e);
    return false;
  }
}

export async function updateSessionTitle(id, title) {
  try {
    const stmt = db.prepare('UPDATE sessions SET title = ? WHERE id = ?');
    const info = stmt.run(title, id);
    return info.changes > 0;
  } catch (e) {
    console.error('updateSessionTitle error:', e);
    return false;
  }
}

export async function getSessionById(id) {
  try {
    const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;
    return { ...row, messages: row.messages ? JSON.parse(row.messages) : [] };
  } catch (e) {
    console.error('getSessionById error:', e);
    return null;
  }
}
