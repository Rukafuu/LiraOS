import express from 'express';
import { ChatRequest } from '../types.js';
import { createConversation, addMessageToConversation, updateConversationTitle, getConversationById } from '../services/conversationService.js';
import { getMemoriesForUser } from '../services/memoryStore.js';
import { streamLiraResponse, generateTitleFromConversation, generateMemoriesFromConversation } from '../llm/liraLLM.js';
import { addMemories } from '../services/memoryStore.js';

const router = express.Router();

router.post('/chat/stream', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { conversationId, message } = req.body as { conversationId?: string; message: string };

    if (!message) {
      console.log('No message provided in request');
      return res.status(400).json({ error: 'Message is required' });
    }

    let conversationIdToUse = conversationId;
    let conversation;

    // Create new conversation if not provided or if provided ID doesn't exist
    if (!conversationIdToUse) {
      conversation = createConversation();
      conversationIdToUse = conversation.id;
    } else {
      conversation = getConversationById(conversationIdToUse);
      if (!conversation) {
        // Create new conversation with the provided ID as title hint
        conversation = createConversation(`Conversa ${conversationIdToUse}`);
        conversationIdToUse = conversation.id;
      }
    }

    // Add user message
    const userMessage = addMessageToConversation(conversationIdToUse, {
      role: 'user',
      content: message
    });

    // Get conversation with all messages (refresh after adding message)
    conversation = getConversationById(conversationIdToUse);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found after creation' });
    }

    // Generate title if this is the first message
    if (conversation.messages.length === 1) {
      const title = await generateTitleFromConversation(conversation.messages);
      updateConversationTitle(conversationIdToUse, title);
    }

    // Get relevant memories
    const memories = getMemoriesForUser();

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Start streaming response
    const stream = await streamLiraResponse({
      messages: conversation.messages,
      memories
    });

    const reader = stream.getReader();
    let assistantContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.content) {
              assistantContent += data.content;
              res.write(`data: ${JSON.stringify({ content: data.content })}\n\n`);
            } else if (data.done) {
              // Add assistant message to conversation
              addMessageToConversation(conversationIdToUse, {
                role: 'assistant',
                content: assistantContent
              });

              // Generate and save memories
              const newMemories = await generateMemoriesFromConversation(conversation.messages);
              if (newMemories.length > 0) {
                addMemories(newMemories);
              }

              res.write(`data: ${JSON.stringify({ done: true, conversationId: conversationIdToUse })}\n\n`);
              res.end();
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as chatRouter };
