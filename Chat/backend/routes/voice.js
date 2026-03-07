import express from 'express';
import dotenv from 'dotenv';
import { generateSpeechMinimax, generateSpeechElevenLabs, generateSpeechGoogle, generateSpeechEdgeTTS } from '../services/ttsService.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { getUserById } from '../user_store.js';
import { canUseFeature } from '../services/tierLimits.js';

dotenv.config();
const router = express.Router();

router.post('/tts', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await getUserById(userId);
    const userTier = user?.plan || 'free';
    const hasPremiumVoice = await canUseFeature(userTier, 'voice_hd');

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

    // Priority 1: Edge TTS (Francisca Neural - High Quality & Free)
    try {
        console.log(`[TTS] 🦜 Attempting EdgeTTS (Francisca Neural)...`);
        const audioBuffer = await generateSpeechEdgeTTS(textToSpeak);
        console.log(`[TTS] ✅ EdgeTTS Success!`);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
        return;
    } catch (e) {
        console.warn('[TTS] ⚠️ EdgeTTS failed, falling back...', e.message);
    }

    // Priority 2: ElevenLabs (Best Quality) - Premium Only
    if (process.env.ELEVENLABS_API_KEY && hasPremiumVoice) {
        try {
            console.log(`[TTS] ✨ Attempting ElevenLabs (Premium)...`);
            const elevenVoiceId = voiceId?.startsWith('eleven-') 
                ? voiceId.replace('eleven-', '') 
                : '21m00Tcm4TlvDq8ikWAM'; 
            
            const audioBuffer = await generateSpeechElevenLabs(textToSpeak, elevenVoiceId);
            console.log(`[TTS] ✅ ElevenLabs Success!`);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.send(audioBuffer);
            return;
        } catch (e) {
            console.warn('[TTS] ⚠️ ElevenLabs failed...', e.message);
        }
    }

    // Priority 3: Google (Fallback)
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
            message: 'All voice providers failed.'
        });
    }

  } catch (error) {
    console.error('[TTS ROUTE ERROR]', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
