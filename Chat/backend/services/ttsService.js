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
// HUGGING FACE TTS (Anime-Link Free Alternative)
// ------------------------------------------------------------------
export async function generateSpeechHuggingFace(text) {
    const apiKey = (process.env.HF_API_KEY || '').trim();
    if (!apiKey) throw new Error("HuggingFace API Key is missing.");

    // Modelo MMS-TTS Português (Facebook/VITS) - Voz feminina natural em PT-BR
    const model = 'facebook/mms-tts-por'; 
    
    console.log(`[TTS] HuggingFace Request: ${model} (PT-BR)`);

    // UPDATE: URL alterada de api-inference para router.huggingface.co
    const response = await fetch(`https://router.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text })
    });

    if (!response.ok) {
        // Se o modelo estiver carregando (503), lançar erro específico
        if (response.status === 503) {
            throw new Error(`HuggingFace Model Loading (Cold Boot). Try again in 20s.`);
        }
        const err = await response.text();
        throw new Error(`HuggingFace API ${response.status}: ${err}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
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
export async function generateSpeechEdgeTTS() { throw new Error("EdgeTTS removed."); }
export async function generateSpeechAWSPolly() { throw new Error("Polly removed."); }
