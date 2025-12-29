import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateImage } from '../services/imageGeneration.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { imageJobs } from '../services/jobStore.js';

const router = express.Router();


// POST /api/images/generate
router.post('/generate', requireAuth, async (req, res) => {
    try {
        const { prompt, tier = 'free' } = req.body;
        
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        const jobId = uuidv4();
        const job = {
            id: jobId,
            status: 'queued',
            progress: 0,
            prompt,
            createdAt: Date.now()
        };

        imageJobs.set(jobId, job);

        // Start processing asynchronously
        (async () => {
            try {
                job.status = 'generating';
                job.progress = 10;
                
                // Simulate some progress steps if the actual generation doesn't support streaming
                const progressInterval = setInterval(() => {
                    if (job.status === 'generating' && job.progress < 80) {
                        job.progress += 10;
                    }
                }, 500);

                const HF_KEY = process.env.HUGGINNGFACE_ACCESS_TOKEN;
                const result = await generateImage(prompt, tier, HF_KEY);
                
                clearInterval(progressInterval);

                if (result.success) {
                    job.status = 'completed';
                    job.progress = 100;
                    job.result = result.imageUrl;
                    job.fallback = result.fallback;
                } else {
                    job.status = 'failed';
                    job.error = 'Image generation failed';
                }
            } catch (err) {
                console.error(`Job ${jobId} failed:`, err);
                job.status = 'failed';
                job.error = err.message || 'Unknown error';
            }
        })();

        res.json({ jobId, status: 'queued' });

    } catch (error) {
        console.error('Generate route error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/images/:jobId
// Simple Polling Endpoint
router.get('/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const job = imageJobs.get(id);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
        id: job.id,
        status: job.status,
        progress: job.progress,
        result: job.result,
        error: job.error
    });
});

export default router;
