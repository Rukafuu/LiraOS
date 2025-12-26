export interface Attachment {
  id: string;
  file?: File;
  previewUrl: string;
  type: 'image' | 'document' | 'text' | 'script' | 'executable';
  name?: string;
  size?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  attachments?: Attachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  personaId?: string; // The persona used in this chat
  userId?: string;
}

export type ThemeMode = 'light' | 'dark';

export interface ChatStore {
  sessions: ChatSession[];
  currentSessionId: string | null;
  createNewSession: () => void;
  selectSession: (id: string) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  clearHistory: () => void;
}

export type LiraThemeId =
  | 'lira-dark'
  | 'lira-aurora'
  | 'lira-ice'
  | 'lira-nature'
  | 'lira-desert'
  | 'lira-halloween'
  | 'lira-xmas'
  | 'lira-carnival'
  | 'lira-cyberleaf'
  | 'lira-obsidian'
  | 'lira-royal'
  | 'lira-singularity';

export interface LiraTheme {
  id: LiraThemeId;
  name: string;
  price: number; // Cost in Coins
  isLocked: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    card: string;
    border: string;
    dim: string;
  };
}

export type PersonaId = 'default' | 'tsundere' | 'caring' | 'concise' | 'unfiltered' | 'poetic';

export interface Persona {
  id: PersonaId;
  name: string;
  description: string;
  systemInstruction: string;
  price: number;
  isLocked: boolean;
  icon: any; // Lucide Icon component
}

// GAMIFICATION TYPES

export interface UserStats {
  username: string; // Added username
  level: number;
  currentXp: number;
  nextLevelXp: number;
  coins: number; // New Currency
  streakDays: number;
  bondLevel: number; // 0 to 100
  totalMessages: number;
  plan?: 'free' | 'pro';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  isCompleted: boolean;
  type: 'daily' | 'weekly';
  progress: number;
  maxProgress: number;
  isClaimed?: boolean;
}

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'galactic' | 'cosmic';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number | null;
  rarity: AchievementRarity;
  xpReward: number;
  isHidden?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  username: string;
  xp: number;
  avatarUrl?: string;
  isCurrentUser: boolean;
  badges: string[];
}

export interface Memory {
  id: string;
  content: string;
  createdAt: number;
  tags: string[];
  category?: 'profile' | 'contact' | 'location' | 'birthday' | 'note';
  priority?: 'low' | 'medium' | 'high';
  userId?: string;
}
