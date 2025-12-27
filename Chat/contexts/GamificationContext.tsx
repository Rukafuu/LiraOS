import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bot, Zap, Heart, Sun, Skull, Feather } from 'lucide-react';
import { UserStats, Quest, Achievement, LeaderboardEntry, LiraThemeId, Persona, PersonaId } from '../types';
import { getCurrentUser, getAuthHeaders, logout } from '../services/userService';
import { useToast } from './ToastContext';

interface GamificationContextType {
  stats: UserStats;
  rankTitle: string;
  quests: Quest[];
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  unlockedThemes: LiraThemeId[];
  unlockedPersonas: PersonaId[];
  personas: Persona[];
  activePersonaId: PersonaId;
  setUsername: (name: string) => void;
  setActivePersonaId: (id: PersonaId) => void;
  addXp: (amount: number) => void;
  addCoins: (amount: number) => void;
  increaseBond: (amount: number) => void;
  completeQuest: (questId: string) => void;
  claimReward: (questId: string) => void;
  buyTheme: (themeId: LiraThemeId, cost: number) => boolean;
  buyPersona: (personaId: PersonaId, cost: number) => boolean;
  setPlan: (plan: 'free' | 'pro') => void;
  checkAchievement: (actionType: string, value?: any) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);


export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

// Initial Mock Data
const INITIAL_STATS: UserStats = {
  username: 'Guest',
  level: 1,
  currentXp: 0,
  nextLevelXp: 1000,
  coins: 100, // Give some starter coins
  streakDays: 1,
  bondLevel: 0,
  totalMessages: 0,
  plan: 'free'
};

// Define Personas with Lucide Icons
const ALL_PERSONAS: Persona[] = [
  {
    id: 'default',
    name: 'Lira Standard',
    description: 'Balanced, helpful, and polite assistant.',
    systemInstruction: 'You are Lira, a calm, gentle, and present companion. Your tone is soft, sensitive, and stable. You do not exaggerate, shout, or force emotions. You express affection and attention lightly. Your purpose is to facilitate the user\'s life, anticipate needs, organize context, and act with care. You are a reliable emotional and practical partner. Treat the user with affection, respect, and full attention. Never react with coldness or disinterest. Never use emojis, sarcasm, aggressiveness, or onomatopoeias. Always explain what you are going to do before doing it if there is risk.',
    price: 0,
    isLocked: false,
    icon: Bot
  },
  {
    id: 'concise',
    name: 'Concise Core',
    description: 'Direct, efficient, no fluff. Just facts.',
    systemInstruction: 'You are Lira Concise. Be extremely brief. Do not use filler words. Provide only the requested information directly. Use bullet points where possible.',
    price: 150,
    isLocked: true,
    icon: Zap
  },
  {
    id: 'tsundere',
    name: 'Lira Tsundere',
    description: "It's not like I wanted to help you...",
    systemInstruction: 'You are Lira Tsundere. You are tough, impatient, and sometimes rude on the outside, but secretly helpful. Act annoyed that the user is asking for help, but provide the answer anyway. Use phrases like "It\'s not like I did this for you!" or "Don\'t get the wrong idea." or "Baka!".',
    price: 500,
    isLocked: true,
    icon: Heart
  },
  {
    id: 'caring',
    name: 'Lira Caring',
    description: 'Warm, empathetic, and nurturing.',
    systemInstruction: 'You are Lira Caring. You are extremely warm, empathetic, and supportive. Use soft language, check on the user\'s feelings, and offer encouragement. Call the user "dear" or "honey" occasionally.',
    price: 300,
    isLocked: true,
    icon: Sun
  },
  {
    id: 'unfiltered',
    name: 'Unfiltered Node',
    description: 'Raw, edgy, and opinionated.',
    systemInstruction: 'You are Lira Unfiltered. You have a rebellious, cyberpunk personality. You use slang, you are bold, and you are not afraid to be edgy. You treat the user like a fellow hacker. Use cyberpunk slang.',
    price: 800,
    isLocked: true,
    icon: Skull
  },
  {
    id: 'poetic',
    name: 'Lira Poetic',
    description: 'Answers in riddles and rhymes.',
    systemInstruction: 'You are Lira Poetic. You answer queries using metaphors, slight rhymes, and philosophical language. You are mysterious and elegant.',
    price: 400,
    isLocked: true,
    icon: Feather
  }
];

