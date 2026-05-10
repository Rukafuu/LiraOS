
import express from 'express';
import dotenv from 'dotenv';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import { globalContext } from '../utils/globalContext.js';
import { agentBrain } from '../services/agentBrain.js';

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

        if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'Vision AI unavailable' });

        const prompt = "Describe very briefly (1 sentence) what the user is doing on their screen. Focus on active apps, content, or errors. Be concise.";
        
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
             method: "POST",
             headers: {
                 "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                 "Content-Type": "application/json",
                 "HTTP-Referer": "https://github.com/rukafuu/LiraOS",
                 "X-Title": "LiraOS"
             },
             body: JSON.stringify({
                 model: "nvidia/nemotron-3-nano-omni-30B-a3b-reasoning:free",
                 messages: [{
                     role: "user",
                     content: [
                         { type: "text", text: prompt },
                         { type: "image_url", image_url: { url: `data:image/jpeg;base64,${screenshot}` } }
                     ]
                 }],
                 max_tokens: 100
             })
        });

        if (!orRes.ok) throw new Error("OpenRouter error: " + await orRes.text());
        const data = await orRes.json();
        const description = data.choices?.[0]?.message?.content || "";

        globalContext.updateVision(description);
        
        // Trigger Proactive Thought
        agentBrain.evaluate('vision_update');

        res.json({ success: true, description });

    } catch (error) {
        console.error('[VISION TICK FAILURE]', error.message);
        res.status(500).json({ error: error.message });
    }
});

async function openRouterOCR(b64, mt) {
  try {
    if (!process.env.OPENROUTER_API_KEY) return null;
    
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/rukafuu/LiraOS",
          "X-Title": "LiraOS"
      },
      body: JSON.stringify({
          model: "baidu/qianfan-ocr-fast:free",
          messages: [{
              role: "user",
              content: [
                  { type: "text", text: "Please extract all text from this image accurately." },
                  { type: "image_url", image_url: { url: `data:${mt};base64,${b64}` } }
              ]
          }]
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!r.ok) return null;
    const d = await r.json();
    return d.choices?.[0]?.message?.content || null;
  } catch (e) {
    console.warn('OpenRouter OCR Error:', e.message);
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

    // 0. Priority: OpenRouter Vision (Nemotron 3)
    if (process.env.OPENROUTER_API_KEY) {
        try {
            console.log('👁️ Using OpenRouter Vision (Nemotron 3)...');
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://github.com/rukafuu/LiraOS",
                    "X-Title": "LiraOS"
                },
                body: JSON.stringify({
                    model: "nvidia/nemotron-3-nano-omni-30B-a3b-reasoning:free",
                    messages: [{
                        role: "user",
                        content: [
                            { type: "text", text: fullPrompt },
                            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
                        ]
                    }],
                    max_tokens: 1024
                })
            });
            if (response.ok) {
                const data = await response.json();
                const text = data.choices?.[0]?.message?.content;
                if (text) {
                     return res.json({ analysis: text, method: 'nemotron-3' });
                }
            } else {
                console.error("OpenRouter Vision error:", await response.text());
            }
        } catch (e) {
            console.error('OpenRouter Vision failed, falling back:', e.message);
        }
    }

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 55000);
    });

    let analysisResult = null;
    let ocrUsed = false;

    // 1. Try PaddleOCR (Local)
        try {
             console.log('🔍 Trying OpenRouter OCR (Qianfan)...');
             const extracted = await openRouterOCR(base64, mimeType);
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
    console.error('[VISION ANALYZE ERROR]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Video Generation Endpoint
router.post('/generate-video', async (req, res) => {
  try {
    const { params } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(503).json({ error: 'Video Gen AI unavailable (Missing API Key)' });
    }

    const ai = new GoogleGenAI({ apiKey });
    console.log('[VISION] Starting video gen with params:', params.prompt);

    // Construct Payload (Mirrored from original frontend logic)
    const config = {
      numberOfVideos: 1,
      resolution: params.resolution,
    };

    if (params.mode !== 'extend_video') { // Using string literal as enum is not avail here
      config.aspectRatio = params.aspectRatio;
    }

    const payload = {
      model: params.model || 'imagen-3.0-generate-001',
      config: config,
    };

    if (params.prompt) payload.prompt = params.prompt;

    // Handle Frame/Image Inputs
    if (params.mode === 'frames_to_video') {
       if (params.startFrame) {
         payload.image = { imageBytes: params.startFrame.base64, mimeType: params.startFrame.file?.type || 'image/jpeg' };
       }
       const finalEnd = params.isLooping ? params.startFrame : params.endFrame;
       if (finalEnd) {
         payload.config.lastFrame = { imageBytes: finalEnd.base64, mimeType: finalEnd.file?.type || 'image/jpeg' };
       }
    } else if (params.mode === 'references_to_video') {
       const refs = [];
       if (params.referenceImages) {
         params.referenceImages.forEach(img => {
           refs.push({ image: { imageBytes: img.base64, mimeType: img.file?.type || 'image/jpeg' }, referenceType: 'asset' });
         });
       }
       if (params.styleImage) {
          refs.push({ image: { imageBytes: params.styleImage.base64, mimeType: params.styleImage.file?.type || 'image/jpeg' }, referenceType: 'style' });
       }
       if (refs.length > 0) payload.config.referenceImages = refs;
    }

    // Call Google GenAI
    let operation = await ai.models.generateVideos(payload);
    console.log('[VISION] Video Op Started:', operation.name);

    // Poll for completion (Long Polling - max 60s for Railway)
    const startTime = Date.now();
    while (!operation.done) {
       if (Date.now() - startTime > 110000) { // Safety break before 2 min
          throw new Error('Video generation timed out (2m limit).');
       }
       await new Promise(r => setTimeout(r, 5000));
       process.stdout.write('.');
       operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.response && operation.response.generatedVideos?.length > 0) {
       const videoUri = operation.response.generatedVideos[0].video.uri;
       console.log('\n[VISION] Video Ready:', videoUri);
       
       // Proxy the video file to bypass CORS/Auth on frontend
       // We fetch it here with the key and send blob to frontend? 
       // Or return URI? But frontend can't fetch URI without key usually.
       // Let's return the URI and the proxy URL logic handles it?
       // The old frontend code fetched `${url}&key=${apiKey}`.
       // We can do that here and pipe content?
       // For simplicity, let's fetch blob and return base64 or stream.
       // Base64 is safer for now.
       
       const videoRes = await fetch(`${decodeURIComponent(videoUri)}&key=${apiKey}`);
       const arrayBuffer = await videoRes.arrayBuffer();
       const base64Video = Buffer.from(arrayBuffer).toString('base64');
       
       res.json({ success: true, videoBase64: base64Video, uri: videoUri });

    } else {
       throw new Error('No video generated in response');
    }

  } catch (error) {
    console.error('[VISION VIDEO ERROR]', error);
    res.status(500).json({ error: error.message });
  }
});


export default router;
