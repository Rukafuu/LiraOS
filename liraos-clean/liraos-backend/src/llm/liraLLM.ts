import { Message, Memory } from '../types.js';

// TODO: Replace with actual Lira Northstar API integration
// Use process.env.LIRA_API_KEY, process.env.LIRA_BASE_URL, process.env.LIRA_MODEL

export async function streamLiraResponse({
  messages,
  memories
}: {
  messages: Message[];
  memories: Memory[];
}): Promise<ReadableStream<Uint8Array>> {
  // Real implementation: Call Lira Northstar API with streaming
  const apiKey = process.env.LIRA_API_KEY;
  const baseUrl = process.env.LIRA_BASE_URL || 'https://api.lira.ai';
  const model = process.env.LIRA_MODEL || 'northstar-v1';

  if (!apiKey) {
    throw new Error('LIRA_API_KEY not configured');
  }

  // Prepare conversation history with memories
  const systemPrompt = `Você é Lira, uma IA assistente acolhedora e gentil. Seja calma, presente e perceptiva. Não use emojis, símbolos decorativos ou onomatopeias. Responda de forma natural e objetiva.

Memórias relevantes do usuário:
${memories.map(m => `- ${m.summary}`).join('\n')}

Histórico da conversa:`;

  const conversationMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: conversationMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Lira API error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body from Lira API');
    }

    // Transform the response stream to our SSE format
    const reader = response.body.getReader();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
              controller.close();
              break;
            }

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  // Ignore parsing errors for incomplete chunks
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`));
          controller.close();
        }
      }
    });

    return stream;
  } catch (error) {
    console.error('Lira API call failed:', error);

    // Fallback: Return a simple response
    const fallbackResponse = 'Olá! Sou a Lira. Parece que houve um problema com minha conexão. Como posso ajudar?';
    const encoder = new TextEncoder();

    return new ReadableStream({
      start(controller) {
        const words = fallbackResponse.split(' ');
        let index = 0;

        const interval = setInterval(() => {
          if (index < words.length) {
            const chunk = words[index] + ' ';
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            index++;
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
            clearInterval(interval);
          }
        }, 100);
      }
    });
  }
}

export async function generateTitleFromConversation(messages: Message[]): Promise<string> {
  const apiKey = process.env.LIRA_API_KEY;
  const baseUrl = process.env.LIRA_BASE_URL || 'https://api.lira.ai';

  if (!apiKey) {
    // Fallback: Generate title from first user message
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const words = firstUserMessage.content.split(' ').slice(0, 5).join(' ');
      return `Conversa: ${words}...`;
    }
    return 'Nova Conversa';
  }

  try {
    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const response = await fetch(`${baseUrl}/chat/title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        conversation: conversationText,
        max_length: 50
      })
    });

    if (!response.ok) {
      throw new Error(`Lira Title API error: ${response.status}`);
    }

    const result = await response.json();
    return result.title || 'Nova Conversa';
  } catch (error) {
    console.error('Lira Title API call failed:', error);

    // Fallback
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const words = firstUserMessage.content.split(' ').slice(0, 5).join(' ');
      return `Conversa: ${words}...`;
    }
    return 'Nova Conversa';
  }
}

export async function generateMemoriesFromConversation(messages: Message[]): Promise<Omit<Memory, 'id' | 'createdAt'>[]> {
  const apiKey = process.env.LIRA_API_KEY;
  const baseUrl = process.env.LIRA_BASE_URL || 'https://api.lira.ai';

  if (!apiKey) {
    // Fallback: Generate simple memories
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return [];

    const summary = `Usuário mencionou: ${userMessages.map(m => m.content.slice(0, 50)).join(', ')}`;

    return [{
      userId: 'default-user',
      summary,
      importance: 'medium' as const,
      tags: ['conversa']
    }];
  }

  try {
    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const response = await fetch(`${baseUrl}/chat/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        conversation: conversationText,
        user_id: 'default-user'
      })
    });

    if (!response.ok) {
      throw new Error(`Lira Memories API error: ${response.status}`);
    }

    const result = await response.json();

    // Assuming Lira returns an array of memories
    return (result.memories || []).map((mem: any) => ({
      userId: mem.user_id || 'default-user',
      summary: mem.summary,
      importance: mem.importance || 'medium',
      tags: mem.tags || []
    }));
  } catch (error) {
    console.error('Lira Memories API call failed:', error);

    // Fallback
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return [];

    const summary = `Usuário mencionou: ${userMessages.map(m => m.content.slice(0, 50)).join(', ')}`;

    return [{
      userId: 'default-user',
      summary,
      importance: 'medium' as const,
      tags: ['conversa']
    }];
  }
}
