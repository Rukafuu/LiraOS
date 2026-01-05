import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

/**
 * AWS S3 Storage Service for LiraOS
 * Provides reliable, scalable cloud storage for user assets (images, voice samples, logs).
 */

const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize S3 Client only if credentials exist
let s3Client = null;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && S3_BUCKET) {
    try {
        s3Client = new S3Client({
            region: REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        console.log(`[STORAGE] S3 Client Initialized. Bucket: ${S3_BUCKET}`);
    } catch (e) {
        console.error('[STORAGE] Failed to initialize S3 Client:', e.message);
    }
} else {
    console.warn('[STORAGE] Missing AWS Credentials or Bucket Name. Cloud storage disabled.');
}

/**
 * Uploads a Buffer (image/audio) to S3 and returns the public URL.
 * @param {Buffer} buffer - File content
 * @param {string} mimeType - e.g., 'image/png', 'audio/mpeg'
 * @param {string} folder - Optional folder prefix (e.g., 'images/gen', 'voice/user')
 * @returns {Promise<string|null>} Public URL of uploaded file
 */
export async function uploadToS3(buffer, mimeType, folder = 'uploads') {
    if (!s3Client) {
        console.warn('[STORAGE] S3 not configured. Using local/base64 fallback.');
        return null;
    }

    const extension = mimeType.split('/')[1] || 'bin';
    const filename = `${folder}/${uuidv4()}.${extension}`;

    try {
        console.log(`[STORAGE] Uploading ${filename} to S3 (${buffer.length} bytes)...`);

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: S3_BUCKET,
                Key: filename,
                Body: buffer,
                ContentType: mimeType,
                // ACL: 'public-read' // Note: Many buckets block ACLs now. Ensure Bucket Policy allows public read.
            }
        });

        await upload.done();

        // Construct Public URL
        // Format: https://BUCKET.s3.REGION.amazonaws.com/KEY
        const publicUrl = `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${filename}`;
        
        console.log(`[STORAGE] Upload Success: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error('[STORAGE] Upload Failed:', error);
        throw error;
    }
}

/**
 * Converts a Base64 string to Buffer and Uploads to S3 (Convenience)
 */
export async function uploadBase64ToS3(base64Data, folder = 'images') {
    if (!s3Client) return null;

    // Remove Data URI header if present (e.g. "data:image/png;base64,")
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
        // Assume raw base64 if no header, default to png
        const buffer = Buffer.from(base64Data, 'base64');
        return await uploadToS3(buffer, 'image/png', folder);
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    return await uploadToS3(buffer, mimeType, folder);
}

export const isStorageEnabled = () => !!s3Client;
