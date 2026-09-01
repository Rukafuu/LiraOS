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

function mapSessionToPrisma(session, now) {
  const { id, userId, title, personaId, createdAt, updatedAt, messages } = session;
  const messagesStr = messages !== undefined ? JSON.stringify(messages) : undefined;

  return {
    where: { id },
    update: {
      title,
      personaId,
      updatedAt: updatedAt || now,
      ...(messagesStr !== undefined && { messagesStr })
    },
    create: {
      id,
      userId: userId || 'unknown',
      title: title || 'New Chat',
      personaId,
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
      messagesStr: messagesStr || '[]'
    }
  };
}

export async function upsertSession(session) {
  if (!session.id) return null;
  const now = Date.now();
  try {
    await prisma.session.upsert(mapSessionToPrisma(session, now));
    return session;
  } catch (e) {
    console.error('upsertSession error:', e);
    throw e;
  }
}

export async function upsertSessions(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) return;
  const now = Date.now();
  const operations = sessions.map(session => prisma.session.upsert(mapSessionToPrisma(session, now)));
  try {
    await prisma.$transaction(operations);
  } catch (e) {
    console.error('upsertSessions error:', e);
    throw e;
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
