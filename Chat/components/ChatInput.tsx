import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Square, ArrowUp, X, FileText, Mic, AlertCircle, Brain, Zap, Volume2, VolumeX, ChevronDown, Check } from 'lucide-react';
import { VoiceButton } from './ui/VoiceButton';
import { PREMIUM_VOICES } from '../services/lira_voice';
import { Attachment } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { processFile, validateFileForUpload, logFileProcessing } from '../services/fileService';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  onSendMessage: (message: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  onStop: () => void;
  onEditLastMessage: () => void;
  selectedModel?: 'mistral' | 'xiaomi';
  onModelChange?: (model: 'mistral' | 'xiaomi') => void;
  isDeepMode?: boolean;
  onToggleDeepMode?: () => void;
  onOpenLegal?: () => void;
  onOpenCookies?: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading,
  onStop,
  onEditLastMessage,
  selectedModel = 'mistral',
  onModelChange,
  isDeepMode = false,
  onToggleDeepMode,
  onOpenLegal,
  onOpenCookies,
  voiceEnabled = false,
  onToggleVoice
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const { t } = useTranslation();
  
  // Voice Settings
  // Voice enabled state is now controlled by parent (App.tsx)
  const [autoSendVoice, setAutoSendVoice] = useState(() => localStorage.getItem('lira_auto_send_voice') !== 'false'); // Default true
  const [selectedVoiceId, setSelectedVoiceId] = useState(localStorage.getItem('lira_premium_voice_id') || PREMIUM_VOICES[0].id);

  const toggleAutoSend = () => {
    const newVal = !autoSendVoice;
    setAutoSendVoice(newVal);
    localStorage.setItem('lira_auto_send_voice', String(newVal));
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'ArrowUp' && input === '' && attachments.length === 0) {
        e.preventDefault();
        onEditLastMessage();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await attachFiles(e.target.files);
    }
  };

  const removeAttachment = (id: string) => {
     setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleVoiceInput = (text: string) => {
    if (autoSendVoice) {
      if (!text.trim()) return;
      onSendMessage(text, attachments);
      setInput('');
      setAttachments([]);
    } else {
      setInput(text);
      setTimeout(() => {
          if (textareaRef.current) {
               textareaRef.current.style.height = 'auto';
               textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
               textareaRef.current.focus();
          }
      }, 10);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
     if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
     }
  }, [input]);

  const attachFiles = async (files: FileList | File[]) => {
    const newAttachments: Attachment[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      const validation = validateFileForUpload(file);
      if (!validation.isValid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }
      try {
        const result = await processFile(file);
        logFileProcessing(result);
        if (result.success) {
          const previewUrl = result.imageData || result.text || result.base64 || '';
          newAttachments.push({
            id: uuidv4(),
            file,
            previewUrl,
            type: result.type,
            name: result.name,
            size: result.size
          });
        } else {
          errors.push(`${file.name}: ${result.error}`);
        }
      } catch {
        errors.push(`${file.name}: Failed to process file`);
      }
    }
    if (errors.length > 0) {
      setFileErrors(errors);
      errors.forEach(error => addToast(error, 'error'));
    } else {
      setFileErrors([]);
    }
    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
      addToast(t('chat_input.toast_attached', { count: newAttachments.length }), 'success');
    }
  };
  
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    const files: File[] = [];
    for (const item of items as any) {
      if (item.kind === 'file') {
        const blob = item.getAsFile();
        if (blob) {
          const f = new File([blob], blob.type.startsWith('image/') ? `pasted-image.${blob.type.split('/')[1]}` : 'pasted-file', { type: blob.type });
          files.push(f);
        }
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await attachFiles(files);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const dt = e.dataTransfer;
    if (dt?.files && dt.files.length > 0) {
      await attachFiles(dt.files);
    }
  };

  return (
    <div className="w-full pb-6 md:pb-6 px-2 md:px-4 z-20">
      <div className="max-w-3xl mx-auto relative">
        <style>{`
          @keyframes neon-pulse {
            0% { box-shadow: 0 0 5px rgba(56,189,248,0.2), inset 0 0 10px rgba(0,0,0,0.5); border-color: rgba(56,189,248,0.3); }
            50% { box-shadow: 0 0 20px rgba(56,189,248,0.4), inset 0 0 10px rgba(0,0,0,0.5); border-color: rgba(56,189,248,0.6); }
            100% { box-shadow: 0 0 5px rgba(56,189,248,0.2), inset 0 0 10px rgba(0,0,0,0.5); border-color: rgba(56,189,248,0.3); }
          }
          .input-glow-active {
            animation: neon-pulse 3s infinite ease-in-out;
          }
        `}</style>
        
        {/* Attachments Preview Area */}
        {attachments.length > 0 && (
           <div className="flex gap-2 mb-3 overflow-x-auto py-1 pl-1 no-scrollbar">
              {attachments.map(att => (
                 <div key={att.id} className="relative group flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-black/40 shadow-sm">
                    <button 
                      onClick={() => removeAttachment(att.id)}
                      className="absolute top-0.5 right-0.5 bg-black/70 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      aria-label="Remove attachment"
                    >
                       <X size={10} />
                    </button>
                    {att.type === 'image' ? (
                       <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FileText size={16} />
                       </div>
                    )}
                 </div>
              ))}
           </div>
        )}
        
        {/* Main Input Bar */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
          relative flex items-end gap-1 md:gap-2 p-1.5 md:p-2 
          bg-[#18181b] rounded-[26px] 
          transition-all duration-300 border
          ${isFocused 
            ? 'input-glow-active' 
            : 'border-white/10 shadow-premium'
          }
          ${isDragOver ? 'ring-2 ring-lira-blue/40 bg-white/5' : ''}
        `}>
          <input 
             type="file" 
             multiple 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileSelect}
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all mb-0.5 md:mb-1 ml-0.5 md:ml-1 flex-shrink-0"
            title={t('chat_input.attach_tooltip')}
          >
            <Plus size={18} strokeWidth={2} />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t('chat_input.placeholder')}
            rows={1}
            className="
              flex-1 bg-transparent text-white placeholder-gray-500 
              text-[14px] md:text-[15px] outline-none resize-none py-2 md:py-2.5 max-h-[200px]
              scrollbar-thin leading-relaxed self-center min-w-0
            "
          />

          <div className="flex gap-1 mb-0.5 md:mb-1 mr-0.5 md:mr-1 items-center flex-shrink-0">
             
             {/* 1. Mic Button */}
             <VoiceButton onTranscript={handleVoiceInput} />
             
             {/* 2. Mode Pill (Dropdown Trigger) */}
             <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`
                    h-8 md:h-9 px-2 md:px-3 rounded-full flex items-center gap-1.5 md:gap-2 text-xs font-medium transition-all
                    ${showMenu ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}
                  `}
                >
                  {selectedModel === 'mistral' ? (
                     <Brain size={14} className="text-purple-400" />
                  ) : (
                     <Zap size={14} className="text-green-400" />
                  )}
                  <span className="hidden sm:inline">{selectedModel === 'mistral' ? t('chat_input.pro') : t('chat_input.premium')}</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute bottom-full mb-2 right-0 w-64 glass-panel border border-white/10 rounded-xl p-3 z-50 bg-[#121214] shadow-2xl animate-fade-in origin-bottom-right">
                       
                       {/* Model Selection */}
                       <div className="mb-3">
                         <div className="text-[10px] uppercase text-gray-500 font-bold px-1 mb-1">{t('chat_input.model')}</div>
                         <div className="space-y-1">
                           <button
                             onClick={() => { onModelChange?.('mistral'); setShowMenu(false); }}
                             className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${selectedModel === 'mistral' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-300'}`}
                           >
                             <Brain size={16} className="text-purple-400" />
                             <div className="flex-1 text-left">
                               <div>{t('chat_input.pro')}</div>
                               <div className="text-[10px] text-gray-500">{t('chat_input.pro_desc')}</div>
                             </div>
                             {selectedModel === 'mistral' && <Check size={14} className="text-purple-400" />}
                           </button>
                           
                           <button
                             onClick={() => { onModelChange?.('xiaomi'); setShowMenu(false); }}
                             className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${selectedModel === 'xiaomi' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-300'}`}
                           >
                             <Zap size={16} className="text-green-400" />
                             <div className="flex-1 text-left">
                               <div>{t('chat_input.premium')}</div>
                               <div className="text-[10px] text-gray-500">{t('chat_input.premium_desc')}</div>
                             </div>
                             {selectedModel === 'xiaomi' && <Check size={14} className="text-green-400" />}
                           </button>
                         </div>
                       </div>

                       {/* Options */}
                       <div className="border-t border-white/5 pt-2 mb-2">
                          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={onToggleDeepMode}>
                             <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Zap size={14} className={isDeepMode ? 'text-lira-blue' : 'text-gray-500'} />
                                <span>{t('chat_input.deep_mode')}</span>
                             </div>
                             <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isDeepMode ? 'bg-lira-blue' : 'bg-white/10'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isDeepMode ? 'translate-x-4' : ''}`} />
                             </div>
                          </div>
                          
                          {/* Auto-Send Voice Toggle */}
                          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={toggleAutoSend}>
                             <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Mic size={14} className={autoSendVoice ? 'text-lira-pink' : 'text-gray-500'} />
                                <span>{t('chat_input.voice_mode')}</span>
                             </div>
                             <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${autoSendVoice ? 'bg-lira-pink' : 'bg-white/10'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${autoSendVoice ? 'translate-x-4' : ''}`} />
                             </div>
                          </div>
                       </div>

                       {/* Voice Settings */}
                       <div className="border-t border-white/5 pt-2">
                          <div className="text-[10px] uppercase text-gray-500 font-bold px-1 mb-1">{t('chat_input.voice_output')}</div>
                          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={onToggleVoice}>
                             <div className="flex items-center gap-2 text-sm text-gray-300">
                                {voiceEnabled ? <Volume2 size={14} className="text-lira-pink" /> : <VolumeX size={14} className="text-gray-500" />}
                                <span>{t('chat_input.read_aloud')}</span>
                             </div>
                             <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${voiceEnabled ? 'bg-lira-pink' : 'bg-white/10'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${voiceEnabled ? 'translate-x-4' : ''}`} />
                             </div>
                          </div>
                          
                          {/* Premium Voice Selector */}
                          {voiceEnabled && selectedModel === 'xiaomi' && (
                             <div className="mt-2 pl-2 border-l-2 border-white/5 ml-2">
                               {PREMIUM_VOICES.map(v => (
                                 <button
                                   key={v.id}
                                   onClick={() => {
                                     setSelectedVoiceId(v.id);
                                     localStorage.setItem('lira_premium_voice_id', v.id);
                                     addToast(`Voice: ${v.name}`, 'info');
                                   }}
                                   className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 ${selectedVoiceId === v.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                 >
                                   <div className={`w-1.5 h-1.5 rounded-full ${selectedVoiceId === v.id ? 'bg-lira-pink' : 'bg-gray-600'}`} />
                                   <span>{v.name}</span>
                                 </button>
                               ))}
                             </div>
                          )}
                       </div>

                    </div>
                  </>
                )}
             </div>

             {/* 3. Send Button */}
             {isLoading ? (
                <button 
                  onClick={onStop}
                  className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-200 transition-colors shadow-lg flex-shrink-0"
                >
                  <Square size={14} fill="currentColor" />
                </button>
             ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={!input.trim() && attachments.length === 0}
                  className={`
                    w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0
                    ${(input.trim() || attachments.length > 0) 
                      ? 'bg-white text-black shadow-lg hover:bg-gray-200 active:scale-95' 
                      : 'bg-white/10 text-gray-500 cursor-not-allowed'}
                  `}
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
             )}
          </div>
          
          {isDragOver && (
            <div className="absolute inset-0 rounded-[26px] border border-lira-blue/40 pointer-events-none bg-lira-blue/5">
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-lira-blue">{t('chat_input.drop_files')}</div>
            </div>
          )}
        </div>
        
        {/* Footer Disclaimer */}
        <div className="text-center text-[10px] text-gray-500 mt-2 pb-2">
            <span>{t('footer.disclaimer_text')}</span>
        </div>
      </div>
    </div>
  );
};
