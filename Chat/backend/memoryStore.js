import db from './db/index.js';

export async function getMemories(userId) {
  try {
    let query = 'SELECT * FROM memories';
    const params = [];
    
    if (userId) {
      query += ' WHERE userId = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY createdAt DESC';
    
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
  } catch (e) {
    console.error('getMemories error:', e);
    return [];
  }
}

export async function addMemory(content, tags = [], category = 'note', priority = 'medium', userId = null) {
  const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = Date.now();
  
  try {
    const stmt = db.prepare(`
      INSERT INTO memories (id, userId, content, category, priority, createdAt, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, userId, content, category, priority, createdAt, JSON.stringify(tags));
    
    return {
      id,
      userId,
      content,
      category,
      priority,
      createdAt,
      tags
    };
  } catch (e) {
    console.error('addMemory error:', e);
    return null;
  }
}

export async function getMemoryById(id) {
  try {
    const stmt = db.prepare('SELECT * FROM memories WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;
    return { ...row, tags: row.tags ? JSON.parse(row.tags) : [] };
  } catch (e) {
    return null;
  }
}

export async function deleteMemory(id, requesterUserId = null) {
  try {
    if (requesterUserId) {
      const mem = await getMemoryById(id);
      if (!mem || mem.userId !== requesterUserId) return false;
    }
    const stmt = db.prepare('DELETE FROM memories WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
  } catch (e) {
    console.error('deleteMemory error:', e);
    return false;
  }
}

export async function deleteMemoriesByUser(userId) {
  try {
    const stmt = db.prepare('DELETE FROM memories WHERE userId = ?');
    const info = stmt.run(userId);
    return info.changes > 0;
  } catch (e) {
    console.error('deleteMemoriesByUser error:', e);
    return false;
  }
}
