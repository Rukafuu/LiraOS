import React, { useState } from 'react';
import { Brain, Zap, LogOut, Headset, Volume2, VolumeX, AppWindow } from 'lucide-react';
import { motion } from 'framer-motion';
import { AvatarPulse } from './ui/AvatarPulse';
import { useTranslation } from 'react-i18next';

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
  isExhausted?: boolean;
  fatigue?: number;
  onToggleCompanion?: () => void;
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
  onToggleVoice,
  isExhausted,
  fatigue,
  onToggleCompanion
}) => {
  const [showModelSelector, setShowModelSelector] = useState(false);
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-x-0 border-t-0 border-b border-lira-blue/5 backdrop-blur-2xl">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        
        <div className="flex items-center">
            <button 
              onClick={onToggleSidebar}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors focus:outline-none z-50 mr-6"
              aria-label="Toggle Sidebar"
            >
              <div className="w-5 h-3.5 relative flex flex-col justify-between">
                <motion.span 
                  animate={isSidebarOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full h-0.5 bg-gray-300 block rounded-full origin-center"
                />
                <motion.span 
                  animate={isSidebarOpen ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full h-0.5 bg-gray-300 block rounded-full"
                />
                <motion.span 
                  animate={isSidebarOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="w-full h-0.5 bg-gray-300 block rounded-full origin-center"
                />
              </div>
            </button>
          
          <div className="flex items-center gap-4">
             <AvatarPulse status={status} size="sm" />
             
             <div className="flex flex-col gap-0.5">
                <motion.h2 
                  key={title}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-semibold text-sm md:text-[15px] text-white/90 truncate max-w-[200px] md:max-w-md"
                >
                  {title}
                </motion.h2>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase tracking-widest font-medium transition-colors duration-500 ${status === 'generating' ? 'text-lira-pink' : 'text-lira-blue/70'}`}>
                    {status === 'generating' ? t('chat_header.thinking') : t('chat_header.online')}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      backendStatus === 'online' ? 'bg-green-400' : 
                      backendStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
                    }`} />
                    <span className="text-[8px] text-gray-400">
                      {backendStatus === 'online' ? t('chat_header.status_on') : backendStatus === 'offline' ? t('chat_header.status_off') : t('chat_header.status_chk')}
                    </span>
                  </div>

                  {isExhausted && (
                    <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-bold tracking-wider animate-pulse">
                      EXHAUSTED
                    </span>
                  )}
                  
                  {typeof fatigue === 'number' && (
                    <div className="ml-2 flex flex-col gap-0.5 w-12" title={`Energy: ${Math.round(100 - fatigue)}%`}>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                           <div 
                              className={`h-full transition-all duration-500 ${
                                 (100 - fatigue) > 50 ? 'bg-green-400' : 
                                 (100 - fatigue) > 25 ? 'bg-yellow-400' : 'bg-red-400'
                              }`} 
                              style={{ width: `${Math.max(0, 100 - fatigue)}%` }}
                           />
                        </div>
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>

          <div className="flex items-center gap-2">
            {onToggleVoice && (
              <button
                onClick={onToggleVoice}
                className={`p-2.5 rounded-xl transition-all ${voiceEnabled ? 'text-green-400 bg-green-400/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title={voiceEnabled ? "Disable Read Aloud" : "Enable Read Aloud"}
              >
                {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
            )}
          {onStartVoiceCall && (
             <button 
               onClick={onStartVoiceCall}
               className="p-2.5 rounded-xl text-white hover:text-lira-pink hover:bg-white/5 transition-all"
               title={t('chat_header.start_call')}
             >
               <Headset size={20} />
             </button>
          )}

          {status === 'generating' && onStop && (
            <button
              onClick={onStop}
              className="p-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              title={t('chat_header.stop_generation')}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ⏹️
              </motion.div>
            </button>
          )}
          {onToggleCompanion && (
            <button 
                onClick={onToggleCompanion}
                className="p-2.5 rounded-xl text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 transition-colors hidden sm:flex items-center gap-2"
                title="Lira Companion Mode (Float)"
            >
                <AppWindow size={18} />
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title={t('chat_header.logout')}>
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lira-blue/20 to-transparent opacity-50" />
      
      {showModelSelector && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowModelSelector(false)}
        />
      )}
    </header>
  );
};
