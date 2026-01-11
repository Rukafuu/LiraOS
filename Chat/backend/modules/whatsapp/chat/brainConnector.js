import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { WA_SYSTEM_PROMPT, PERSONALITIES } from './whatsappContext.js';

dotenv.config();

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const MODEL_NAME = "gemini-2.0-flash"; // Fast and cheap

export async function generateReply(userId, userText, history = [], mode = 'normal') {
    if (!gemini) return "My brain is disconnected (No API Key). 😵";

    try {
        const model = gemini.getGenerativeModel({ model: MODEL_NAME });
        const systemPrompt = PERSONALITIES[mode] || WA_SYSTEM_PROMPT;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: "System: Initialize Lira WhatsApp Persona." }] },
                { role: "model", parts: [{ text: "Lira WhatsApp Online. Ready to chat." }] },
                ...history
            ],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        });

        const result = await chat.sendMessage(userText);
        let response = result.response.text();

        // Safety cleanup just in case
        if (response.length > 500) {
            response = response.substring(0, 497) + "...";
        }

        return response;
    } catch (e) {
        console.error("Brain Error:", e);
        return "I had a glitch... try again later? 🐛";
    }
}

export async function enhancePrompt(originalPrompt) {
    if (!gemini) return originalPrompt;
    try {
        const model = gemini.getGenerativeModel({ model: MODEL_NAME });
        const result = await model.generateContent(`
            You are an AI Image Prompt Expert.
            Rewrite the following user prompt into a detailed, English prompt for an image generator (like Midjourney/DALL-E).
            Keep it under 40 words. Focus on visual description, lighting, and style.
            User Prompt: "${originalPrompt}"
            Output ONLY the English prompt.
        `);
        return result.response.text().trim();
    } catch { return originalPrompt; }
}
