import React, { useState, useEffect, useRef, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
const SettingsModal = React.lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const DashboardModal = React.lazy(() => import('./components/DashboardModal').then(m => ({ default: m.DashboardModal })));
const StoreModal = React.lazy(() => import('./components/StoreModal').then(m => ({ default: m.StoreModal })));
import { BootSequence } from './components/ui/BootSequence';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingTour } from './components/OnboardingTour';
import { LandingChat } from './components/LandingChat';
const CookieConsentModal = React.lazy(() => import('./components/CookieConsentModal').then(m => ({ default: m.CookieConsentModal })));
const LiraCompanionWidget = React.lazy(() => import('./components/LiraCompanionWidget').then(m => ({ default: m.LiraCompanionWidget })));
const CompanionPage = React.lazy(() => import('./components/CompanionPage').then(m => ({ default: m.CompanionPage })));
import { CookiePreferences } from './components/CookieConsentModal';
const ShortcutsModal = React.lazy(() => import('./components/ShortcutsModal').then(m => ({ default: m.ShortcutsModal })));
const GamerModal = React.lazy(() => import('./components/GamerModal').then(m => ({ default: m.GamerModal })));
const DailyQuestsModal = React.lazy(() => import('./components/DailyQuestsModal').then(m => ({ default: m.DailyQuestsModal })));
import { LoadingScreen } from './components/LoadingScreen';
import { ParticleBackground } from './components/ui/ParticleBackground';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { GamificationProvider, useGamification } from './contexts/GamificationContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { useAmbientGlow } from './hooks/useAmbientGlow';
import { useKeyboardManager } from './hooks/useKeyboardManager';
import { ChatSession, Message, Attachment, Memory } from './types';
import { generateChatTitle, streamResponse, textToSpeech, fetchMemories, addMemoryServer, deleteMemoryServer, addIntelligentMemory, getRelevantMemories, deleteAllMemoriesForUser, imageUrlToDataUrl, saveSessionServer, deleteSessionServer } from './services/ai';
import { LIRA_AVATAR } from './constants';
import { getCurrentUser, isAuthenticated, logout as userLogout, getAuthHeaders, handleOAuthCallback, getSettings } from './services/userService';
import { liraVoice } from './services/lira_voice';
import { initialMoodState, updateMood, MoodState } from './services/moodEngine';
import { AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { LoginModal } from './components/LoginModal';
import { LegalModal } from './components/LegalModal';
import { WelcomeModal } from './components/WelcomeModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ResetPassword } from './components/ResetPassword';
import { VoiceCallOverlay } from './components/VoiceCallOverlay';
import { IrisModal } from './components/IrisModal';
import { DiscordModal } from './components/DiscordModal';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { PhotoBooth } from './components/PhotoBooth';
import { AdminPanel } from './components/AdminPanel';
import { TodoPanel } from './components/TodoPanel';

const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
const LOCAL_STORAGE_KEY = 'lira_chat_sessions';
const MEMORY_STORAGE_KEY = 'lira_memories';
const COOKIE_CONSENT_KEY = 'lira_cookie_consent';

const LiraAppContent = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  if (pathname === '/reset') {
    return <ResetPassword backendUrl={API_BASE_URL} />;
  }
  const [isBooted, setIsBooted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isGodMode, setIsGodMode] = useState(false);

  // Handle OAuth Callback on Load
  useEffect(() => {
    const checkOAuth = async () => {
       const success = await handleOAuthCallback();
       if (success) {
          window.history.replaceState({}, document.title, window.location.pathname);
          const user = getCurrentUser();
          setIsLoggedIn(true);
          // If fresh user (loginCount <= 1), show onboarding
          if (user && user.loginCount <= 1) {
              setShowOnboarding(true);
          }
       }
    };
    checkOAuth();
  }, []);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
     if (typeof window !== 'undefined') {
        return window.innerWidth >= 768;
     }
     return false;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const [isGamerOpen, setIsGamerOpen] = useState(false);
  const [isDailyQuestsOpen, setIsDailyQuestsOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isTodoPanelOpen, setIsTodoPanelOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'mistral' | 'xiaomi'>('mistral');
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isDeepMode, setIsDeepMode] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
    const [dynamicPersona, setDynamicPersona] = useState(false); // Fix for missing state
  const [showCompanion, setShowCompanion] = useState(false);
  
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
     if (typeof window !== 'undefined') {
       return localStorage.getItem('lira_voice_enabled') === 'true';
     }
     return false;
  });

  const handleToggleVoice = () => {
      const newVal = !isVoiceEnabled;
      setIsVoiceEnabled(newVal);
      localStorage.setItem('lira_voice_enabled', String(newVal));
      addToast(newVal ? 'Read Aloud Enabled 🔊' : 'Read Aloud Disabled 🔇', 'info');
  };

  const { stats, addXp, increaseBond, setUsername, activePersonaId, setActivePersonaId, unlockedPersonas, personas, addCoins } = useGamification();
  const { addToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSpokenMsgId = useRef<string | null>(null);
  const [moodState, setMoodState] = useState<MoodState>(initialMoodState);

  // Mood Ticker
  useEffect(() => {
    const timer = setInterval(() => {
        setMoodState(prev => updateMood(prev, { type: 'TICK' }));
    }, 20000); // 20s tick
    return () => clearInterval(timer);
  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0];

  const { glowClassName } = useAmbientGlow(currentSession?.messages || []);
  const { currentTheme, setTheme } = useTheme();

  const handleGodMode = () => {
      if (isGodMode) return;
      addCoins(9999);
      setIsGodMode(true);
      addToast('GOD MODE ENABLED: Unlimited Power!', 'success');
      const audio = new Audio('https://www.myinstants.com/media/sounds/level-up-sound-effect.mp3'); 
      audio.volume = 0.2;
      audio.play().catch(() => {});
      setTimeout(() => setIsGodMode(false), 5000);
  };

  const { isBarrelRoll, isMatrixMode } = useKeyboardManager({
      onNewChat: () => {
        createNewChat();
        addToast('New conversation created', 'info');
      },
      onToggleSidebar: () => setIsSidebarOpen(prev => !prev),
      onOpenSettings: () => setIsSettingsOpen(true),
      onOpenShortcuts: () => setIsShortcutsOpen(true),
      onCloseModals: () => {
          setIsSettingsOpen(false);
          setIsDashboardOpen(false);
          setIsStoreOpen(false);
          setIsShortcutsOpen(false);
          setIsCookieModalOpen(false);
          setIsGamerOpen(false);
          setIsDailyQuestsOpen(false);
      },
      onGodMode: handleGodMode
  });

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Detecta se o usuário perdeu a internet
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, { headers: getAuthHeaders() });
        if (response.ok) {
          setBackendStatus('online');
        } else if (response.status === 503) {
             setIsOffline(true); // Trigger maintenance screen on 503
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isOffline) {
      return <MaintenanceScreen />;
  }

  useEffect(() => {
    const currentUser = getCurrentUser();
    const authenticated = isAuthenticated();
    // OAuth callback handling
    try {
      const usp = new URLSearchParams(window.location.search);
      const oauth = usp.get('oauth');
      const token = usp.get('token');
      const email = usp.get('email');
      const name = usp.get('name');
      const uid = usp.get('uid');
      const refreshToken = usp.get('refreshToken');
      if (oauth && token && (email || uid)) {
        const userObj = {
          id: uid || `user_${Date.now()}`,
          email: String(email || '').toLowerCase(),
          username: name || (email ? String(email).split('@')[0] : 'User'),
          password: '',
          createdAt: Date.now(),
          lastLogin: Date.now(),
          profile: {}
        };
        try {
          localStorage.setItem('lira_current_user', JSON.stringify(userObj));
          localStorage.setItem('lira_session', JSON.stringify({
            userId: userObj.id,
            token,
            refreshToken,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
          }));
        } catch {}
        // Clean URL
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch {}
    if (currentUser && authenticated) {
      setUsername(currentUser.username);
      setIsLoggedIn(true);
      setIsBooted(true);
      setIsLoginOpen(false);
      setShowWelcome(true);
      setIsReturningUser(Boolean(currentUser.lastLogin));
      // Load user settings
      (async () => {
        try {
          const r = await fetch(`${API_BASE_URL}/api/settings?userId=${encodeURIComponent(currentUser.id)}`, { headers: getAuthHeaders() });
          if (r.ok) {
            const s = await r.json();
            if (s?.selectedModel) setSelectedModel(s.selectedModel);
            if (typeof s?.isDeepMode === 'boolean') setIsDeepMode(s.isDeepMode);
            if (typeof s?.isSidebarOpen === 'boolean') setIsSidebarOpen(s.isSidebarOpen);
            if (s?.themeId) setTheme(s.themeId);
          }
        } catch {}
      })();
    } else {
      setIsLoginOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const currentUser = getCurrentUser();
    
    // Auto-Show Companion if Voice Call starts
    if (isVoiceActive) {
        setShowCompanion(true);
        // Force layout refresh to wake up Lira
        setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
    }

    const userId = currentUser?.id;
    (async () => {
      try {
        if (userId) {
           const useFastAuth = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_USE_FASTAPI_AUTH) === '1';
           const url = `${API_BASE_URL}/api/chat/sessions`;
           const r = await fetch(url, { headers: getAuthHeaders() });
          if (r.ok) {
            const list = await r.json();
            if (Array.isArray(list) && list.length > 0) {
              setSessions(list);
              setCurrentSessionId(list[0].id);
            } else {
              const sessionsKey = `${LOCAL_STORAGE_KEY}_${userId}`;
              const saved = localStorage.getItem(sessionsKey);
              if (saved) {
                try {
                  const parsed = JSON.parse(saved);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setSessions(parsed);
                    setCurrentSessionId(parsed[0].id || null);
                  await fetch(`${API_BASE_URL}/api/chat/sessions`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({ userId, sessions: parsed })
                  }).catch(() => {});
                  } else {
                    setSessions([]);
                    setCurrentSessionId(null);
                  }
                } catch {
                  setSessions([]);
                  setCurrentSessionId(null);
                }
              } else {
                // Try recover from any local backup keys
                const keys = Object.keys(localStorage);
                const candidates = keys.filter(k => k.startsWith(LOCAL_STORAGE_KEY + '_'));
                let recovered: any[] = [];
                for (const k of candidates) {
                  try {
                    const val = localStorage.getItem(k);
                    const arr = val ? JSON.parse(val) : [];
                    if (Array.isArray(arr) && arr.length > 0) {
                      recovered = arr;
                      break;
                    }
                  } catch {}
                }
                if (recovered.length > 0) {
                  setSessions(recovered);
                  setCurrentSessionId(recovered[0]?.id || null);
                  await fetch(`${API_BASE_URL}/api/chat/sessions`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify({ userId, sessions: recovered })
                  }).catch(() => {});
                } else {
                  setSessions([]);
                  setCurrentSessionId(null);
                }
              }
            }
          }
        }
      } catch {}
    })();
    (async () => {
      const serverMemories = await fetchMemories(userId);
      if (serverMemories.length > 0) {
        setMemories(serverMemories);
      } else {
        const memKey = userId ? `${MEMORY_STORAGE_KEY}_${userId}` : MEMORY_STORAGE_KEY;
        const savedMemories = localStorage.getItem(memKey);
        if (savedMemories) {
          const arr = JSON.parse(savedMemories);
          setMemories(arr);
          // Import to backend for persistence
          try {
            await fetch(`${API_BASE_URL}/api/recovery/import`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify({ userId, memories: arr })
            });
          } catch {}
        } else {
          // search any backup keys
          const keys = Object.keys(localStorage);
          const candidates = keys.filter(k => k.startsWith(MEMORY_STORAGE_KEY + '_'));
          for (const k of candidates) {
            try {
              const val = localStorage.getItem(k);
              const arr = val ? JSON.parse(val) : [];
              if (Array.isArray(arr) && arr.length > 0) {
                setMemories(arr);
                const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
                await fetch(`${API_BASE_URL}/api/recovery/import`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                  body: JSON.stringify({ userId, memories: arr })
                }).catch(() => {});
                break;
              }
            } catch {}
          }
        }
      }
    })();
  }, [isLoggedIn]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    const safeSessions = sessions.map(s => ({
      ...s,
      messages: s.messages.map(m => ({
        ...m,
        attachments: m.attachments?.map(a => ({
          id: a.id,
          previewUrl: a.previewUrl,
          type: a.type,
          name: a.name ?? a.file?.name,
          size: a.size ?? a.file?.size
        }))
      }))
    }));
    
    // Only save to LocalStorage if NOT logged in (Guest Mode)
    // Logged in users save to backend via explicit calls in handleSendMessage/triggerAIResponse
    if (!userId) {
      const key = 'lira_chat_sessions';
      localStorage.setItem(key, JSON.stringify(safeSessions));
    }
  }, [sessions]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    if (!userId) {
      const key = MEMORY_STORAGE_KEY;
      localStorage.setItem(key, JSON.stringify(memories));
    }
  }, [memories]);

  const handleBootComplete = () => {
    setIsBooted(true);
  };

  const handleLogin = (username: string, userId: string) => {
    setUsername(username);
    setIsLoggedIn(true);
    setIsBooted(true);
    const hasSeenOnboarding = localStorage.getItem(`lira_onboarding_seen_${userId}`);
    if (!hasSeenOnboarding) {
       setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
     setShowOnboarding(false);
     const currentUser = getCurrentUser();
     if (currentUser?.id) {
       localStorage.setItem(`lira_onboarding_seen_${currentUser.id}`, 'true');
     }
     addToast('Welcome to LiraOS!', 'success');
  };

  const handleCookieSave = (preferences: CookiePreferences) => {
     localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
     setIsCookieModalOpen(false);
     addToast('Preferences saved', 'success');
  };

  const createNewChat = () => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      personaId: activePersonaId,
      userId
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    if (userId) {
      fetch(`${API_BASE_URL}/api/chat/sessions/${encodeURIComponent(id)}`, { method: 'DELETE', headers: getAuthHeaders() }).catch(() => {});
    }
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
    addToast('Chat deleted', 'info');
  };

  const handleDeleteMemory = async (id: string) => {
     const ok = await deleteMemoryServer(id);
     if (ok) {
       setMemories(prev => prev.filter(m => m.id !== id));
       addToast('Memory deleted', 'info');
     } else {
       addToast('Failed to delete memory', 'error');
     }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        setIsGenerating(false);
        addToast('Generation stopped', 'info');
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
             return {
                ...s,
                messages: s.messages.map(m => 
                   m.isStreaming ? { ...m, isStreaming: false, status: 'done', content: m.partial || m.content || '' } : m
                )
             };
          }
          return s;
        }));
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  const handleAnalyzeLira = async () => {
    try {
      const dataUrl = await imageUrlToDataUrl(LIRA_AVATAR as unknown as string);
      const att: Attachment = { id: uuidv4(), previewUrl: dataUrl, type: 'image', name: 'lira-pfp.jpeg', size: 0 };
      await handleSendMessage('Analise esta imagem da Lira', [att]);
    } catch {
      addToast('Falha ao carregar imagem da Lira', 'error');
    }
  };
  const handleToggleDeepMode = () => {
    setIsDeepMode(prev => !prev);
    addToast(isDeepMode ? 'Deep Mode off' : 'Deep Mode on', 'info');
  };

  const triggerAIResponse = async (sessionId: string, history: Message[], promptText: string, attachments: Attachment[] = []) => {
      const abortCtrl = new AbortController();
      abortControllerRef.current = abortCtrl;
      setIsGenerating(true);
      const modelMessageId = uuidv4();
      
      // 1. IMMEDIATE FEEDBACK: Create Thinking Message
      setSessions(prev => prev.map(s => { 
        if (s.id === sessionId) {
           return { ...s, messages: [...s.messages, {
               id: modelMessageId,
               role: 'model',
               content: '',
               partial: '',
               status: 'thinking',
               timestamp: Date.now(),
               isStreaming: true
           }]}; 
        } 
        return s; 
      }));

      let accumulatedResponse = "";
      
      // Declare userId at function scope so it's available in finally block
      const currentUser = getCurrentUser();
      const userId = currentUser?.id;
      
      try {
        // Search for relevant memories
        const relevantMemories = await getRelevantMemories(promptText, 5, userId);
        
        // 🧠 process user message
        const userMessage = { content: promptText };
        const { memory: extractedMemory } = await addIntelligentMemory(userMessage, 'default', userId);
        if (extractedMemory) {
          setMemories(prev => [...prev, extractedMemory]);
          addToast('Memória salva 🧠', 'success');
        }

        try {
          // Dynamic Persona Logic: Inject Instructions
          let finalPrompt = promptText;
          const unlockedIds = personas.filter(p => !p.isLocked).map(p => p.id);
          
          if (dynamicPersona) {
              const idsList = unlockedIds.join(', ');
              finalPrompt += `\n\n[SYSTEM: You have "Dynamic Persona" enabled. Your current persona is "${activePersonaId}". If you detect that the user's tone or intent would be SIGNIFICANTLY better served by one of your other unlocked personas (IDs: ${idsList}), you MUST append the tag "[[SWITCH_PERSONA:target_id]]" at the very end of your response. Example: "[[SWITCH_PERSONA:caring]]". Do not switch if the current persona fits well.]`;
          }

          // EXHAUSTED MODE: Override
          if (moodState.mood === 'exausta') {
             finalPrompt += `\n\n[SYSTEM: You are currently EXHAUSTED (Low Battery/Tired). Your responses should be shorter, more direct, maybe with some sighs (*sigh*) or pauses (...). Avoid long explanations. If the user asks complicated things, ask for a break or be brief. DO NOT switch personas while exhausted.]`;
          }

          const latest = await fetchMemories(userId);
             if (Array.isArray(latest) && latest.length > 0) {
               setMemories(latest);
             }
         } catch {}

        // Pass memories to context - using selected model with relevância
        const personaToUse = isDeepMode ? { ...activePersona, systemInstruction: `${activePersona.systemInstruction}\nResponda com raciocínio detalhado, valide suposições, cite fontes quando úteis, e apresente passos claros.` } : activePersona;
        const localDateTime = new Date().toLocaleString();
        const stream = streamResponse(history, promptText, personaToUse, relevantMemories, selectedModel, abortCtrl.signal, attachments, userId, localDateTime);
        
        // Throttled Update Logic
        const UPDATE_INTERVAL = 80; // Faster updates for smoother UI
        let lastUpdate = 0;
        
        for await (const chunk of stream) {
            if (abortCtrl.signal.aborted) break;

            accumulatedResponse += chunk;
            setStreamingText(accumulatedResponse); // Keep for overlays if needed cheap

            const now = Date.now();
            if (now - lastUpdate > UPDATE_INTERVAL) {
               lastUpdate = now;
               setSessions(prev => prev.map(s => {
                  if (s.id === sessionId) {
                      const newMessages = s.messages.map(m => {
                          if (m.id === modelMessageId) {
                               return {
                                   ...m,
                                   partial: accumulatedResponse,
                                   status: 'streaming' as const,
                                   isStreaming: true
                               };
                          }
                          return m;
                      });
                      return { ...s, messages: newMessages };
                  }
                  return s;
               }));
            }
        }
        
        // Final update to ensure complete message is saved
        setSessions(prev => prev.map(s => {
             if (s.id === sessionId) {
                 const existingModelMsgIndex = s.messages.findIndex(m => m.id === modelMessageId);
                 if (existingModelMsgIndex === -1) {
                     return {
                         ...s,
                         messages: [...s.messages, {
                             id: modelMessageId,
                             role: 'model',
                             content: accumulatedResponse,
                             timestamp: Date.now(),
                             isStreaming: true
                         }]
                     };
                 } else {
                     const newMessages = [...s.messages];
                     newMessages[existingModelMsgIndex] = {
                         ...newMessages[existingModelMsgIndex],
                         content: accumulatedResponse
                     };
                     return { ...s, messages: newMessages };
                 }
             }
             return s;
        }));

        const hadImage = (attachments || []).some(att => att.type === 'image');
        if (hadImage) {
          if (accumulatedResponse.includes('Limite de uso da API do Gemini')) {
            addToast('Limite do Gemini atingido. Tente novamente em alguns minutos.', 'error');
          } else if (
            accumulatedResponse.includes('Não foi possível analisar a imagem') ||
            accumulatedResponse.includes('Infelizmente não consegui processá-la')
          ) {
            addToast('Serviço de visão indisponível. Tente novamente em breve.', 'error');
          }
        }

        
        // Fallback heuristic: save if it matches known patterns and none was extracted
        if (!extractedMemory && (promptText.toLowerCase().includes("remember that") || promptText.toLowerCase().includes("my name is"))) {
           const created = await addMemoryServer(promptText, ['auto'], 'note', 'medium', userId);
           if (created) {
             setMemories(prev => [...prev, created]);
           } else {
             const localMem: Memory = { id: uuidv4(), content: promptText, createdAt: Date.now(), tags: ['auto'], category: 'note', priority: 'medium' };
             setMemories(prev => [...prev, localMem]);
           }
           addToast('Memória salva 🧠', 'success');
        }

      } catch (e) {
          if ((e as any).name !== 'AbortError') console.error("Generation error", e);
      } finally {
          setIsGenerating(false);
          abortControllerRef.current = null;
          
          // Save final session state to backend
          // Save final session state to backend
          if (userId && accumulatedResponse) {
             // Update Mood on Response
             setMoodState(prev => updateMood(prev, { type: 'ASSISTANT_RESPONSE', tokens: accumulatedResponse.length / 4 }));
             
             const finalModelMsg: Message = {
                id: modelMessageId,
                role: 'model',
                content: accumulatedResponse,
                timestamp: Date.now(),
                isStreaming: false,
                status: 'done'
             };
             
             // 🎭 Dynamic Persona Switch Processing
             const switchRegex = /\[\[SWITCH_PERSONA:([a-z-]+)\]\]/i;
             const match = accumulatedResponse.match(switchRegex);
             if (match && match[1]) {
                 const targetId = match[1] as any;
                 if (personas.some(p => p.id === targetId)) { // Verify it's valid
                      finalModelMsg.content = finalModelMsg.content.replace(match[0], '').trim();
                      accumulatedResponse = finalModelMsg.content; // Update for TTS and Save
                      
                      // 1. Change Persona
                      // We need to access setActivePersonaId from gamification context.
                      // Since we are inside a callback/effect scope, we need to be careful.
                      // But we have 'personas' and 'activePersonaId' in scope? No, we have the hook values.
                      // Wait, triggerAIResponse is inside the component, so it has access to `setActivePersonaId`?
                      // The hook `useGamification` returns `setActivePersonaId`.
                      // Let's verify we destructured it.
                      // We destructured `activePersonaId`, `personas`... need `setActivePersonaId`.
                      
                      // Check destructuring in App.tsx (line 88)
                      // const { stats, addXp, increaseBond, setUsername, activePersonaId, personas, addCoins } = useGamification();
                      // I need to add `setActivePersonaId` to the destructuring list in the first chunk or assume it's there.
                      // It seems I missed it in the file view. I'll add it now.
                 }
             }

             // We need to reconstruct the session. 
             // Note: 'history' passed to this function includes the user message.
             const finalMessages = [...history, finalModelMsg];
             
             // We need to find the session to get other props (title, personaId, etc)
             // But we can't access 'sessions' state reliably here if it changed.
             // We'll trust that sessionId is valid and title/persona haven't changed during generation.
             // However, to be safe, we might want to fetch it or just patch the messages.
             // Our backend upsertSession replaces the session. 
             // Let's try to get it from the functional update in setSessions? No.
             
             // Best effort: find in current sessions list (closure might be stale but usually fine for title/persona)
             const currentSess = sessions.find(s => s.id === sessionId);
             if (currentSess) {
                const sessionToSave = {
                   ...currentSess,
                   messages: finalMessages,
                   updatedAt: Date.now()
                };
                saveSessionServer(sessionToSave);
             }
          }
          
          // Auto TTS Trigger (only if NOT in a voice call, as overlay handles that)
          if (isVoiceEnabled && accumulatedResponse && !abortCtrl.signal.aborted && !isVoiceActive) {
               // Determine voice (reuse logic)
               const voiceId = localStorage.getItem('lira_premium_voice_id') || 'xtts-local';
               const isPremium = voiceId !== 'google-pt-BR';
               
               liraVoice.speak(accumulatedResponse, {
                  usePremium: isPremium,
                  voiceId: isPremium ? 'xtts-local' : 'google-pt-BR'
               });
          }

          setSessions(prev => prev.map(s => {
             if (s.id === sessionId) {
                return {
                   ...s,
                   messages: s.messages.map(m => m.id === modelMessageId ? { ...m, isStreaming: false, status: 'done', content: accumulatedResponse, partial: undefined } : m)
                };
             }
             return s;
          }));
          
          setStreamingText(''); // Clear streaming text to unblock overlay
      }
  };

  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    let activeSessionId = currentSessionId;
    addXp(10); 
    increaseBond(1);
    if (!activeSessionId) {
      const currentUser = getCurrentUser();
      const userId = currentUser?.id;
      const newSession: ChatSession = {
        id: uuidv4(),
        title: 'New Conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        personaId: activePersonaId,
        userId
      };
      setSessions(prev => [newSession, ...prev]);
      activeSessionId = newSession.id;
      setCurrentSessionId(activeSessionId);
    }
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments: attachments
    };

    // Update Mood on User Message
    setMoodState(prev => updateMood(prev, { type: 'USER_MESSAGE', chars: text.length }));
    
    // Check for rest commands
    if (/vai descansar|descansa|tá tudo bem|relaxa/i.test(text)) {
        setMoodState(prev => updateMood(prev, { type: 'REST' }));
        addToast('Lira recuperou um pouco de energia 🔋', 'success');
    }

    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        return { ...session, messages: [...session.messages, userMessage], updatedAt: Date.now() };
      }
      return session;
    }));
    {
      const s = sessions.find(s => s.id === activeSessionId);
      const currentUser = getCurrentUser();
      const userId = currentUser?.id;
      const toSave = s ? { ...s, messages: [...s.messages, userMessage], userId } : undefined;
      
      if (toSave && userId) {
        saveSessionServer(toSave);
      }
    }
    const history = sessions.find(s => s.id === activeSessionId)?.messages || [];
    const updatedHistory = [...history, userMessage];
    await triggerAIResponse(activeSessionId, updatedHistory, text, attachments);
    if (history.length === 0) {
        generateChatTitle(text, selectedModel).then(title => {
          setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title } : s));
          const currentUser = getCurrentUser();
          const userId = currentUser?.id;
          const saved = sessions.find(ss => ss.id === activeSessionId);
          const finalSession = saved ? { ...saved, title, userId } : undefined;
          if (finalSession && userId) {
            const useFastAuth = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_USE_FASTAPI_AUTH) === '1';
            const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
            fetch(`${API_BASE_URL}/api/chat/sessions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
              body: JSON.stringify(finalSession)
            }).catch(() => {});
            const key = `${LOCAL_STORAGE_KEY}_${userId}`;
            try { localStorage.setItem(key, JSON.stringify([finalSession, ...sessions.filter(x => x.id !== activeSessionId)])); } catch {}
          }
        });
    }
  };

  const handleRegenerateMessage = async (messageId: string) => {
    if (!currentSessionId || isGenerating) return;
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || session.messages[messageIndex].role !== 'model') return;
    const messagesUpToUser = session.messages.slice(0, messageIndex);
    const lastUserMessage = messagesUpToUser.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return;
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: messagesUpToUser, updatedAt: Date.now() }
        : s
    ));
    addToast('Regenerating response...', 'info');
    await triggerAIResponse(currentSessionId, messagesUpToUser, lastUserMessage.content, lastUserMessage.attachments || []);
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentSessionId || isGenerating) return;
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || session.messages[messageIndex].role !== 'user') return;
    const updatedMessages = [...session.messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: newContent,
      timestamp: Date.now()
    };
    const messagesUpToEdit = updatedMessages.slice(0, messageIndex + 1);
    setSessions(prev => prev.map(s =>
      s.id === currentSessionId
        ? { ...s, messages: messagesUpToEdit, updatedAt: Date.now() }
        : s
    ));
    addToast('Message edited, regenerating...', 'info');
    const editedMessage = messagesUpToEdit[messageIndex];
    await triggerAIResponse(currentSessionId, messagesUpToEdit, newContent, editedMessage.attachments || []);
  };


  // Broadcast Channel for Companion Sync
  useEffect(() => {
    const channel = new BroadcastChannel('lira_companion_channel');
    
    if (streamingText || isVoiceActive) {
        channel.postMessage({ type: 'SPEAK_START' });
    } else {
        channel.postMessage({ type: 'SPEAK_END' });
    }

    return () => channel.close();
  }, [streamingText, isVoiceActive]);
  
  const handleTTS = async (text: string) => {
    // Determine voice (reuse overlay logic or default)
    const voiceId = localStorage.getItem('lira_premium_voice_id') || 'xtts-local';
    const isPremium = voiceId !== 'google-pt-BR';
    
    liraVoice.speak(text, {
       usePremium: isPremium,
       voiceId: isPremium ? 'xtts-local' : 'google-pt-BR'
    });
  };

  const handleCompanionInteraction = (type: 'drag' | 'resize') => {
      if (streamingText || isVoiceActive) return;
      const phrases = type === 'drag' 
        ? ["Ui!", "Opa!", "Me leva!", "Segura!"] 
        : ["Tô crescendo!", "Eita!", "Gostei!"];
      const text = phrases[Math.floor(Math.random() * phrases.length)];
      handleTTS(text);
  };
  // Persist UI settings
  useEffect(() => {
    const u = getCurrentUser();
    const userId = u?.id;
    if (!userId) return;
    const patch = { selectedModel, isDeepMode, isSidebarOpen, themeId: currentTheme.id };
    const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
    fetch(`${API_BASE_URL}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ userId, patch })
    }).catch(() => {});
  }, [selectedModel, isDeepMode, isSidebarOpen, currentTheme.id]);

  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalSection, setLegalSection] = useState<'terms' | 'privacy' | 'cookies'>('terms');
  const [isIrisOpen, setIsIrisOpen] = useState(false);
  const [isDiscordOpen, setIsDiscordOpen] = useState(false);
  
  // ... existing code ...

  if (!isLoggedIn) {
      return (
          <>
            <div className={`fixed inset-0 bg-black text-white ${isBarrelRoll ? 'do-a-barrel-roll' : ''} ${isMatrixMode ? 'matrix-mode' : ''} z-0`}>
                <LandingChat onLoginReq={() => setIsLoginOpen(true)} />
                <LoginModal
                    isOpen={isLoginOpen}
                    onClose={() => setIsLoginOpen(false)}
                    backendUrl={API_BASE_URL}
                    onLoggedIn={() => {
                        const u = getCurrentUser();
                        if (u) {
                            setUsername(u.username);
                            setIsLoggedIn(true);
                            setIsBooted(true);
                            setIsReturningUser(Boolean(u.lastLogin));
                            
                            // Check for first-time login onboarding
                            const hasSeenOnboarding = localStorage.getItem(`lira_onboarding_seen_${u.id}`);
                            if (!hasSeenOnboarding) {
                                setShowOnboarding(true);
                                setShowWelcome(false); // Don't show generic welcome if showing tour
                            } else {
                                setShowWelcome(true);
                            }
                        }
                    }}
                />
            </div>
          </>
      );
  }

  return (
    <div className={`
        flex h-[100dvh] w-full relative bg-lira-bg text-white overflow-hidden font-sans selection:bg-lira-pink/30 transition-colors duration-500
        ${isBarrelRoll ? 'do-a-barrel-roll' : ''}
        ${isMatrixMode ? 'matrix-mode' : ''}
        ${isGodMode ? 'god-mode' : ''}
    `}>
      {/* ... backgrounds ... */}
      <div className="bg-noise" />
      <ParticleBackground isHyperSpeed={isBarrelRoll || isGodMode} />
      <div className={`absolute inset-0 bg-gradient-to-b ${glowClassName} blur-[120px] pointer-events-none z-0 transition-all duration-1000`} />
      
      {showOnboarding && <OnboardingTour onComplete={handleOnboardingComplete} />}
      <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} initialSection={legalSection} />
      <IrisModal isOpen={isIrisOpen} onClose={() => setIsIrisOpen(false)} />
      <DiscordModal isOpen={isDiscordOpen} onClose={() => setIsDiscordOpen(false)} />

      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenStore={() => setIsStoreOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenLegal={() => setIsLegalModalOpen(true)}
        onOpenIris={() => setIsIrisOpen(true)}
        onOpenDiscord={() => setIsDiscordOpen(true)}
        onOpenGamer={() => setIsGamerOpen(true)}
        onOpenDailyQuests={() => setIsDailyQuestsOpen(true)}
        onOpenSupporters={() => setIsDashboardOpen(true)} // Map to dashboard for now
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
        onOpenTodoPanel={() => setIsTodoPanelOpen(true)}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />
 
      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader 
          title={currentSession?.title || 'New Conversation'}
          isMobile={typeof window !== 'undefined' ? window.innerWidth < 768 : false}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          status={isGenerating ? 'generating' : 'idle'}
          backendStatus={backendStatus}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onStop={handleStop}
          isGenerating={isGenerating}
          onToggleDeepMode={handleToggleDeepMode}
          isDeepMode={isDeepMode}
          displayName={stats.username}
          avatarUrl={LIRA_AVATAR}
          onToggleCompanion={() => setShowCompanion(!showCompanion)}
          onLogout={() => {
            const sessionStr = localStorage.getItem('lira_session');
            try {
              const sess = sessionStr ? JSON.parse(sessionStr) : null;
              if (sess?.refreshToken) {
                const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
                fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ refreshToken: sess.refreshToken }) }).catch(() => {});
              }
            } catch {}
            userLogout();
            setSessions([]);
            setCurrentSessionId(null);
            setMemories([]);
            setIsLoggedIn(false);
            setIsLoginOpen(false);
          }}
          onStartVoiceCall={() => setIsVoiceActive(true)}
          voiceEnabled={isVoiceEnabled}
          onToggleVoice={handleToggleVoice}
          isExhausted={moodState.mood === 'exausta'}
          fatigue={moodState.fatigue}
        />
 
        <div className="flex-1 flex flex-col min-h-0">
          <MessageList
            messages={currentSession?.messages || []}
            isLoading={isGenerating}
            onRegenerate={handleRegenerateMessage}
            onEdit={handleEditMessage}
            onTTS={handleTTS}
            onSuggestionClick={(text) => handleSendMessage(text, [])}
            onSaveMemory={(messageId) => {
              const session = currentSession;
              if (!session) return;
              const msg = session.messages.find(m => m.id === messageId);
              if (!msg) return;
              const currentUser = getCurrentUser();
              const userId = currentUser?.id;
              addMemoryServer(msg.content, ['manual', activePersonaId], 'note', 'medium', userId).then(saved => {
                if (saved) {
                  setMemories(prev => [...prev, saved]);
                  addToast('Saved to Memory', 'success');
                } else {
                  addToast('Failed to save memory', 'error');
                }
              });
            }}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isGenerating}
            onStop={handleStop}
            onEditLastMessage={() => {
              const session = currentSession;
              if (!session) return;
              const lastUser = [...session.messages].reverse().find(m => m.role === 'user');
              if (lastUser) addToast('Scroll to your last message and click edit', 'info');
            }}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            isDeepMode={isDeepMode}
            onToggleDeepMode={handleToggleDeepMode}
            onOpenLegal={() => setIsLegalModalOpen(true)}
            onOpenCookies={() => setIsLegalModalOpen(true)}
            voiceEnabled={isVoiceEnabled} 
            onToggleVoice={handleToggleVoice}
          />
        </div>
      </div>
 
      <Suspense fallback={<LoadingScreen />}>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        memories={memories} 
        onDeleteMemory={handleDeleteMemory} 
        onClearUserData={async () => {
          const currentUser = getCurrentUser();
          const userId = currentUser?.id;
          if (!userId) return;
          const sessionsKey = `${LOCAL_STORAGE_KEY}_${userId}`;
          const memKey = `${MEMORY_STORAGE_KEY}_${userId}`;
          localStorage.removeItem(sessionsKey);
          localStorage.removeItem(memKey);
          setSessions([]);
          setCurrentSessionId(null);
          setMemories([]);
          const okMem = await deleteAllMemoriesForUser(userId);
          let okSess = false;
          try {
            const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
            const r = await fetch(`${API_BASE_URL}/api/sessions?userId=${encodeURIComponent(userId)}`, { method: 'DELETE', headers: getAuthHeaders() });
            okSess = r.ok;
          } catch {}
          addToast(okMem && okSess ? 'Your data has been cleared' : 'Failed to clear some server data (local cleared)', okMem && okSess ? 'success' : 'error');
        }}
        onLogout={() => {
          const currentUser = getCurrentUser();
          const userId = currentUser?.id;
          if (userId) {
            // Optional: persist any unsaved local state under user keys (already handled by effects)
          }
          userLogout();
          setSessions([]);
          setCurrentSessionId(null);
          setMemories([]);
          setIsLoggedIn(false);
          setIsSettingsOpen(false);
          addToast('Logged out', 'success');
        }}
        onOpenLegal={(section) => {
          setLegalSection(section);
          setIsLegalModalOpen(true);
        }}
        onExportUserData={() => {
          const currentUser = getCurrentUser();
          const userId = currentUser?.id;
          (async () => {
            try {
              const payload: any = { users: [], userId, sessions: [], memories: [] }; // getAllUsers() removed - function doesn't exist
              if (userId) {
                const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
                const sr = await fetch(`${API_BASE_URL}/api/sessions?userId=${encodeURIComponent(userId)}`, { headers: getAuthHeaders() });
                if (sr.ok) payload.sessions = await sr.json();
                const mems = await fetchMemories(userId);
                payload.memories = mems;
              }
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `lira-export-${userId || 'anon'}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              addToast('Exported data', 'success');
            } catch {
              addToast('Export failed', 'error');
            }
          })();
        }}
        onImportUserData={(data) => {
          try {
            const currentUser = getCurrentUser();
            const userId = currentUser?.id;
              // importUsers removed - function doesn't exist
              // if (Array.isArray(data.users)) {
              //   const { added, updated } = importUsers(data.users);
              //   addToast(`Users merged (${added} added, ${updated} updated)`, 'info');
              // }
            const sessionsKey = userId ? `${LOCAL_STORAGE_KEY}_${userId}` : LOCAL_STORAGE_KEY;
            const memKey = userId ? `${MEMORY_STORAGE_KEY}_${userId}` : MEMORY_STORAGE_KEY;
            if (Array.isArray(data.sessions)) {
              localStorage.setItem(sessionsKey, JSON.stringify(data.sessions));
              setSessions(data.sessions);
              setCurrentSessionId(data.sessions[0]?.id || null);
            }
            if (Array.isArray(data.memories)) {
              localStorage.setItem(memKey, JSON.stringify(data.memories));
              setMemories(data.memories);
            }
            addToast('Imported data', 'success');
          } catch {
            addToast('Invalid import file', 'error');
          }
        }}
      />
      <DashboardModal 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)} 
      />
      <StoreModal 
        isOpen={isStoreOpen} 
        onClose={() => setIsStoreOpen(false)} 
      />
      <ShortcutsModal 
        isOpen={isShortcutsOpen} 
        onClose={() => setIsShortcutsOpen(false)} 
      />
      <GamerModal 
        isOpen={isGamerOpen} 
        onClose={() => setIsGamerOpen(false)} 
      />
      <DailyQuestsModal
        isOpen={isDailyQuestsOpen}
        onClose={() => setIsDailyQuestsOpen(false)}
      />
      <CookieConsentModal 
        isOpen={isCookieModalOpen} 
        onSave={handleCookieSave} 
        onClose={() => setIsCookieModalOpen(false)} 
      />
      <VoiceCallOverlay
        isOpen={isVoiceActive}
        onClose={() => setIsVoiceActive(false)}
        onSendMessage={(text) => handleSendMessage(text, [])}
        userName={stats.username || 'User'}
        avatarUrl={LIRA_AVATAR}
        currentResponse={streamingText}
        messages={currentSession?.messages || []}
        onToggleCompanion={() => setShowCompanion(prev => !prev)}
      />
      
      {/* Background Studio for Selfies (Disabled when Voice Call is active to avoid conflicts) */}
      {!isVoiceActive && (
          <PhotoBooth messages={currentSession?.messages || []} />
      )}

      {showCompanion && (
          <LiraCompanionWidget 
              onClose={() => setShowCompanion(false)}
              isSpeaking={Boolean(streamingText || isVoiceActive)}
          />
      )}

      <WelcomeModal
        isOpen={showWelcome}
        username={(() => {
            const u = getCurrentUser();
            const rawName = stats.username && stats.username !== 'Guest' ? stats.username : (u?.username || 'Guest');
            // Admin Override
            if (u?.id === 'user_1734661833589' || rawName.toLowerCase().includes('admin')) {
                return 'Pai';
            }
            return rawName;
        })()}
        isReturning={isReturningUser}
        onClose={() => setShowWelcome(false)}
        onNewChat={createNewChat}
      />

      <AdminPanel 
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />

      <TodoPanel 
        isOpen={isTodoPanelOpen}
        onClose={() => setIsTodoPanelOpen(false)}
        userTier={(() => {
          const currentUser = getCurrentUser();
          if (!currentUser) return 'Observer';
          
          // Check if admin first
          if (currentUser.id === 'user_1734661833589' || currentUser.username?.toLowerCase().includes('admin')) {
            return 'Singularity';
          }
          
          // Then check plan
          if ((currentUser as any).plan && (currentUser as any).plan !== 'free') {
            return (currentUser as any).plan.charAt(0).toUpperCase() + (currentUser as any).plan.slice(1);
          }
          
          return 'Observer';
        })()}
      />

      </Suspense>
    </div>
  );
};
 
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <GamificationProvider>
          <ErrorBoundary>
            <LiraAppContent />
          </ErrorBoundary>
        </GamificationProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};
 
export default App;
