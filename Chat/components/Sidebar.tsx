import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Search, Settings, X, Trash2, Sparkles, Command, LayoutGrid, ShoppingBag, Keyboard, Shield, Video, Crown, Gamepad2 } from 'lucide-react';
import { ChatSession } from '../types';
import { LIRA_AVATAR } from '../constants';
import { getCurrentUser } from '../services/userService';
import { useTranslation } from 'react-i18next';

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
  onOpenSupporters: () => void;
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
  onOpenSupporters,
  isOpen,
  onCloseMobile
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

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
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 h-full' : 'relative h-full'}
          bg-[#0c0c0e] border-r border-white/5
          flex flex-col overflow-hidden
        `}
      >
        <div className="w-[260px] h-full flex flex-col min-w-[260px]">
            {/* Header / Brand */}
            <div className="px-4 py-5 flex items-center justify-between">
                <div className="flex items-center space-x-2.5 opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="w-6 h-6 rounded-md overflow-hidden bg-white/10 flex items-center justify-center border border-white/10">
                        <img src={LIRA_AVATAR} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-semibold text-sm tracking-tight text-white">LiraOS</span>
                </div>
                
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => {
                            onNewChat();
                            if(isMobile) onCloseMobile();
                        }}
                        className="p-1.5 rounded-lg text-lira-dim hover:text-white hover:bg-white/10 transition-colors"
                        title={t('sidebar.new_chat')}
                    >
                        <Plus size={18} />
                    </button>
                    {isMobile && (
                        <button onClick={onCloseMobile} className="p-1.5 text-lira-dim hover:text-white">
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Meus Itens */}
            <div className="px-6 py-2">
                <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">{t('sidebar.my_items')}</span>
            </div>
            <div className="px-3 mb-2 space-y-0.5">
                <button 
                    onClick={onOpenDashboard}
                    className="w-full text-left flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <LayoutGrid size={14} />
                    <span>{t('sidebar.dashboard')}</span>
                </button>
                <button 
                    onClick={onOpenStore}
                    className="w-full text-left flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <ShoppingBag size={14} />
                    <span>{t('sidebar.store')}</span>
                </button>
                <button 
                    onClick={onOpenIris}
                    className="w-full text-left flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                    <Video size={14} className="text-purple-400" />
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:text-white transition-colors">{t('sidebar.iris')}</span>
                </button>
                <button 
                    onClick={onOpenDiscord}
                    className="w-full text-left flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                    <MessageSquare size={14} className="text-[#5865F2]" />
                    <span className="group-hover:text-[#5865F2] transition-colors">{t('sidebar.discord_hub')}</span>
                </button>
                <button 
                    onClick={onOpenGamer}
                    className="w-full text-left flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
                >
                    <Gamepad2 size={14} className="text-emerald-500" />
                    <span className="group-hover:text-emerald-500 transition-colors">Gamer Mode</span>
                </button>
                <div className="relative group pt-2 pb-1">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-[2px] text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-transparent focus:border-white/10 focus:bg-white/10 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-gray-600 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Conversas */}
            <div className="px-6 py-2">
                <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">{t('sidebar.conversations')}</span>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 space-y-0.5 scrollbar-thin">
                {filteredSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 text-xs">
                        No conversations yet
                    </div>
                ) : (
                    filteredSessions.map((session) => (
                    <div key={session.id} className="group relative">
                        <button
                        onClick={() => {
                            onSelectSession(session.id);
                            if (isMobile) onCloseMobile();
                        }}
                        className={`
                            w-full text-left flex items-center space-x-2 px-3 py-2 rounded-lg text-[12px] transition-all duration-200
                            ${currentSessionId === session.id 
                            ? 'bg-white/10 text-white' 
                            : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}
                        `}
                        >
                            <span className="truncate flex-1 pr-6">{session.title || 'Untitled'}</span>
                        </button>
                        
                        {/* Hover Actions */}
                        <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center ${currentSessionId === session.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session.id);
                                }}
                                className="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5 flex gap-1">
                <button 
                    onClick={onOpenSettings}
                    className="flex-1 flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all group min-w-0"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center border border-white/10 text-xs text-white overflow-hidden flex-shrink-0">
                       {currentUser?.avatar ? (
                         <img 
                           src={currentUser.avatar} 
                           alt="Avatar" 
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <span className="text-sm font-bold">
                           {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                         </span>
                       )}
                    </div>
                    <div className="flex-1 text-left min-w-0 truncate">
                        <div className="text-xs font-medium truncate">
                          {currentUser?.username || 'User'}
                        </div>
                        <div className="text-[10px] text-lira-dim">{t('sidebar.pro_plan')}</div>
                    </div>
                    <Settings size={16} />
                </button>
                
                <button 
                    onClick={onOpenSupporters}
                    className="p-2 rounded-lg text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors flex items-center justify-center w-10"
                    title="Hall of Fame"
                >
                    <Crown size={18} />
                </button>
            </div>
        </div>
      </motion.aside>
    </>
  );
};
