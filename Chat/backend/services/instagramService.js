
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGES_DIR = path.join(__dirname, '../../Data/instagram_pending');

// Ensure directory exists
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

class InstagramService {
    constructor() {
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        this.userId = process.env.INSTAGRAM_USER_ID; // Business Account ID
    }

    /**
     * Uploads an image to Instagram Feed
     * @param {string} imagePath Local path or URL
     * @param {string} caption 
     */
    async postPhoto(imagePath, caption) {
        if (!this.accessToken || !this.userId) {
            console.warn("[Instagram] Credentials missing. Post skipped.");
            return { ok: false, error: "Credentials missing" };
        }

        try {
            console.log(`[Instagram] Preparing to post: ${imagePath}`);

            // 1. Upload Image to Container
            // Note: Instagram Graph API requires a PUBLIC URL for the image.
            // If running localhost, we need to upload it to a temporary host or use a tunnel.
            // For now, let's assume valid URL or handle logic later.
            // A common trick for localhost dev is to use ngrok in the user env, 
            // OR simply return a "Simulation Success" if we are local.
            
            if (process.env.NODE_ENV !== 'production' && !imagePath.startsWith('http')) {
                console.log(`[Instagram] 🚧 Dev Mode: Skipping API call (Image is local). \nCaption: ${caption}`);
                return { ok: true, id: 'simulated_media_id_123' };
            }

            const containerUrl = `https://graph.facebook.com/v21.0/${this.userId}/media`;
            const containerRes = await axios.post(containerUrl, null, {
                params: {
                    image_url: imagePath,
                    caption: caption,
                    access_token: this.accessToken
                }
            });

            const creationId = containerRes.data.id;
            console.log(`[Instagram] Container created: ${creationId}`);

            // 2. Publish Container
            const publishUrl = `https://graph.facebook.com/v21.0/${this.userId}/media_publish`;
            const publishRes = await axios.post(publishUrl, null, {
                params: {
                    creation_id: creationId,
                    access_token: this.accessToken
                }
            });

            console.log(`[Instagram] Published! ID: ${publishRes.data.id}`);
            return { ok: true, id: publishRes.data.id };

        } catch (error) {
            console.error("[Instagram] Post Error:", error.response ? error.response.data : error.message);
            return { ok: false, error: error.message };
        }
    }

    /**
     * Saves a base64 snapshot from frontend to disk for review/posting
     */
    async saveSnapshot(base64Data, caption) {
        const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return null;
        }

        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `lira_snap_${Date.now()}.png`;
        const filepath = path.join(IMAGES_DIR, filename);

        fs.writeFileSync(filepath, buffer);
        console.log(`[Instagram] Snapshot saved: ${filepath}`);
        
        // Save metadata
        fs.writeFileSync(filepath + '.meta.json', JSON.stringify({ caption, timestamp: Date.now() }));

        return { filename, filepath };
    }
}

export const instagramService = new InstagramService();
