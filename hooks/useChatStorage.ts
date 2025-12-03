import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSession } from '../types';

const STORAGE_KEY = 'lira_chat_sessions_v1';
const DEBOUNCE_DELAY = 1500; // 1.5 seconds

export const useChatStorage = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: ChatSession[] = JSON.parse(stored);
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to parse chat history", e);
        setSessions([]);
      }
    }
  }, []);

  // Debounced save function
  const debouncedSave = useCallback((sessionsToSave: ChatSession[]) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsToSave));
      } catch (e) {
        console.error("Storage limit reached", e);
      }
    }, DEBOUNCE_DELAY);
  }, []);

  // Update sessions and trigger debounced save
  const updateSessions = useCallback((newSessions: ChatSession[]) => {
    setSessions(newSessions);
    if (newSessions.length > 0) {
      debouncedSave(newSessions);
    }
  }, [debouncedSave]);

  // Force immediate save (for critical operations like session deletion)
  const forceSave = useCallback((sessionsToSave: ChatSession[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsToSave));
    } catch (e) {
      console.error("Storage limit reached", e);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    sessions,
    updateSessions,
    forceSave
  };
};
