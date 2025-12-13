import express from 'express';
import { getAllConversations, getConversationById } from '../services/conversationService.js';

const router = express.Router();

router.get('/conversations', (req, res) => {
  try {
    const conversations = getAllConversations();
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

router.get('/conversations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const conversation = getConversationById(id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

export { router as conversationsRouter };
