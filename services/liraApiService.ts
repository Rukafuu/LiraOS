// Lira API Service - Conecta ao backend real da Lira
const BACKEND_URL = import.meta.env.VITE_LIRA_BACKEND_URL || 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_LIRA_API_KEY || 'lira-development-key';

interface ChatStreamResponse {
  conversationId: string;
  done: boolean;
  content?: string;
  error?: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

class LiraApiService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${BACKEND_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  async *sendMessageStream(
    message: string,
    conversationId?: string
  ): AsyncGenerator<string> {
    try {
      const response = await this.makeRequest('/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({
          message,
          conversationId,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const data: ChatStreamResponse = JSON.parse(dataStr);

              if (data.content) {
                yield data.content;
              }

              if (data.done) {
                return; // End the generator
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      // Fallback response
      yield "Olá! Sou a Lira. Parece que houve um problema com minha conexão. Como posso ajudar?";
    }
  }

  async generateTitle(conversationMessages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      // Use the first user message to generate a title
      const firstUserMessage = conversationMessages.find(m => m.role === 'user');
      if (!firstUserMessage) return "Nova Conversa";

      // Simple title generation based on first message
      const words = firstUserMessage.content.split(' ').slice(0, 5).join(' ');
      return `Conversa: ${words}...`;
    } catch (error) {
      console.error('Title generation error:', error);
      return "Nova Conversa";
    }
  }

  // Conversões entre formatos do frontend e backend
  static convertFrontendToBackendMessage(message: {
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
    attachments?: any[];
  }): {
    role: 'user' | 'assistant';
    content: string;
  } {
    return {
      role: message.role === 'model' ? 'assistant' : 'user',
      content: message.text,
    };
  }

  static convertBackendToFrontendMessage(message: {
    role: 'user' | 'assistant';
    content: string;
  }, index: number): {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
    attachments?: any[];
  } {
    return {
      id: `msg-${index}`,
      role: message.role === 'assistant' ? 'model' : 'user',
      text: message.content,
      timestamp: new Date(),
    };
  }

  static convertBackendConversationToFrontend(conversation: Conversation): {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: Array<{
      id: string;
      role: 'user' | 'model';
      text: string;
      timestamp: Date;
      attachments?: any[];
    }>;
  } {
    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages.map((msg, index) =>
        LiraApiService.convertBackendToFrontendMessage(msg, index)
      ),
    };
  }
}

// Export singleton instance
export const liraApiService = new LiraApiService();

// Export types
export type { ChatStreamResponse, Conversation };
