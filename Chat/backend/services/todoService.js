import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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

export const todoService = {
  getLists: async (userId) => {
    return loadLists(userId);
  },

  createList: async (userId, title) => {
    const lists = await loadLists(userId);
    const newList = {
      id: `list_${Date.now()}`,
      title,
      items: [],
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
      const lists = await loadLists(userId);
      const listIndex = lists.findIndex(l => l.id === listId);
      
      // If listId not found, maybe listId is title? AI can be dumb.
      // Let's try to find by title if ID fail? No, force strict ID for now or first list.
      let targetIndex = listIndex;
      if (targetIndex === -1 && lists.length > 0) {
          // Fallback: Add to first list
          targetIndex = 0;
      } else if (targetIndex === -1 && lists.length === 0) {
          // Create default list
          const newList = {
              id: `list_${Date.now()}`,
              title: "Tarefas",
              items: [],
              createdAt: Date.now(),
              updatedAt: Date.now()
          };
          lists.push(newList);
          targetIndex = 0;
      }
      
      const newItem = {
          id: `item_${Date.now()}`,
          text,
          completed: false,
          createdAt: Date.now()
      };
      
      lists[targetIndex].items.push(newItem);
      lists[targetIndex].updatedAt = Date.now();
      await saveLists(userId, lists);
      return newItem;
  }
};
