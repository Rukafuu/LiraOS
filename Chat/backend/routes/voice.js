import express from 'express';
import dotenv from 'dotenv';
import { generateSpeechMinimax, generateSpeechElevenLabs, generateSpeechGoogle } from '../services/ttsService.js';

dotenv.config();
const router = express.Router();

router.post('/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    console.log(`[TTS] 🗣️ Requesting audio for: "${text.substring(0, 50)}..."`);

    // 🧹 Text Cleaning
    const cleanText = text
      .replace(/\[[\s\S]*?\]/g, '')
      .replace(/\([\s\S]*?\)/g, '')
      .replace(/\*[\s\S]*?\*/g, '')
      .replace(/[*#_`~]/g, '')
      .replace(/-{2,}/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const textToSpeak = cleanText.length > 0 ? cleanText : text;

    // 🎯 SMART TTS ROUTING: ElevenLabs (1st) → Minimax (2nd) → Google (3rd)
    
    // Priority 1: ElevenLabs (Best Quality)
    if (process.env.ELEVENLABS_API_KEY) {
        try {
            console.log(`[TTS] ✨ Attempting ElevenLabs (Premium)...`);
            const elevenVoiceId = voiceId?.startsWith('eleven-') 
                ? voiceId.replace('eleven-', '') 
                : 'hzmQH8l82zshXXrObQE2'; // Default Lira voice
            const audioBuffer = await generateSpeechElevenLabs(textToSpeak, elevenVoiceId);
            console.log(`[TTS] ✅ ElevenLabs Success!`);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.send(audioBuffer);
            return;
        } catch (e) {
            console.warn('[TTS] ⚠️ ElevenLabs failed, trying Minimax...', e.message);
        }
    }

    // Priority 2: Minimax (Good Quality Backup)
    if (process.env.MINIMAX_API_KEY) {
        try {
            console.log(`[TTS] 🎭 Attempting Minimax (Backup)...`);
            const minimaxVoiceId = voiceId === 'lira-local' || voiceId === 'xtts-local' 
                ? 'English_PlayfulGirl' 
                : (voiceId?.startsWith('minimax-') ? voiceId.replace('minimax-', '') : 'English_PlayfulGirl');
            const audioBuffer = await generateSpeechMinimax(textToSpeak, minimaxVoiceId);
            console.log(`[TTS] ✅ Minimax Success!`);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.send(audioBuffer);
            return;
        } catch (e) {
            console.warn('[TTS] ⚠️ Minimax failed, trying Google...', e.message);
        }
    }

    // Priority 3: Google (Free Fallback - Always Works)
    try {
        console.log(`[TTS] 🌐 Using Google Fallback (Free)...`);
        const audioBuffer = await generateSpeechGoogle(textToSpeak, 'pt-BR');
        console.log(`[TTS] ✅ Google Success!`);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
        return;
    } catch (googleErr) {
        console.error('[TTS] ❌ All TTS services failed:', googleErr.message);
        return res.status(503).json({ 
            error: 'TTS Service Unavailable',
            message: 'All voice providers failed. Please check API keys.'
        });
    }

  } catch (error) {
    console.error('[TTS ROUTE ERROR]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
