import fetch from 'node-fetch';

const POLLINATIONS_BASE = 'https://image.pollinations.ai';
const TIMEOUT_MS = 5000;

/**
 * Check if Pollinations.ai service is available
 * @returns {Promise<boolean>} True if service is healthy
 */
export async function checkPollinationsHealth() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
        
        const response = await fetch(`${POLLINATIONS_BASE}/prompt/test?width=64&height=64&nologo=true`, {
            signal: controller.signal,
            method: 'HEAD'
        });
        
        clearTimeout(timeout);
        return response.ok;
    } catch (error) {
        console.error('[IMAGE_GEN] Pollinations health check failed:', error.message);
        return false;
    }
}

/**
 * Generate an image URL using Pollinations.ai
 * @param {string} prompt - The image description
 * @param {Object} options - Generation options
 * @returns {string} The generated image URL
 */
export function generateImageUrl(prompt, options = {}) {
    const {
        nologo = true,
        private: isPrivate = true,
        enhance = true,
        model = 'flux',
        seed = Date.now(),
        width = null,
        height = null
    } = options;
    
    // Sanitize and truncate prompt
    const sanitizedPrompt = prompt.trim().substring(0, 1000);
    
    const params = new URLSearchParams({
        nologo: nologo.toString(),
        private: isPrivate.toString(),
        enhance: enhance.toString(),
        model,
        seed: seed.toString()
    });
    
    // Add optional dimensions
    if (width) params.append('width', width.toString());
    if (height) params.append('height', height.toString());
    
    return `${POLLINATIONS_BASE}/prompt/${encodeURIComponent(sanitizedPrompt)}?${params.toString()}`;
}

/**
 * Validate an image generation prompt
 * @param {string} prompt - The prompt to validate
 * @returns {Object} Validation result with isValid flag and optional error message
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
 * Get service status and statistics
 * @returns {Promise<Object>} Service status information
 */
export async function getServiceStatus() {
    const isHealthy = await checkPollinationsHealth();
    
    return {
        provider: 'Pollinations.ai',
        model: 'Flux',
        healthy: isHealthy,
        endpoint: POLLINATIONS_BASE,
        features: {
            nologo: true,
            private: true,
            enhance: true,
            customSeed: true
        }
    };
}
