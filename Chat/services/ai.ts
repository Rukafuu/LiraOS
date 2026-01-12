import { Message, Persona, Memory, Attachment } from '../types';
import { getSettings, getAuthHeaders } from './userService';

// @ts-ignore
import { IS_DESKTOP, API_BASE_URL } from '../src/config';

const FRONTEND_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FRONTEND_URL) || 'http://localhost:5173';
import { apiFetch } from './apiClient';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

/**
 * Converte um arquivo de imagem para o formato que o Gemini espera (Base64)
 */
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type || 'image/jpeg'
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Converte previewUrl (data URL) para formato Gemini
 */
const previewUrlToGenerativePart = (previewUrl: string): { inlineData: { data: string; mimeType: string } } => {
  const [header, data] = previewUrl.split(',');
  const mimeMatch = header.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  return {
    inlineData: {
      data: data,
      mimeType: mimeType
    }
  };
};

export const imageUrlToDataUrl = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};

// 🧠 Funções de memória inteligentes (locais)

export const saveSessionServer = async (session: any): Promise<boolean> => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/chat/sessions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify({ session })
    });
    return res.ok;
  } catch {
    return false;
  }
};



export const deleteSessionServer = async (id: string): Promise<boolean> => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/chat/sessions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const fetchMemories = async (userId?: string): Promise<Memory[]> => {
  try {
    const url = `${API_BASE_URL}/api/memories`;
    const token = (() => {
      try { const s = localStorage.getItem('lira_session'); return s ? JSON.parse(s).token : ''; } catch { return ''; }
    })();
    const res = await apiFetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const addMemoryServer = async (content: string, tags: string[] = [], category?: Memory['category'], priority?: Memory['priority'], userId?: string): Promise<Memory | null> => {
  try {
    const res = await apiFetch(`${API_BASE_URL}/api/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': (() => { try { const s = localStorage.getItem('lira_session'); return s ? `Bearer ${JSON.parse(s).token}` : ''; } catch { return ''; } })() },
      body: JSON.stringify({ content, tags, category, priority, userId })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
  } catch {
    return null;
  }
};

export const deleteMemoryServer = async (id: string): Promise<boolean> => {
  try {
    const token = (() => {
      try { const s = localStorage.getItem('lira_session'); return s ? JSON.parse(s).token : ''; } catch { return ''; }
    })();
    const res = await apiFetch(`${API_BASE_URL}/api/memories/${id}`, { method: 'DELETE', headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
    return res.ok;
  } catch {
    return false;
  }
};

export const deleteAllMemoriesForUser = async (userId: string): Promise<boolean> => {
  try {
    const token = (() => {
      try { const s = localStorage.getItem('lira_session'); return s ? JSON.parse(s).token : ''; } catch { return ''; }
    })();
    const res = await apiFetch(`${API_BASE_URL}/api/memories`, { method: 'DELETE', headers: token ? { 'Authorization': `Bearer ${token}` } : undefined });
    return res.ok;
  } catch {
    return false;
  }
};

const normalizeMemoryText = (category: string, value: string): string => {
  const v = value.trim();
  switch (category) {
    case 'profile':
      return `O usuário se chama ${v}`;
    case 'location':
      return `O usuário mora em ${v}`;
    case 'birthday':
      return `O aniversário do usuário é ${v}`;
    case 'contact':
      if (v.includes('@')) return `O email do usuário é ${v}`;
      return `O telefone do usuário é ${v}`;
    default:
      return `Nota: ${v}`;
  }
};

export const extractMemoryFromMessage = (text: string): { content: string; category: Memory['category']; priority: Memory['priority'] } | null => {
  if (!text) return null;
  const t = text.trim();
  const lower = t.toLowerCase();
  const stripPrefix = (s: string) => s.replace(/^\s*remember that\s*/i, '').trim();
  const medium: Memory['priority'] = 'medium';
  const high: Memory['priority'] = 'high';
  const low: Memory['priority'] = 'low';

  const nameMatch = t.match(/(?:my name is|eu me chamo|meu nome é)\s+([^\.,\n]+)/i);
  if (nameMatch) {
    const value = nameMatch[1].trim();
    return { content: normalizeMemoryText('profile', value), category: 'profile', priority: high };
  }
  const locMatch = t.match(/(?:i live in|eu moro em)\s+([^\.,\n]+)/i);
  if (locMatch) {
    const value = locMatch[1].trim();
    return { content: normalizeMemoryText('location', value), category: 'location', priority: medium };
  }
  const bdayMatch = t.match(/(?:my birthday is|meu aniversário é)\s+([^\.,\n]+)/i);
  if (bdayMatch) {
    const value = bdayMatch[1].trim();
    return { content: normalizeMemoryText('birthday', value), category: 'birthday', priority: medium };
  }
  const emailMatch = t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) {
    const value = emailMatch[0];
    return { content: normalizeMemoryText('contact', value), category: 'contact', priority: high };
  }
  const phoneMatch = t.match(/(\+?\d[\d\s\-\(\)]{7,}\d)/);
  if (phoneMatch) {
    const value = phoneMatch[1].trim();
    return { content: normalizeMemoryText('contact', value), category: 'contact', priority: medium };
  }
  if (lower.includes('remember that')) {
    const rest = stripPrefix(t);
    if (rest.length > 3) {
      return { content: normalizeMemoryText('note', rest), category: 'note', priority: low };
    }
  }
  return null;
};

export const addIntelligentMemory = async (
  userMessage: { content: string },
  personaId: string,
  userId?: string
): Promise<{ memory?: Memory }> => {
  const extracted = extractMemoryFromMessage(userMessage.content);
  if (!extracted) return {};
  const saved = await addMemoryServer(extracted.content, ['auto', personaId], extracted.category, extracted.priority, userId);
  if (saved) return { memory: saved };
  return { memory: { id: `mem_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, content: extracted.content, createdAt: Date.now(), tags: ['auto', personaId], category: extracted.category, priority: extracted.priority, userId } as Memory };
};

export const getRelevantMemories = async (query: string, limit: number = 5, userId?: string): Promise<Memory[]> => {
  const all = await fetchMemories(userId);
  if (!query || all.length === 0) return [];
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .filter(w => w.length > 2);
  const score = (m: Memory): number => {
    const mc = (m.content || '').toLowerCase();
    let s = 0;
    for (const t of tokens) {
      if (mc.includes(t)) s += 1;
    }
    const pri = m.priority === 'high' ? 2 : m.priority === 'medium' ? 1 : 0;
    return s + Math.min(mc.length / 200, 2) + pri;
  };
  const ranked = all
    .map(m => ({ m, s: score(m) }))
    .filter(r => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(r => r.m);
  return ranked;
};

/**
 * Generates a title for the chat session based on the first user message.
 */
export const generateChatTitle = async (firstMessage: string, model: string = 'mistral'): Promise<string> => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/generate-title`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ firstMessage, model })
    });

    if (!response.ok) {
      throw new Error('Failed to generate title');
    }

    const data = await response.json();
    return data.title || 'New Conversation';
  } catch (error) {
    console.error("Failed to generate title:", error);
    return firstMessage.slice(0, 30) + (firstMessage.length > 30 ? '...' : '');
  }
};

/**
 * Formats a message with attachments for the AI
 */
const formatMessageWithAttachments = (content: string, attachments: Attachment[] = []): string => {
  if (attachments.length === 0) return content;
  
  let formattedMessage = content;
  
  for (const attachment of attachments) {
    const attName = attachment.file?.name || attachment.name || 'attachment';
    if (attachment.type === 'image' && attachment.previewUrl) {
      formattedMessage += `\n\n[IMAGEM ANEXADA: ${attName}] - Por favor, analise esta imagem em detalhes.`;
    } else if ((attachment.type === 'script' || attachment.type === 'text') && attachment.previewUrl) {
      formattedMessage += `\n\n[ARQUIVO DE CÓDIGO: ${attName}] - Analise o código anexado.`;
    } else if (attachment.type === 'document' && attachment.previewUrl) {
      formattedMessage += `\n\n[DOCUMENTO: ${attName}] - Analise o documento.`;
    }
  }
  
  return formattedMessage;
};

/**
 * Prepara os attachments para envio ao backend com todos os dados necessários
 */
const prepareAttachmentsForBackend = (attachments: Attachment[]): any[] => {
  return attachments.map(att => ({
    id: att.id,
    type: att.type,
    name: att.file?.name || att.name || 'attachment',
    size: att.file?.size || att.size || 0,
    previewUrl: att.previewUrl || '',
    text: att.previewUrl && (att.type === 'text' || att.type === 'script') ? att.previewUrl : undefined
  }));
};

/**
 * Análise de imagem com fallback robusto (Backend)
 */
async function analyzeImageWithFallback(imageData: any, prompt: string): Promise<string> {
  console.log('🔍 Solicitando análise de imagem ao backend...');
  
  try {
    const token = (() => {
      try { const s = localStorage.getItem('lira_session'); return s ? JSON.parse(s).token : ''; } catch { return ''; }
    })();

    const response = await apiFetch(`${API_BASE_URL}/api/vision/analyze`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        imageData,
        prompt
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.analysis) {
        console.log(`✅ Análise concluída via ${data.method || 'backend'}`);
        return data.analysis;
      }
    }
    
    // Se chegou aqui, a resposta não foi ok ou não tem analysis
    throw new Error('Backend não retornou análise válida');

  } catch (error: any) {
    console.error('❌ Vision analysis failed:', error.message);
    return 'Recebi sua imagem! Infelizmente não consegui processá-la no momento. Posso ajudar com outras tarefas como análise de código, documentos ou conversas em texto. 😊';
  }
}

/**
 * Sends a message to the AI backend and yields chunks of text for streaming effect.
 */
export async function* streamResponse(
  history: Message[], 
  newMessage: string,
  persona: Persona,
  memories: Memory[] = [],
  model: string = 'mistral',
  signal?: AbortSignal,
  attachments: Attachment[] = [],
  userId?: string,
  localDateTime?: string
): AsyncGenerator<string, void, unknown> {
  
  try {
    // Verificar se há imagens anexadas
    const imageAttachments = attachments.filter(att => att.type === 'image' && att.previewUrl);
    
    // Se houver imagens, usar análise híbrida Pixtral + Gemini
    if (imageAttachments.length > 0) {
      console.log('🖼️ Imagem detectada, usando sistema híbrido Pixtral + Gemini...');
      
      try {
        // Usar apenas a primeira imagem (simplificado)
        const imgAtt = imageAttachments[0];
        const imageData = previewUrlToGenerativePart(imgAtt.previewUrl).inlineData;
        
        // Verificar se a imagem não é muito grande
        const maxSize = 5 * 1024 * 1024; // 5MB para Pixtral
        if (imageData.data.length > maxSize) {
          yield `📷 Imagem anexada: ${imgAtt.name}\n\n[Imagem muito grande para análise. Por favor, anexe uma imagem menor.]`;
          return;
        }
        
        // Preparar prompt para análise com personalidade
        const visionPrompt = `[CONTEXTO] O usuário enviou esta imagem para você, Lira (uma IA amigável, inteligente e com personalidade).
        
[INSTRUÇÃO] Analise a imagem e responda ao comentário do usuário: "${newMessage}"
        
Diretrizes de Resposta:
1. NÃO faça apenas uma lista fria do que vê. Converse sobre a imagem.
2. Seja natural, curiosa e envolvente. Use emojis se apropriado.
3. Se for uma foto pessoal/paisagem, reaja com emoção/apreciação.
4. Se for técnico (código/texto), seja prestativa e vá direto ao ponto, mas mantendo o tom amigável.
5. Mantenha a resposta em Português do Brasil.`;
        
        // Usar sistema híbrido
        const analysis = await analyzeImageWithFallback(imageData, visionPrompt);
        
        // Simular streaming da resposta
        const words = analysis.split(' ');
        for (const word of words) {
          if (signal?.aborted) return;
          await new Promise(resolve => setTimeout(resolve, 20));
          yield word + ' ';
        }
        
        return;
      } catch (error: any) {
        console.error('Vision analysis failed:', error);
        yield `\n\n*[Erro ao analisar imagem: ${error.message}]*\n📷 Imagem anexada: ${imageAttachments[0]?.name || 'imagem'}\n\nPor favor, tente novamente ou use uma imagem menor.`;
        return;
      }
    }
    
    // Para mensagens sem imagem, usar backend (Mistral mais rápido)
    const formattedMessage = formatMessageWithAttachments(newMessage, attachments);
    
    const messages = [...history, { role: 'user', content: formattedMessage }].map(m => ({
      role: m.role,
      content: m.content
    }));

    // Fetch settings
    const settings = await getSettings();
    const temperature = settings.temperature ?? 0.7;
    const finalSystemInstruction = settings.systemInstructions || persona.systemInstruction;
    
    let effectiveModel = model;
    if (settings.model) {
        if (settings.model === 'flash') effectiveModel = 'gemini-flash';
        else if (settings.model === 'pro') effectiveModel = 'gemini-pro';
        else effectiveModel = settings.model;
    }

    const token = (() => {
      try { const s = localStorage.getItem('lira_session'); return s ? JSON.parse(s).token : ''; } catch { return ''; }
    })();
    
    const requestBody = JSON.stringify({
        messages,
        systemInstruction: finalSystemInstruction,
        model: effectiveModel,
        memories,
        attachments: prepareAttachmentsForBackend(attachments),
        userId,
        temperature,
        localDateTime
    });

    // --- DESKTOP MODE (RUST NATIVE STREAM) ---
    if (IS_DESKTOP) {
        let queue: Array<{ type: 'chunk' | 'done' | 'error', val?: any }> = [];
        let pendingResolve: ((v: any) => void) | null = null;
        
        const push = (item: any) => {
            if (pendingResolve) {
                const r = pendingResolve;
                pendingResolve = null;
                r(item);
            } else {
                queue.push(item);
            }
        };

        const unlistenChunk = await listen<string>('chat-stream-chunk', (e) => push({ type: 'chunk', val: e.payload }));
        const unlistenComplete = await listen('chat-stream-complete', () => push({ type: 'done' }));
        // Using a generic error listener if you added one, or handling invoke error. 
        // For simplicity, we assume invoke error is caught below.

        // Start the request
        invoke('stream_chat_request', {
            url: `${API_BASE_URL}/api/chat/stream`,
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: requestBody
        }).catch(err => {
             // If invoke fails immediately or during stream
             push({ type: 'error', val: err });
        });

        try {
            let buffer = '';
            while (true) {
                const item = queue.length > 0 ? queue.shift()! : await new Promise<any>(r => pendingResolve = r);
                
                if (item.type === 'error') throw new Error(String(item.val));
                if (item.type === 'done') break;
                
                if (item.type === 'chunk' && item.val) {
                    buffer += item.val;
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('data: ')) {
                            const data = trimmed.slice(6);
                            if (data === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) yield parsed.content;
                                if (parsed.error) yield `\n\n*[Error: ${parsed.error}]*`;
                            } catch {}
                        }
                    }
                }
            }
        } finally {
            unlistenChunk();
            unlistenComplete();
        }
        return;
    }

    // --- WEB MODE (STANDARD FETCH) ---
    // --- WEB MODE (STANDARD FETCH WITH STREAMING) ---
    if (!IS_DESKTOP) {
      console.log('🌐 Web Mode: Using standard fetch stream');
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: requestBody,
          signal
      });

      if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
          throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep partial line in buffer

          for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === 'data: [DONE]') continue;
              
              if (trimmed.startsWith('data: ')) {
                  try {
                      const data = JSON.parse(trimmed.slice(6));
                      if (data.content) yield data.content;
                       if (data.error) yield `\n\n*[Error: ${data.error}]*`;
                  } catch (e) {
                      console.warn('Failed to parse stream chunk:', trimmed);
                  }
              }
          }
      }
      return;
    }
  } catch (error: any) {
    console.error('Stream error details:', error);
    yield `\n\n*[Ocorreu um erro na comunicação: ${error?.message || 'Erro desconhecido'}]*`;
  }
}

/**
 * Text-to-Speech functionality
 */
export const textToSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await apiFetch(`${API_BASE_URL}/api/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('TTS request failed');
    }

    const data = await response.json();
    return data.audioUrl;
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
};
