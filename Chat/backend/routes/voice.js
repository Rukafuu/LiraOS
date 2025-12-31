import express from 'express';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { requireAuth } from '../middlewares/authMiddleware.js';
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
    const cleanText = text
      .replace(/[*#_`~]/g, '')
      .replace(/-{2,}/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const textToSpeak = cleanText.length > 0 ? cleanText : text;

    // 🟢 Lira Local (Edge-TTS)
    if (voiceId === 'lira-local') {
      const pythonScript = path.join(process.cwd(), 'python', 'tts_engine.py');

      // 🐧 Cross-Platform Command
      // Windows uses 'python', Linux/Mac uses 'python3'
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

      // Spawn python process with --generate-only
      const pyProcess = spawn(pythonCommand, [pythonScript, textToSpeak, '--generate-only']);

      let audioPath = '';

      pyProcess.stdout.on('data', (data) => {
        audioPath += data.toString().trim();
      });

      pyProcess.stderr.on('data', (data) => {
        console.error('[TTS Engine Error]', data.toString());
      });

      pyProcess.on('close', (code) => {
        if (code !== 0 || !audioPath) {
          return res.status(500).json({ error: 'TTS Generation Failed' });
        }

        // Read file and send
        try {
          if (fs.existsSync(audioPath)) {
            const buffer = fs.readFileSync(audioPath);

            res.setHeader('Content-Type', 'audio/mpeg');
            // res.setHeader('Content-Length', buffer.length); // Optional, chunked transfer is fine
            res.send(buffer);

            // Cleanup
            fs.unlinkSync(audioPath);
          } else {
            res.status(500).json({ error: 'Audio file not found' });
          }
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: 'Error reading audio file' });
        }
      });
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
        console.error('XTTS Backend Error:', e);
        return res.status(503).json({ error: 'XTTS Local Server communication failed', details: e.message });
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
