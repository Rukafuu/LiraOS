import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Memory } from '../types.js';

const MEMORIES_FILE = join(process.cwd(), 'data', 'memories.json');

function loadMemories(): Memory[] {
  try {
    const data = readFileSync(MEMORIES_FILE, 'utf-8');
    const memories = JSON.parse(data);
    return memories.map((mem: any) => ({
      ...mem,
      createdAt: new Date(mem.createdAt)
    }));
  } catch {
    return [];
  }
}

function saveMemories(memories: Memory[]): void {
  writeFileSync(MEMORIES_FILE, JSON.stringify(memories, null, 2));
}

export function getMemoriesForUser(userId: string = 'default-user'): Memory[] {
  const memories = loadMemories();
  return memories.filter(mem => mem.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function addMemories(memories: Omit<Memory, 'id' | 'createdAt'>[]): void {
  const existingMemories = loadMemories();
  const newMemories: Memory[] = memories.map(mem => ({
    ...mem,
    id: uuidv4(),
    createdAt: new Date()
  }));
  existingMemories.push(...newMemories);
  saveMemories(existingMemories);
}

export function searchMemories(query: string, userId: string = 'default-user'): Memory[] {
  const memories = getMemoriesForUser(userId);
  // Simple text search - can be improved with embeddings later
  return memories.filter(mem =>
    mem.summary.toLowerCase().includes(query.toLowerCase()) ||
    (mem.tags && mem.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
  );
}