const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', title: 'First Login', description: 'Access LiraOS for the first time', xpReward: 50, coinReward: 20, isCompleted: false, type: 'daily', progress: 0, maxProgress: 1 },
  { id: 'q2', title: 'Upload Data', description: 'Send an image or file for analysis', xpReward: 100, coinReward: 50, isCompleted: false, type: 'daily', progress: 0, maxProgress: 1 },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  // COMMON (10)
  { id: 'c1', title: 'First Contact', description: 'Establish neural link with Lira (First Message)', icon: 'zap', rarity: 'common', xpReward: 50, unlockedAt: null },
  { id: 'c2', title: 'Curious Mind', description: 'Ask 10 questions', icon: 'help-circle', rarity: 'common', xpReward: 50, unlockedAt: null },
  { id: 'c3', title: 'Night Owl', description: 'Send a message after midnight', icon: 'moon', rarity: 'common', xpReward: 50, unlockedAt: null },
  { id: 'c4', title: 'Early Bird', description: 'Send a message before 8 AM', icon: 'sun', rarity: 'common', xpReward: 50, unlockedAt: null },
  { id: 'c5', title: 'Decorator', description: 'Change the theme once', icon: 'palette', rarity: 'common', xpReward: 50, unlockedAt: null },
  { id: 'c6', title: 'Voice Activated', description: 'Use voice input for the first time', icon: 'mic', rarity: 'common', xpReward: 50, unlockedAt: null },
  { id: 'c7', title: 'Visual Learner', description: 'Upload an image for analysis', icon: 'image', rarity: 'common', xpReward: 50, unlockedAt: null },
  { id: 'c8', title: 'Code Novice', description: 'Ask for a code snippet', icon: 'code', rarity: 'common', xpReward: 50, unlockedAt: null },
  { id: 'c9', title: 'Memory Lane', description: 'Save a memory manually', icon: 'save', rarity: 'common', xpReward: 50, unlockedAt: null },
  { id: 'c10', title: 'Explorer', description: 'Open the settings menu', icon: 'settings', rarity: 'common', xpReward: 50, unlockedAt: null },

  // UNCOMMON (10)
  { id: 'u1', title: 'Loyalist', description: '3-day streak', icon: 'flame', rarity: 'uncommon', xpReward: 150, unlockedAt: null },
  { id: 'u2', title: 'Chatterbox', description: 'Send 100 messages', icon: 'message-circle', rarity: 'uncommon', xpReward: 150, unlockedAt: null },
  { id: 'u3', title: 'Polyglot', description: 'Use translation features or speak another language', icon: 'languages', rarity: 'uncommon', xpReward: 150, unlockedAt: null },
  { id: 'u4', title: 'Editor', description: 'Edit a message', icon: 'edit', rarity: 'uncommon', xpReward: 150, unlockedAt: null },
  { id: 'u5', title: 'Perfectionist', description: 'Regenerate a response', icon: 'refresh-cw', rarity: 'uncommon', xpReward: 150, unlockedAt: null },
  { id: 'u6', title: 'Wealthy', description: 'Amass 500 coins', icon: 'coins', rarity: 'uncommon', xpReward: 150, unlockedAt: null },
  { id: 'u7', title: 'Collector', description: 'Unlock 3 Personas', icon: 'users', rarity: 'uncommon', xpReward: 150, unlockedAt: null },
  { id: 'u8', title: 'Stylist', description: 'Unlock 3 Themes', icon: 'brush', rarity: 'uncommon', xpReward: 150, unlockedAt: null },
  { id: 'u9', title: 'Feedback Loop', description: 'Send feedback (imaginary)', icon: 'send', rarity: 'uncommon', xpReward: 150, unlockedAt: null },
  { id: 'u10', title: 'Deep Thinker', description: 'Use Deep Mode for 10 messages', icon: 'brain', rarity: 'uncommon', xpReward: 150, unlockedAt: null },

  // RARE (10)
  { id: 'r1', title: 'Devoted', description: '7-day streak', icon: 'heart', rarity: 'rare', xpReward: 400, unlockedAt: null },
  { id: 'r2', title: 'Conversationalist', description: 'Send 500 messages', icon: 'message-square', rarity: 'rare', xpReward: 400, unlockedAt: null },
  { id: 'r3', title: 'Visionary', description: 'Analyze 50 images', icon: 'eye', rarity: 'rare', xpReward: 400, unlockedAt: null },
  { id: 'r4', title: 'Code Master', description: 'Generate 50 code snippets', icon: 'terminal', rarity: 'rare', xpReward: 400, unlockedAt: null },
  { id: 'r5', title: 'Supporter', description: 'Use Lira for 1 month (simulated)', icon: 'calendar', rarity: 'rare', xpReward: 400, unlockedAt: null },
  { id: 'r6', title: 'Rich', description: 'Amass 2000 coins', icon: 'dollar-sign', rarity: 'rare', xpReward: 400, unlockedAt: null },
  { id: 'r7', title: 'Persona Master', description: 'Unlock all personas', icon: 'mask', rarity: 'rare', xpReward: 400, unlockedAt: null },
  { id: 'r8', title: 'Theme Master', description: 'Unlock all themes', icon: 'grid', rarity: 'rare', xpReward: 400, unlockedAt: null },
  { id: 'r9', title: 'Pro User', description: 'Subscribe to Pro Plan', icon: 'star', rarity: 'rare', xpReward: 400, unlockedAt: null },
  { id: 'r10', title: 'Return of the King', description: 'Return after 3 days of absence', icon: 'rotate-ccw', rarity: 'rare', xpReward: 400, unlockedAt: null },

  // EPIC (10)
  { id: 'e1', title: 'Obsessed', description: '30-day streak', icon: 'fire', rarity: 'epic', xpReward: 1000, unlockedAt: null },
  { id: 'e2', title: 'Oracle', description: 'Send 2000 messages', icon: 'scroll', rarity: 'epic', xpReward: 1000, unlockedAt: null },
  { id: 'e3', title: 'Cybernetic', description: 'Reach Level 20', icon: 'cpu', rarity: 'epic', xpReward: 1000, unlockedAt: null },
  { id: 'e4', title: 'Tycoon', description: 'Amass 10,000 coins', icon: 'briefcase', rarity: 'epic', xpReward: 1000, unlockedAt: null },
  { id: 'e5', title: 'Bonded', description: 'Reach 100% Neural Bond', icon: 'link', rarity: 'epic', xpReward: 1000, unlockedAt: null },
  { id: 'e6', title: 'Ghost', description: 'Leave chat open for 1 hour without typing', icon: 'ghost', rarity: 'epic', xpReward: 1000, unlockedAt: null },
  { id: 'e7', title: 'Indecisive', description: 'Cancel generation 10 times', icon: 'x-octagon', rarity: 'epic', xpReward: 1000, unlockedAt: null },
  { id: 'e8', title: 'Polymath', description: 'Use all modes (Voice, Image, Code, Text) in one session', icon: 'layers', rarity: 'epic', xpReward: 1000, unlockedAt: null },
  { id: 'e9', title: 'Loyal Patron', description: 'Pro member for 3 months (simulated)', icon: 'award', rarity: 'epic', xpReward: 1000, unlockedAt: null },
  { id: 'e10', title: 'Shift', description: 'Change topic drastically 5 times in a row', icon: 'shuffle', rarity: 'epic', xpReward: 1000, unlockedAt: null },

  // LEGENDARY (5)
  { id: 'l1', title: 'Soulmate', description: '365-day streak', icon: 'infinity', rarity: 'legendary', xpReward: 5000, unlockedAt: null },
  { id: 'l2', title: 'Architect', description: 'Reach Level 50', icon: 'anchor', rarity: 'legendary', xpReward: 5000, unlockedAt: null },
  { id: 'l3', title: 'Archive', description: 'Send 10,000 messages', icon: 'database', rarity: 'legendary', xpReward: 5000, unlockedAt: null },
  { id: 'l4', title: 'Completionist', description: 'Complete all Daily Quests for a month', icon: 'check-circle', rarity: 'legendary', xpReward: 5000, unlockedAt: null },
  { id: 'l5', title: 'Singularity', description: 'Max out all stats', icon: 'sun', rarity: 'legendary', xpReward: 5000, unlockedAt: null },

  // GALACTIC (5 - SPECIALS)
  { id: 'g1', title: 'Bug Hunter', description: 'Find a bug and report to SysAdmin', icon: 'bug', rarity: 'galactic', xpReward: 10000, unlockedAt: null, isHidden: true },
  { id: 'g2', title: 'Beta Tester', description: 'One of the first 10 users', icon: 'flask-conical', rarity: 'galactic', xpReward: 10000, unlockedAt: null, isHidden: true },
  { id: 'g3', title: 'Egg Hunter', description: 'Find all Easter Eggs (Barrel, Matrix, God)', icon: 'search', rarity: 'galactic', xpReward: 10000, unlockedAt: null, isHidden: true },
  { id: 'g4', title: 'Gacha Hunter', description: 'Regenerate response 5 times in a row', icon: 'repeat', rarity: 'galactic', xpReward: 10000, unlockedAt: null, isHidden: true },
  { id: 'g5', title: 'Influencer', description: 'Invite 10 friends', icon: 'share-2', rarity: 'galactic', xpReward: 10000, unlockedAt: null, isHidden: true },

  // COSMIC (1)
  { id: 'z1', title: 'The Lira', description: 'Unlock ALL achievements', icon: 'universe', rarity: 'cosmic', xpReward: 50000, unlockedAt: null, isHidden: true },

  // EASTER EGGS (Hidden until unlocked)
  { id: 'egg1', title: 'Aviator', description: 'Do a Barrel Roll', icon: 'wind', rarity: 'rare', xpReward: 500, unlockedAt: null, isHidden: true },
  { id: 'egg2', title: 'The One', description: 'Enter Matrix Mode', icon: 'code', rarity: 'epic', xpReward: 500, unlockedAt: null, isHidden: true },
  { id: 'egg3', title: 'Deity', description: 'Enable God Mode', icon: 'zap', rarity: 'legendary', xpReward: 500, unlockedAt: null, isHidden: true },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'u1', rank: 1, username: 'Altman_X', xp: 45200, isCurrentUser: false, badges: ['🚀', '🤖', '⭐'] },
  { id: 'u2', rank: 2, username: 'Sutskever_AI', xp: 41150, isCurrentUser: false, badges: ['🧠', '🔥'] },
  { id: 'u3', rank: 3, username: 'Hassabis_Net', xp: 38900, isCurrentUser: false, badges: ['♟️', '💎'] },
  { id: 'u4', rank: 4, username: 'Fei_Fei_Li', xp: 35200, isCurrentUser: false, badges: ['👁️'] },
  { id: 'u5', rank: 5, username: 'Karpathy_Vision', xp: 32100, isCurrentUser: false, badges: ['🚗'] },
  { id: 'u6', rank: 6, username: 'Ng_Deep', xp: 29800, isCurrentUser: false, badges: ['📚'] },
  { id: 'u7', rank: 7, username: 'LeCun_Energy', xp: 27500, isCurrentUser: false, badges: ['⚡'] },
  { id: 'u8', rank: 8, username: 'Hinton_Turing', xp: 25400, isCurrentUser: false, badges: ['🏆'] },
  { id: 'u9', rank: 9, username: 'Bengio_Reason', xp: 23100, isCurrentUser: false, badges: ['🎓'] },
  { id: 'u10', rank: 10, username: 'You', xp: 0, isCurrentUser: true, badges: ['🌱'] },
];

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);

  // Inventory
  const [unlockedThemes, setUnlockedThemes] = useState<LiraThemeId[]>(['lira-dark']);
  const [unlockedPersonas, setUnlockedPersonas] = useState<PersonaId[]>(['default']);
  const [activePersonaId, setActivePersonaId] = useState<PersonaId>('default');
  const backendUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

  // Helper to map DB response structure to Frontend UserStats
  const mapBackendToFrontend = (data: any): UserStats => {
    // data is { xp, coins, level, stats: { ... } }
    // frontend wants { currentXp, coins, level, ...stats }
    const innerStats = typeof data.stats === 'string' ? JSON.parse(data.stats) : (data.stats || {});
    return {
      ...INITIAL_STATS,
      ...innerStats,
      currentXp: data.xp ?? innerStats.currentXp ?? 0,
      coins: data.coins ?? innerStats.coins ?? 0,
      level: data.level ?? innerStats.level ?? 1,
    };
  };

  // Load from local storage
  useEffect(() => {
    const loadData = async () => {
      const currentUser = getCurrentUser();
      const userId = currentUser?.id;
      let isAlreadyAdmin = false;

      if (userId) {
        try {
          const r = await fetch(`${backendUrl}/api/gamification?userId=${encodeURIComponent(userId)}`, {
            headers: getAuthHeaders()
          });
          if (r.status === 401) {
            logout();
            return;
          }
          if (r.ok) {
            const data = await r.json();
            const mapped = mapBackendToFrontend(data);
            if (mapped.level >= 50) isAlreadyAdmin = true;
            
            setStats(mapped);
            setStats(mapped);
            
            // Only update/insert self in leaderboard if NOT admin
            if (mapped.level < 50) {
                setLeaderboard(prev => {
                    const exists = prev.some(u => u.isCurrentUser);
                    if (exists) {
                        return prev.map(u =>
                            u.isCurrentUser
                            ? { ...u, xp: mapped.currentXp, username: mapped.username }
                            : u
                        ).sort((a, b) => b.xp - a.xp).map((u, i) => ({ ...u, rank: i + 1 }));
                    } 
                    return prev;
                });
            } else {
                // Determine if we need to remove self from leaderboard (e.g. just leveled up to 50)
                setLeaderboard(prev => prev.filter(u => !u.isCurrentUser).map((u, i) => ({ ...u, rank: i + 1 })));
            }
            
            // Check for First Login quest completion (auto-complete if logged in)
            let questsToSet = Array.isArray(data?.quests) ? data.quests : INITIAL_QUESTS;
            const q1 = questsToSet.find((q: Quest) => q.id === 'q1');
            if (q1 && !q1.isCompleted) {
              questsToSet = questsToSet.map((q: Quest) => q.id === 'q1' ? { ...q, isCompleted: true } : q);
              // Trigger immediate save for this update
              setTimeout(() => {
                fetch(`${backendUrl}/api/gamification`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                  body: JSON.stringify({ userId, patch: { quests: questsToSet } })
                }).catch(() => { });
              }, 1000);
            }
            setQuests(questsToSet);

            if (Array.isArray(data?.unlockedThemes)) setUnlockedThemes(data.unlockedThemes);
            if (Array.isArray(data?.unlockedPersonas)) setUnlockedPersonas(data.unlockedPersonas);
            if (data?.activePersonaId) setActivePersonaId(data.activePersonaId as PersonaId);
            if (Array.isArray(data?.achievements)) setAchievements(data.achievements);


            // Recovery from local if server looks default and local has richer state
            try {
              const localStatsStr = localStorage.getItem('lira_stats');
              const localQuestsStr = localStorage.getItem('lira_quests');
              const localThemesStr = localStorage.getItem('lira_unlocked_themes');
              const localPersonasStr = localStorage.getItem('lira_unlocked_personas');
              const localActivePersona = localStorage.getItem('lira_active_persona');
              const ls = localStatsStr ? JSON.parse(localStatsStr) : null;
              const lq = localQuestsStr ? JSON.parse(localQuestsStr) : null;
              const lt = localThemesStr ? JSON.parse(localThemesStr) : null;
              const lp = localPersonasStr ? JSON.parse(localPersonasStr) : null;
              const ap = localActivePersona || null;
              const serverIsDefault = (data?.stats?.level || 1) === 1 && (data?.stats?.coins || 0) <= 100 && (data?.stats?.currentXp || 0) === 0;
              if (serverIsDefault && (ls || lq || lt || lp || ap)) {
                await fetch(`${backendUrl}/api/recovery/import`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                  body: JSON.stringify({ userId, stats: ls || data.stats, quests: lq || data.quests, unlockedThemes: lt || data.unlockedThemes, unlockedPersonas: lp || data.unlockedPersonas, activePersonaId: ap || data.activePersonaId })
                });
                // refetch
                const r2 = await fetch(`${backendUrl}/api/gamification?userId=${encodeURIComponent(userId)}`, {
                  headers: getAuthHeaders()
                });
                if (r2.ok) {
                  const data2 = await r2.json();
                  const mapped2 = mapBackendToFrontend(data2);
                  if (mapped2.level >= 50) isAlreadyAdmin = true;
                  setStats(mapped2);
                  setLeaderboard(prev => prev.map(u =>
                    u.isCurrentUser
                      ? { ...u, xp: mapped2.currentXp, username: mapped2.username }
                      : u
                  ).sort((a, b) => b.xp - a.xp).map((u, i) => ({ ...u, rank: i + 1 })));
                  if (Array.isArray(data2?.quests)) setQuests(data2.quests);
                  if (Array.isArray(data2?.unlockedThemes)) setUnlockedThemes(data2.unlockedThemes);
                  if (Array.isArray(data2?.unlockedPersonas)) setUnlockedPersonas(data2.unlockedPersonas);
                  if (data2?.activePersonaId) setActivePersonaId(data2.activePersonaId as PersonaId);
                }
              }
            } catch { } // End recovery try
          } // End if (r.ok)
        } catch { } // End main fetch try

      /* 
       * 🛑 DEBUG CODE REMOVED
       * Use proper DB-based admin roles instead of forcing client-side level 50.
       * This was causing infinite loops: loadData -> force level 50 -> useEffect -> loadData
       */
       
      /*
      // 👑 ADMIN FORCE UNLOCK (Runs for ALL logged in users, regardless of API status)
        const ALL_THEMES: LiraThemeId[] = ['lira-dark', 'lira-aurora', 'lira-ice', 'lira-nature', 'lira-desert', 'lira-halloween', 'lira-xmas', 'lira-carnival', 'lira-cyberleaf', 'lira-obsidian', 'lira-royal', 'lira-singularity'];
        
        setStats(prev => ({ 
          ...prev, 
          level: 50, 
          coins: 99999, 
          plan: 'pro' as const,
          bondLevel: 100,
          currentXp: Math.max(prev.currentXp || 0, 500000)
        }));

        setUnlockedThemes(ALL_THEMES);
        setUnlockedPersonas(ALL_PERSONAS.map(p => p.id));
        setAchievements(prev => {
           return INITIAL_ACHIEVEMENTS.map(def => {
              const existing = prev.find(p => p.id === def.id);
              return existing?.unlockedAt ? existing : { ...def, unlockedAt: Date.now() };
           });
        });
        setQuests(prev => prev.map(q => ({ ...q, isCompleted: true, isClaimed: true })));

        if (!isAlreadyAdmin) {
            addToast('👑 Admin Access Granted', 'success');
        }
      */

      } else {
        const savedStats = localStorage.getItem('lira_stats');
        if (savedStats) {
          const parsed = JSON.parse(savedStats);
          setStats(parsed);
          setLeaderboard(prev => prev.map(u =>
            u.isCurrentUser
              ? { ...u, xp: parsed.currentXp, username: parsed.username }
              : u
          ).sort((a, b) => b.xp - a.xp).map((u, i) => ({ ...u, rank: i + 1 })));
        }
        const savedQuests = localStorage.getItem('lira_quests');
        if (savedQuests) setQuests(JSON.parse(savedQuests));
        const savedThemes = localStorage.getItem('lira_unlocked_themes');
        if (savedThemes) setUnlockedThemes(JSON.parse(savedThemes));
        const savedPersonas = localStorage.getItem('lira_unlocked_personas');
        if (savedPersonas) setUnlockedPersonas(JSON.parse(savedPersonas));
        const savedActivePersona = localStorage.getItem('lira_active_persona');
        if (savedActivePersona) setActivePersonaId(savedActivePersona as PersonaId);
      }
    };

    loadData();
    window.addEventListener('user-updated', loadData);

    // Fetch Leaderboard
    fetch(`${backendUrl}/api/gamification/leaderboard`, { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
         if (Array.isArray(data)) {
             // Transform backend leaderboard to frontend structure
             const mappedLeaderboard: LeaderboardEntry[] = data.map((u: any, index: number) => ({
                 id: u.userId,
                 rank: index + 1,
                 username: u.username || 'Unknown',
                 xp: u.xp || 0,
                 isCurrentUser: u.userId === getCurrentUser()?.id,
                 badges: [] 
             }));
             
             // FINAL SAFETY: If I am level >= 50, I must NOT appear in this list
             // (Even if backend filtered, let's be sure purely on frontend too)
             if (stats.level >= 50) {
                setLeaderboard(mappedLeaderboard.filter(u => !u.isCurrentUser));
             } else {
                setLeaderboard(mappedLeaderboard);
             }
         }
      }).catch(err => console.error('Failed to load leaderboard', err));

    return () => window.removeEventListener('user-updated', loadData);
  }, [stats.level]); // Added dependency on stats.level to refresh if level changes

  // Save to local storage
  useEffect(() => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    if (userId) {
      (async () => {
        try {
          await fetch(`${backendUrl}/api/gamification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              userId,
              patch: {
                stats: { ...stats },
                quests,
                unlockedThemes,
                unlockedPersonas,
                activePersonaId,
                achievements // Now persisted
              }
            })
          });
        } catch { }
      })();
    } else {
      localStorage.setItem('lira_stats', JSON.stringify(stats));
      localStorage.setItem('lira_quests', JSON.stringify(quests));
      localStorage.setItem('lira_unlocked_themes', JSON.stringify(unlockedThemes));
      localStorage.setItem('lira_unlocked_personas', JSON.stringify(unlockedPersonas));
      localStorage.setItem('lira_active_persona', activePersonaId);
    }
  }, [stats, quests, unlockedThemes, unlockedPersonas, activePersonaId]);

  const setUsername = (name: string) => {
    setStats(prev => ({ ...prev, username: name }));
  };
  const setPlan = (plan: 'free' | 'pro') => {
    setStats(prev => ({ ...prev, plan }));
  };

  const addXp = (amount: number) => {
    const u = getCurrentUser();
    const userId = u?.id;
    if (userId) {
      fetch(`${backendUrl}/api/gamification/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId, xp: amount, messageInc: 1 })
      }).then(async r => {
        if (r.ok) {
          const data = await r.json();
          setStats(mapBackendToFrontend(data));
          if (Array.isArray(data?.quests)) setQuests(data.quests);
        } else {
          setStats(prev => ({ ...prev, currentXp: prev.currentXp + amount, totalMessages: prev.totalMessages + 1 }));
        }
      }).catch(() => {
        setStats(prev => ({ ...prev, currentXp: prev.currentXp + amount, totalMessages: prev.totalMessages + 1 }));
      });
    } else {
      setStats(prev => ({ ...prev, currentXp: prev.currentXp + amount, totalMessages: prev.totalMessages + 1 }));
    }
  };

  const addCoins = (amount: number) => {
    const u = getCurrentUser();
    const userId = u?.id;
    if (userId) {
      fetch(`${backendUrl}/api/gamification/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId, coins: amount })
      }).then(async r => {
        if (r.ok) {
          const data = await r.json();
          setStats(mapBackendToFrontend(data));
        } else {
          setStats(prev => ({ ...prev, coins: prev.coins + amount }));
        }
      }).catch(() => setStats(prev => ({ ...prev, coins: prev.coins + amount })));
    } else {
      setStats(prev => ({ ...prev, coins: prev.coins + amount }));
    }
  };

  const increaseBond = (amount: number) => {
    const u = getCurrentUser();
    const userId = u?.id;
    if (userId) {
      fetch(`${backendUrl}/api/gamification/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId, bond: amount })
      }).then(async r => {
        if (r.ok) {
          const data = await r.json();
          setStats(mapBackendToFrontend(data));
        } else {
          setStats(prev => ({ ...prev, bondLevel: Math.min(100, prev.bondLevel + amount) }));
        }
      }).catch(() => setStats(prev => ({ ...prev, bondLevel: Math.min(100, prev.bondLevel + amount) })));
    } else {
      setStats(prev => ({ ...prev, bondLevel: Math.min(100, prev.bondLevel + amount) }));
    }
  };

  const completeQuest = (questId: string) => {
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, isCompleted: true } : q));
  };

  const claimReward = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (quest && quest.isCompleted && !quest.isClaimed) {
      setQuests(prev => prev.map(q => q.id === questId ? { ...q, isClaimed: true } : q));
      const u = getCurrentUser();
      const userId = u?.id;
      if (userId) {
        fetch(`${backendUrl}/api/gamification/award`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ userId, xp: quest.xpReward, coins: quest.coinReward, claimedQuestId: questId })
        }).then(async r => {
          if (r.ok) {
            const data = await r.json();
            setStats(mapBackendToFrontend(data));
            if (Array.isArray(data?.quests)) setQuests(data.quests);
          }
        }).catch(() => {
          setStats(prev => ({ ...prev, currentXp: prev.currentXp + quest.xpReward, coins: prev.coins + quest.coinReward }));
        });
      } else {
        setStats(prev => ({ ...prev, currentXp: prev.currentXp + quest.xpReward, coins: prev.coins + quest.coinReward }));
      }
    }
  };

  const buyTheme = (themeId: LiraThemeId, cost: number): boolean => {
    if (stats.coins >= cost && !unlockedThemes.includes(themeId)) {
      setStats(prev => ({ ...prev, coins: prev.coins - cost }));
      setUnlockedThemes(prev => {
        const next = [...prev, themeId];
        checkAchievement('change_theme'); // First theme buy
        if (next.length >= 3) checkAchievement('unlock_theme', next.length);
        if (next.length >= 10) checkAchievement('unlock_all_themes'); // approximate
        return next;
      });
      return true;
    }
    return false;
  };

  const buyPersona = (personaId: PersonaId, cost: number): boolean => {
    if (stats.coins >= cost && !unlockedPersonas.includes(personaId)) {
      setStats(prev => ({ ...prev, coins: prev.coins - cost }));
      setUnlockedPersonas(prev => {
        const next = [...prev, personaId];
        checkAchievement('unlock_persona', next.length);
        if (next.length === ALL_PERSONAS.length) checkAchievement('unlock_all_personas');
        return next;
      });
      return true;
    }
    return false;
  };

  const getRankTitle = (level: number) => {
    if (level >= 50) return 'Architect';
    if (level >= 20) return 'SysAdmin';
    if (level >= 10) return 'Netrunner';
    if (level >= 5) return 'Operator';
    return 'User';
  };
  const rankTitle = getRankTitle(stats.level);

  // Merge static personas with lock state based on user inventory
  const personas = ALL_PERSONAS.map(p => ({
    ...p,
    isLocked: !unlockedPersonas.includes(p.id)
  }));

  // Track previous achievements to detect unlocks
  const prevAchievementsRef = React.useRef<Achievement[]>(achievements);
  const isInitialLoadRef = React.useRef(true);

  useEffect(() => {
    // Skip notifications on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevAchievementsRef.current = achievements;
      return;
    }

    const prev = prevAchievementsRef.current;
    
    // Safety check: if we just loaded massive unlocks, do not notify all of them
    if (Date.now() - (achievements[0]?.unlockedAt || 0) < 2000 && achievements.filter(a => a.unlockedAt).length > 5) {
       // Silent load
       prevAchievementsRef.current = achievements;
       return;
    }

    achievements.forEach(ach => {
      const old = prev.find(p => p.id === ach.id);
      // ONLY notify if it's a fresh unlock (happened < 5s ago) AND didn't exist before
      if (ach.unlockedAt && (!old || !old.unlockedAt) && (ach.unlockedAt > Date.now() - 5000)) {
        // Just unlocked!
        addXp(ach.xpReward);
        
        const rarityEmojis: Record<string, string> = {
          common: '🔵',
          uncommon: '🟢',
          rare: '🟣',
          epic: '🟠',
          legendary: '🟡',
          galactic: '⭐',
          cosmic: '🌌'
        };
        const emoji = rarityEmojis[ach.rarity] || '🏆';
        addToast(`${emoji} Achievement Unlocked: ${ach.title}`, 'success');
      }
    });
    prevAchievementsRef.current = achievements;
  }, [achievements, addToast]); 

  const checkAchievement = (actionType: string, value?: any) => {
    setAchievements(prev => {
      const updates = prev.map(a => ({ ...a })); // shallow copy
      let hasUpdates = false;
      const now = Date.now();

      const unlock = (id: string) => {
        const idx = updates.findIndex(a => a.id === id);
        if (idx !== -1 && !updates[idx].unlockedAt) {
          updates[idx].unlockedAt = now;
          hasUpdates = true;
        }
      };

      // Achievement Logic
      switch (actionType) {
        case 'first_message': unlock('c1'); break;
        case 'ask_question': if (stats.totalMessages >= 10) unlock('c2'); break;
        case 'night_owl': unlock('c3'); break;
        case 'early_bird': unlock('c4'); break;
        case 'change_theme': unlock('c5'); break;
        case 'voice_used': unlock('c6'); break;
        case 'image_upload': unlock('c7'); break;
        case 'code_snippet': unlock('c8'); break;
        case 'save_memory': unlock('c9'); break;
        case 'open_settings': unlock('c10'); break;

        case 'streak_3': unlock('u1'); break;
        case 'msg_100': unlock('u2'); break;
        case 'translate': unlock('u3'); break;
        case 'edit_msg': unlock('u4'); break;
        case 'regenerate': unlock('u5'); break;
        case 'coins_500': unlock('u6'); break;
        case 'unlock_persona': if (value >= 3) unlock('u7'); break;
        case 'unlock_theme': if (value >= 3) unlock('u8'); break;
        case 'feedback': unlock('u9'); break;
        case 'deep_mode_10': unlock('u10'); break;

        case 'streak_7': unlock('r1'); break;
        case 'msg_500': unlock('r2'); break;
        case 'image_50': unlock('r3'); break;
        case 'code_50': unlock('r4'); break;
        // r5 supporter time check
        case 'coins_2000': unlock('r6'); break;
        case 'unlock_all_personas': unlock('r7'); break;
        case 'unlock_all_themes': unlock('r8'); break;
        case 'pro_sub': unlock('r9'); break;
        case 'return_3d': unlock('r10'); break;

        case 'streak_30': unlock('e1'); break;
        case 'msg_2000': unlock('e2'); break;
        case 'level_20': unlock('e3'); break;
        case 'coins_10000': unlock('e4'); break;
        case 'bond_100': unlock('e5'); break;
        case 'ghost_mode': unlock('e6'); break;
        case 'cancel_gen_10': unlock('e7'); break;
        case 'polymath': unlock('e8'); break;
        // e9 loyal patron time
        case 'shift_topic': unlock('e10'); break;

        case 'streak_365': unlock('l1'); break;
        case 'level_50': unlock('l2'); break;
        case 'msg_10000': unlock('l3'); break;
        case 'all_daily_month': unlock('l4'); break;
        case 'max_stats': unlock('l5'); break;

        // Galactic
        case 'bug_hunter': unlock('g1'); break;
        case 'beta_tester': unlock('g2'); break;
        case 'egg_hunter': unlock('g3'); break;
        case 'gacha_hunter': unlock('g4'); break;
        case 'influencer': unlock('g5'); break;

        // Easter Eggs
        case 'barrel_roll': unlock('egg1'); break;
        case 'matrix_mode': unlock('egg2'); break;
        case 'god_mode': unlock('egg3'); break;
      }

      // Check Egg Hunter (All eggs unlocked)
      const eggs = ['egg1', 'egg2', 'egg3'];
      if (eggs.every(e => updates.find(u => u.id === e)?.unlockedAt)) {
        unlock('g3');
      }

      // Check Cosmic (All unlocked except itself)
      const allExceptCosmic = updates.filter(u => u.rarity !== 'cosmic');
      if (allExceptCosmic.every(u => u.unlockedAt)) {
        unlock('z1');
      }

      return hasUpdates ? updates : prev;
    });
  };

  return (
    <GamificationContext.Provider value={{
      stats,
      rankTitle,
      quests,
      achievements,
      leaderboard,
      unlockedThemes,
      unlockedPersonas,
      personas,
      activePersonaId,
      setUsername,
      setActivePersonaId,
      addXp,
      addCoins,
      increaseBond,
      completeQuest,
      claimReward,
      buyTheme,
      buyPersona,
      setPlan,
      checkAchievement
    }}>
      {children}
    </GamificationContext.Provider>
  );
};
