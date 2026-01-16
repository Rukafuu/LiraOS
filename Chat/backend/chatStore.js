import prisma from './prismaClient.js';

// Helper
const toInt = (n) => Number(n);

export async function getSessions(userId) {
  try {
    const sessions = await prisma.session.findMany({
      where: userId ? { userId } : {},
      orderBy: { updatedAt: 'desc' }
    });
    
    return sessions.map(row => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      personaId: row.personaId,
      createdAt: toInt(row.createdAt),
      updatedAt: toInt(row.updatedAt),
      messages: row.messagesStr ? JSON.parse(row.messagesStr) : []
    }));
  } catch (e) {
    console.error('getSessions error:', e);
    return [];
  }
}

export async function upsertSession(session) {
  if (!session.id) return null;
  
  const { id, userId, title, personaId, createdAt, updatedAt, messages } = session;
  const now = Date.now();
  
  try {
    const messagesStr = JSON.stringify(messages || []);

    await prisma.session.upsert({
      where: { id },
      update: {
        title,
        personaId,
        updatedAt: updatedAt || now,
        messagesStr
      },
      create: {
        id,
        userId: userId || 'unknown',
        title: title || 'New Chat',
        personaId,
        createdAt: createdAt || now,
        updatedAt: updatedAt || now,
        messagesStr
      }
    });

    return session;
  } catch (e) {
    console.error('upsertSession error:', e);
    return null;
  }
}

export async function deleteSession(id) {
  try {
    await prisma.session.delete({
      where: { id }
    });
    return true;
  } catch (e) {
    // If not found, prisma throws P2025.
    return false;
  }
}

export async function deleteSessionsByUser(userId) {
  try {
    const info = await prisma.session.deleteMany({
      where: { userId }
    });
    return info.count > 0;
  } catch (e) {
    console.error('deleteSessionsByUser error:', e);
    return false;
  }
}

export async function updateSessionTitle(id, title) {
  try {
    await prisma.session.update({
      where: { id },
      data: { title }
    });
    return true;
  } catch (e) {
    console.error('updateSessionTitle error:', e);
    return false;
  }
}

export async function getSessionById(id) {
  try {
    const row = await prisma.session.findUnique({
      where: { id }
    });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      personaId: row.personaId,
      createdAt: toInt(row.createdAt),
      updatedAt: toInt(row.updatedAt),
      messages: row.messagesStr ? JSON.parse(row.messagesStr) : []
    };
  } catch (e) {
    console.error('getSessionById error:', e);
    return null;
  }
}
