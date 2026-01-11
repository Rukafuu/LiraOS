import prisma from '../../../prismaClient.js';

export async function getOrCreateWaUser(waId, pushName, profilePicUrl = null) {
    const userId = `wa_${waId.replace(/\D/g, '')}`; 
    // Example: wa_551199999999

    // 1. Check if exists
    try {
        const existing = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (existing) {
            // Optional: Update name if changed
            return existing;
        }

        // 2. Create Light Account
        const dummyEmail = `${userId}@lira.bot`;
        
        const newUser = await prisma.user.create({
            data: {
                id: userId,
                email: dummyEmail,
                username: pushName || `User ${waId.slice(-4)}`,
                passwordHash: 'WA_AUTH_ONLY',
                avatar: profilePicUrl,
                plan: 'free',
                createdAt: Date.now(),
                isBanned: 0
            }
        });
        return newUser;
    } catch (e) {
        console.error('[WA] DB Error (Offline?). Using Guest Mode.', e.message);
        // Fallback Memory User
        return {
            id: userId,
            username: pushName || 'Guest',
            preferences: { platform: 'whatsapp' }
        };
    }
}
