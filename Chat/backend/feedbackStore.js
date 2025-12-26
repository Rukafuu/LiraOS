import db from './db/index.js';

export const addFeedback = (userId, feedback, type, rating, context) => {
  const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO feedback (id, userId, feedback, type, rating, context, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, userId, feedback, type, rating, JSON.stringify(context || {}), 'new', now);
  return { id, userId, feedback, type, rating, context, status: 'new', createdAt: now };
};

export const getFeedback = () => {
  const rows = db.prepare('SELECT * FROM feedback ORDER BY createdAt DESC').all();
  return rows.map(r => ({
    ...r,
    context: JSON.parse(r.context || '{}')
  }));
};
