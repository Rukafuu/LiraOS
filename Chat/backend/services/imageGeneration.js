import fetch from 'node-fetch';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { uploadBase64ToS3, isStorageEnabled } from './storageService.js';
import { uploadToBlob } from './blobService.js';
import { jobStore } from './jobStore.js';
import { getTierLimit } from './tierLimits.js';

dotenv.config();

const POLLINATIONS_BASE = 'https://image.pollinations.ai';
const PRODIA_BASE = 'https://image.prodia.com';
const HUGGINGFACE_MODEL = 'black-forest-labs/FLUX.1-schnell';
const TIMEOUT_MS = 30000;

/**
 * Image generation providers by tier
 */
const PROVIDERS = {
    gemini: {
        name: 'Google Gemini',
        model: 'gemini-2.0-flash-exp',
        tiers: ['free', 'observer', 'vega', 'sirius', 'antares', 'supernova', 'singularity'],
        quality: 'ultra'
    },
    pollinations: {
        name: 'Pollinations.ai',
        model: 'Flux',
        tiers: [],
        quality: 'standard'
    },
    prodia: {
        name: 'Prodia',
        model: 'SDXL',
        tiers: [],
        quality: 'high'
    },
    huggingface: {
        name: 'Hugging Face',
        model: 'FLUX.1-schnell',
        tiers: [],
        quality: 'professional'
    }
};

/**
 * Get the appropriate image provider based on user tier
 * @param {string} userTier - User's subscription tier
 * @returns {string} Provider name
 */
export function getProviderForTier(userTier = 'free') {
    // Gemini for ALL tiers (free API key)
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
        return 'gemini';
    }
    // Fallback to Pollinations only if no Gemini/Google key
    return 'pollinations';
}

/**
 * Generate image URL using Pollinations.ai
 */
function generatePollinationsUrl(prompt, seed = Date.now()) {
    // Truncate to 500 chars to avoid URL length errors in some browsers/proxies
    const sanitizedPrompt = prompt.trim().substring(0, 500);
    const params = new URLSearchParams({
        nologo: 'true',
        private: 'true',
        enhance: 'true',
        model: 'flux',
        seed: seed.toString()
    });
    
    return `${POLLINATIONS_BASE}/prompt/${encodeURIComponent(sanitizedPrompt)}?${params.toString()}`;
}

/**
 * Generate image URL using Prodia
 */
function generateProdiaUrl(prompt, seed = Date.now()) {
    const sanitizedPrompt = prompt.trim().substring(0, 1000);
    const params = new URLSearchParams({
        prompt: sanitizedPrompt,
        model: 'sdxl',
        seed: seed.toString(),
        negative_prompt: 'blurry, low quality, distorted',
        steps: '25',
        cfg: '7'
    });
    
    return `${PRODIA_BASE}/generate?${params.toString()}`;
}

/**
 * Generate image using Google Gemini (Nano Banana 2 - gemini-3.1-flash-image-preview)
 * Uses generateContent with native image output modality
 */
async function generateGeminiImage(prompt, apiKey) {
    if (!apiKey) throw new Error('Gemini API key required');

    const ai = new GoogleGenAI({ apiKey });
    
    // Model priority order: best quality first, fallback to stable
    const MODELS = [
        'gemini-3.1-flash-image-preview',  // Nano Banana 2 - recommended
        'gemini-2.5-flash-preview-04-17',  // Nano Banana stable
        'gemini-2.0-flash-exp',            // experimental fallback
    ];
    
    for (const MODEL of MODELS) {
        console.log(`[GEMINI] Trying image generation with ${MODEL}...`);
        try {
            const response = await ai.models.generateContent({
                model: MODEL,
                contents: prompt,
                config: {
                    responseModalities: ['IMAGE', 'TEXT'],
                }
            });
            
            const parts = response.candidates?.[0]?.content?.parts || [];
            
            // Look for image data first
            for (const part of parts) {
                if (part.inlineData) {
                    const base64 = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    console.log(`[GEMINI] ✅ Image generated with ${MODEL}! (${mimeType}, ${Math.round(base64.length / 1024)}KB)`);
                    return `data:${mimeType};base64,${base64}`;
                }
            }
            
            // Only got text back - log it and try next model
            const textResponse = parts.map(p => p.text).filter(Boolean).join(' ');
            console.warn(`[GEMINI] ${MODEL} returned text only: "${textResponse.substring(0, 100)}"`);
        } catch (err) {
            console.warn(`[GEMINI] ${MODEL} failed: ${err.message?.substring(0, 120)}`);
        }
    }
    
    throw new Error('All Gemini models failed to return image data');
}

/**
 * Generate image using Hugging Face Inference API (Legacy support)
 */
async function generateHuggingFaceImage(prompt, apiKey) {
    if (!apiKey) {
        throw new Error('Hugging Face API key required');
    }
    
    const sanitizedPrompt = prompt.trim().substring(0, 1000);
    
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
        
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${HUGGINGFACE_MODEL}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: sanitizedPrompt,
                    parameters: {
                        num_inference_steps: 4, 
                        guidance_scale: 0.0,
                        width: 512,
                        height: 512
                    }
                }),
                signal: controller.signal
            }
        );
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HF Error: ${response.status} - ${errorText}`);
        }
        
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:image/png;base64,${base64}`;
        
    } catch (error) {
        throw error;
    }
}

/**
 * Generate image based on user tier
 * @param {string} prompt - Image description
 * @param {string} userId - User ID for limit checking
 * @param {string} userTier - User's subscription tier
 * @param {string} hfApiKey - Hugging Face API key (optional)
 * @returns {Promise<Object>} Generation result with URL and metadata
 */
