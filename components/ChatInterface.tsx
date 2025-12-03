import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, X, Zap } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import ChatErrorBoundary from './ChatErrorBoundary';
import SidebarSessions from './SidebarSessions';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatInterface: React.FC = () => {
  // Use the custom chat hook for all chat logic
  const {
    sessions,
    activeSession,
    activeSessionId,
    messages,
    isLoading,
    createNewSession,
    selectSession,
    deleteSession,
    sendMessage,
    regenerateLastResponse,
    clearActiveSessionMessages,
    renameActiveSession,
    exportActiveSession
  } = useChat();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);
  const [inputText, setInputText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  // Enhanced UI States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [connectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowHistorySidebar(false);
      } else {
        setShowHistorySidebar(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoized filtered sessions for performance
  const filteredSessions = useMemo(() => 
    sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [sessions, searchQuery]
  );

  // Message count for header
  const messageCount = useMemo(() => 
    messages.filter(m => m.role === 'user').length,
    [messages]
  );

  // Toast notification system
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // UI Action Handlers
  const handleToggleSidebar = useCallback(() => {
    setShowHistorySidebar(prev => !prev);
  }, []);

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', newMode);
      }
      return newMode;
    });
  }, []);

  const handleToggleCompactMode = useCallback(() => {
    setIsCompactMode(prev => {
      const newMode = !prev;
      showToast(newMode ? 'Modo compacto ativado' : 'Modo normal ativado', 'info');
      return newMode;
    });
  }, [showToast]);

  // Message Actions
  const handleCopyText = useCallback(async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      showToast('Texto copiado!', 'success');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast('Erro ao copiar texto', 'error');
    }
  }, [showToast]);

  const handleSpeakText = useCallback((text: string, messageId: string) => {
    if (!window.speechSynthesis) return;

    // Stop current speech if playing
    if (speakingMessageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      if (speakingMessageId === messageId) return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    
    utterance.onstart = () => setSpeakingMessageId(messageId);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  }, [speakingMessageId]);

  const handleStopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
  }, []);

  const handleSendMessage = useCallback((text: string, attachments: any[]) => {
    sendMessage(text, attachments);
    setInputText('');
  }, [sendMessage]);

  const handleRegenerateResponse = useCallback(async () => {
    showToast('Regenerando resposta...', 'info');
    try {
      await regenerateLastResponse();
      showToast('Resposta regenerada com sucesso', 'success');
    } catch (error) {
      showToast('Erro ao regenerar resposta', 'error');
    }
  }, [regenerateLastResponse, showToast]);

  // Utility function to download JSON file
  const downloadJSON = useCallback((data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Slash command handler
  const handleSlashCommand = useCallback((command: string, args: string) => {
    switch (command.toLowerCase()) {
      case 'clear':
        clearActiveSessionMessages();
        showToast('Sessão limpa', 'success');
        break;
      
      case 'new':
        createNewSession();
        showToast('Nova sessão criada', 'success');
        break;
      
      case 'title':
        if (args.trim()) {
          renameActiveSession(args.trim());
          showToast(`Título alterado para: ${args.trim()}`, 'success');
        } else {
          showToast('Use: /title <novo título>', 'error');
        }
        break;
      
      case 'export':
        const sessionData = exportActiveSession();
        if (sessionData) {
          const filename = `liraos-chat-${activeSession?.id || 'session'}.json`;
          downloadJSON(sessionData, filename);
          showToast(`Conversa exportada: ${filename}`, 'success');
        } else {
          showToast('Erro ao exportar conversa', 'error');
        }
        break;
      
      default:
        showToast(`Comando desconhecido: /${command}`, 'error');
        break;
    }
  }, [clearActiveSessionMessages, createNewSession, renameActiveSession, exportActiveSession, activeSession?.id, showToast, downloadJSON]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea (except for specific cases)
      const isInInput = (e.target as HTMLElement)?.tagName === 'INPUT' || 
                       (e.target as HTMLElement)?.tagName === 'TEXTAREA';

      // Ctrl + N - New session
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        createNewSession();
        showToast('Nova sessão criada', 'info');
        return;
      }

      // Ctrl + Shift + C - Clear session
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        clearActiveSessionMessages();
        showToast('Sessão limpa', 'info');
        return;
      }

      // Ctrl + K - Focus search (only when not in input)
      if (e.ctrlKey && e.key === 'k' && !isInInput) {
        e.preventDefault();
        // Focus the search input in sidebar
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          showToast('Busca ativada', 'info');
        }
        return;
      }

      // Esc - Clear selections/close modals
      if (e.key === 'Escape') {
        // Clear any selections or close modals if needed
        setSpeakingMessageId(null);
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewSession, clearActiveSessionMessages, showToast]);

  const canRegenerate = messages.length > 1;

  return (
    <ChatErrorBoundary>
      <div className="flex h-full w-full bg-white dark:bg-slate-900 overflow-hidden relative transition-colors duration-300">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className={`
            fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm border
            transform transition-all duration-300 animate-in slide-in-from-top-2
            ${toastType === 'success' 
              ? 'bg-green-50/90 dark:bg-green-900/90 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : toastType === 'error'
              ? 'bg-red-50/90 dark:bg-red-900/90 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-blue-50/90 dark:bg-blue-900/90 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
            }
          `}>
            <div className="flex items-center gap-2">
              {toastType === 'success' && <Check size={16} />}
              {toastType === 'error' && <X size={16} />}
              {toastType === 'info' && <Zap size={16} />}
              <span className="text-sm font-medium">{toastMessage}</span>
              <button 
                onClick={() => setToastMessage(null)}
                className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* History Sidebar */}
        <SidebarSessions
          sessions={filteredSessions}
          activeSessionId={activeSessionId}
          searchQuery={searchQuery}
          showHistorySidebar={showHistorySidebar}
          onSearchChange={setSearchQuery}
          onSelectSession={selectSession}
          onDeleteSession={deleteSession}
          onCreateNewSession={createNewSession}
        />

        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${showHistorySidebar ? 'lg:ml-0' : 'lg:ml-0'}`}>
          
          {/* Header */}
          <ChatHeader
            showHistorySidebar={showHistorySidebar}
            activeSessionTitle={activeSession?.title || 'New Conversation'}
            connectionStatus={connectionStatus}
            messageCount={messageCount}
            isLoading={isLoading}
            isCompactMode={isCompactMode}
            isDarkMode={isDarkMode}
            canRegenerate={canRegenerate}
            onToggleSidebar={handleToggleSidebar}
            onRegenerateResponse={handleRegenerateResponse}
            onToggleCompactMode={handleToggleCompactMode}
            onToggleDarkMode={handleToggleDarkMode}
          />

          {/* Messages */}
          <MessageList
            messages={messages}
            isCompactMode={isCompactMode}
            copiedMessageId={copiedMessageId}
            speakingMessageId={speakingMessageId}
            onCopyText={handleCopyText}
            onSpeakText={handleSpeakText}
            onStopSpeaking={handleStopSpeaking}
          />

          {/* Input Area */}
          <ChatInput
            inputText={inputText}
            isLoading={isLoading}
            onInputChange={setInputText}
            onSendMessage={handleSendMessage}
            onSlashCommand={handleSlashCommand}
          />
        </div>
      </div>
    </ChatErrorBoundary>
  );
};

export default ChatInterface;
