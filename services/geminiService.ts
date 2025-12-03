import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { LIRA_SYSTEM_INSTRUCTION } from "../constants";
import { Message, Attachment } from "../types";

// Initialize Gemini Client
// IMPORTANT: Expects process.env.API_KEY to be available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatSession: Chat | null = null;

export const initializeChat = (history?: Message[]) => {
  // Convert internal Message format to Gemini API history format
  // We must reconstruct the parts to include attachments for context
  const geminiHistory = history?.map(msg => {
    const parts: any[] = [];
    
    // Add text part if it exists
    if (msg.text) {
      parts.push({ text: msg.text });
    }

    // Add attachment parts if they exist
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }

    return {
      role: msg.role,
      parts: parts
    };
  }) || [];

  chatSession = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: LIRA_SYSTEM_INSTRUCTION,
      temperature: 0.7, // Slightly creative/warm
      candidateCount: 1,
    },
    history: geminiHistory
  });
};

export const sendMessageToGeminiStream = async (message: string, attachments: Attachment[] = []): Promise<AsyncIterable<GenerateContentResponse>> => {
  if (!chatSession) {
    initializeChat();
  }
  
  if (!chatSession) {
     throw new Error("Failed to initialize chat session");
  }

  try {
    let messagePayload: any = message;

    // If there are attachments, we need to send a multipart message
    if (attachments.length > 0) {
      const parts: any[] = [];
      
      // Add attachments first or last? Usually doesn't matter, but contextually:
      // "Here is an image, what is it?" -> Image first helps.
      attachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });

      if (message) {
        parts.push({ text: message });
      }

      messagePayload = parts;
    }

    // The SDK accepts string or array of parts for the 'message' property in chat
    const result = await chatSession.sendMessageStream({ message: messagePayload });
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateChatTitle = async (userMessage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a short, concise, and engaging title (max 5 words) for a chat that starts with: "${userMessage}". The title should be in the language of the message. Return ONLY the title text. Do not use quotes or markdown.`,
    });
    return response.text?.trim() || "New Conversation";
  } catch (error) {
    console.warn("Failed to generate title", error);
    return "New Conversation";
  }
};