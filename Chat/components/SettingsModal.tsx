import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Brain, Palette, RefreshCw, Zap, Check, Trash2, Database, Camera, Activity, Cpu, Sliders, Star, Lock, Key, ShieldCheck, AlertCircle, Shield, Bell, LayoutGrid, Network, Keyboard, LifeBuoy, Heart, MessageSquare, ExternalLink, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useGamification } from '../contexts/GamificationContext';
import { getCurrentUser, updateProfile, updateAvatar, getSettings, saveSettings, UserSettings, getAuthHeaders } from '../services/userService';
import { useToast } from '../contexts/ToastContext';
import { MemoryGraph } from './ui/MemoryGraph';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:4000';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories?: { id: string, content: string, createdAt: number, category?: string, priority?: string }[];
  onDeleteMemory?: (id: string) => void;
  onClearUserData?: () => void;
  onLogout?: () => void;
  onExportUserData?: () => void;
  onImportUserData?: (data: any) => void;
  onOpenLegal?: (section: 'terms' | 'privacy' | 'cookies') => void;
}

type Tab = 'profile' | 'security' | 'intelligence' | 'shortcuts' | 'memories' | 'appearance' | 'help';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, memories = [], onDeleteMemory, onClearUserData, onLogout, onExportUserData, onImportUserData, onOpenLegal }) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'' | 'profile' | 'contact' | 'location' | 'birthday' | 'note'>('');
  const [priority, setPriority] = useState<'' | 'low' | 'medium' | 'high'>('');
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const { stats, setUsername, unlockedThemes } = useGamification();
  const { addToast } = useToast();

  // Get current user data
  const currentUser = getCurrentUser();
  // Ensure we are not showing stale data if context hasn't updated
  const effectiveStats = stats.username === currentUser?.username ? stats : { ...stats, username: currentUser?.username || '', level: 1, currentXp: 0 };
  
  const [userAvatar, setUserAvatar] = useState<string | undefined>(currentUser?.avatar);
  const [displayName, setDisplayName] = useState(effectiveStats.username || '');

  // Filter only unlocked themes for settings
  const ownedThemes = availableThemes.filter(t => unlockedThemes.includes(t.id));

  // Local state for intelligence settings simulation
  const [temperature, setTemperature] = useState(0.7);
  const [systemInstructions, setSystemInstructions] = useState('');
  const [modelSpeed, setModelSpeed] = useState('flash');
  const [notifications, setNotifications] = useState(true);
  const [dynamicPersona, setDynamicPersona] = useState(false);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Memory View State
  const [memoryViewMode, setMemoryViewMode] = useState<'list' | 'graph'>('list');

  // Load Settings
  React.useEffect(() => {
    if (isOpen) {
      getSettings().then(settings => {
        if (settings.temperature !== undefined) setTemperature(settings.temperature);
        if (settings.systemInstructions !== undefined) setSystemInstructions(settings.systemInstructions);
        if (settings.model) setModelSpeed(settings.model);
        if (settings.theme) setTheme(settings.theme as any);
        if (settings.model) setModelSpeed(settings.model);
        if (settings.theme) setTheme(settings.theme as any);
        if (settings.notifications !== undefined) setNotifications(settings.notifications);
        if (settings.dynamicPersona !== undefined) setDynamicPersona(settings.dynamicPersona);
      });
    }
  }, [isOpen]);

  // Handle save settings
  const handleSaveSettings = async () => {
    const settings: UserSettings = {
      temperature,
      systemInstructions,
      model: modelSpeed as any,
      theme: currentTheme.id,
      notifications,
      dynamicPersona
    };
    const success = await saveSettings(settings);
    if (success) {
        addToast(t('settings.intelligence.toast_saved'), 'success');
    } else {
        addToast('Failed to save settings', 'error');
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image too large (max 5MB)', 'error');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast('Please select an image file', 'error');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setUserAvatar(base64);
      
      // Save to database
      if (currentUser) {
        const result = await updateAvatar(currentUser.id, base64);
        if (result.success) {
          addToast(t('settings.profile.toast_avatar'), 'success');
          // Trigger a re-render in other components by updating localStorage
          window.dispatchEvent(new Event('user-updated'));
        } else {
          addToast(result.message, 'error');
        }
      }
    };
    reader.readAsDataURL(file);
  };

    const handleGoogleConnect = async () => {
    try {
        if (!currentUser?.id) return;
        const response = await fetch(`${API_BASE_URL}/api/auth/google-calendar/connect?userId=${encodeURIComponent(currentUser.id)}`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        if (data.url) {
            // Open popup for OAuth
            window.open(data.url, 'Google Auth', 'width=600,height=700');
            
            // Listen for window close or message to refresh status
             const messageHandler = (event: MessageEvent) => {
                if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
                    addToast('Google Calendar conectado com sucesso!', 'success');
                    window.removeEventListener('message', messageHandler);
                }
            };
            window.addEventListener('message', messageHandler);
        }
    } catch (error) {
        console.error(error);
        addToast('Erro ao iniciar conexão com Google', 'error');
    }
  };

  // Handle save profile name
  const handleSaveName = async () => {
    if (!currentUser || !displayName.trim()) return;
    
    const result = await updateProfile(currentUser.id, { username: displayName });
    if (result.success) {
      setUsername(displayName);
      addToast(t('settings.profile.toast_success'), 'success');
      window.dispatchEvent(new Event('user-updated'));
    } else {
      addToast(result.message, 'error');
    }
  };

  const menuItems = [
    { id: 'profile', label: t('settings.tabs.profile'), icon: User },
    { id: 'security', label: t('settings.tabs.security'), icon: Shield },
    { id: 'intelligence', label: t('settings.intelligence.title'), icon: Brain },
    { id: 'memories', label: t('settings.memories.title'), icon: Database },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: Palette },
    { id: 'help', label: t('settings.tabs.help'), icon: LifeBuoy },
  ];

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) return;
    
    if (passwordForm.new !== passwordForm.confirm) {
       setPasswordStatus('error');
       setTimeout(() => setPasswordStatus('idle'), 3000);
       return;
    }

    // Simulate API call
    setPasswordStatus('success');
    setTimeout(() => {
       setPasswordStatus('idle');
       setPasswordForm({ current: '', new: '', confirm: '' });
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl h-[650px] bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-premium overflow-hidden flex flex-col md:flex-row z-50"
          >
            {/* Sidebar */}
            <aside className="w-full md:w-60 bg-[#121215] border-r border-white/5 flex flex-col">
              <div className="p-6">
                <h2 className="text-lg font-bold text-white">{t('settings.title')}</h2>
              </div>

              <nav className="flex-1 px-3 space-y-0.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as Tab)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${isActive 
                          ? 'bg-white/10 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'}
                      `}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-lira-pink/5 to-transparent rounded-lg border border-lira-pink/10">
                  <Zap size={14} className="text-lira-pink" />
                  <span className="text-xs font-semibold text-lira-pink">{t('settings.pro_plan')}</span>
                </div>
                <button
                  onClick={() => onLogout && onLogout()}
                  className="mt-3 w-full px-3 py-2 text-xs bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 text-white transition-colors"
                >
                  {t('settings.logout')}
                </button>
              </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 flex flex-col relative bg-[#0c0c0e]">
              <div className="absolute top-4 right-4 z-10">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">{t('settings.profile.identity')}</h3>
                      <p className="text-sm text-gray-500 mb-8">{t('settings.profile.desc')}</p>
                      
                      <div className="flex items-start gap-8">
                        <label className="relative group cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-gray-800 to-black border border-white/10 flex items-center justify-center overflow-hidden">
                             {userAvatar ? (
                               <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                             ) : (
                               <span className="text-3xl font-bold text-white">{stats.username?.charAt(0) || 'U'}</span>
                             )}
                          </div>
                          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <Camera size={20} className="text-white" />
                          </div>
                        </label>
                        
                        <div className="flex-1 space-y-4">
                           <div className="space-y-1.5">
                              <label className="text-xs font-medium text-gray-400">{t('settings.profile.display_name')}</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={displayName}
                                  onChange={(e) => setDisplayName(e.target.value)}
                                  className="flex-1 bg-[#18181b] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:border-white/30 outline-none transition-all" 
                                />
                                <button
                                  onClick={handleSaveName}
                                  disabled={displayName === stats.username}
                                  className="px-4 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {t('settings.profile.save')}
                                </button>
                              </div>
                           </div>
                           
                           {/* Enhanced Stats Row */}
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                                 <div className="p-1.5 bg-lira-blue/20 rounded-md text-lira-blue">
                                    <Star size={16} fill="currentColor" />
                                 </div>
                                 <div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">{t('settings.profile.level')}</div>
                                    <div className="text-lg font-bold text-white">{stats.level}</div>
                                 </div>
                              </div>
                              
                              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                                 <div className="p-1.5 bg-purple-500/20 rounded-md text-purple-400">
                                    <Activity size={16} />
                                 </div>
                                 <div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">{t('settings.profile.xp')}</div>
                                    <div className="text-lg font-bold text-white">{stats.currentXp}</div>
                                 </div>
                              </div>
                           </div>

                           {/* Integrations */}
                           <div className="pt-6 border-t border-white/5 space-y-4">
                              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Integrations</h4>
                              
                              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                 <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-blue-500/20 rounded-md text-blue-500">
                                       <Activity size={16} />
                                    </div>
                                    <div>
                                       <div className="text-sm font-medium text-white">Google Calendar</div>
                                       <div className="text-xs text-gray-500">Connect to manage events</div>
                                    </div>
                                 </div>
                                 <button
                                    onClick={handleGoogleConnect}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors border border-white/10"
                                 >
                                    Connect
                                 </button>
                              </div>
                           </div>

                           {/* Notifications & Preferences */}
                           <div className="pt-6 border-t border-white/5 space-y-4">
                              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('settings.profile.preferences')}</h4>
                              
                              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                 <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-yellow-500/20 rounded-md text-yellow-500">
                                       <Bell size={16} />
                                    </div>
                                    <div>
                                       <div className="text-sm font-medium text-white">{t('settings.profile.notifications')}</div>
                                       <div className="text-xs text-gray-500">{t('settings.profile.notifications_desc')}</div>
                                    </div>
                                 </div>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                   <input 
                                     type="checkbox" 
                                     checked={notifications} 
                                     onChange={(e) => setNotifications(e.target.checked)} 
                                     className="sr-only peer" 
                                   />
                                   <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lira-pink"></div>
                                 </label>
                              </div>

                              <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleSaveSettings}
                                    className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    {t('settings.profile.save_prefs')}
                                </button>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                     <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{t('settings.security.title')}</h3>
                        <p className="text-sm text-gray-500 mb-8">{t('settings.security.desc')}</p>
                        
                         <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400">{t('settings.security.current_pwd')}</label>
                                <div className="relative">
                                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input 
                                        type="password"
                                        value={passwordForm.current}
                                        onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                                        className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:border-white/30 outline-none transition-all placeholder-gray-700"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400">{t('settings.security.new_pwd')}</label>
                                    <input 
                                        type="password"
                                        value={passwordForm.new}
                                        onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                                        className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:border-white/30 outline-none transition-all placeholder-gray-700"
                                        placeholder="New password"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400">{t('settings.security.confirm_pwd')}</label>
                                    <input 
                                        type="password"
                                        value={passwordForm.confirm}
                                        onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                        className={`w-full bg-[#18181b] border rounded-lg py-2.5 px-3 text-sm text-white outline-none transition-all placeholder-gray-700 ${passwordStatus === 'error' ? 'border-red-500/50' : 'border-white/10 focus:border-white/30'}`}
                                        placeholder="Confirm"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <div className="text-xs">
                                    {passwordStatus === 'error' && <span className="text-red-400 flex items-center gap-1"><AlertCircle size={14} /> {t('settings.security.status_mismatch')}</span>}
                                    {passwordStatus === 'success' && <span className="text-green-400 flex items-center gap-1"><ShieldCheck size={14} /> {t('settings.security.status_saved')}</span>}
                                </div>
                                <button 
                                    type="submit"
                                    className="px-5 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    {t('settings.security.update_btn')}
                                </button>
                            </div>
                         </form>

                         <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-start gap-3">
                            <AlertCircle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-yellow-500 mb-1">{t('settings.security.two_fa_title')}</h4>
                                <p className="text-xs text-yellow-600/70">{t('settings.security.two_fa_desc')}</p>
                            </div>
                         </div>
                    </div>
                  </motion.div>
                )}

                {/* Intelligence Tab */}
                {activeTab === 'intelligence' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <div>
                       <h3 className="text-xl font-semibold text-white mb-1">{t('settings.intelligence.title')}</h3>
                       <p className="text-sm text-gray-500 mb-8">{t('settings.intelligence.desc')}</p>

                       <div className="space-y-8">
                          {/* Model Selection */}
                          <div className="space-y-3">
                             <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                <Cpu size={14} /> {t('settings.intelligence.model_arch')}
                             </label>
                             <div className="grid grid-cols-2 gap-3">
                                <button 
                                  onClick={() => setModelSpeed('flash')}
                                  className={`p-4 rounded-xl border text-left transition-all ${modelSpeed === 'flash' ? 'bg-white/10 border-white/20' : 'bg-[#18181b] border-white/5 hover:border-white/10'}`}
                                >
                                   <div className="flex justify-between items-start mb-2">
                                      <span className="font-semibold text-white text-sm">Turbo</span>
                                      {modelSpeed === 'flash' && <Check size={14} className="text-white" />}
                                   </div>
                                   <p className="text-xs text-gray-500">{t('settings.intelligence.flash_desc')}</p>
                                </button>
                                <button 
                                  onClick={() => setModelSpeed('pro')}
                                  className={`p-4 rounded-xl border text-left transition-all ${modelSpeed === 'pro' ? 'bg-white/10 border-white/20' : 'bg-[#18181b] border-white/5 hover:border-white/10'}`}
                                >
                                   <div className="flex justify-between items-start mb-2">
                                      <span className="font-semibold text-white text-sm">Flash</span>
                                      {modelSpeed === 'pro' && <Check size={14} className="text-white" />}
                                   </div>
                                   <p className="text-xs text-gray-500">{t('settings.intelligence.pro_desc')}</p>
                                </button>
                             </div>
                          </div>

                          {/* Temperature */}
                          <div className="space-y-3">
                             <div className="flex justify-between">
                                <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                   <Activity size={14} /> {t('settings.intelligence.creativity')}
                                </label>
                                <span className="text-xs text-white font-mono">{temperature.toFixed(1)}</span>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="w-full accent-white h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                             />
                             <div className="flex justify-between text-[10px] text-gray-600">
                                <span>{t('settings.intelligence.precise')}</span>
                                <span>{t('settings.intelligence.balanced')}</span>
                                <span>{t('settings.intelligence.creative')}</span>
                             </div>
                          </div>

                          {/* Dynamic Persona Toggle */}
                          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                             <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-lira-blue/20 rounded-md text-lira-blue">
                                   <RefreshCw size={16} />
                                </div>
                                <div>
                                   <div className="text-sm font-medium text-white">{t('settings.intelligence.dynamic_persona_title') || 'Dynamic Persona'}</div>
                                   <div className="text-xs text-gray-500">{t('settings.intelligence.dynamic_persona_desc') || 'Automatically switch personality based on conversation mood'}</div>
                                </div>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer">
                               <input 
                                 type="checkbox" 
                                 checked={dynamicPersona} 
                                 onChange={(e) => setDynamicPersona(e.target.checked)} 
                                 className="sr-only peer" 
                               />
                               <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lira-blue"></div>
                             </label>
                          </div>

                          {/* System Instructions */}
                          <div className="space-y-3">
                             <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                <Sliders size={14} /> {t('settings.intelligence.system_instructions')}
                             </label>
                             <textarea
                                value={systemInstructions}
                                onChange={(e) => setSystemInstructions(e.target.value)}
                                placeholder={t('settings.intelligence.system_placeholder')}
                                className="w-full h-32 bg-[#18181b] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-white/30 outline-none resize-none placeholder-gray-700"
                             />
                             <p className="text-xs text-gray-500">{t('settings.intelligence.system_desc')}</p>
                          </div>
                          
                          <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSaveSettings}
                                className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                {t('settings.intelligence.save_changes')}
                            </button>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                )}

                {/* Shortcuts Tab Removed (Moved to Sidebar only) */}

                {/* Memories Tab */}
              {activeTab === 'memories' && (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div>
                       <h3 className="text-xl font-semibold text-white mb-2">{t('settings.memories.title')}</h3>
                       <p className="text-gray-500 text-sm mb-6">{t('settings.memories.desc')}</p>
                       
                       <div className="flex flex-wrap items-center gap-3 mb-4">
                          <input
                            type="text"
                            placeholder={t('settings.memories.search_placeholder')}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 min-w-[180px] bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-white/30 outline-none transition-all"
                          />
                          <select
                            onChange={(e) => setCategory(e.target.value as any)}
                            className="bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-white/30 outline-none transition-all"
                          >
                            <option value="">{t('settings.memories.all_categories')}</option>
                            <option value="profile">{t('settings.memories.cat_profile')}</option>
                            <option value="contact">{t('settings.memories.cat_contact')}</option>
                            <option value="location">{t('settings.memories.cat_location')}</option>
                            <option value="birthday">{t('settings.memories.cat_birthday')}</option>
                            <option value="note">{t('settings.memories.cat_note')}</option>
                          </select>
                          <select
                            onChange={(e) => setPriority(e.target.value as any)}
                            className="bg-[#18181b] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-white/30 outline-none transition-all"
                          >
                            <option value="">{t('settings.memories.all_priorities')}</option>
                            <option value="high">{t('settings.memories.pri_high')}</option>
                            <option value="medium">{t('settings.memories.pri_medium')}</option>
                             <option value="low">{t('settings.memories.pri_low')}</option>
                          </select>
                            
                          <div className="flex bg-[#18181b] p-1 rounded-lg border border-white/10 ml-auto">
                             <button 
                                onClick={() => setMemoryViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${memoryViewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                                title="List View"
                             >
                                <LayoutGrid size={16} />
                             </button>
                             <button 
                                onClick={() => setMemoryViewMode('graph')}
                                className={`p-1.5 rounded-md transition-all ${memoryViewMode === 'graph' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                                title="Graph View"
                             >
                                <Network size={16} />
                             </button>
                          </div>
                       </div>
                       
                       {memoryViewMode === 'graph' ? (
                          <MemoryGraph memories={memories} />
                       ) : (
                       (() => {
                          const [searchState, categoryState, priorityState] = [search, category, priority];
                          const filtered = memories.filter(m => {
                            const textMatch = (m.content || '').toLowerCase().includes((searchState || '').toLowerCase());
                            const catMatch = categoryState ? m.category === categoryState : true;
                            const priMatch = priorityState ? m.priority === priorityState : true;
                            return textMatch && catMatch && priMatch;
                          });
                         
                         return filtered.length === 0 ? (
                           <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-gray-500 text-sm">
                              {t('settings.memories.no_memories')}
                           </div>
                         ) : (
                            <div className="space-y-2">
                               {filtered.map(mem => (
                                  <div key={mem.id} className="p-3 bg-[#18181b] border border-white/5 rounded-lg flex items-start justify-between group hover:border-white/20 transition-colors">
                                     <div>
                                        <p className="text-sm text-gray-300">{mem.content}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                          {mem.category && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-gray-400">
                                              {mem.category}
                                            </span>
                                          )}
                                          {mem.priority && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${mem.priority === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-300' : mem.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' : 'bg-green-500/10 border-green-500/20 text-green-300'}`}>
                                              {mem.priority}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[10px] text-gray-600 mt-1 block">
                                           {new Date(mem.createdAt).toLocaleDateString()}
                                        </span>
                                     </div>
                                     <button 
                                       onClick={() => onDeleteMemory && onDeleteMemory(mem.id)}
                                       className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                     >
                                        <Trash2 size={14} />
                                     </button>
                                  </div>
                               ))}
                            </div>
                         );
                       })()
                       )}
                      </div>
                      
                      <div className="mt-6 p-4 border border-red-500/20 rounded-xl bg-red-500/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-red-400">{t('settings.memories.danger_zone')}</h4>
                            <p className="text-xs text-red-300/80">{t('settings.memories.danger_desc')}</p>
                          </div>
                          <button
                            onClick={() => onClearUserData && onClearUserData()}
                            className="px-3 py-2 text-xs bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 hover:bg-red-500/30 transition-colors"
                          >
                            {t('settings.memories.clear_data')}
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => onExportUserData && onExportUserData()}
                            className="px-3 py-2 text-xs bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                          >
                            {t('settings.memories.export_data')}
                          </button>
                          <label className="px-3 py-2 text-xs bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors cursor-pointer">
                            {t('settings.memories.import_data')}
                            <input
                              type="file"
                              accept="application/json"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const text = await file.text();
                                try {
                                  const data = JSON.parse(text);
                                  onImportUserData && onImportUserData(data);
                                } catch {
                                  // noop
                                }
                                e.currentTarget.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>
                 </motion.div>
              )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                     
                     {/* Language Selector */}
                     <div>
                        <h3 className="text-xl font-semibold text-white mb-4">{t('settings.language')}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t('settings.select_language')}</p>
                        <div className="flex flex-wrap gap-2 mb-8">
                            {[
                                { code: 'en', label: 'English' },
                                { code: 'pt', label: 'Português' },
                                { code: 'es', label: 'Español' },
                                { code: 'fr', label: 'Français' },
                                { code: 'de', label: 'Deutsch' }
                            ].map(lang => (
                                <button
                                key={lang.code}
                                onClick={() => i18n.changeLanguage(lang.code)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                                    i18n.language.startsWith(lang.code)
                                    ? 'bg-white text-black border-white' 
                                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
                                }`}
                                >
                                {lang.label}
                                </button>
                            ))}
                        </div>
                     </div>

                     <div>
                      <h3 className="text-xl font-semibold text-white mb-6">{t('settings.appearance.themes_title')}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {ownedThemes.map((theme) => {
                          const isSelected = currentTheme.id === theme.id;
                          return (
                            <button
                              key={theme.id}
                              onClick={() => setTheme(theme.id)}
                              className={`relative group cursor-pointer text-left rounded-lg overflow-hidden transition-all duration-300 border ${isSelected ? 'ring-1 ring-white border-transparent' : 'border-white/10 hover:border-white/30'}`}
                            >
                              <div className="aspect-video relative overflow-hidden" style={{ backgroundColor: theme.colors.bg }}>
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full blur-md opacity-60" style={{ backgroundColor: theme.colors.primary }}></div>
                              </div>
                              <div className="p-2 bg-[#18181b] border-t border-white/5 flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-200">{theme.name}</span>
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Help Tab */}
                {activeTab === 'help' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                     <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{t('settings.help.title')}</h3>
                        <p className="text-sm text-gray-500 mb-8">{t('settings.help.desc')}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Subscription Management */}
                           <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-lira-pink/20 rounded-lg text-lira-pink">
                                   <Zap size={18} />
                                </div>
                                <h4 className="font-semibold text-white text-sm">{t('settings.help.subscription')}</h4>
                              </div>
                              <p className="text-xs text-gray-400 mb-4 h-8">{t('settings.help.subscription_desc')}</p>
                              <button className="w-full py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                                {t('settings.help.manage_billing')}
                              </button>
                           </div>

                           {/* Upgrade / Patreon */}
                           <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-[#FF424D]/20 rounded-lg text-[#FF424D]">
                                   <Heart size={18} />
                                </div>
                                <h4 className="font-semibold text-white text-sm">Patreon Support</h4>
                              </div>
                               <p className="text-xs text-gray-400 mb-4 h-8">{t('settings.help.patreon_desc')}</p>
                              <a 
                                href="https://patreon.com/amarinthlira?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-full py-2 bg-[#FF424D] text-white text-xs font-bold rounded-lg hover:bg-[#E63946] transition-colors text-center"
                              >
                                {t('settings.help.upgrade_now')}
                              </a>
                           </div>
                           
                           {/* Feedback */}
                           <div className="col-span-1 md:col-span-2 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                   <MessageSquare size={18} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white text-sm">{t('settings.help.feedback')}</h4>
                                    <p className="text-xs text-gray-400">{t('settings.help.feedback_desc')}</p>
                                </div>
                              </div>
                              <a 
                                href="https://forms.google.com/example-feedback" 
                                target="_blank"
                                rel="noopener noreferrer" 
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
                              >
                                {t('settings.help.send_feedback')}
                                <ExternalLink size={12} />
                              </a>
                           </div>

                           {/* Social Media */}
                           <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 mt-2">
                                 <a 
                                   href="https://www.twitch.tv/amarynth_lira" 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="p-3 bg-[#9146FF]/10 border border-[#9146FF]/20 hover:bg-[#9146FF]/20 hover:border-[#9146FF]/40 rounded-xl flex items-center gap-3 transition-all group"
                                 >
                                    <div className="p-2 bg-[#9146FF] rounded-lg text-white">
                                       <Zap size={18} fill="currentColor" />
                                    </div>
                                    <div>
                                       <div className="text-xs font-bold text-[#9146FF]">Twitch</div>
                                       <div className="text-[10px] text-gray-400 group-hover:text-gray-300">Em breve</div>
                                    </div>
                                 </a>

                                 <a 
                                   href="https://www.instagram.com/amarinth_lira?igsh=MTEyY3V2dGV2Y3htMQ==" 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="p-3 bg-[#E1306C]/10 border border-[#E1306C]/20 hover:bg-[#E1306C]/20 hover:border-[#E1306C]/40 rounded-xl flex items-center gap-3 transition-all group"
                                 >
                                    <div className="p-2 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] rounded-lg text-white">
                                       <Camera size={18} />
                                    </div>
                                    <div className="text-xs font-bold text-[#E1306C] group-hover:text-[#E1306C]/80">Instagram</div>
                                 </a>
                           </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('settings.help.legal')}</h4>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => onOpenLegal && onOpenLegal('terms')} className="text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-between p-3 bg-[#18181b] rounded-lg border border-white/5 hover:border-white/10">
                                    <span>{t('settings.help.terms')}</span>
                                    <ExternalLink size={14} className="text-gray-500" />
                                </button>
                                <button onClick={() => onOpenLegal && onOpenLegal('privacy')} className="text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-between p-3 bg-[#18181b] rounded-lg border border-white/5 hover:border-white/10">
                                    <span>{t('settings.help.privacy')}</span>
                                    <ExternalLink size={14} className="text-gray-500" />
                                </button>
                                <button onClick={() => onOpenLegal && onOpenLegal('cookies')} className="text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-between p-3 bg-[#18181b] rounded-lg border border-white/5 hover:border-white/10">
                                    <span>{t('settings.help.cookie_prefs')}</span>
                                    <Settings size={14} className="text-gray-500" />
                                </button>
                            </div>
                        </div>
                     </div>
                  </motion.div>
                )}
              </div>
            </main>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
