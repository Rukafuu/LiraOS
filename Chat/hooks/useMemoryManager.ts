import { useState, useEffect, useCallback } from 'react';
import { Memory } from '../types';
import { getCurrentUser } from '../services/userService';
import { fetchMemories, addMemoryServer, deleteMemoryServer, deleteAllMemoriesForUser } from '../services/ai';

const MEMORY_STORAGE_KEY = 'lira_memories';

interface UseMemoryManagerProps {
  isLoggedIn: boolean;
}

interface UseMemoryManagerReturn {
  memories: Memory[];
  setMemories: React.Dispatch<React.SetStateAction<Memory[]>>;
  addMemory: (memory: Memory) => Promise<void>;
  deleteMemory: (id: string) => Promise<boolean>;
  clearAllMemories: () => Promise<boolean>;
  loadMemories: () => Promise<void>;
}

export const useMemoryManager = ({ isLoggedIn }: UseMemoryManagerProps): UseMemoryManagerReturn => {
  const [memories, setMemories] = useState<Memory[]>([]);

  // Load memories on login
  useEffect(() => {
    if (!isLoggedIn) return;
    loadMemories();
  }, [isLoggedIn]);

  // Save memories to localStorage when changed
  useEffect(() => {
    if (!isLoggedIn) return;
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    const key = userId ? `${MEMORY_STORAGE_KEY}_${userId}` : MEMORY_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(memories));
  }, [memories, isLoggedIn]);

  const loadMemories = useCallback(async () => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    
    try {
      const serverMemories = await fetchMemories(userId);
      if (serverMemories.length > 0) {
        setMemories(serverMemories);
        return;
      }
    } catch (e) {
      console.error("Failed to fetch memories from server");
    }

    // Fallback to localStorage
    const memKey = userId ? `${MEMORY_STORAGE_KEY}_${userId}` : MEMORY_STORAGE_KEY;
    const savedMemories = localStorage.getItem(memKey);
    if (savedMemories) {
      try {
        setMemories(JSON.parse(savedMemories));
      } catch (e) {
        console.error("Failed to parse local memories");
      }
    }
  }, []);

  const addMemory = useCallback(async (memory: Memory) => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    
    // Attempt to save to server
    const saved = await addMemoryServer(
      memory.content,
      memory.tags,
      memory.category,
      memory.priority,
      userId
    );

    if (saved) {
      setMemories(prev => [saved, ...prev]);
    } else {
      console.warn('Failed to save memory to server, adding locally');
      setMemories(prev => [memory, ...prev]); 
    }
  }, []);

  const deleteMemory = useCallback(async (id: string): Promise<boolean> => {
    const ok = await deleteMemoryServer(id);
    if (ok) {
      setMemories(prev => prev.filter(m => m.id !== id));
      return true;
    }
    return false;
  }, []);

  const clearAllMemories = useCallback(async (): Promise<boolean> => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    if (!userId) return false;

    const memKey = `${MEMORY_STORAGE_KEY}_${userId}`;
    localStorage.removeItem(memKey);
    setMemories([]);

    const ok = await deleteAllMemoriesForUser(userId);
    return ok;
  }, []);

  return {
    memories,
    setMemories,
    addMemory,
    deleteMemory,
    clearAllMemories,
    loadMemories
  };
};
