import { put, del, list } from '@vercel/blob';

/**
 * LiraOS Vercel Blob Storage Integration
 * Helper service to upload and manage static files in the cloud.
 */

/**
 * Uploads a file (Buffer or Stream) to Vercel Blob
 * @param {string} filename The name to save the file as (e.g. 'avatar-123.jpg')
 * @param {Buffer|Blob|Stream|String} content The content of the file
 * @param {object} options Additional options (e.g. { access: 'public', contentType: 'image/jpeg' })
 * @returns {Promise<object>} The blob response, including the public URL
 */
export async function uploadToBlob(filename, content, options = {}) {
    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            throw new Error("BLOB_READ_WRITE_TOKEN is missing from .env");
        }

        const defaultOptions = {
            access: 'public', // 'public' makes it accessible via URL
            addRandomSuffix: true, // Prevents overwriting files with the same name
            ...options
        };

        const result = await put(filename, content, defaultOptions);
        console.log(`[BLOB] 🎉 Upload successful: ${result.url}`);
        return result;

    } catch (error) {
        console.error(`[BLOB] ❌ Upload failed for ${filename}:`, error);
        throw error;
    }
}

/**
 * Deletes a file from Vercel Blob by its URL
 * @param {string} url The public URL of the blob to delete
 */
export async function deleteFromBlob(url) {
    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            throw new Error("BLOB_READ_WRITE_TOKEN is missing from .env");
        }

        await del(url);
        console.log(`[BLOB] 🗑️ Deleted blob: ${url}`);
        return true;
    } catch (error) {
        console.error(`[BLOB] ❌ Delete failed for ${url}:`, error);
        throw error;
    }
}

/**
 * Lists all files currently in your Vercel Blob storage
 * @returns {Promise<Array>} Array of blob objects
 */
export async function listBlobs() {
    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            throw new Error("BLOB_READ_WRITE_TOKEN is missing from .env");
        }

        const { blobs } = await list();
        return blobs;
    } catch (error) {
        console.error(`[BLOB] ❌ Failed to list blobs:`, error);
        throw error;
    }
}
