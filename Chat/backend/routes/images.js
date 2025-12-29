import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { generateImage } from '../services/imageGeneration.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { jobStore } from '../services/jobStore.js';

const router = express.Router();


// POST /api/images/generate
router.post('/generate', requireAuth, async (req, res) => {
    try {
        const { prompt, tier = 'free' } = req.body;
        
        if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

        const jobId = uuidv4();
        // Create initial job in DB
        await jobStore.create(jobId, {
            prompt,
            status: 'queued',
            progress: 0,
            createdAt: Date.now(),
            userId: req.user?.id
        });

        // Start processing asynchronously
        (async () => {
            try {
                await jobStore.update(jobId, { status: 'generating', progress: 10 });
                
                // Simulate some progress steps if the actual generation doesn't support streaming
                const progressInterval = setInterval(async () => {
                    // Fetch latest status to ensure we don't overwrite completion? 
                    // Optimization: Just blind update progress if < 80
                    try {
                         // We can't easily check 'job.progress' without fetching.
                         // But for simplicity, we assume generation takes time.
                         // Let's just update timestamp or keep distinct updates.
                         // Actually, reading from DB every 500ms is heavy for just simulation.
                         // We'll skip simulation updates in DB to save IO, or do it less frequently.
                    } catch(e) {}
                }, 1000);

                const HF_KEY = process.env.HUGGINNGFACE_ACCESS_TOKEN;
                const result = await generateImage(prompt, tier, HF_KEY);
                
                clearInterval(progressInterval);

                if (result.success) {
                    await jobStore.update(jobId, {
                        status: 'completed', // Ready
                        progress: 100,
                        result: result.imageUrl,
                        provider: result.provider
                    });
                } else {
                     await jobStore.update(jobId, {
                        status: 'failed',
                        error: 'Image generation failed'
                    });
                }
            } catch (err) {
                console.error(`Job ${jobId} failed:`, err);
                await jobStore.update(jobId, {
                    status: 'failed',
                    error: err.message || 'Unknown error'
                });
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
router.get('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const job = await jobStore.get(id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
    
        // Debug Log
        if (job.status !== 'completed' && job.status !== 'failed') {
             // console.log(`[API_IMG] Job ${req.params.id} still ${job.status}`);
        } else {
             console.log(`[API_IMG] Job ${req.params.id} is ${job.status}`);
        }

        res.json({
            id: job.id,
            status: job.status === 'completed' ? 'ready' : job.status, // Map 'completed' to 'ready' for frontend? Or frontend handles 'completed'?
            // Frontend expects 'ready' or 'completed'?
            // ProgressiveImage.tsx checks "status === 'ready'".
            // Backend jobStore usually used 'completed'.
            // Let's map it here to be safe: 'completed' -> 'ready'.
            
            progress: job.progress,
            result: job.result, // This is the persistent URL/Base64
            error: job.error
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
