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
      messages: row.messages || [] // Prisma handles Json
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
    // Using upsert
    // Note: userId is required in create, but might be optional in session object?
    // Assuming session object has all fields.
    // createdAt defaulting to now if missing.
    
    await prisma.session.upsert({
      where: { id },
      update: {
        title,
        personaId,
        updatedAt: updatedAt || now,
        messages: messages || []
      },
      create: {
        id,
        userId: userId || 'unknown', // Should fallback or fail? User usually exists.
        title: title || 'New Chat',
        personaId,
        createdAt: createdAt || now,
        updatedAt: updatedAt || now,
        messages: messages || []
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
      messages: row.messages || []
    };
  } catch (e) {
    console.error('getSessionById error:', e);
    return null;
  }
}
