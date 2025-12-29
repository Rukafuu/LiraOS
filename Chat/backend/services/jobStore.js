import prisma from '../prismaClient.js';

export const jobStore = {
    async create(id, data) {
        try {
            return await prisma.imageJob.create({
                data: {
                    id,
                    prompt: data.prompt,
                    status: data.status,
                    progress: data.progress || 0,
                    createdAt: BigInt(data.createdAt || Date.now()),
                    userId: data.userId,
                    provider: data.provider,
                    result: data.result,
                    error: data.error
                }
            });
        } catch (error) {
            console.error('[JobStore] Create failed:', error);
            throw error;
        }
    },

    async get(id) {
        try {
            const job = await prisma.imageJob.findUnique({
                where: { id }
            });
            if (!job) return null;
            return {
                ...job,
                createdAt: Number(job.createdAt)
            };
        } catch (error) {
            console.error('[JobStore] Get failed:', error);
            return null;
        }
    },

    async update(id, data) {
        // Filter undefined fields to avoid overwriting with null/undefined if not intended
        // But Prisma update ignores undefined usually if passed in 'data' object properly?
        // Let's be explicit manually or pass data directly if keys match Schema.
        try {
            return await prisma.imageJob.update({
                where: { id },
                data: data
            });
        } catch (error) {
             console.error('[JobStore] Update failed:', error);
             // If record missing, might fail
             return null;
        }
    }
};

// Deprecated in-memory map (kept momentarily if needed, but we should remove usages)
// export const imageJobs = new Map();
