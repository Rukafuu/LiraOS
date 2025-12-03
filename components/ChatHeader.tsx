import React, { memo } from 'react';
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Sparkles, 
  Loader2, 
  RefreshCw, 
  Minimize2, 
  Sun, 
  Moon 
} from 'lucide-react';

interface ChatHeaderProps {
  showHistorySidebar: boolean;
  activeSessionTitle: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  messageCount: number;
  isLoading: boolean;
  isCompactMode: boolean;
  isDarkMode: boolean;
  canRegenerate: boolean;
  onToggleSidebar: () => void;
  onRegenerateResponse: () => void;
  onToggleCompactMode: () => void;
  onToggleDarkMode: () => void;
}

const ChatHeader = memo<ChatHeaderProps>(({ 
  showHistorySidebar,
  activeSessionTitle,
  connectionStatus,
  messageCount,
  isLoading,
  isCompactMode,
  isDarkMode,
  canRegenerate,
  onToggleSidebar,
  onRegenerateResponse,
  onToggleCompactMode,
  onToggleDarkMode
}) => {
  return (
    <header className="h-16 px-6 border-b border-rose-100 dark:border-rose-900/20 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {showHistorySidebar ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
        <div className="flex-1">
           <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
             {activeSessionTitle}
             <Sparkles size={16} className="text-yellow-400 animate-pulse" />
           </h2>
           <div className="flex items-center gap-4 text-xs">
             <div className="flex items-center gap-1 text-rose-400 dark:text-rose-500 font-medium">
               <div className={`w-2 h-2 rounded-full animate-pulse ${
                 connectionStatus === 'connected' ? 'bg-green-400' 
                 : connectionStatus === 'connecting' ? 'bg-yellow-400'
                 : 'bg-red-400'
               }`}></div>
               <span>
                 {connectionStatus === 'connected' ? 'LiraOS Conectado' 
                  : connectionStatus === 'connecting' ? 'Conectando...'
                  : 'Desconectado'}
               </span>
             </div>
             <span className="text-slate-400 dark:text-slate-500">
               {messageCount} mensagens
             </span>
             {isLoading && (
               <div className="flex items-center gap-1 text-rose-400">
                 <Loader2 size={12} className="animate-spin" />
                 <span>Gerando resposta...</span>
               </div>
             )}
           </div>
        </div>
      </div>
      
      {/* Header Actions */}
      <div className="flex items-center gap-2">
        {/* Regenerate Button */}
        {canRegenerate && !isLoading && (
          <button
            onClick={onRegenerateResponse}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
            title="Regenerar última resposta"
          >
            <RefreshCw size={18} />
          </button>
        )}
        
        {/* Compact Mode Toggle */}
        <button
          onClick={onToggleCompactMode}
          className={`p-2 rounded-lg transition-colors ${
            isCompactMode 
              ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' 
              : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
          }`}
          title={isCompactMode ? "Desativar modo compacto" : "Ativar modo compacto"}
        >
          <Minimize2 size={18} />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
          title={isDarkMode ? "Modo claro" : "Modo escuro"}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
});

ChatHeader.displayName = 'ChatHeader';

export default ChatHeader;
