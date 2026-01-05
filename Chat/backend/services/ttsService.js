import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { uploadToS3 } from './storageService.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize Polly
let pollyClient = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    pollyClient = new PollyClient({ 
        region: REGION, 
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });
    console.log('[TTS] AWS Polly Client Initialized 🦜');
}

/**
 * Generates speech using AWS Polly
 * @param {string} text - Text to speak
 * @param {string} voiceId - Polly Voice ID (e.g. 'Camila', 'Vitoria', 'Ruth')
 * @param {string} engine - 'neural', 'standard', or 'generative'
 * @returns {Promise<Buffer>} Audio buffer
 */
export async function generateSpeechAWSPolly(text, voiceId = 'Francisca', engine = 'neural') {
    if (!pollyClient) throw new Error("AWS Credentials missing for Polly.");

    console.log(`[TTS] Requesting AWS Polly: ${voiceId} (${engine}) - "${text.substring(0, 20)}..."`);

    // Basic SSML to control breathing/speed if needed
    const params = {
        Text: text,
        OutputFormat: "mp3",
        VoiceId: voiceId,
        Engine: engine, // 'generative' is only supported for certain voices (e.g. Ruth, Matthew in US-English)
        LanguageCode: voiceId === 'Camila' || voiceId === 'Vitoria' || voiceId === 'Thiago' ? 'pt-BR' : 'en-US'
    };

    // AWS Polly Generative Engine currently supports:
    // en-US: Ruth, Matthew, Amy
    // If user requests 'generative' for PT-BR, good luck (it might fallback or fail).
    // Let's safe-guard: if PT-BR and Generative requested, fallback to Neural because Generative PT-BR might not be public yet.
    if (params.LanguageCode === 'pt-BR' && engine === 'generative') {
        console.warn("[TTS] AWS Polly Generative not widely available for PT-BR yet. Falling back to Neural.");
        params.Engine = 'neural';
    }

    try {
        const command = new SynthesizeSpeechCommand(params);
        const response = await pollyClient.send(command);

        // Convert Stream to Buffer
        const audioStream = response.AudioStream;
        const chunks = [];
        for await (const chunk of audioStream) {
            chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);
        
        // Async Cache to S3 (Fire and Forget)
        const hash = crypto.createHash('md5').update(`polly-${voiceId}-${engine}-${text}`).digest('hex');
        uploadToS3(audioBuffer, 'audio/mpeg', `voice/cache/${hash}.mp3`)
            .then(url => console.log(`[TTS] Cached to S3: ${url}`))
            .catch(err => console.error(`[TTS] Cache failed: ${err.message}`));

        return audioBuffer;

    } catch (error) {
        console.error("[TTS] Polly Synthesis Failed:", error);
        throw error;
    }
}

// ------------------------------------------------------------------
// EDGE TTS IMPLEMENTATION (Direct WebSocket - Zero Dependency Hell)
// ------------------------------------------------------------------
export async function generateSpeechEdgeTTS(text, voice = 'pt-BR-FranciscaNeural', pitch = '+20Hz', rate = '+10%') {
    console.log(`[TTS] EdgeTTS Request: ${voice} (Pitch: ${pitch}, Rate: ${rate})`);
    
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4-EB77-4785-A779-A21604C1F59D');
        const chunks = [];

        ws.on('open', () => {
             const requestId = uuidv4().replace(/-/g, '');
             ws.send(`X-Timestamp:${new Date().toString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`);
             
             const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='pt-BR'><voice name='${voice}'><prosody pitch='${pitch}' rate='${rate}'>${text}</prosody></voice></speak>`;
             ws.send(`X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toString()}\r\nPath:ssml\r\n\r\n${ssml}`);
        });

        ws.on('message', (data, isBinary) => {
            if (isBinary) {
                // Find 'Path:audio\r\n' in the header part of the binary message
                const separator = Buffer.from('Path:audio\r\n');
                const idx = data.indexOf(separator);
                if (idx !== -1) {
                     // The header is text, then \r\n, then binary data.
                     // The end of header is marked by detecting where the ascii text ends, 
                     // usually simpler to look for the known separator and skip a known offset?
                     // Actually, binary messages from Edge have a 2-byte size header for the text header.
                     // Let's rely on finding "Path:audio\r\n" and looking for the start of content.
                     // Usually it's roughly after the text header.
                     // Let's just scan for '\r\n\r\n' after the 'Path:audio'
                     const headerEndInfo = data.indexOf(Buffer.from('\r\n\r\n'), idx);
                     if (headerEndInfo !== -1) {
                         const audioData = data.subarray(headerEndInfo + 4);
                         chunks.push(audioData);
                     }
                }
            }
        });

        ws.on('close', () => {
            if (chunks.length > 0) {
                const audioBuffer = Buffer.concat(chunks);
                
                // Cache to S3 (Async)
                const hash = crypto.createHash('md5').update(`edge-${voice}-${pitch}-${rate}-${text}`).digest('hex');
                uploadToS3(audioBuffer, 'audio/mpeg', `voice/cache/${hash}.mp3`)
                    .then(url => console.log(`[TTS] Cached to S3: ${url}`))
                    .catch(() => {});

                resolve(audioBuffer);
            } else {
                // Sometimes close happens before we get chunks if error
                // But usually we get at least something. 
                // If empty, reject.
                if (chunks.length === 0) reject(new Error('EdgeTTS closed without audio'));
            }
        });

        ws.on('error', (err) => {
            console.error('[TTS] EdgeTTS Error:', err);
            reject(err);
        });
    });
}

// ------------------------------------------------------------------
// MINIMAX TTS IMPLEMENTATION (Premium Anime/Expressive)
// ------------------------------------------------------------------
export async function generateSpeechMinimax(text, voiceId = 'English_PlayfulGirl') {
    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;

    if (!apiKey || !groupId) {
        throw new Error("Minimax Credentials (API_KEY or GROUP_ID) missing.");
    }

    console.log(`[TTS] Requesting Minimax: ${voiceId} - "${text.substring(0, 20)}..."`);
    
    // Minimax T2A V2 Endpoint
    const url = `https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "speech-01-turbo",
                text: text,
                stream: false,
                voice_setting: {
                    voice_id: voiceId,
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
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Minimax API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        
        // Minimax usually returns hex audio in data.data.audio
        if (data.base_resp && data.base_resp.status_code !== 0) {
             throw new Error(`Minimax Business Error: ${data.base_resp.status_msg}`);
        }

        if (!data.data || !data.data.audio) {
            throw new Error("Minimax response missing audio data");
        }

        // Convert Hex to Buffer
        const audioHex = data.data.audio;
        const audioBuffer = Buffer.from(audioHex, 'hex');

        // Async Cache to S3
        const hash = crypto.createHash('md5').update(`minimax-${voiceId}-${text}`).digest('hex');
        uploadToS3(audioBuffer, 'audio/mpeg', `voice/cache/${hash}.mp3`)
            .then(url => console.log(`[TTS] Cached to S3: ${url}`))
            .catch(() => {});

        return audioBuffer;

    } catch (error) {
        console.error("[TTS] Minimax Synthesis Failed:", error);
        throw error;
    }
}
