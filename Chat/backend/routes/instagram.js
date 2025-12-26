
import express from 'express';
import { instagramService } from '../services/instagramService.js';

const router = express.Router();

// 1. Receive Snapshot from Frontend (Photo Booth)
router.post('/upload-snapshot', async (req, res) => {
    try {
        const { image, caption, autoPost } = req.body;
        
        if (!image) return res.status(400).json({ error: "No image provided" });

        // Save locally first
        const saved = await instagramService.saveSnapshot(image, caption || "Lira Snapshot");
        
        if (autoPost) {
            // In a real scenario, we'd need to upload this local file to a public URL (S3/Cloudinary)
            // before Instagram API can see it.
            // For this MVP, we just confirm saving.
            return res.json({ 
                success: true, 
                message: "Snapshot saved for Instagram (Auto-post requires Public URL setup)",
                file: saved.filename 
            });
        }

        res.json({ success: true, file: saved.filename });
    } catch (e) {
        console.error("Snapshot Error:", e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
