import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message } from '../types.js';

const CONVERSATIONS_FILE = join(process.cwd(), 'data', 'conversations.json');

function loadConversations(): Conversation[] {
  try {
    const data = readFileSync(CONVERSATIONS_FILE, 'utf-8');
    const conversations = JSON.parse(data);
    // Convert date strings back to Date objects
    return conversations.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt)
      }))
    }));
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]): void {
  writeFileSync(CONVERSATIONS_FILE, JSON.stringify(conversations, null, 2));
}

export function getAllConversations(): Omit<Conversation, 'messages'>[] {
  const conversations = loadConversations();
  return conversations.map(({ messages, ...rest }) => rest);
}

export function getConversationById(id: string): Conversation | null {
  const conversations = loadConversations();
  return conversations.find(conv => conv.id === id) || null;
}

export function createConversation(title: string = 'Nova Conversa'): Conversation {
  const conversations = loadConversations();
  const newConversation: Conversation = {
    id: uuidv4(),
    title,
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: []
  };
  conversations.push(newConversation);
  saveConversations(conversations);
  return newConversation;
}

export function addMessageToConversation(conversationId: string, message: Omit<Message, 'id' | 'conversationId' | 'createdAt'>): Message {
  const conversations = loadConversations();
  const conversation = conversations.find(conv => conv.id === conversationId);
  if (!conversation) throw new Error('Conversation not found');

  const newMessage: Message = {
    id: uuidv4(),
    conversationId,
    ...message,
    createdAt: new Date()
  };

  conversation.messages.push(newMessage);
  conversation.updatedAt = new Date();
  saveConversations(conversations);
  return newMessage;
}

export function updateConversationTitle(conversationId: string, title: string): void {
  const conversations = loadConversations();
  const conversation = conversations.find(conv => conv.id === conversationId);
  if (!conversation) throw new Error('Conversation not found');

  conversation.title = title;
  conversation.updatedAt = new Date();
  saveConversations(conversations);
}
