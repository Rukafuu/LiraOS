export interface Attachment {
  type: 'image' | 'file';
  mimeType: string;
  data: string; // Base64 string without data URI prefix
  name: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date | string; // Allow string for serialization
  isStreaming?: boolean;
  attachments?: Attachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export enum ViewMode {
  CHAT = 'CHAT',
  DASHBOARD = 'DASHBOARD'
}

export interface ModuleStatus {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  type: 'core' | 'plugin' | 'system';
  iconName: string; 
}

export interface SystemStats {
  cpuUsage: number;
  memoryUsage: number;
  emotionalResonance: number;
  uptime: number;
}