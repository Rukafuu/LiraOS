import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Copy, Check, Edit2, RotateCcw, FileText, Brain } from 'lucide-react';
import { Message } from '../types';
import { LIRA_AVATAR } from '../constants';
import { ChatWidgetRenderer } from './ChatWidgets';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import { StreamingMessageBubble } from './chat/StreamingMessageBubble';

interface MessageItemProps {
  message: Message;
  isLast: boolean;
  onRegenerate: () => void;
  onEdit: (newContent: string) => void;
  onTTS: (text: string) => void;
  onSaveMemory: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  isLast, 
  onRegenerate,
  onEdit,
  onTTS,
  onSaveMemory
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const { addToast } = useToast();
  const { t } = useTranslation();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    addToast(t('message_item.toast_copied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast(t('message_item.toast_code_copied'), 'success');
  }

  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit(editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group w-full flex justify-start mb-6 px-4`}
    >
      <div className={`flex w-full max-w-3xl gap-4 flex-row`}>
        
        {!isUser && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 border border-white/10 shadow-sm overflow-hidden bg-[#0c0c0e]">
                <img src={LIRA_AVATAR} alt="Lira" className="w-full h-full object-cover" />
            </div>
        )}

        <div className={`flex flex-col w-full min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
            
            {/* Message Header (Name + Timestamp) */}
            <div className={`flex items-center gap-2 mb-1 h-5 flex-row`}>
               <span className="text-[13px] font-semibold text-white">
                 {isUser ? t('message_item.you') : 'Lira'}
               </span>
               <span className="text-[10px] text-lira-dim opacity-0 group-hover:opacity-100 transition-opacity select-none">
                  {formattedTime}
               </span>
            </div>

            {message.attachments && message.attachments.length > 0 && (
              <div className={`flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                 {message.attachments.map((att, idx) => (
                    <div key={idx} className="relative group overflow-hidden rounded-lg border border-white/10 bg-black/40">
                       {att.type === 'image' ? (
                          <img src={att.previewUrl} alt="attachment" className="h-28 w-auto object-cover" />
                       ) : (
                          <div className="h-16 w-32 flex flex-col items-center justify-center p-2 text-gray-400">
                             <FileText size={20} className="mb-1" />
                             <span className="text-[10px] truncate max-w-full">{att.file?.name || att.name || 'file'}</span>
                          </div>
                       )}
                    </div>
                 ))}
              </div>
            )}

            {isEditing ? (
              <div className="bg-[#18181b] border border-white/10 rounded-xl p-3 w-full text-left">
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-transparent text-white text-[15px] outline-none resize-none min-h-[80px]"
                />
                <div className="flex justify-end gap-2 mt-2">
                   <button onClick={handleCancelEdit} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-white transition-colors">
                      {t('message_item.cancel')}
                   </button>
                   <button onClick={handleSaveEdit} className="px-3 py-1.5 rounded-lg text-xs bg-white text-black font-medium hover:bg-gray-200 transition-colors">
                      {t('message_item.save')}
                   </button>
                </div>
              </div>
            ) : (
            message.status === 'thinking' ? (
               <div className="flex flex-col gap-2 py-2 px-4 bg-white/5 rounded-2xl rounded-tl-none animate-pulse min-w-[200px]">
                  <div className="h-3 bg-white/10 rounded w-3/4"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                  <div className="h-3 bg-white/10 rounded w-5/6"></div>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lira-pink opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-lira-pink"></span>
                     </span>
                     <span className="text-xs text-white/40 italic">Thinking...</span>
                  </div>
               </div>
            ) : (
              <div className={`
                relative text-[15px] leading-7 text-gray-200 text-left w-fit max-w-full break-words [overflow-wrap:anywhere]
                ${isUser ? 'bg-white/5 px-4 py-2 rounded-2xl rounded-tr-none' : ''}
              `}>
                 <div className="markdown-content w-full">
                    {/* Use Streaming Bubble for AI messages, standard markdown for User */}
                    {!isUser ? (
                        <StreamingMessageBubble 
                            content={((message.status === 'streaming' && message.partial) ? message.partial : message.content) || ''}
                            isStreaming={message.isStreaming || message.status === 'streaming'}
                            status={message.status}
                            isModel={true}
                        />
                    ) : (
                        <ReactMarkdown 
                            components={{
                                 code({node, inline, className, children, ...props}: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                        <div className="bg-black/30 p-2 rounded-md my-2 overflow-x-auto">
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        </div>
                                    ) : (
                                        <code className="bg-white/10 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                            {children}
                                        </code>
                                    )
                                 }
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}
                 </div>
              </div>
            ))}

            {!isEditing && !message.isStreaming && (
              <div className={`
                flex items-center gap-1 mt-1 opacity-40 group-hover:opacity-100 transition-opacity duration-200
                ${isUser ? 'justify-end pr-0' : 'justify-start pl-0'}
              `}>
                 <button 
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                    title={t('message_item.copy')}
                 >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                 </button>
                 
                 {!isUser && (
                    <button 
                        onClick={onRegenerate}
                        className={`p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors ${!isLast && 'hidden'}`}
                        title={t('message_item.regenerate')}
                    >
                        <RotateCcw size={14} />
                    </button>
                 )}

                 {isUser && (
                   <button 
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                      title={t('message_item.edit')}
                   >
                      <Edit2 size={14} />
                   </button>
                 )}
                 
                 <button
                   onClick={onSaveMemory}
                   className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                   title={t('message_item.save_memory')}
                 >
                   <Brain size={14} />
                 </button>
              </div>
            )}
        </div>
      </div>
    </motion.div>
  );
};
