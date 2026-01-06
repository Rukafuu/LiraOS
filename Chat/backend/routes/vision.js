
import express from 'express';
import dotenv from 'dotenv';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { globalContext } from '../utils/globalContext.js';

dotenv.config();

const router = express.Router();
router.use(requireAuth);

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_VISION_API_KEY = process.env.MISTRAL_PIXTRAL_API_KEY || MISTRAL_API_KEY;
const PIXTRAL_MODEL = process.env.PIXTRAL_MODEL || 'pixtral-12b-2409';
const PADDLE_OCR_URL = process.env.PADDLE_OCR_URL || 'http://127.0.0.1:5001/ocr';
const PADDLE_OCR_LANG = process.env.PADDLE_OCR_LANG || 'en';

const geminiClient = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Vision Tick (Called by Lira Link)
router.post('/tick', async (req, res) => {
    try {
        const { screenshot } = req.body; // Base64
        if (!screenshot) return res.status(400).json({ error: 'No screenshot' });

        if (!geminiClient) return res.status(503).json({ error: 'Vision AI unavailable' });

        // Fire and Forget Analysis (to not block client too much, though we should await to not leak memory)
        // Let's await for Gemini Flash (it's fast)
        const model = geminiClient.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" }); // Or a very fast model. Let's use standard flash for now if lite not avail.
        // Actually, gemini-2.0-flash is the standard fast one.

        const prompt = "Describe very briefly (1 sentence) what the user is doing on their screen. Focus on active apps, content, or errors. Be concise.";
        
        const result = await model.generateContent([
            prompt,
            { inlineData: { data: screenshot, mimeType: 'image/jpeg' } }
        ]);
        
        const response = await result.response;
        const description = response.text();

        globalContext.updateVision(description);

        res.json({ success: true, description });

    } catch (error) {
        console.error('[VISION TICK FAILURE]', error.message);
        res.status(500).json({ error: error.message });
    }
});

async function paddleOCR(b64, mt) {
  try {
    const r = await fetch(PADDLE_OCR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: `data:${mt};base64,${b64}`, lang: PADDLE_OCR_LANG }),
      signal: AbortSignal.timeout(5000) // 5s timeout
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.text || null;
  } catch (e) {
    console.warn('PaddleOCR Error:', e.message);
    return null;
  }
}

router.post('/analyze', async (req, res) => {
  try {
    const { imageData, prompt, systemInstruction, memories = [] } = req.body;
    if (!imageData || !imageData.data) {
      return res.status(400).json({ error: 'imageData required' });
    }

    const base64 = imageData.data;
    const mimeType = imageData.mimeType || 'image/jpeg';
    const fullPrompt = prompt || "O que tem nesta imagem?";

    // 0. Priority: Gemini 2.0 Flash Vision (Fastest & Best)
    if (geminiClient) {
        try {
            console.log('👁️ Using Gemini Vision...');
            const model = geminiClient.getGenerativeModel({ model: "gemini-2.0-flash" });
            
            const result = await model.generateContent([
                fullPrompt,
                {
                    inlineData: {
                        data: base64,
                        mimeType: mimeType
                    }
                }
            ]);
            const response = await result.response;
            const text = response.text();
            
            if (text) {
                 return res.json({ analysis: text, method: 'gemini-flash' });
            }
        } catch (e) {
            console.error('Gemini Vision failed, falling back:', e.message);
        }
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 55000);
    });

    let analysisResult = null;
    let ocrUsed = false;

    // 1. Try PaddleOCR (Local)
    try {
        // Only try if configured url is reachable - skipping explicit check for speed, relying on fetch fail
        if (PADDLE_OCR_URL.includes('127.0.0.1')) { 
             console.log('🔍 Trying PaddleOCR...');
             const extracted = await paddleOCR(base64, mimeType);
             if (extracted && extracted.trim().length > 5) {
                console.log('✅ OCR Success. Text length:', extracted.length);
                ocrUsed = true;
                
                // Analyze extracted text
                const textResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      model: 'mistral-large-latest',
                      messages: [
                        { 
                          role: 'user', 
                          content: `SYSTEM INSTRUCTION: Analyze this OCR text from an image.\n"${extracted}"\n\nUser Question: ${fullPrompt}` 
                        }
                      ],
                      max_tokens: 1024
                    })
                });

                if (textResponse.ok) {
                    const data = await textResponse.json();
                    analysisResult = data.choices?.[0]?.message?.content;
                }
             }
        }
    } catch (e) {
        console.warn('OCR skipped:', e.message);
    }

    // 2. Fallback to Pixtral (Vision Model)
    if (!analysisResult) {
        console.log('👁️ Using Pixtral Vision Model...');
        try {
            const fetchPromise = fetch("https://api.mistral.ai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${MISTRAL_VISION_API_KEY}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: PIXTRAL_MODEL,
                messages: [
                  {
                    role: "user",
                    content: [
                      { type: "text", text: fullPrompt },
                      { type: "image_url", image_url: `data:${mimeType};base64,${base64}` }
                    ]
                  }
                ],
                max_tokens: 2048
              })
            });
            const response = await Promise.race([fetchPromise, timeoutPromise]);
            
            if (response.ok) {
              const data = await response.json();
              analysisResult = data.choices?.[0]?.message?.content;
            } else {
                const err = await response.text();
                console.error(`Pixtral failed: ${response.status} - ${err}`);
            }
        } catch (e) { console.error('Pixtral error:', e.message); }
    }

    if (analysisResult) {
        res.json({ analysis: analysisResult, method: ocrUsed ? 'ocr' : 'vision-pixtral' });
    } else {
        throw new Error('Could not analyze image via any available method');
    }

  } catch (error) {
    console.error('Vision Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
