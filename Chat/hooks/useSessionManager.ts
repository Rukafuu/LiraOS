import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, Message, Attachment } from '../types';
import { getCurrentUser } from '../services/userService';

const LOCAL_STORAGE_KEY = 'lira_chat_sessions';

interface UseSessionManagerProps {
  isLoggedIn: boolean;
  activePersonaId: string;
}

interface UseSessionManagerReturn {
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  currentSession: ChatSession | undefined;
  createNewChat: () => string;
  deleteSession: (id: string) => void;
  updateSessionMessages: (sessionId: string, messages: Message[]) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  clearAllSessions: () => void;
}

export const useSessionManager = ({ 
  isLoggedIn, 
  activePersonaId 
}: UseSessionManagerProps): UseSessionManagerReturn => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Load sessions from localStorage
  useEffect(() => {
    if (!isLoggedIn) return;
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    const sessionsKey = userId ? `${LOCAL_STORAGE_KEY}_${userId}` : LOCAL_STORAGE_KEY;
    const savedSessions = localStorage.getItem(sessionsKey);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      } catch (e) { 
        console.error("Failed to load session history"); 
      }
    }
  }, [isLoggedIn]);

  // Save sessions to localStorage
  useEffect(() => {
    if (!isLoggedIn) return;
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    const key = userId ? `${LOCAL_STORAGE_KEY}_${userId}` : LOCAL_STORAGE_KEY;
    
    const safeSessions = sessions.map(s => ({
      ...s,
      messages: s.messages.map(m => ({
        ...m,
        attachments: m.attachments?.map(a => ({
          id: a.id,
          previewUrl: a.previewUrl,
          type: a.type,
          name: a.name ?? (a as any).file?.name,
          size: a.size ?? (a as any).file?.size
        }))
      }))
    }));
    localStorage.setItem(key, JSON.stringify(safeSessions));
  }, [sessions, isLoggedIn]);

  const createNewChat = useCallback((): string => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      personaId: activePersonaId,
      userId
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  }, [activePersonaId]);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const updateSessionMessages = useCallback((sessionId: string, messages: Message[]) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, messages, updatedAt: Date.now() } 
        : s
    ));
  }, []);

  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, title } : s
    ));
  }, []);

  const clearAllSessions = useCallback(() => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    if (userId) {
      const sessionsKey = `${LOCAL_STORAGE_KEY}_${userId}`;
      localStorage.removeItem(sessionsKey);
    }
    setSessions([]);
    setCurrentSessionId(null);
  }, []);

  return {
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    currentSession,
    createNewChat,
    deleteSession,
    updateSessionMessages,
    updateSessionTitle,
    clearAllSessions
  };
};
