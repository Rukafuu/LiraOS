import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getUserById } from '../user_store.js';
import { getTierLimit } from './tierLimits.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TODOS_DIR = path.join(__dirname, '../data/todos');

async function ensureTodosDir() {
  try {
    await fs.access(TODOS_DIR);
  } catch {
    await fs.mkdir(TODOS_DIR, { recursive: true });
  }
}

function getUserTodoPath(userId) {
  return path.join(TODOS_DIR, `${userId}.json`);
}

async function loadLists(userId) {
  await ensureTodosDir();
  const todoPath = getUserTodoPath(userId);
  try {
    const data = await fs.readFile(todoPath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

async function saveLists(userId, lists) {
  await ensureTodosDir();
  const todoPath = getUserTodoPath(userId);
  await fs.writeFile(todoPath, JSON.stringify(lists, null, 2));
}

function createItemObject(text, index = 0) {
  return {
    id: `item_${Date.now()}_${index}`,
    text,
    completed: false,
    createdAt: Date.now()
  };
}

export const todoService = {
  getLists: async (userId) => {
    return loadLists(userId);
  },

  createList: async (userId, title, initialItems = []) => {
    const user = await getUserById(userId);
    const tier = user?.plan || 'free';
    const limit = getTierLimit(tier, 'maxTodoLists');

    const lists = await loadLists(userId);
    
    if (lists.length >= limit) {
      throw new Error(`Limite de ${limit} listas atingido para seu plano.`);
    }

    const items = Array.isArray(initialItems)
      ? initialItems.map((text, idx) => typeof text === 'string' ? createItemObject(text, idx) : text)
      : [];

    const newList = {
      id: `list_${Date.now()}`,
      title,
      items,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    lists.unshift(newList);
    await saveLists(userId, lists);
    return newList;
  },

  updateList: async (userId, listId, updatedListData) => {
     // If updatedListData is full object, replace. If partial... logic is tricky.
     // Let's assume full list object for now to match old router logic or partial.
     // Actually router sends full object on PUT.
     const lists = await loadLists(userId);
     const index = lists.findIndex(l => l.id === listId);
     if (index === -1) throw new Error('List not found');
     
     // Merge logic simple
     lists[index] = { ...lists[index], ...updatedListData, updatedAt: Date.now() };
     await saveLists(userId, lists);
     return lists[index];
  },

  deleteList: async (userId, listId) => {
    let lists = await loadLists(userId);
    lists = lists.filter(l => l.id !== listId);
    await saveLists(userId, lists);
    return true;
  },
  
  // New granular methods for AI
  addItem: async (userId, listId, text) => {
      return (await todoService.addItems(userId, listId, [text]))[0];
  },

  addItems: async (userId, listId, texts) => {
      if (!texts || !Array.isArray(texts) || texts.length === 0) return [];

      const lists = await loadLists(userId);
      let listIndex = lists.findIndex(l => l.id === listId);
      
      if (listIndex === -1 && lists.length > 0) {
          listIndex = 0;
      } else if (listIndex === -1 && lists.length === 0) {
          const newList = {
              id: `list_${Date.now()}`,
              title: "Tarefas",
              items: [],
              createdAt: Date.now(),
              updatedAt: Date.now()
          };
          lists.push(newList);
          listIndex = 0;
      }
      
      const newItems = texts.map((text, idx) => createItemObject(text, idx));
      
      lists[listIndex].items.push(...newItems);
      lists[listIndex].updatedAt = Date.now();
      await saveLists(userId, lists);
      return newItems;
  }
};
