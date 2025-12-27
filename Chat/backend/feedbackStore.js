import prisma from './prismaClient.js';

// Helper
const toInt = (n) => Number(n);

export const addFeedback = async (userId, feedback, type, rating, context) => {
  const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();
  
  try {
      await prisma.feedback.create({
          data: {
              id,
              userId: userId || null, 
              feedback,
              type,
              rating,
              context: context || {},
              status: 'new',
              createdAt: now
          }
      });
      return { id, userId, feedback, type, rating, context, status: 'new', createdAt: now };
  } catch (e) {
      console.error('addFeedback error:', e);
      return null;
  }
};

export const getFeedback = async () => {
    try {
        const rows = await prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return rows.map(r => ({
            ...r,
            context: r.context || {},
            createdAt: toInt(r.createdAt)
        }));
    } catch (e) {
        console.error('getFeedback error:', e);
        return [];
    }
};
