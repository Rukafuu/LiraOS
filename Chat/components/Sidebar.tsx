import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Search, Settings, X, Trash2, Sparkles, Command, LayoutGrid, ShoppingBag, Keyboard, Shield, Video, Crown, Gamepad2, Gift, CheckSquare, Calendar } from 'lucide-react';
import { ChatSession } from '../types';
import { LIRA_AVATAR } from '../constants';
import { getCurrentUser } from '../services/userService';
import { useTranslation } from 'react-i18next';
import { FeedbackModal } from './FeedbackModal';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
  onOpenDashboard: () => void;
  onOpenStore: () => void;
  onOpenShortcuts: () => void;
  onOpenLegal: () => void;
  onOpenIris: () => void;
  onOpenDiscord: () => void;
  onOpenGamer: () => void;
  onOpenDailyQuests: () => void;
  onOpenSupporters: () => void;
  onOpenAdminPanel: () => void;
  onOpenTodoPanel: () => void;
  onOpenCalendar: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenSettings,
  onOpenDashboard,
  onOpenStore,
  onOpenShortcuts,
  onOpenLegal,
  onOpenIris,
  onOpenDiscord,
  onOpenGamer,
  onOpenDailyQuests,
  onOpenSupporters,
  onOpenAdminPanel,
  onOpenTodoPanel,
  onOpenCalendar,
  isOpen,
  onCloseMobile
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [showFeedback, setShowFeedback] = useState(false);
  /* Footer Auto-Expand Logic */
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const footerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFooterEnter = () => {
    if (footerTimeoutRef.current) clearTimeout(footerTimeoutRef.current);
    setIsFooterExpanded(true);
  };

  const handleFooterLeave = () => {
    footerTimeoutRef.current = setTimeout(() => {
      setIsFooterExpanded(false);
    }, 2000);
  };

  const handleItemsEnter = () => setIsItemsExpanded(true);
  const handleItemsLeave = () => setIsItemsExpanded(false);

  useEffect(() => {
    const handleUserUpdate = () => setCurrentUser(getCurrentUser());
    window.addEventListener('user-updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);
    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredSessions = sessions.filter(s => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    const titleMatch = (s.title || 'Untitled').toLowerCase().includes(term);
    const msgMatch = (s.messages || []).some(m => (m.content || '').toLowerCase().includes(term));
    return titleMatch || msgMatch;
  }).sort((a, b) => b.updatedAt - a.updatedAt);

  const sidebarVariants = isMobile ? {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 }
  } : {
    open: { width: 260, opacity: 1 },
    closed: { width: 0, opacity: 0 }
  };

  return (
    <>
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        className={`fixed md:relative z-[100] h-full bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/5 flex flex-col overflow-hidden ${isMobile ? 'top-0 left-0 w-[280px]' : ''}`}
      >
        {/* HEADER */}
        <div className="p-4 border-b border-white/5 space-y-4">
           
           <div className="flex items-center gap-3 px-2">
             <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all">
                <img src={LIRA_AVATAR} className="w-full h-full object-cover" alt="Lira" />
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-wide">LiraOS</span>
                <span className="text-[10px] text-purple-400 font-mono">v2.0.0-beta</span>
             </div>
           </div>

           <button 
             onClick={onNewChat}
             className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all group"
           >
             <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300 text-purple-400" />
             <span className="text-sm font-medium">{t('sidebar.new_chat')}</span>
           </button>

           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-400 transition-colors" size={14} />
              <input 
                type="text" 
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
           </div>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            
            <div 
              className="border-y border-white/5 bg-[#080808]/50 transition-all duration-300 ease-in-out"
              onMouseEnter={handleItemsEnter}
              onMouseLeave={handleItemsLeave}
            >
                <div className="p-3">
                    <AnimatePresence mode="wait">
                        {isItemsExpanded ? (
                            // EXPANDED VIEW
                            <motion.div 
                                key="expanded"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-1"
                            >
                                <div className="px-3 text-[10px] font-bold text-gray-500 tracking-wider mb-2">{t('sidebar.my_items')}</div>
                                
                                <button onClick={onOpenDashboard} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors group">
                                    <LayoutGrid size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">{t('sidebar.dashboard')}</span>
                                </button>
                                
                                <button onClick={onOpenIris} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors group">
                                    <Video size={16} className="text-red-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">{t('sidebar.iris')}</span>
                                </button>

                                <button onClick={onOpenStore} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors group">
                                    <ShoppingBag size={16} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm">{t('sidebar.store')}</span>
                                </button>
                                
                                <button onClick={onOpenGamer} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors group">
                                     <Gamepad2 size={16} className="text-purple-500 group-hover:scale-110 transition-transform" />
                                     <span className="text-sm">{t('sidebar.game')}</span>
                                </button>

                                <button onClick={onOpenDailyQuests} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors group">
                                     <Gift size={16} className="text-pink-400 group-hover:scale-110 transition-transform" />
                                     <span className="text-sm">Missões Diárias</span>
                                </button>

                                 <button onClick={onOpenDiscord} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors group">
                                     <div className="w-4 h-4 flex items-center justify-center">
                                        <svg viewBox="0 0 127.14 96.36" className="w-full h-full fill-indigo-400 group-hover:scale-110 transition-transform">
                                            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c.12-9.23-1.69-19-4.89-29.08l-.84-2.73C117.22,34.81,107.7,8.07,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                                        </svg>
                                     </div>
                                     <span className="text-sm">{t('sidebar.discord_hub')}</span>
                                </button>
                            </motion.div>
                        ) : (
                            // COLLAPSED VIEW (Icons Only)
                            <motion.div 
                               key="collapsed"
                               initial={{ opacity: 0 }}
                               animate={{ opacity: 1 }}
                               exit={{ opacity: 0 }}
                               onClick={() => setIsItemsExpanded(true)}
                               className="flex items-center justify-around cursor-pointer py-2"
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors" onClick={(e) => { e.stopPropagation(); onOpenDashboard(); }}>
                                    <LayoutGrid size={16} className="text-blue-400" />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors" onClick={(e) => { e.stopPropagation(); onOpenIris(); }}>
                                    <Video size={16} className="text-red-400" />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center hover:bg-yellow-500/20 transition-colors" onClick={(e) => { e.stopPropagation(); onOpenStore(); }}>
                                    <ShoppingBag size={16} className="text-yellow-400" />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center hover:bg-purple-500/20 transition-colors" onClick={(e) => { e.stopPropagation(); onOpenGamer(); }}>
                                    <Gamepad2 size={16} className="text-purple-500" />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center hover:bg-pink-500/20 transition-colors" onClick={(e) => { e.stopPropagation(); onOpenDailyQuests(); }}>
                                    <Gift size={16} className="text-pink-400" />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center hover:bg-indigo-500/20 transition-colors" onClick={(e) => { e.stopPropagation(); onOpenDiscord(); }}>
                                    <svg viewBox="0 0 127.14 96.36" className="w-4 h-4 fill-indigo-400">
                                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c.12-9.23-1.69-19-4.89-29.08l-.84-2.73C117.22,34.81,107.7,8.07,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                                    </svg>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>


            <div className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-gray-500 tracking-wider mb-2 flex justify-between items-center">
                  <span>{t('sidebar.conversations')}</span>
                  <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{filteredSessions.length}</span>
                </div>
                
                {filteredSessions.map((session) => (
                  <div 
                    key={session.id}
                    className={`group relative flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                        currentSessionId === session.id 
                        ? 'bg-purple-500/10 text-white border border-purple-500/20' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                    }`}
                    onClick={() => onSelectSession(session.id)}
                  >
                    <MessageSquare size={14} className={currentSessionId === session.id ? 'text-purple-400' : 'text-gray-500'} />
                    <div className="flex-1 overflow-hidden">
                       <p className="text-sm truncate pr-6">{session.title || 'Untitled Chat'}</p>
                    </div>

                    <button 
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-gray-500 hover:text-red-400 transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                        }}
                    >
                        <Trash2 size={12} />
                    </button>
                  </div>
                ))}
            </div>

        </div>

        {/* --- SETTINGS & FOOTER (Auto-Expand) --- */}
        <div 
          className="mt-auto border-t border-white/5 bg-[#080808] transition-all duration-300 ease-in-out"
          onMouseEnter={handleFooterEnter}
          onMouseLeave={handleFooterLeave}
        >
            <div className="p-4">
                <AnimatePresence mode="wait">
                    {isFooterExpanded ? (
                        // EXPANDED VIEW
                        <motion.div 
                            key="expanded"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2"
                        >
                            {/* Profile Card */}
                            {currentUser && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-4 group hover:bg-white/10 transition-colors">
                                    {currentUser.avatar ? (
                                        <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                            {currentUser.username.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-bold text-white truncate">{currentUser.username}</span>
                                        <span className="text-[10px] text-gray-400 truncate">{currentUser.email}</span>
                                    </div>
                                </div>
                            )}

                            {/* Menu Buttons */}
                            <button 
                                onClick={onOpenSettings} 
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Settings size={16} className="text-blue-400 group-hover:rotate-45 transition-transform duration-500" />
                                </div>
                                <span className="text-[13px] font-medium">{t('sidebar.settings')}</span>
                            </button>

                            <button 
                                onClick={onOpenShortcuts} 
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                    <Keyboard size={16} className="text-gray-400" />
                                </div>
                                <span className="text-[13px] font-medium">{t('sidebar.shortcuts_title').split('(')[0]}</span>
                            </button>

                            <button 
                                onClick={() => setShowFeedback(true)}
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare size={16} className="text-green-400" />
                                </div>
                                <span className="text-[13px] font-medium">{t('feedback_modal.title')}</span>
                            </button>

                            <button 
                                onClick={onOpenLegal} 
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                                    <Shield size={16} className="text-gray-400" />
                                </div>
                                <span className="text-[13px] font-medium">{t('sidebar.legal')}</span>
                            </button>

                            <button 
                                onClick={onOpenAdminPanel} 
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                    <Command size={16} className="text-red-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[13px] font-medium">Admin Panel</span>
                            </button>

                            <button 
                                onClick={onOpenTodoPanel} 
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                    <CheckSquare size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[13px] font-medium">To-Do Lists</span>
                            </button>

                            <button 
                                onClick={onOpenCalendar} 
                                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                    <Calendar size={16} className="text-orange-400 group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[13px] font-medium">Calendar</span>
                            </button>
                        </motion.div>
                    ) : (
                        // COLLAPSED VIEW (Compact)
                        <motion.div 
                           key="collapsed"
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           onClick={() => setIsFooterExpanded(true)}
                           className="flex items-center justify-between cursor-pointer py-2"
                        >
                            {/* Left: Mini Profile */}
                            <div className="flex items-center gap-3">
                                {currentUser?.avatar ? (
                                    <img src={currentUser.avatar} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                        {currentUser?.username?.substring(0, 2).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <span className="text-sm font-medium text-white max-w-[80px] truncate">
                                    {currentUser?.username?.split(' ')[0] || 'User'}
                                </span>
                            </div>
                            
                            {/* Right: Hint Icons */}
                            <div className="flex items-center gap-2 text-white/30">
                                <Settings size={14} />
                                <Keyboard size={14} />
                                <MessageSquare size={14} />
                                <Shield size={14} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </motion.aside>

      {/* ✅ Feedback Modal Rendering */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
        userId={currentUser?.id}
      />
    </>
  );
};
