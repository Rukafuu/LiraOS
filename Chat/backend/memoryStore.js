import prisma from './prismaClient.js';

const toInt = (n) => Number(n);

export async function getMemories(userId) {
  try {
    const rows = await prisma.memory.findMany({
        where: userId ? { userId } : {},
        orderBy: { createdAt: 'desc' }
    });
    
    return rows.map(row => ({
      ...row,
      tags: row.tags || [],
      createdAt: toInt(row.createdAt)
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
    await prisma.memory.create({
        data: {
            id,
            userId,
            content,
            category,
            priority,
            createdAt,
            tags: tags,
            importance: 1
        }
    });
    
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
    const row = await prisma.memory.findUnique({
        where: { id }
    });
    if (!row) return null;
    return { ...row, tags: row.tags || [], createdAt: toInt(row.createdAt) };
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
    await prisma.memory.delete({ where: { id } });
    return true;
  } catch (e) {
    console.error('deleteMemory error:', e);
    return false;
  }
}

export async function deleteMemoriesByUser(userId) {
  try {
    const info = await prisma.memory.deleteMany({ where: { userId } });
    return info.count > 0;
  } catch (e) {
    console.error('deleteMemoriesByUser error:', e);
    return false;
  }
}
