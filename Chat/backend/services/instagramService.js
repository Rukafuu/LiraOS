import fetch from 'node-fetch'; // Should be global in Node 18+, but using native fetch
import dotenv from 'dotenv';

dotenv.config();

const INSTAGRAM_API_BASE = 'https://graph.facebook.com/v19.0';

/**
 * Posts an image to Instagram Feed
 * @param {string} imageUrl - Public URL of the image (must be on S3 or similar)
 * @param {string} caption - The text caption for the post
 */
export async function postToInstagram(imageUrl, caption) {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID; // The Instagram Business Account ID

    if (!accessToken || !accountId) {
        throw new Error('Instagram credentials missing (INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID)');
    }

    console.log(`[INSTAGRAM] 📸 Preparing to post image: ${imageUrl}`);

    try {
        // Step 1: Create Media Container
        // POST /{ig-user-id}/media
        const containerUrl = `${INSTAGRAM_API_BASE}/${accountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;
        
        const containerRes = await fetch(containerUrl, { method: 'POST' });
        const containerData = await containerRes.json();

        if (containerData.error) {
            throw new Error(`Instagram Container Error: ${containerData.error.message}`);
        }

        const creationId = containerData.id;
        console.log(`[INSTAGRAM] Container created: ${creationId}`);

        // Step 2: Publish Media
        // POST /{ig-user-id}/media_publish
        const publishUrl = `${INSTAGRAM_API_BASE}/${accountId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
        
        const publishRes = await fetch(publishUrl, { method: 'POST' });
        const publishData = await publishRes.json();

        if (publishData.error) {
            throw new Error(`Instagram Publish Error: ${publishData.error.message}`);
        }

        console.log(`[INSTAGRAM] ✨ Post Published! ID: ${publishData.id}`);
        return {
            success: true,
            postId: publishData.id,
            permalink: `https://instagram.com/p/${publishData.id}/` // Note: API doesn't return permalink immediately usually, but we can assume success
        };

    } catch (error) {
        console.error('[INSTAGRAM] Failed to post:', error);
        throw error;
    }
}

/**
 * Get recent media (Optional: for Lira to see her own feed)
 */
export async function getRecentMedia(limit = 5) {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

    if (!accessToken || !accountId) return [];

    try {
        const url = `${INSTAGRAM_API_BASE}/${accountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = await res.json();
        
        return data.data || [];
    } catch (e) {
        console.error('Failed to fetch media:', e);
        return [];
    }
}
