
import express from 'express';
import { getMemories, addMemory, deleteMemory, deleteMemoriesByUser } from '../memoryStore.js';
import dotenv from 'dotenv';
import { requireAuth } from '../middlewares/authMiddleware.js';

dotenv.config();

const router = express.Router();
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const mems = await getMemories(userId);
    res.json(mems);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { content, tags = [], category = 'note', priority = 'medium' } = req.body;
    const userId = req.userId;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content is required' });
    }

    const mem = await addMemory(content, tags, category, priority, userId);
    res.json(mem);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const ok = await deleteMemory(req.params.id, req.userId);
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const userId = req.userId;
    const ok = await deleteMemoriesByUser(userId);
    res.json({ ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Intelligent extraction (Mistral)
router.post('/extract', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text_required' });
    
    // Fallback to extraction logic if key missing, but here we assume key exists
    if (!MISTRAL_API_KEY) {
        return res.json({ content: String(text).slice(0, 300), category: 'note', priority: 'medium' });
    }

    const r = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${MISTRAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: 'Resuma em 1-2 frases, objetivas e informativas. Classifique categoria em profile|contact|location|birthday|note e prioridade em high|medium|low. Retorne JSON com keys content, category, priority.' },
          { role: 'user', content: text }
        ]
      })
    });
    if (!r.ok) throw new Error('Model failed');
    const j = await r.json();
    const c = j.choices?.[0]?.message?.content || '';
    
    let parsed = null;
    try { 
        // Try to find JSON block
        const match = c.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else parsed = JSON.parse(c); 
    } catch {}
    
    if (!parsed || !parsed.content) {
      parsed = { content: String(text).slice(0, 300), category: 'note', priority: 'medium' };
    }
    res.json(parsed);
  } catch (e) {
    // Fallback
    res.json({ content: String(req.body.text).slice(0, 300), category: 'note', priority: 'medium' });
  }
});

export default router;
