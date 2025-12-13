import express from 'express';
import { ImageRequest } from '../types.js';
import { generateImage } from '../services/imageGenerator.js';
import { addMessageToConversation } from '../services/conversationService.js';

const router = express.Router();

router.post('/image', async (req, res) => {
  try {
    const { prompt }: ImageRequest = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await generateImage(prompt);

    // Optionally add to a conversation if conversationId is provided
    // For now, just return the result
    // TODO: Integrate with conversation system

    res.json(result);
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

export { router as imageRouter };
