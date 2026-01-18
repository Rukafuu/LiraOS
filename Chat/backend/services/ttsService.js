import { uploadToS3 } from './storageService.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as googleTTS from 'google-tts-api';

dotenv.config();

// ------------------------------------------------------------------
// MINIMAX PREMIUM IMPLEMENTATION (V2 - sk-api keys)
// ------------------------------------------------------------------
export async function generateSpeechMinimax(text, voiceId = 'English_PlayfulGirl') {
    const apiKey = (process.env.MINIMAX_API_KEY || '').trim();
    if (!apiKey) throw new Error("Minimax API Key is missing.");

    const url = 'https://api.minimaxi.chat/v1/text_to_speech';
    
    console.log(`[TTS] Minimax v2 Request ID: ${voiceId}`);

    const body = {
        model: "speech-01-turbo",
        text: text,
        voice_id: voiceId,
        stream: false,
        voice_setting: {
            speed: 1.0,
            vol: 1.0,
            pitch: 0
        },
        audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: "mp3",
            channel: 1
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Minimax API HTTP ${response.status}: ${err}`);
    }

    const data = await response.json();
    if (data.base_resp?.status_code !== 0) {
        const msg = data.base_resp?.status_msg || 'Unknown error';
        console.error(`[TTS] Minimax Business Error: ${msg}`);
        throw new Error(`Minimax Error: ${msg}`);
    }

    if (!data.data || !data.data.audio) {
        throw new Error("Minimax: No audio data in response");
    }

    return Buffer.from(data.data.audio, 'hex');
}

// ------------------------------------------------------------------
// ELEVENLABS PREMIUM FALLBACK
// ------------------------------------------------------------------
export async function generateSpeechElevenLabs(text, voiceId = 'hzmQH8l82zshXXrObQE2') {
    const apiKey = (process.env.ELEVENLABS_API_KEY || '').trim();
    if (!apiKey) throw new Error("ElevenLabs API Key is missing.");

    console.log(`[TTS] ElevenLabs Request: ${voiceId}`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'accept': 'audio/mpeg'
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`ElevenLabs API HTTP ${response.status}: ${err}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// ------------------------------------------------------------------
// EDGE TTS (Microsoft Francisca Neural - Free High Quality)
// ------------------------------------------------------------------
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function generateSpeechEdgeTTS(text) {
    console.log(`[TTS] EdgeTTS Request (Python): pt-BR-FranciscaNeural`);
    
    return new Promise((resolve, reject) => {
        const outputFilename = `temp_edge_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
        const outputPath = path.join(__dirname, '..', 'temp', outputFilename); // Salva na pasta temp do backend/temp
        
        // Garante que a pasta temp existe
        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const pythonScript = path.join(__dirname, '..', 'python', 'edge_tts_connector.py');
        
        // Tenta 'python3' (Linux/Railway) ou 'python' (Windows)
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
        
        const processPy = spawn(pythonCommand, [pythonScript, text, outputPath]);

        processPy.stderr.on('data', (data) => {
            console.error(`[EdgeTTS Python Error]: ${data}`);
        });

        processPy.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`EdgeTTS Python process exited with code ${code}`));
                return;
            }

            try {
                if (fs.existsSync(outputPath)) {
                    const buffer = fs.readFileSync(outputPath);
                    fs.unlinkSync(outputPath); // Limpa arquivo
                    resolve(buffer);
                } else {
                    reject(new Error("EdgeTTS Output file not found."));
                }
            } catch (err) {
                reject(err);
            }
        });
    });
}

// ------------------------------------------------------------------
// GOOGLE TTS FALLBACK (Ultimate Backup)
// ------------------------------------------------------------------
export async function generateSpeechGoogle(text, lang = 'pt-BR') {
    console.log(`[TTS] Google Fallback Request: ${lang}`);
    try {
        const url = googleTTS.getAudioUrl(text, {
            lang: lang,
            slow: false,
            host: 'https://translate.google.com',
        });
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Google TTS status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (err) {
        console.error('[TTS] Google Fallback Error:', err.message);
        throw err;
    }
}

// Mocked/Legacy stubs
// EdgeTTS agora está implementado corretamente acima.
export async function generateSpeechAWSPolly() { throw new Error("Polly removed."); }
