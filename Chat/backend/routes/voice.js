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

    // 🎭 ROUTING LOGIC: Minimax -> ElevenLabs -> Google
    if (voiceId.startsWith('minimax-') || voiceId === 'English_PlayfulGirl' || voiceId === 'lira-local' || voiceId === 'xtts-local') {
        try {
            console.log(`[TTS] Attempting Minimax...`);
            const targetId = (voiceId === 'lira-local' || voiceId === 'minimax-playful' || voiceId === 'xtts-local') ? 'English_PlayfulGirl' : voiceId;
            const audioBuffer = await generateSpeechMinimax(textToSpeak, targetId);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.send(audioBuffer);
            return;
        } catch (e) {
            console.warn('[TTS] Minimax failed, trying ElevenLabs fallback...', e.message);
            try {
                const audioBuffer = await generateSpeechElevenLabs(textToSpeak);
                res.setHeader('Content-Type', 'audio/mpeg');
                res.send(audioBuffer);
                return;
            } catch (elevenErr) {
                console.warn('[TTS] ElevenLabs failed, trying Google fallback...', elevenErr.message);
                try {
                    const audioBuffer = await generateSpeechGoogle(textToSpeak, 'pt-BR');
                    res.setHeader('Content-Type', 'audio/mpeg');
                    res.send(audioBuffer);
                    return;
                } catch (googleErr) {
                    console.error('[TTS] All services failed:', googleErr.message);
                    return res.status(503).json({ error: 'TTS Service Unavailable' });
                }
            }
        }
    }

    // Default Fallback (Directly to ElevenLabs/Google if no specific voiceId matches)
    try {
        const audioBuffer = await generateSpeechElevenLabs(textToSpeak);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch {
        const audioBuffer = await generateSpeechGoogle(textToSpeak, 'pt-BR');
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    }

  } catch (error) {
    console.error('[TTS ROUTE ERROR]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
