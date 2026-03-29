import React, { useState, useEffect } from 'react';
import { Brain, Lightning, SignOut, Headset, SpeakerHigh, SpeakerSlash, Browser, Eye, Airplay, ChartBar, Desktop, Pulse } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarPulse } from './ui/AvatarPulse';
import { useTranslation } from 'react-i18next';
import { CompactSystemStats } from './CompactSystemStats';

interface ChatHeaderProps {
  title: string;
  isMobile: boolean;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  status: 'idle' | 'generating';
  backendStatus?: 'online' | 'offline' | 'checking';
  onStop?: () => void;
  isGenerating?: boolean;
  isDeepMode?: boolean;
  selectedModel?: 'mistral' | 'xiaomi';
  onModelChange?: (model: 'mistral' | 'xiaomi') => void;
  onToggleDeepMode?: () => void;
  displayName?: string;
  avatarUrl?: string;
  onLogout?: () => void;
  onStartVoiceCall?: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  title, 
  isMobile, 
  onToggleSidebar, 
  isSidebarOpen,
  status,
  backendStatus = 'online',
  onStop,
  onLogout,
  onStartVoiceCall,
  voiceEnabled,
  onToggleVoice
}) => {
  const { t } = useTranslation();
  const [showStats, setShowStats] = useState(() => localStorage.getItem('lira_show_telemetry') === 'true');

  const toggleStats = () => {
    const newVal = !showStats;
    setShowStats(newVal);
    localStorage.setItem('lira_show_telemetry', String(newVal));
  };


  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-x-0 border-t-0 border-b border-white/5 backdrop-blur-3xl">
      <div className="mx-auto px-2 md:px-5 h-14 md:h-18 flex items-center justify-between">
        
        <div className="flex items-center min-w-0 flex-1 gap-2 md:gap-4">
            <button 
              onClick={onToggleSidebar}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors focus:outline-none z-50 flex-shrink-0"
              aria-label={t('common.toggle_sidebar')}
            >
              <div className="w-5 h-3.5 relative flex flex-col justify-between">
                <motion.span 
                  animate={isSidebarOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-0.5 bg-gray-400 block rounded-full origin-center"
                />
                <motion.span 
                  animate={isSidebarOpen ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-0.5 bg-gray-400 block rounded-full"
                />
                <motion.span 
                  animate={isSidebarOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-0.5 bg-gray-400 block rounded-full origin-center"
                />
              </div>
            </button>
          
          <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
             <div className="hidden sm:block">
                <AvatarPulse status={status} size="sm" />
             </div>
             
             <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                    <motion.h2 
                        key={title}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="font-bold text-sm md:text-base text-white truncate max-w-[120px] sm:max-w-[200px] lg:max-w-md"
                    >
                        {title}
                    </motion.h2>
                    
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      backendStatus === 'online' ? 'bg-green-400' : 
                      backendStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
                    }`} />
                    <span className="text-[10px] text-gray-500 font-medium">
                      {backendStatus === 'online' ? t('chat_header.status_on') : backendStatus === 'offline' ? t('chat_header.status_off') : t('chat_header.status_chk')}
                    </span>
                  </div>

                  <span className={`text-[10px] uppercase tracking-tighter font-bold transition-colors ${status === 'generating' ? 'text-lira-pink' : 'text-blue-400/60'}`}>
                    {status === 'generating' ? t('chat_header.thinking') : t('chat_header.online')}
                  </span>
                </div>
             </div>
          </div>
        </div>

          <div className="flex items-center gap-1 sm:gap-3 ml-2">
            
            {/* Toggleable Telemetry (Moved to right section) */}
            <AnimatePresence>
                {showStats && !isMobile && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mr-2"
                    >
                        <CompactSystemStats />
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={toggleStats}
                className={`p-2 sm:p-2.5 rounded-xl transition-all ${showStats ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title={t('chat_header.toggle_telemetry') || "Toggle Telemetry"}
            >
                <Desktop size={18} className="sm:w-5 sm:h-5" />
            </button>

            {onToggleVoice && (
              <button
                onClick={onToggleVoice}
                className={`p-2 sm:p-2.5 rounded-xl transition-all ${voiceEnabled ? 'text-green-400 bg-green-400/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title={voiceEnabled ? t('chat_header.voice_disable') : t('chat_header.voice_enable')}
              >
                {voiceEnabled ? <SpeakerHigh size={18} className="sm:w-5 sm:h-5" /> : <SpeakerSlash size={18} className="sm:w-5 sm:h-5" />}
              </button>
            )}

          {onLogout && (
            <button 
                onClick={onLogout} 
                className="p-2 sm:p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all" 
                title={t('chat_header.logout')}
            >
              <SignOut size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </header>
  );
};
