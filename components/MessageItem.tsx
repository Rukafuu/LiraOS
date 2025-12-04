import React, { memo } from 'react';
import { User, Loader2, Copy, Check, Volume2, VolumeX, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import liraLogo from '../src/assets/lira-logo.png';

interface MessageItemProps {
  message: Message;
  isCompactMode: boolean;
  copiedMessageId: string | null;
  speakingMessageId: string | null;
  onCopyText: (text: string, messageId: string) => void;
  onSpeakText: (text: string, messageId: string) => void;
  onStopSpeaking: () => void;
}

const MessageItem = memo<MessageItemProps>(({ 
  message, 
  isCompactMode, 
  copiedMessageId, 
  speakingMessageId, 
  onCopyText, 
  onSpeakText, 
  onStopSpeaking 
}) => {
  return (
    <div className={`group flex gap-${isCompactMode ? '3' : '4'} max-w-4xl mx-auto ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`
        shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm mt-1 relative overflow-hidden
        ${message.role === 'user' 
          ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
          : 'bg-white/20 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-rose-500/20'
        }
      `}>
        {message.role === 'user' ? (
          <User size={20} />
        ) : (
          <div className="relative w-full h-full">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-rose-400/20 dark:bg-rose-500/30 rounded-full blur-sm animate-pulse"></div>
            
            {/* Logo */}
            <img
              src={liraLogo}
              alt="Lira"
              className={`w-full h-full object-contain transition-all duration-300 ${
                message.role === 'model' && message.isStreaming
                  ? 'animate-pulse'
                  : ''
              } ${
                'filter brightness-110 contrast-110'
              }`}
            />
            
            {/* Overlay for breathing effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-300/10 to-orange-200/10 dark:from-rose-500/20 dark:to-rose-700/20 mix-blend-soft-light rounded-full"></div>
          </div>
        )}
      </div>

      <div className={`flex flex-col gap-2 max-w-[80%] md:max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
        
        {/* Attachments rendering in chat history */}
        {message.attachments && message.attachments.length > 0 && (
           <div className="flex flex-wrap gap-2 mb-1">
              {message.attachments.map((att, i) => (
                <div key={i} className="relative group overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
                   {att.type === 'image' ? (
                     <img 
                       src={`data:${att.mimeType};base64,${att.data}`} 
                       alt="Attachment" 
                       className="h-32 w-auto object-cover rounded-md"
                     />
                   ) : (
                     <div className="flex items-center gap-2 p-2 h-16 w-32 bg-slate-50 dark:bg-slate-800 rounded-md">
                        <FileText className="text-rose-400" size={20} />
                        <span className="text-xs truncate text-slate-600 dark:text-slate-300 w-full">{att.name}</span>
                     </div>
                   )}
                </div>
              ))}
           </div>
        )}

        <div className={`
          p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed
          ${message.role === 'user' 
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-none' 
            : 'bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30 text-slate-800 dark:text-slate-200 rounded-tl-none'
          }
        `}>
          {message.role === 'model' && message.isStreaming && !message.text ? (
            <div className="flex items-center gap-2 text-rose-400">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-xs">Lira is thinking...</span>
            </div>
          ) : (
            <div className="prose prose-sm md:prose-base prose-rose dark:prose-invert max-w-none break-words">
              <ReactMarkdown 
                components={{
                  // Custom styling for markdown elements if needed
                  a: ({node, ...props}) => <a {...props} className="text-rose-500 hover:underline" target="_blank" rel="noopener noreferrer" />,
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          {/* Message Actions */}
          {message.text && !message.isStreaming && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Copy Button */}
              <button
                onClick={() => onCopyText(message.text, message.id)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                title="Copiar texto"
              >
                {copiedMessageId === message.id ? <Check size={14} /> : <Copy size={14} />}
              </button>
              
              {/* TTS Button - Only for model messages */}
              {message.role === 'model' && (
                <button
                  onClick={() => speakingMessageId === message.id ? onStopSpeaking() : onSpeakText(message.text, message.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  title={speakingMessageId === message.id ? "Parar áudio" : "Ouvir texto"}
                >
                  {speakingMessageId === message.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
