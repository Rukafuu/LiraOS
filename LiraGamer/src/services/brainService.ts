import axios from 'axios';

// Interfaces
export interface BrainResponse {
  text: string;
  source: 'groq' | 'llama' | 'local-rule';
  emotion?: string;
}

// Configuration
const CONFIG = {
  groqKey: import.meta.env.VITE_GROQ_API_KEY || '',
  ollamaUrl: import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434',
  llamaModel: import.meta.env.VITE_LLAMA_MODEL || 'llama3',
  groqModel: import.meta.env.VITE_GROQ_MODEL || 'llama3-70b-8192'
};

// --- OLLAMA CLIENT (Chat Brain - Deep/free) ---
const ollamaClient = axios.create({
  baseURL: CONFIG.ollamaUrl
});

export const brainService = {
  
  // Rápido: Para reagir a eventos do jogo (Via Fetch direto para evitar erros de lib)
  async processGameEvent(eventDescription: string): Promise<BrainResponse> {
    if (!CONFIG.groqKey) return { text: "Groq API Key missing.", source: 'local-rule' };

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.groqKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: `You are Lira, a gamer girl AI VTuber. You are playing a game. React quickly, shortly and excitedly to this game event. Don't be too formal. Use gamer slang. Keep it under 15 words.` },
                { role: 'user', content: eventDescription }
            ],
            model: CONFIG.groqModel,
            temperature: 0.8,
            max_tokens: 50
        })
      });

      const data = await response.json();
      return {
        text: data.choices?.[0]?.message?.content || "No response",
        source: 'groq'
      };
    } catch (e) {
      console.error("Groq Error:", e);
      return { text: "Brain freeze! (Groq Error)", source: 'local-rule' };
    }
  },

  // Conversacional: Para responder ao Chat da Twitch
  async processChatMessage(user: string, message: string): Promise<BrainResponse> {
    try {
      // 1. Tentar Ollama (Llama 3 local)
      const response = await ollamaClient.post('/api/generate', {
        model: CONFIG.llamaModel,
        prompt: `System: You are Lira, a charismatic VTuber streamer. You are cool, funny, and friendly. Answer the user's message in Portuguese (or the language they used). Keep it engaging but concise for a stream context.
User (${user}): ${message}
Lira:`,
        stream: false
      });

      if (response.data && response.data.response) {
        return {
           text: response.data.response,
           source: 'llama'
        };
      }
      return { text: "...", source: 'local-rule' };

    } catch (e) {
      console.warn("Ollama unreachable, falling back to simple rules.", e);
      
      // Fallback simples se o Ollama estiver desligado
      return this.fallbackLogic(user, message);
    }
  },

  fallbackLogic(user: string, message: string): BrainResponse {
    const msg = message.toLowerCase();
    if (msg.includes('oi') || msg.includes('ola')) return { text: `Oii ${user}!`, source: 'local-rule' };
    return { text: `Li sua mensagem ${user}, mas meu cérebro Llama tá desligado D:`, source: 'local-rule' };
  }
};
