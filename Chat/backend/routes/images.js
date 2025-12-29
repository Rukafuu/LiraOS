import express from 'express';
import { generateImage, getProviderInfo } from '../services/imageGeneration.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getUserById } from '../authStore.js';

const router = express.Router();

// In-memory job storage (in production, use Redis or database)
const jobs = new Map();

router.use(requireAuth);

/**
 * POST /api/images/generate
 * Start image generation and return jobId immediately
 */
router.post('/generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        const userId = req.userId;

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Get user tier
        const user = await getUserById(userId);
        const userPlan = user?.plan || 'free';

        // Create job
        const jobId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        jobs.set(jobId, {
            jobId,
            status: 'queued',
            progress: 0,
            prompt: prompt.trim(),
            userId,
            createdAt: Date.now()
        });

        // Start generation in background
        generateImageAsync(jobId, prompt.trim(), userPlan);

        res.json({ jobId, status: 'queued' });

    } catch (error) {
        console.error('[IMAGES] Generation error:', error);
        res.status(500).json({ error: 'Failed to start image generation' });
    }
});

/**
 * GET /api/images/:jobId
 * Get job status and result
 */
router.get('/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    // Only return job to owner
    if (job.userId !== req.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(job);
});

/**
 * DELETE /api/images/:jobId
 * Clear a completed job
 */
router.delete('/:jobId', (req, res) => {
    const { jobId } = req.params;
    const job = jobs.get(jobId);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    if (job.userId !== req.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    jobs.delete(jobId);
    res.json({ success: true });
});

/**
 * Background image generation
 */
async function generateImageAsync(jobId, prompt, userPlan) {
    try {
        // Update to generating
        const job = jobs.get(jobId);
        if (!job) return;

        job.status = 'generating';
        job.progress = 10;
        jobs.set(jobId, job);

        // Get HF API key
        const HF_API_KEY = process.env.HUGGINNGFACE_ACCESS_TOKEN;

        // Generate image
        const result = await generateImage(prompt, userPlan, HF_API_KEY);

        if (result.success) {
            job.status = 'ready';
            job.progress = 100;
            job.imageUrl = result.imageUrl;
            job.provider = result.provider;
            job.model = result.model;
            job.quality = result.quality;
            job.completedAt = Date.now();
        } else {
            job.status = 'error';
            job.error = 'Generation failed';
        }

        jobs.set(jobId, job);

    } catch (error) {
        console.error(`[IMAGES] Job ${jobId} failed:`, error);
        const job = jobs.get(jobId);
        if (job) {
            job.status = 'error';
            job.error = error.message || 'Unknown error';
            jobs.set(jobId, job);
        }
    }
}

// Cleanup old jobs (older than 1 hour)
setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [jobId, job] of jobs.entries()) {
        if (job.createdAt < oneHourAgo) {
            jobs.delete(jobId);
        }
    }
}, 10 * 60 * 1000); // Run every 10 minutes

export default router;
