export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'image' | 'system';
  createdAt: Date;
  metadata?: {
    imageUrl?: string;
    suggestions?: string[];
  };
}

export interface Memory {
  id: string;
  userId: string;
  summary: string;
  createdAt: Date;
  importance: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface ChatRequest {
  conversationId?: string;
  message: string;
}

export interface ImageRequest {
  prompt: string;
}

export interface MemoryUpdateRequest {
  conversationId: string;
  messages: Message[];
}
