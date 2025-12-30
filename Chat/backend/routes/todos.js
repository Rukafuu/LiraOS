import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TODOS_DIR = path.join(__dirname, '../data/todos');

const router = express.Router();
router.use(requireAuth);

// Ensure todos directory exists
async function ensureTodosDir() {
  try {
    await fs.access(TODOS_DIR);
  } catch {
    await fs.mkdir(TODOS_DIR, { recursive: true });
  }
}

// Get user's todo file path
function getUserTodoPath(userId) {
  return path.join(TODOS_DIR, `${userId}.json`);
}

// Get all todo lists for user
router.get('/', async (req, res) => {
  try {
    await ensureTodosDir();
    const userId = req.userId;
    const todoPath = getUserTodoPath(userId);

    try {
      const data = await fs.readFile(todoPath, 'utf-8');
      const todos = JSON.parse(data);
      res.json(todos);
    } catch (e) {
      // File doesn't exist yet, return empty array
      res.json([]);
    }
  } catch (e) {
    console.error('Error loading todos:', e);
    res.status(500).json({ error: 'Failed to load todos' });
  }
});

// Create new todo list
router.post('/', async (req, res) => {
  try {
    await ensureTodosDir();
    const userId = req.userId;
    const todoPath = getUserTodoPath(userId);
    const newList = req.body;

    // Load existing lists
    let lists = [];
    try {
      const data = await fs.readFile(todoPath, 'utf-8');
      lists = JSON.parse(data);
    } catch (e) {
      // File doesn't exist, start with empty array
    }

    // Add new list
    lists.unshift(newList);

    // Save
    await fs.writeFile(todoPath, JSON.stringify(lists, null, 2));
    res.json({ success: true, list: newList });
  } catch (e) {
    console.error('Error creating todo list:', e);
    res.status(500).json({ error: 'Failed to create list' });
  }
});

// Update todo list
router.put('/:listId', async (req, res) => {
  try {
    await ensureTodosDir();
    const userId = req.userId;
    const { listId } = req.params;
    const updatedList = req.body;
    const todoPath = getUserTodoPath(userId);

    // Load existing lists
    let lists = [];
    try {
      const data = await fs.readFile(todoPath, 'utf-8');
      lists = JSON.parse(data);
    } catch (e) {
      return res.status(404).json({ error: 'Lists not found' });
    }

    // Update the list
    const index = lists.findIndex(l => l.id === listId);
    if (index === -1) {
      return res.status(404).json({ error: 'List not found' });
    }

    lists[index] = updatedList;

    // Save
    await fs.writeFile(todoPath, JSON.stringify(lists, null, 2));
    res.json({ success: true, list: updatedList });
  } catch (e) {
    console.error('Error updating todo list:', e);
    res.status(500).json({ error: 'Failed to update list' });
  }
});

// Delete todo list
router.delete('/:listId', async (req, res) => {
  try {
    await ensureTodosDir();
    const userId = req.userId;
    const { listId } = req.params;
    const todoPath = getUserTodoPath(userId);

    // Load existing lists
    let lists = [];
    try {
      const data = await fs.readFile(todoPath, 'utf-8');
      lists = JSON.parse(data);
    } catch (e) {
      return res.status(404).json({ error: 'Lists not found' });
    }

    // Remove the list
    lists = lists.filter(l => l.id !== listId);

    // Save
    await fs.writeFile(todoPath, JSON.stringify(lists, null, 2));
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting todo list:', e);
    res.status(500).json({ error: 'Failed to delete list' });
  }
});

export default router;
