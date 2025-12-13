import { Conversation, Message, ChatRequest, ImageRequest } from '../types';

const API_BASE = '/api'; // Proxy para http://localhost:3001/api

export async function fetchConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE}/conversations`);
  if (!response.ok) throw new Error('Failed to fetch conversations');
  const data = await response.json();
  // Convert date strings to Date objects
  return data.map((conv: any) => ({
    ...conv,
    createdAt: new Date(conv.createdAt),
    updatedAt: new Date(conv.updatedAt),
    messages: conv.messages?.map((msg: any) => ({
      ...msg,
      createdAt: new Date(msg.createdAt)
    })) || []
  }));
}

export async function fetchConversation(id: string): Promise<Conversation> {
  const response = await fetch(`${API_BASE}/conversations/${id}`);
  if (!response.ok) throw new Error('Failed to fetch conversation');
  const data = await response.json();
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    messages: data.messages.map((msg: any) => ({
      ...msg,
      createdAt: new Date(msg.createdAt)
    }))
  };
}

export async function generateImage(prompt: string): Promise<{ imageUrl: string } | { base64: string }> {
  const response = await fetch(`${API_BASE}/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt } as ImageRequest)
  });
  if (!response.ok) throw new Error('Failed to generate image');
  return response.json();
}

export function streamChatMessage(
  request: ChatRequest,
  onChunk: (content: string) => void,
  onDone: (conversationId: string) => void,
  onError: (error: string) => void
): () => void {
  let abortController: AbortController | null = null;

  const startStream = async () => {
    try {
      abortController = new AbortController();

      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: request.message,
          conversationId: request.conversationId
        }),
        signal: abortController.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                onChunk(data.content);
              } else if (data.done) {
                onDone(data.conversationId || '');
                return;
              } else if (data.error) {
                onError(data.error);
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', dataStr, parseError);
            }
          }
        }
      }

      onDone('');
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name !== 'AbortError') {
        console.error('Stream error:', error);
        onError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  };

  startStream();

  // Return cleanup function
  return () => {
    if (abortController) {
      abortController.abort();
    }
  };
}
