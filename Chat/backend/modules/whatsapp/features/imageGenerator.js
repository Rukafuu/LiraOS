import axios from 'axios';

export async function generateImage(prompt) {
    try {
        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(prompt);
        // Using Pollinations.ai with Flux model (High Quality)
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

        console.log(`[ImageGen] Generated URL: ${url}`);
        // Baileys will handle the fetching. Pollinations generates on-demand.
        return url;
    } catch (e) {
        console.error("Image Gen Error:", e.message);
        return null;
    }
}
