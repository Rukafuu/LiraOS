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

    // 🎯 SMART TTS ROUTING: ElevenLabs (1st) → Minimax (2nd) → Google (3rd)
    
    // Priority 1: ElevenLabs (Best Quality) - Premium Only
    if (process.env.ELEVENLABS_API_KEY && hasPremiumVoice) {
        try {
            console.log(`[TTS] ✨ Attempting ElevenLabs (Premium)...`);
            const elevenVoiceId = voiceId?.startsWith('eleven-') 
                ? voiceId.replace('eleven-', '') 
                : '21m00Tcm4TlvDq8ikWAM'; // Default: Rachel (Plano Free Compatible)
            
            // Backup ID anterior (Lira Clone): hzmQH8l82zshXXrObQE2 (Requer Plano Pago)
            
            const audioBuffer = await generateSpeechElevenLabs(textToSpeak, elevenVoiceId);
            console.log(`[TTS] ✅ ElevenLabs Success! (Voice: ${elevenVoiceId})`);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.send(audioBuffer);
            return;
        } catch (e) {
            console.warn('[TTS] ⚠️ ElevenLabs failed, trying Minimax...', e.message);
        }
    }

    // Priority 2: Minimax (Good Quality Backup) - Premium Only
    if (process.env.MINIMAX_API_KEY && hasPremiumVoice) {
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
        }
    }

    // Priority 3: Edge TTS (Desativado: Python não encontrado. Aguardando fix de infra)
    /*
    try {
        console.log(`[TTS] 🦜 Attempting EdgeTTS (Francisca Neural)...`);
        const audioBuffer = await generateSpeechEdgeTTS(textToSpeak);
        console.log(`[TTS] ✅ EdgeTTS Success!`);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
        return;
    } catch (e) {
        console.warn('[TTS] ⚠️ EdgeTTS failed, trying Google...', e.message);
    }
    */
    
    // Priority 4: Google (Unica opção estavel agora)
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
