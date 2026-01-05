import express from 'express';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { generateSpeechAWSPolly } from '../services/ttsService.js';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

dotenv.config();

const router = express.Router();

// router.use(requireAuth); // 🔓 Temporarily DISABLED for Voice Debugging

router.post('/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    console.log(`[TTS] 🗣️ Requesting audio for: "${text.substring(0, 50)}..."`);

    // 🧹 Text Cleaning
    // Remove [EMOTION], (Action), *Action*, and Markdown
    const cleanText = text
      .replace(/\[[\s\S]*?\]/g, '') // Remove [Tags] with newlines
      .replace(/\([\s\S]*?\)/g, '') // Remove (Parentheses) with newlines
      .replace(/\*[\s\S]*?\*/g, '') // Remove *Asterisks* actions
      .replace(/[*#_`~]/g, '')      // Remove remaining markdown chars
      .replace(/-{2,}/g, '')        // Remove long dashes
      .replace(/\s+/g, ' ')         // Collapse whitespace
      .trim();

    console.log(`[TTS DEBUG] Original: "${text.substring(0,30)}..." -> Clean: "${cleanText.substring(0,30)}..."`);

    const textToSpeak = cleanText.length > 0 ? cleanText : text;

    // ☁️ Lira Local (Now AWS Polly Cloud)
    if (voiceId === 'lira-local') {
      // Use 'Vitoria' or 'Camila' (Neural) for best PT-BR experience
      // 'generative' engine is experimental for PT-BR, defaulting to neural in service if needed.
      const audioBuffer = await generateSpeechAWSPolly(textToSpeak, 'Vitoria', 'neural'); 
      
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audioBuffer);
      return;
    }

    // 🟢 XTTS Local Support
    if (voiceId === 'xtts-local') {
      try {
        const xttsRes = await fetch('http://127.0.0.1:5002/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToSpeak, language: 'pt' })
        });
        if (!xttsRes.ok) throw new Error(await xttsRes.text());

        // BUFFERING PROXY (More robust than stream piping)
        const arrayBuffer = await xttsRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);

        return;
      } catch (e) {
        console.warn('[TTS] XTTS Local Server unavailable, falling back to AWS Polly (Vitoria Neural)...', e.message);
        try {
            // Fallback to Polly (Vitoria)
            const audioBuffer = await generateSpeechAWSPolly(textToSpeak, 'Vitoria', 'neural');
            res.setHeader('Content-Type', 'audio/mpeg');
            res.send(audioBuffer);
            return;
        } catch (pollyErr) {
            console.error('[TTS] Both XTTS and Polly Fallback failed:', pollyErr);
            return res.status(503).json({ error: 'TTS Service Unavailable', details: pollyErr.message });
        }
      }
    }

    // 🟠 ElevenLabs Fallback
    const apiKey = (process.env.elevenlabs_api_key || process.env.ELEVENLABS_API_KEY || '').trim();
    if (!apiKey) return res.status(500).json({ error: 'ElevenLabs API Key missing' });

    const voice = voiceId || '2RrzVoV9QVqHnD8bujTu';

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_44100_192`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: textToSpeak,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'TTS_upstream_error', details: errText });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(buffer);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
