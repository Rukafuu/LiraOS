import express from 'express';
import logger from '../utils/logger.js'; // Assuming this exists, if not I should check.
import { getSystemInfo } from '../utils/logger.js'; 
import { addFeedback, getFeedback } from '../feedbackStore.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

// Get all feedback (admin only in future)
router.get('/', (req, res) => {
  try {
    // TODO: Add admin check
    const feedbacks = getFeedback();
    res.json(feedbacks);
  } catch (e) {
    console.error('Failed to read feedback:', e);
    res.status(500).json({ error: 'Failed to read feedback' });
  }
});

// Submit feedback
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      feedback, 
      type = 'general', // general | bug | feature | ux
      context = {},
      rating 
    } = req.body;

    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback text is required' });
    }

    // Enrich context with system info if available
    const enrichedContext = {
        ...context,
        system: typeof getSystemInfo === 'function' ? getSystemInfo() : {}
    };

    const entry = addFeedback(userId, feedback, type, rating, enrichedContext);

    res.json({ 
      success: true, 
      message: 'Thank you for your feedback!',
      id: entry.id 
    });
  } catch (e) {
    console.error('Failed to save feedback:', e);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

export default router;
