import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { todoService } from '../services/todoService.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const todos = await todoService.getLists(req.userId);
    res.json(todos);
  } catch (e) {
    console.error('Error loading todos:', e);
    res.status(500).json({ error: 'Failed to load todos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, items } = req.body; 
    const name = title || req.body.title || "Nova Lista"; 
    const list = await todoService.createList(req.userId, name, items || []);
    res.json(list);
    // Frontend POST body is full object. Service createList creates new object.
    // Let's adapt frontend slightly or make service accept full object.
    // Actually, service createList takes title. Frontend sends full object.
    
    // Correction: Router should just use service correctly.
    // If frontend sends full object, we extract title.
  } catch (e) {
    console.error('Error creating todo list:', e);
    res.status(500).json({ error: 'Failed to create list' });
  }
});

router.put('/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    const updatedList = await todoService.updateList(req.userId, listId, req.body);
    res.json(updatedList);
  } catch (e) {
    console.error('Error updating todo list:', e);
    res.status(500).json({ error: 'Failed to update list' });
  }
});

router.delete('/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    await todoService.deleteList(req.userId, listId);
    res.json({ success: true });
  } catch (e) {
    console.error('Error deleting todo list:', e);
    res.status(500).json({ error: 'Failed to delete list' });
  }
});

export default router;
