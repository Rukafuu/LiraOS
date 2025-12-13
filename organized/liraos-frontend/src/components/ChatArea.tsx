import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { TypingBubble } from './TypingBubble';
import { streamChatMessage, generateImage } from '../services/api';
import { Send, Image, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function ChatArea() {
  const { currentConversation, state, dispatch } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || state.isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    // Add user message to conversation
    const userMessage = {
      id: uuidv4(),
      conversationId: currentConversation!.id,
      role: 'user' as const,
      content: messageText,
      createdAt: new Date()
    };
    dispatch({ type: 'ADD_MESSAGE', payload: { conversationId: currentConversation!.id, message: userMessage } });

    // Add streaming assistant message placeholder
    const assistantMessage = {
      id: uuidv4(),
      conversationId: currentConversation!.id,
      role: 'assistant' as const,
      content: '',
      createdAt: new Date()
    };
    dispatch({ type: 'ADD_MESSAGE', payload: { conversationId: currentConversation!.id, message: assistantMessage } });

    // Start SSE streaming
    cleanupRef.current = streamChatMessage(
      { message: messageText, conversationId: currentConversation!.id },
      (chunk) => {
        // Update assistant message with new chunk
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            conversationId: currentConversation!.id,
            message: {
              ...assistantMessage,
              content: assistantMessage.content + chunk
            }
          }
        });
      },
      (conversationId) => {
        dispatch({ type: 'SET_LOADING', payload: false });
        cleanupRef.current = null;
      },
      (error) => {
        dispatch({ type: 'SET_ERROR', payload: error });
        dispatch({ type: 'SET_LOADING', payload: false });
        cleanupRef.current = null;
      }
    );
  };

  const handleGenerateImage = async () => {
    if (!inputMessage.trim() || isGeneratingImage) return;

    const prompt = inputMessage.trim();
    setIsGeneratingImage(true);

    try {
      const result = await generateImage(prompt);

      // Add image message to conversation
      const imageMessage = {
        id: uuidv4(),
        conversationId: currentConversation!.id,
        role: 'assistant' as const,
        content: `Imagem gerada para: ${prompt}`,
        type: 'image' as const,
        createdAt: new Date(),
        metadata: {
          imageUrl: 'imageUrl' in result ? result.imageUrl : undefined,
          suggestions: [`Gerar variação`, `Melhorar prompt`]
        }
      };
      dispatch({ type: 'ADD_MESSAGE', payload: { conversationId: currentConversation!.id, message: imageMessage } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Falha ao gerar imagem' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-nagisa-bgSoft rounded-3xl m-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-nagisa-text mb-2">
            Bem-vindo ao Chat Lira!
          </h2>
          <p className="text-nagisa-textSoft">
            Selecione ou crie uma nova conversa para começar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-nagisa-panel dark:bg-nagisaDark-panel rounded-3xl shadow-[0_18px_40px_rgba(43,34,56,0.18)] mx-6 my-4 overflow-hidden border border-nagisa-border/60 dark:border-nagisaDark-border/70">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-nagisa-border/70 bg-nagisa-bgSoft/70 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold text-nagisa-text">
            {currentConversation.title}
          </h1>
          <p className="text-xs text-nagisa-textSoft">
            Conversa com Lira
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-700 font-medium">Lira online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentConversation.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={state.isLoading && message.role === 'assistant'}
          />
        ))}
        {state.isLoading && (
          <TypingBubble />
        )}
      </div>

      {/* Input */}
      <div className="px-6 pb-4 pt-3 bg-gradient-to-t from-nagisa-bgSoft/90 via-nagisa-panel/95 to-nagisa-panel/0">
        <div className="flex items-center gap-3 rounded-full bg-nagisa-panel border border-nagisa-border shadow-[0_10px_30px_rgba(43,34,56,0.18)] px-4 py-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Digite sua mensagem para a Lira..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-nagisa-text placeholder:text-nagisa-textSoft resize-none min-h-[20px] max-h-32"
            rows={1}
            disabled={state.isLoading}
          />
          <button
            onClick={handleGenerateImage}
            disabled={!inputMessage.trim() || isGeneratingImage}
            className="rounded-full p-2 bg-nagisa-accentSoft/60 hover:bg-nagisa-accentSoft transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingImage ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Image size={18} />
            )}
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || state.isLoading}
            className="rounded-full p-2 bg-nagisa-accent text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
