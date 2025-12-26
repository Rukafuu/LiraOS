
import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { createAppeal, getAppeals, getUserStatus, getModerationLogs, resolveAppeal } from '../utils/moderation.js';
import { isAdmin } from '../authStore.js';

const router = express.Router();

router.use(requireAuth);

// Public: Get my status
router.get('/status', (req, res) => {
    const status = getUserStatus(req.userId);
    res.json(status);
});

// Public: Create Appeal
router.post('/appeals', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    
    const result = createAppeal(req.userId, message);
    if (result.error) return res.status(429).json(result);
    res.json(result);
});

// Admin: List Appeals
router.get('/appeals', (req, res) => {
    if (!isAdmin(req.userId)) return res.status(403).json({ error: 'Admin only' });
    const list = getAppeals();
    res.json(list);
});

// Admin: Resolve Appeal
router.patch('/appeals/:id', (req, res) => {
    if (!isAdmin(req.userId)) return res.status(403).json({ error: 'Admin only' });
    const { status, note } = req.body;
    
    const result = resolveAppeal(req.params.id, status, note);
    if (result.error) return res.status(400).json(result);
    res.json(result);
});

// Admin: List Logs
router.get('/logs', (req, res) => {
    if (!isAdmin(req.userId)) return res.status(403).json({ error: 'Admin only' });
    const list = getModerationLogs();
    res.json(list);
});

export default router;
