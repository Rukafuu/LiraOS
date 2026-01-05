import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { uploadToS3 } from './storageService.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
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
export async function generateSpeechAWSPolly(text, voiceId = 'Camila', engine = 'neural') {
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
