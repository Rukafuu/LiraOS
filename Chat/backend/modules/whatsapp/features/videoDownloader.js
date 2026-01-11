import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const BIN_DIR = path.resolve('bin');
const YT_DLP_PATH = path.join(BIN_DIR, 'yt-dlp.exe');
const TEMP_DIR = path.resolve('temp');

// URL for the latest yt-dlp binary (Windows)
const YT_DLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';

async function ensureYtDlp() {
    if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR, { recursive: true });
    
    if (fs.existsSync(YT_DLP_PATH)) return;

    console.log('[DL] Downloading yt-dlp binary (First Run)...');
    
    const response = await axios({
        url: YT_DLP_URL,
        method: 'GET',
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(YT_DLP_PATH);
    
    return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', () => {
            console.log('[DL] yt-dlp installed!');
            resolve();
        });
        writer.on('error', reject);
    });
}

export async function downloadVideo(rawUrl) {
    try {
        await ensureYtDlp();

        const url = rawUrl.replace(/[<>]/g, '').trim();
        if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

        const outputTemplate = path.join(TEMP_DIR, '%(id)s.%(ext)s');
        
        console.log(`[DL] Executing yt-dlp for: ${url}`);
        
        // Command: yt-dlp -o "..." -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --max-filesize 50M
        const { stdout } = await execFileAsync(YT_DLP_PATH, [
            '-o', outputTemplate,
            '-f', 'best[ext=mp4]/best', // Prefer MP4 single file for speed/compat
            '--max-filesize', '50M',    // WhatsApp limit approx
            '--no-playlist',
            url
        ]);

        // Parse filename from stdout or find the file?
        // yt-dlp outputs "[download] Destination: ...\file.mp4"
        const match = stdout.match(/Destination:\s+(.*)$/m) || stdout.match(/has already been downloaded and merged as\s+(.*)$/m) || stdout.match(/\[download\]\s+(.*?)\s+has/);
        
        // Easier: Search for the newest file in temp? 
        // Or trust the logic.
        
        // Let's find the file by ID if possible, or parsing stdout is safer.
        // Actually, matching the destination is tricky if it merges.
        
        // Improved strategy: Get filename first using --print filename
        const { stdout: filenameOut } = await execFileAsync(YT_DLP_PATH, [
            '--print', 'filename',
            '-o', outputTemplate,
            url
        ]);
        
        const filePath = filenameOut.trim();
        
        if (fs.existsSync(filePath)) {
            return {
                filePath,
                type: 'video',
                caption: '🎥 *Download Concluído!*\nAqui está seu vídeo. ✨'
            };
        }
        
        return { error: 'Arquivo não encontrado após download.' };

    } catch (e) {
        console.error('[DL] yt-dlp Error:', e.stderr || e.message);
        return { error: `Erro no download: ${e.message}` };
    }
}
