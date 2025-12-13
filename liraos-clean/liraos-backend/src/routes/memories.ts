import express from 'express';
import { MemoryUpdateRequest } from '../types.js';
import { addMemories } from '../services/memoryStore.js';
import { generateMemoriesFromConversation } from '../llm/liraLLM.js';

const router = express.Router();

router.post('/memories/update', async (req, res) => {
  try {
    const { conversationId, messages }: MemoryUpdateRequest = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Generate new memories from recent conversation
    const newMemories = await generateMemoriesFromConversation(messages);

    if (newMemories.length > 0) {
      addMemories(newMemories);
    }

    res.json({ success: true, memoriesAdded: newMemories.length });
  } catch (error) {
    console.error('Update memories error:', error);
    res.status(500).json({ error: 'Failed to update memories' });
  }
});

export { router as memoriesRouter };