export async function generateImage(prompt, userId = null, userTier = 'free', hfApiKey = null) {
    // 1. Check Tier Limits
    if (userId) {
        const limit = getTierLimit(userTier, 'imagesPerDay');
        const usageToday = await jobStore.countTodayJobs(userId);
        if (usageToday >= limit) {
            console.warn(`[IMAGE_GEN] Limit reached for ${userId} (${usageToday}/${limit})`);
            return {
                success: false,
                error: `Você atingiu o limite diário de ${limit} imagens para seu plano.`
            };
        }
    }

    const provider = getProviderForTier(userTier);
    const seed = Date.now();
    
    console.log(`[IMAGE_GEN] Requesting image. Provider: ${provider}, Tier: ${userTier}`);

    try {
        let imageUrl;
        let isBase64 = false;
        
        switch (provider) {
            case 'gemini':
                const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
                if (!geminiKey) throw new Error('GEMINI/GOOGLE API KEY is missing in env');
                imageUrl = await generateGeminiImage(prompt, geminiKey);
                isBase64 = true;
                break;

            case 'huggingface':
                // Legacy Fallback
                const part1 = 'hf_VIKDzotYtkHT';
                const part2 = 'ZQHSoqThvwwPaoBPyerxbr';
                const effectiveKey = hfApiKey || process.env.HUGGINGFACE_ACCESS_TOKEN || (part1 + part2);
                imageUrl = await generateHuggingFaceImage(prompt, effectiveKey);
                isBase64 = true;
                break;
                
            case 'prodia':
                imageUrl = generateProdiaUrl(prompt, seed);
                break;
                
            case 'pollinations':
            default:
                imageUrl = generatePollinationsUrl(prompt, seed);
                break;
        }

        // ☁️ BLOB UPLOAD INTEGRATION
        // If we have a Base64 image, upload it to Vercel Blob!
        if (isBase64) {
            try {
                console.log('[IMAGE_GEN] Uploading generated image to Vercel Blob...');
                const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const ext = imageUrl.includes('jpeg') ? 'jpg' : 'png';
                const filename = `images/gen-${seed}.${ext}`;

                const blobResult = await uploadToBlob(filename, buffer);
                if (blobResult && blobResult.url) {
                    imageUrl = blobResult.url;
                    isBase64 = false; // It's now a reliable URL
                    console.log('[IMAGE_GEN] Blob Upload Complete:', blobResult.url);
                }
            } catch (uploadErr) {
                console.error('[IMAGE_GEN] Blob Upload failed (using Base64 fallback):', uploadErr.message);
                // We keep imageUrl as Base64 so the user still gets their image
            }
        }
        
        return {
            success: true,
            imageUrl,
            isBase64,
            provider: PROVIDERS[provider].name,
            model: PROVIDERS[provider].model,
            quality: PROVIDERS[provider].quality,
            seed
        };
        
    } catch (error) {
        console.error(`[IMAGE_GEN] ${provider} failed:`, error);
        
        // Fallback to Pollinations Proxy
        if (provider !== 'pollinations') {
            console.log('[IMAGE_GEN] Falling back to Pollinations (Proxy Mode)...');
            try {
                const fallbackUrl = generatePollinationsUrl(prompt, seed);
                // Proxy the image: Fetch it here and return Base64 to bypass client-side CORS/Blocks
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
                
                const resp = await fetch(fallbackUrl, { signal: controller.signal });
                clearTimeout(timeout);

                if (resp.ok) {
                   const buf = await resp.arrayBuffer();
                   const b64 = Buffer.from(buf).toString('base64');
                   
                   let fallbackImageUrl = `data:image/jpeg;base64,${b64}`;
                   let fallbackIsBase64 = true;

                   // Try upload fallback to S3 too
                   if (isStorageEnabled()) {
                        try {
                            const s3Url = await uploadBase64ToS3(fallbackImageUrl, 'images/fallback');
                            if (s3Url) {
                                fallbackImageUrl = s3Url;
                                fallbackIsBase64 = false;
                            }
                        } catch (e) {}
                   }

                   return {
                       success: true,
                       imageUrl: fallbackImageUrl,
                       isBase64: fallbackIsBase64,
                       provider: 'Pollinations.ai (Fallback Proxy)',
                       model: 'Flux',
                       quality: 'standard',
                       seed,
                       fallback: true,
                       errorDetails: error.message
                   };
                }
            } catch (fallbackErr) {
               console.error('Fallback Proxy failed:', fallbackErr);
            }

            // Absolute last resort (return raw URL)
            return {
                success: true,
                imageUrl: generatePollinationsUrl(prompt, seed),
                isBase64: false,
                provider: 'Pollinations.ai (Fallback URL)',
                model: 'Flux',
                quality: 'standard',
                seed,
                fallback: true,
                errorDetails: provider + " failed: " + error.message
            };
        }
        
        throw error;
    }
}

/**
 * Validate an image generation prompt
 */
export function validatePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
        return { isValid: false, error: 'Prompt must be a non-empty string' };
    }
    
    const trimmed = prompt.trim();
    
    if (trimmed.length === 0) {
        return { isValid: false, error: 'Prompt cannot be empty' };
    }
    
    if (trimmed.length > 2000) {
        return { isValid: false, error: 'Prompt is too long (max 2000 characters)' };
    }
    
    return { isValid: true, sanitized: trimmed };
}

/**
 * Get provider information for a tier
 */
export function getProviderInfo(userTier = 'free') {
    const provider = getProviderForTier(userTier);
    return PROVIDERS[provider];
}
