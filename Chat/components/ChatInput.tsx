import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperPlaneRight, 
  Plus, 
  Square, 
  ArrowUp, 
  X, 
  FileText, 
  Microphone, 
  WarningCircle, 
  Brain, 
  Lightning, 
  SpeakerHigh, 
  SpeakerSlash, 
  CaretDown, 
  Check, 
  Pulse,
  Camera
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
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
  onOpenCookies?: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  onTakeSelfie?: () => void;
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
  onOpenCookies,
  voiceEnabled = false,
  onToggleVoice,
  onTakeSelfie
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
  
  // Voice settings managed via parent

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
    const autoSendVoice = localStorage.getItem('lira_auto_send_voice') !== 'false';
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
    <div className="w-full pb-3 md:pb-8 px-1 md:px-6 z-20">
      <div className="max-w-3xl mx-auto relative">
        
        {/* Attachments Preview Area */}
        {attachments.length > 0 && (
           <div className="flex gap-2 mb-3 overflow-x-auto py-2 pl-1 no-scrollbar animate-in slide-in-from-bottom-2 duration-300">
              {attachments.map(att => (
                 <div key={att.id} className="relative group flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-xl ring-1 ring-white/5">
                    <button 
                      onClick={() => removeAttachment(att.id)}
                      className="absolute top-1 right-1 bg-black/80 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
                      aria-label={t('common.remove')}
                    >
                       <X size={12} weight="bold" />
                    </button>
                    {att.type === 'image' ? (
                       <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1 bg-white/5">
                          <FileText size={20} weight="duotone" />
                          <span className="text-[8px] truncate max-w-full px-1">{att.name}</span>
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
          relative flex items-end gap-1 md:gap-2 p-1.5 md:p-2.5
          bg-[#121214]/90 backdrop-blur-xl rounded-[28px] md:rounded-[32px] 
          transition-all duration-300 border shadow-2xl
          ${isFocused 
            ? 'border-white/20 ring-4 ring-white/5' 
            : 'border-white/10'
          }
          ${isDragOver ? 'ring-2 ring-blue-500/40 bg-blue-500/5' : ''}
        `}>
          <input 
             type="file" 
             multiple 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileSelect}
          />
          
          <div className="flex items-center gap-1 md:gap-2">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex-shrink-0"
                title={t('chat_input.attach_tooltip')}
            >
                <Plus size={20} weight="bold" />
            </button>
            <button 
                onClick={onTakeSelfie}
                className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex-shrink-0"
                title="Take a Selfie with Lira"
            >
                <Camera size={20} weight="bold" />
            </button>
          </div>

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
            autoFocus
            className="
              flex-1 bg-transparent text-white placeholder-gray-500 
              text-[15px] md:text-[16px] outline-none resize-none py-2.5 md:py-3 max-h-[250px]
              scrollbar-thin leading-relaxed self-center min-w-0
            "
          />

          <div className="flex gap-1 items-center flex-shrink-0 ml-1">
             
             {/* 1. Mic Button */}
             <VoiceButton onTranscript={handleVoiceInput} />
             
             {/* 2. Mode Pill (Dropdown Trigger) */}
             <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`
                    h-9 md:h-10 px-2 md:px-4 rounded-full flex items-center gap-2 text-xs font-bold transition-all
                    ${showMenu ? 'bg-white/10 text-white shadow-inner' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}
                  `}
                >
                  {selectedModel === 'mistral' ? (
                     <Brain size={16} weight="duotone" className="text-purple-400" />
                  ) : (
                     <Lightning size={16} weight="duotone" className="text-yellow-400" />
                  )}
                  <span className="hidden md:inline uppercase tracking-widest">{selectedModel === 'mistral' ? t('chat_input.pro') : t('chat_input.premium')}</span>
                  <CaretDown size={12} weight="bold" className={`transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                {showMenu && (
                  <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowMenu(false)} 
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute bottom-full mb-3 right-0 w-72 glass-panel border border-white/10 rounded-2xl p-4 z-50 bg-[#0c0c0e]/95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200"
                    >
                       
                       {/* Model Selection */}
                       <div className="mb-4">
                         <div className="text-[10px] uppercase text-gray-500 font-extrabold px-1 mb-2 tracking-widest">{t('chat_input.model')}</div>
                         <div className="space-y-1.5">
                           <button
                             onClick={() => { onModelChange?.('mistral'); setShowMenu(false); }}
                             className={`w-full flex items-center gap-4 p-3 rounded-xl text-sm transition-all ${selectedModel === 'mistral' ? 'bg-white/10 text-white ring-1 ring-white/10' : 'hover:bg-white/5 text-gray-400'}`}
                           >
                             <div className={`p-2 rounded-lg ${selectedModel === 'mistral' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-500'}`}>
                                <Brain size={20} weight="fill" />
                             </div>
                             <div className="flex-1 text-left">
                               <div className="font-bold">{t('chat_input.pro')}</div>
                               <div className="text-[10px] text-gray-500 line-clamp-1">{t('chat_input.pro_desc')}</div>
                             </div>
                             {selectedModel === 'mistral' && <Check size={16} weight="bold" className="text-purple-400" />}
                           </button>
                           
                           <button
                             onClick={() => { onModelChange?.('xiaomi'); setShowMenu(false); }}
                             className={`w-full flex items-center gap-4 p-3 rounded-xl text-sm transition-all ${selectedModel === 'xiaomi' ? 'bg-white/10 text-white ring-1 ring-white/10' : 'hover:bg-white/5 text-gray-400'}`}
                           >
                             <div className={`p-2 rounded-lg ${selectedModel === 'xiaomi' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-500'}`}>
                                <Lightning size={20} weight="fill" />
                             </div>
                             <div className="flex-1 text-left">
                               <div className="font-bold">{t('chat_input.premium')}</div>
                               <div className="text-[10px] text-gray-500 line-clamp-1">{t('chat_input.premium_desc')}</div>
                             </div>
                             {selectedModel === 'xiaomi' && <Check size={16} weight="bold" className="text-yellow-400" />}
                           </button>
                         </div>
                       </div>
 
                       {/* Options */}
                       <div className="border-t border-white/5 pt-3">
                          <button 
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all text-sm group"
                            onClick={onToggleDeepMode}
                          >
                             <div className="flex items-center gap-3">
                                <Pulse size={18} weight="bold" className={isDeepMode ? 'text-blue-400' : 'text-gray-500'} />
                                <span className={`font-semibold ${isDeepMode ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>{t('chat_input.deep_mode')}</span>
                             </div>
                             <div className={`w-9 h-5 rounded-full p-1 transition-all duration-300 ${isDeepMode ? 'bg-blue-500' : 'bg-white/10'}`}>
                                <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDeepMode ? 'translate-x-4' : ''}`} />
                             </div>
                          </button>
                       </div>
 
                    </motion.div>
                  </>
                )}
                </AnimatePresence>
             </div>
 
             {/* 3. Send Button */}
             {isLoading ? (
                <button 
                  onClick={onStop}
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white text-black hover:bg-red-500 hover:text-white transition-all shadow-xl flex-shrink-0 group"
                  title={t('common.stop')}
                >
                  <Square size={16} weight="fill" className="group-hover:scale-90 transition-transform" />
                </button>
             ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={!input.trim() && attachments.length === 0}
                  className={`
                    w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 flex-shrink-0
                    ${(input.trim() || attachments.length > 0) 
                      ? 'bg-white text-black shadow-white/10 hover:bg-gray-100 hover:scale-105 active:scale-95' 
                      : 'bg-white/5 text-gray-600 cursor-not-allowed'}
                  `}
                >
                  <ArrowUp size={22} weight="bold" />
                </button>
             )}
          </div>
          
          {isDragOver && (
            <div className="absolute inset-0 rounded-[32px] border-2 border-dashed border-blue-500/40 pointer-events-none bg-blue-500/5 animate-pulse flex items-center justify-center">
              <div className="text-sm font-bold text-blue-400 uppercase tracking-widest">{t('chat_input.drop_files')}</div>
            </div>
          )}
        </div>
        
        {/* Footer Disclaimer */}
        <div className="text-center text-[10px] text-gray-500 mt-3 pb-2 select-none opacity-50 px-4">
            <span>{t('footer.disclaimer_text')}</span>
        </div>
      </div>
    </div>
  );
};

