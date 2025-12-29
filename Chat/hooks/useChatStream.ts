import { useState, useRef, useCallback } from 'react';
import { streamResponse } from '../services/ai';
import { Message, Attachment, Persona } from '../types';

interface UseChatStreamProps {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export const useChatStream = ({ onChunk, onComplete, onError }: UseChatStreamProps = {}) => {
  const [status, setStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle');
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (
    history: Message[], 
    prompt: string, 
    persona: Persona, 
    relevantMemories: any[], 
    model: string, 
    attachments: Attachment[] = [], 
    userId?: string
  ) => {
    setStatus('streaming');
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;
    
    let accumulated = '';
    
    try {
      const localDateTime = new Date().toLocaleString();
      const stream = streamResponse(
          history, 
          prompt, 
          persona, 
          relevantMemories, 
          model, 
          abortCtrl.signal, 
          attachments, 
          userId, 
          localDateTime
      );

      for await (const chunk of stream) {
         if (abortCtrl.signal.aborted) break;
         accumulated += chunk;
         onChunk?.(chunk);
      }

      setStatus('done');
      onComplete?.(accumulated);

    } catch (err: any) {
        if (err.name === 'AbortError') {
            setStatus('idle'); // or cancelled
        } else {
            setStatus('error');
            onError?.(err);
        }
    } finally {
        abortControllerRef.current = null;
    }
  }, [onChunk, onComplete, onError]);

  const stop = useCallback(() => {
     if (abortControllerRef.current) {
         abortControllerRef.current.abort();
         abortControllerRef.current = null;
         setStatus('idle');
     }
  }, []);

  return { generate, stop, status };
};
