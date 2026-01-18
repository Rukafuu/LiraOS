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
import { MsEdgeTTS, OUTPUT_FORMAT } from "edge-tts";

export async function generateSpeechEdgeTTS(text) {
    console.log(`[TTS] EdgeTTS Request: pt-BR-FranciscaNeural`);
    try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata("pt-BR-FranciscaNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        
        const filePath = await tts.toFile(`./temp_${Date.now()}.mp3`, text);
        
        // Ler o arquivo gerado e retornar buffer
        const fs = await import('fs');
        const buffer = fs.readFileSync(filePath);
        
        // Limpar arquivo temporário
        fs.unlinkSync(filePath);
        
        return buffer;
    } catch (e) {
        throw new Error(`EdgeTTS Failed: ${e.message}`);
    }
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
