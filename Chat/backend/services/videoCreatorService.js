import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { createRequire } from 'module';
import { generateSpeechEdgeTTS } from './ttsService.js';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const ffmpegPath = require('ffmpeg-static');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEOS_DIR = path.join(__dirname, '../videos');

if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

export const createShortVideo = async (script, imageUrl, voice = 'pt-BR-FranciscaNeural') => {
    try {
        const id = uuidv4();
        const audioPath = path.join(VIDEOS_DIR, `${id}.mp3`);
        const videoPath = path.join(VIDEOS_DIR, `${id}.mp4`);
        const imagePath = path.join(VIDEOS_DIR, `${id}.jpg`);

        // 1. Generate Audio
        console.log(`[VIDEO] Generating audio for: "${script.substring(0, 20)}..."`);
        const audioBuffer = await generateSpeechEdgeTTS(script, voice);
        fs.writeFileSync(audioPath, audioBuffer);

        // 2. Handle Image
        if (imageUrl.startsWith('data:image')) {
            const base64Data = imageUrl.split(',')[1];
            fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));
        } else if (imageUrl.startsWith('http')) {
            const fetch = (await import('node-fetch')).default;
            const res = await fetch(imageUrl);
            const buffer = await res.arrayBuffer();
            fs.writeFileSync(imagePath, Buffer.from(buffer));
        } else if (fs.existsSync(imageUrl)) {
             fs.copyFileSync(imageUrl, imagePath);
        } else {
            throw new Error(`Invalid image source: ${imageUrl}`);
        }

        // 3. Render Video
        console.log(`[VIDEO] Rendering video to ${videoPath}...`);
        
        // ffmpeg -loop 1 -i image.jpg -i audio.mp3 -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest out.mp4
        // Vertical video (9:16) scaling might be needed if image is not 9:16.
        // For now, naive loop.
        const args = [
            '-y',
            '-loop', '1',
            '-i', imagePath,
            '-i', audioPath,
            '-c:v', 'libx264',
            '-tune', 'stillimage',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            videoPath
        ];

        await new Promise((resolve, reject) => {
            const proc = spawn(ffmpegPath, args);
            let stderr = '';
            proc.stderr.on('data', d => stderr += d.toString());
            proc.on('close', code => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg failed: ${stderr}`));
            });
        });

        // Cleanup temp files
        const cleanup = () => {
             try { fs.unlinkSync(audioPath); fs.unlinkSync(imagePath); } catch (e) {}
        };
        cleanup();

        return {
            filename: `${id}.mp4`,
            filePath: videoPath,
            url: `/videos/${id}.mp4`
        };

    } catch (error) {
        console.error('[VIDEO] Creation failed:', error);
        throw error;
    }
};

/**
 * Higher level function for AI tool usage
 * 1. Generates an image from prompt
 * 2. Creates a short descriptive video with audio narrative
 */
export const generateVideo = async (prompt, userId = null, userPlan = 'free') => {
    try {
        const { generateImage } = await import('./imageGeneration.js');
        
        console.log(`[VIDEO_GEN] Pipeline started for: "${prompt}"`);
        
        // Step 1: Generate Visual
        const imgResult = await generateImage(prompt, userId, userPlan);
        if (!imgResult.success) {
            throw new Error(`Visual generation failed: ${imgResult.error}`);
        }
        
        // Step 2: Create Video
        // Narrate the prompt itself or a shorter version
        const result = await createShortVideo(prompt, imgResult.imageUrl);
        
        return {
            success: true,
            videoUrl: result.url,
            prompt: prompt,
            thumbnail: imgResult.imageUrl
        };
    } catch (e) {
        console.error('[VIDEO_GEN] Error in pipeline:', e);
        return { success: false, error: e.message };
    }
};
