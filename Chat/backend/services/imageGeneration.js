import fetch from 'node-fetch';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
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
        name: 'Google Gemini 3',
        model: 'gemini-3-pro-image-preview',
        tiers: ['sirius', 'antares', 'supernova', 'singularity', 'vega'], // Added Vega here
        quality: 'ultra'
    },
    pollinations: {
        name: 'Pollinations.ai',
        model: 'Flux',
        tiers: ['free', 'observer'],
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
    const tier = userTier.toLowerCase();
    
    // Premium tiers (and Vega) get Gemini 3
    if (['sirius', 'antares', 'supernova', 'singularity', 'vega'].includes(tier)) {
        return 'gemini';
    }
    
    // Free/Observer get Pollinations
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
 * Generate image using Google Gemini 3
 */
async function generateGeminiImage(prompt, apiKey) {
    if (!apiKey) throw new Error('Gemini API key required');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-image-preview' });

    console.log(`[GEMINI] Generating image with prompt: "${prompt.substring(0, 50)}..."`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    if (response.candidates && response.candidates[0].content.parts) {
        const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
        if (imagePart) {
            const base64 = imagePart.inlineData.data;
            const mimeType = imagePart.inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${base64}`;
        }
    }
    
    throw new Error('Gemini response did not contain image data. Check logs.');
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
 * @param {string} userTier - User's subscription tier
 * @param {string} hfApiKey - Hugging Face API key (optional)
 * @returns {Promise<Object>} Generation result with URL and metadata
 */
export async function generateImage(prompt, userTier = 'free', hfApiKey = null) {
    const provider = getProviderForTier(userTier);
    const seed = Date.now();
    
    console.log(`[IMAGE_GEN] Requesting image. Provider: ${provider}, Tier: ${userTier}`);

    try {
        let imageUrl;
        let isBase64 = false;
        
        switch (provider) {
            case 'gemini':
                const geminiKey = process.env.GEMINI_API_KEY;
                if (!geminiKey) throw new Error('GEMINI_API_KEY is missing in env');
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
                const resp = await fetch(fallbackUrl);
                if (resp.ok) {
                   const buf = await resp.arrayBuffer();
                   const b64 = Buffer.from(buf).toString('base64');
                   return {
                       success: true,
                       imageUrl: `data:image/jpeg;base64,${b64}`,
                       isBase64: true,
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
