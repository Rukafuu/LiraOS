import fetch from 'node-fetch';

const POLLINATIONS_BASE = 'https://image.pollinations.ai';
const PRODIA_BASE = 'https://image.prodia.com';
const HUGGINGFACE_MODEL = 'black-forest-labs/FLUX.1-schnell';
const TIMEOUT_MS = 10000;

/**
 * Image generation providers by tier
 */
const PROVIDERS = {
    pollinations: {
        name: 'Pollinations.ai',
        model: 'Flux',
        tiers: ['free', 'observer', 'vega'],
        quality: 'standard'
    },
    prodia: {
        name: 'Prodia',
        model: 'SDXL',
        tiers: ['vega'],
        quality: 'high'
    },
    huggingface: {
        name: 'Hugging Face',
        model: 'FLUX.1-schnell',
        tiers: ['sirius', 'antares', 'supernova', 'singularity'],
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
    
    // Premium tiers get Hugging Face
    if (['sirius', 'antares', 'supernova', 'singularity'].includes(tier)) {
        return 'huggingface';
    }
    
    // Vega gets Prodia
    if (tier === 'vega') {
        return 'prodia';
    }
    
    // Free/Observer get Pollinations
    return 'pollinations';
}

/**
 * Generate image URL using Pollinations.ai
 */
function generatePollinationsUrl(prompt, seed = Date.now()) {
    const sanitizedPrompt = prompt.trim().substring(0, 1000);
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
 * Generate image using Hugging Face Inference API
 * @param {string} prompt - Image description
 * @param {string} apiKey - Hugging Face API key
 * @returns {Promise<string>} Base64 image data URL
 */
async function generateHuggingFaceImage(prompt, apiKey) {
    if (!apiKey) {
        throw new Error('Hugging Face API key required for premium tiers');
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
                        guidance_scale: 0
                    }
                }),
                signal: controller.signal
            }
        );
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[HF] Generation failed with status ${response.status}:`, errorText);
            
            // Helpful messages for common errors
            if (response.status === 401) {
                console.error('[HF] ❌ Invalid API Key. Check your .env file.');
            } else if (response.status === 403) {
                console.error('[HF] ❌ Forbidden. You might need to accept the model terms on Hugging Face.');
            } else if (response.status === 503) {
                console.error('[HF] ⚠️ Model is loading. This is normal for FLUX.1-schnell on free inference API. Retry might work.');
            }

            throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
        }
        
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        return `data:image/png;base64,${base64}`;
        
    } catch (error) {
        console.error('[HF] Image generation error:', error);
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
    
    try {
        let imageUrl;
        let isBase64 = false;
        
        switch (provider) {
            case 'huggingface':
                imageUrl = await generateHuggingFaceImage(prompt, hfApiKey);
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
        
        // Fallback to Pollinations if premium provider fails
        if (provider !== 'pollinations') {
            console.log('[IMAGE_GEN] Falling back to Pollinations...');
            return {
                success: true,
                imageUrl: generatePollinationsUrl(prompt, seed),
                isBase64: false,
                provider: 'Pollinations.ai (Fallback)',
                model: 'Flux',
                quality: 'standard',
                seed,
                fallback: true
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

