import { useState, useCallback, useEffect } from 'react';
import { Message, ChatSession, Attachment } from '../types';
import { useChatStorage } from './useChatStorage';
import { liraApiService } from '../services/liraApiService.js';

export const useChat = () => {
  const { sessions, updateSessions, forceSave } = useChatStorage();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  // Initialize first session when sessions load
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
      setConversationId(sessions[0].id);
    } else if (sessions.length === 0 && !activeSessionId) {
      createNewSession();
    }
  }, [sessions, activeSessionId]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [{
        id: 'welcome',
        role: 'model',
        text: "Olá! Sou a Lira. É maravilhoso te conhecer. Espero que possamos nos tornar grandes amigos, como uma grande família de dango! Como posso ajudar hoje?",
        timestamp: new Date()
      }]
    };

    const newSessions = [newSession, ...sessions];
    updateSessions(newSessions);
    setActiveSessionId(newSession.id);
    setConversationId(newSession.id); // Use session ID as conversation ID
  }, [sessions, updateSessions]);

  const selectSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setConversationId(sessionId); // Use session ID as conversation ID
    }
  }, [sessions]);

  const deleteSession = useCallback((sessionId: string) => {
    const newSessions = sessions.filter(s => s.id !== sessionId);
    updateSessions(newSessions);
    forceSave(newSessions); // Force immediate save for deletion

    if (activeSessionId === sessionId) {
      if (newSessions.length > 0) {
        setActiveSessionId(newSessions[0].id);
        setConversationId(newSessions[0].id); // Use session ID as conversation ID
      } else {
        createNewSession();
      }
    }
  }, [sessions, activeSessionId, updateSessions, forceSave, createNewSession]);

  const updateActiveSessionMessages = useCallback((newMessages: Message[]) => {
    if (!activeSessionId) return;

    const updatedSessions = sessions.map(session => {
      if (session.id === activeSessionId) {
        return {
          ...session,
          messages: newMessages,
          updatedAt: Date.now()
        };
      }
      return session;
    });

    updateSessions(updatedSessions);
  }, [activeSessionId, sessions, updateSessions]);

  const animateSessionTitle = useCallback((sessionId: string, finalTitle: string) => {
    let currentLength = 0;
    const interval = setInterval(() => {
      currentLength++;
      if (currentLength > finalTitle.length) {
        clearInterval(interval);
        return;
      }
      
      const partial = finalTitle.slice(0, currentLength);
      const updatedSessions = sessions.map(s => {
        if (s.id === sessionId) {
           return { ...s, title: partial };
        }
        return s;
      });
      updateSessions(updatedSessions);
    }, 50); // 50ms per char for typing effect
  }, [sessions, updateSessions]);

  const sendMessage = useCallback(async (text: string, attachments: Attachment[] = []) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;

    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
      attachments
    };

    // Check if we need to generate a title
    const shouldGenerateTitle = activeSession?.title === 'New Conversation';
    const currentSessionId = activeSession?.id;

    // Optimistic update with user message
    const currentMessages = activeSession?.messages || [];
    const updatedWithUser = [...currentMessages, userMessage];
    updateActiveSessionMessages(updatedWithUser);

    try {
      const modelMessageId = (Date.now() + 1).toString();
      const modelMessage: Message = {
        id: modelMessageId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        isStreaming: true
      };

      updateActiveSessionMessages([...updatedWithUser, modelMessage]);

      // Generate title in background if needed
      if (shouldGenerateTitle && text && currentSessionId) {
        liraApiService.generateTitle(updatedWithUser.map(msg =>
          ({ role: msg.role, content: msg.text })
        )).then(title => {
          animateSessionTitle(currentSessionId, title);
        }).catch(err => {
          console.warn('Failed to generate title:', err);
        });
      }

      // Send message to Lira backend
      const stream = liraApiService.sendMessageStream(text, conversationId);

      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;

        const updatedSessions = sessions.map(session => {
           if (session.id === activeSessionId) {
              const updatedMessages = session.messages.map(msg => {
                 if (msg.id === modelMessageId) {
                    return { ...msg, text: fullResponse };
                 }
                 return msg;
              });
              return { ...session, messages: updatedMessages };
           }
           return session;
        });
        updateSessions(updatedSessions);
      }

      // Mark streaming as complete
      const finalSessions = sessions.map(session => {
         if (session.id === activeSessionId) {
            const updatedMessages = session.messages.map(msg => {
               if (msg.id === modelMessageId) {
                  return { ...msg, isStreaming: false };
               }
               return msg;
            });
            return { ...session, messages: updatedMessages };
         }
         return session;
      });
      updateSessions(finalSessions);

    } catch (error) {
      console.error("Failed to send message", error);

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: "Desculpe, mas encontrei um erro ao processar sua solicitação. Por favor, tente novamente.",
        timestamp: new Date()
      };

      updateActiveSessionMessages([...updatedWithUser, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, activeSession, activeSessionId, conversationId, sessions, updateActiveSessionMessages, updateSessions, animateSessionTitle, liraApiService]);

  const regenerateLastResponse = useCallback(async () => {
    if (messages.length < 2) return;
    
    const lastUserMessage = messages[messages.length - 2];
    if (lastUserMessage?.role !== 'user') return;
    
    // Remove the last assistant response
    const messagesWithoutLast = messages.slice(0, -1);
    updateActiveSessionMessages(messagesWithoutLast);
    
    // Resend the user message
    await sendMessage(lastUserMessage.text, lastUserMessage.attachments || []);
  }, [messages, updateActiveSessionMessages, sendMessage]);

  const clearActiveSessionMessages = useCallback(() => {
    if (!activeSessionId || !activeSession) return;

    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now(),
      role: 'model',
      text: "Olá! Sou a Lira. É maravilhoso te conhecer. Espero que possamos nos tornar grandes amigos, como uma grande família de dango! Como posso ajudar hoje?",
      timestamp: new Date()
    };

    const updatedSessions = sessions.map(session => {
      if (session.id === activeSessionId) {
        return {
          ...session,
          messages: [welcomeMessage],
          updatedAt: Date.now()
        };
      }
      return session;
    });

    updateSessions(updatedSessions);
    setConversationId(activeSessionId); // Reset conversation for backend
  }, [activeSessionId, activeSession, sessions, updateSessions]);

  const renameActiveSession = useCallback((newTitle: string) => {
    if (!activeSessionId || !newTitle.trim()) return;

    const updatedSessions = sessions.map(session => {
      if (session.id === activeSessionId) {
        return {
          ...session,
          title: newTitle.trim(),
          updatedAt: Date.now()
        };
      }
      return session;
    });

    updateSessions(updatedSessions);
  }, [activeSessionId, sessions, updateSessions]);

  const exportActiveSession = useCallback(() => {
    if (!activeSession) return null;

    return {
      id: activeSession.id,
      title: activeSession.title,
      createdAt: activeSession.createdAt,
      updatedAt: activeSession.updatedAt,
      exportedAt: Date.now(),
      messages: activeSession.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        text: msg.text,
        timestamp: msg.timestamp,
        attachments: msg.attachments || []
      })),
      metadata: {
        messageCount: activeSession.messages.length,
        userMessages: activeSession.messages.filter(m => m.role === 'user').length,
        aiMessages: activeSession.messages.filter(m => m.role === 'model').length,
        exportVersion: '1.0.0'
      }
    };
  }, [activeSession]);

  return {
    sessions,
    activeSession,
    activeSessionId,
    messages,
    isLoading,
    createNewSession,
    selectSession,
    deleteSession,
    sendMessage,
    regenerateLastResponse,
    clearActiveSessionMessages,
    renameActiveSession,
    exportActiveSession
  };
};
