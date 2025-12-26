import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Attachment, Memory, Persona } from '../types';
import { getCurrentUser } from '../services/userService';
import { 
  generateChatTitle, 
  streamResponse, 
  addMemoryServer, 
  addIntelligentMemory, 
  getRelevantMemories 
} from '../services/ai';

interface UseChatActionsProps {
  selectedModel: 'mistral' | 'groq';
  activePersona: Persona;
  onAddMemory: (memory: Memory) => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onUpdateSession: (sessionId: string, messages: Message[]) => void;
  onUpdateSessionTitle: (sessionId: string, title: string) => void;
}

interface UseChatActionsReturn {
  isGenerating: boolean;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  handleStop: () => void;
  triggerAIResponse: (
    sessionId: string, 
    history: Message[], 
    promptText: string, 
    attachments?: Attachment[],
    currentMessages?: Message[]
  ) => Promise<void>;
}

export const useChatActions = ({
  selectedModel,
  activePersona,
  onAddMemory,
  onAddToast,
  onUpdateSession,
  onUpdateSessionTitle
}: UseChatActionsProps): UseChatActionsReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      onAddToast('Generation stopped', 'info');
    }
  }, [onAddToast]);

  const triggerAIResponse = useCallback(async (
    sessionId: string, 
    history: Message[], 
    promptText: string, 
    attachments: Attachment[] = [],
    currentMessages: Message[] = []
  ) => {
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;
    setIsGenerating(true);
    const modelMessageId = uuidv4();
    let accumulatedResponse = "";

    try {
      const currentUser = getCurrentUser();
      const userId = currentUser?.id;
      
      // 🧠 Buscar memórias relevantes para o contexto atual
      const relevantMemories = await getRelevantMemories(promptText, 5, userId);
      
      // 🧠 Processar mensagem para extrair informações automaticamente
      const userMessage = { content: promptText };
      const { memory: extractedMemory } = await addIntelligentMemory(userMessage, 'default', userId);
      if (extractedMemory) {
        onAddMemory(extractedMemory);
        onAddToast('Memória salva 🧠', 'success');
      }

      // Stream response
      const stream = streamResponse(
        history, 
        promptText, 
        activePersona, 
        relevantMemories, 
        selectedModel, 
        abortCtrl.signal, 
        attachments, 
        userId,
        new Date().toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })
      );
      
      let messages = [...currentMessages];
      
      for await (const chunk of stream) {
        if (abortCtrl.signal.aborted) break;

        accumulatedResponse += chunk;
        
        const existingMsgIndex = messages.findIndex(m => m.id === modelMessageId);
        const newModelMessage: Message = {
          id: modelMessageId,
          role: 'model',
          content: accumulatedResponse,
          timestamp: Date.now(),
          isStreaming: true
        };

        if (existingMsgIndex === -1) {
          messages = [...messages, newModelMessage];
        } else {
          messages = messages.map(m => 
            m.id === modelMessageId ? { ...m, content: accumulatedResponse } : m
          );
        }
        
        onUpdateSession(sessionId, messages);
      }
      
      // Fallback heuristic: save if it matches known patterns and none was extracted
      if (!extractedMemory && (
        promptText.toLowerCase().includes("remember that") || 
        promptText.toLowerCase().includes("my name is")
      )) {
        const created = await addMemoryServer(promptText, ['auto'], 'note', 'medium', userId);
        if (created) {
          onAddMemory(created);
        } else {
          const localMem: Memory = { 
            id: uuidv4(), 
            content: promptText, 
            createdAt: Date.now(), 
            tags: ['auto'], 
            category: 'note', 
            priority: 'medium' 
          };
          onAddMemory(localMem);
        }
        onAddToast('Memória salva 🧠', 'success');
      }

    } catch (e) {
      if ((e as any).name !== 'AbortError') {
        console.error("Generation error", e);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
      
      // Mark message as not streaming
      onUpdateSession(sessionId, 
        ([] as Message[]).concat(currentMessages).map(m => 
          m.id === modelMessageId ? { ...m, isStreaming: false } : m
        )
      );
    }
  }, [selectedModel, activePersona, onAddMemory, onAddToast, onUpdateSession]);

  return {
    isGenerating,
    abortControllerRef,
    handleStop,
    triggerAIResponse
  };
};
