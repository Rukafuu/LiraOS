import React, { useRef, useEffect, useState } from 'react';
import { MessageItem } from './MessageItem';
import { Message } from '../types';
import { motion } from 'framer-motion';
import { Code, Lightbulb, Compass, Pencil, ArrowDown } from 'lucide-react';
import { useGamification } from '../contexts/GamificationContext';
import { LIRA_AVATAR } from '../constants';
import { LoadingDots } from './ui/LoadingDots';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onRegenerate: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onTTS: (text: string) => void;
  onSuggestionClick: (text: string) => void;
  onSaveMemory: (messageId: string) => void;
}

const PremiumThinking = () => {
  const [textStage, setTextStage] = React.useState(0);
  const texts = ["ANALYZING INPUT", "QUERYING NEURAL NET", "GENERATING RESPONSE", "OPTIMIZING OUTPUT"];
  
  React.useEffect(() => {
    const interval = setInterval(() => {
        setTextStage(prev => (prev + 1) % texts.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full flex justify-start mb-6 px-4 md:px-0"
    >
      <div className="flex max-w-[85%] gap-4 flex-row items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-purple-500/30 overflow-hidden bg-black/60 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
           <img src={LIRA_AVATAR} alt="Lira" className="w-full h-full object-cover opacity-90" />
        </div>
        
        <div className="relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
           <div className="relative bg-black/80 border border-white/10 rounded-xl px-5 py-3 flex items-center gap-4 overflow-hidden min-w-[200px]">
              
              {/* Scan Line effect */}
              <motion.div 
                  className="absolute top-0 bottom-0 w-[2px] bg-white/20 blur-[1px] z-10"
                  animate={{ left: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />

              <div className="flex gap-1.5 items-center">
                 <motion.div className="w-1.5 h-1.5 bg-purple-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
                 <motion.div className="w-1.5 h-1.5 bg-blue-400 rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, delay: 0.2, repeat: Infinity }} />
                 <motion.div className="w-1.5 h-1.5 bg-white rounded-full" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, delay: 0.4, repeat: Infinity }} />
              </div>

              <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-purple-300/80 font-mono">
                     {texts[textStage]}
                  </span>
                  <div className="h-[2px] w-full bg-white/5 mt-1 rounded-full overflow-hidden">
                     <motion.div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                     />
                  </div>
              </div>

           </div>
        </div>
      </div>
    </motion.div>
  );
};
const ThinkingIndicator = PremiumThinking;

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading,
  onRegenerate,
  onEdit,
  onTTS,
  onSuggestionClick,
  onSaveMemory
}) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const { stats } = useGamification();
  const [atBottom, setAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll logic (only if user is already at the bottom)
  useEffect(() => {
    if (atBottom || isLoading) {
      setTimeout(() => {
          virtuosoRef.current?.scrollToIndex({ index: messages.length + (showThinking ? 1 : 0), align: 'end', behavior: 'auto' });
      }, 50);
    }
  }, [messages.length, isLoading, atBottom]);

  const suggestions = [
    { icon: Code, text: "Write a React hook for fetching data", label: "Code" },
    { icon: Pencil, text: "Write a cyberpunk story intro", label: "Creative" },
    { icon: Lightbulb, text: "Explain quantum computing simply", label: "Learn" },
    { icon: Compass, text: "Plan a trip to Neo Tokyo", label: "Plan" },
  ];

  const lastMsg = messages[messages.length - 1];
  const showThinking = isLoading && (
    messages.length === 0 ||
    lastMsg?.role === 'user' ||
    (lastMsg?.role === 'model' && lastMsg?.isStreaming && (lastMsg?.content || '').length < 2)
  );

  return (
    <div className="flex-1 px-2 md:px-0 relative h-full">
      {/* Scroll to Bottom Button */}
      {showScrollButton && (
           <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => virtuosoRef.current?.scrollToIndex({ index: messages.length + (showThinking ? 1 : 0), align: 'end', behavior: 'smooth' })}
              className="absolute bottom-6 right-8 z-30 bg-lira-bg/90 border border-white/10 p-2 rounded-full shadow-xl hover:bg-white/10 transition-all text-white backdrop-blur-md"
           >
              <ArrowDown size={20} />
           </motion.button>
      )}

      {messages.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 relative z-10 mt-10">
            {/* Hero Logo */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
               <div className="w-24 h-24 mx-auto bg-white/5 rounded-3xl flex items-center justify-center mb-6 shadow-glow-blue border border-white/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-lira-pink/20 to-lira-blue/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img src={LIRA_AVATAR} alt="Lira" className="w-full h-full object-cover" />
               </div>
               <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {stats.username}</h2>
               <p className="text-lira-dim text-sm max-w-md mx-auto">
                 LiraOS v2.5 is ready. Select a persona from the store or start chatting below.
               </p>
            </motion.div>

            {/* Suggestions Grid (GPT Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-2">
               {suggestions.map((item, idx) => (
                  <motion.button
                     key={idx}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.2 + idx * 0.1 }}
                     onClick={() => onSuggestionClick(item.text)}
                     className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-lira-blue/30 p-4 rounded-xl text-left transition-all group flex flex-col gap-3"
                  >
                     <div className="flex items-center gap-3">
                        <item.icon size={18} className="text-lira-blue group-hover:text-lira-pink transition-colors" />
                        <span className="text-xs font-bold text-lira-dim uppercase tracking-wider">{item.label}</span>
                     </div>
                     <span className="text-sm text-gray-300 group-hover:text-white font-medium">
                        "{item.text}"
                     </span>
                  </motion.button>
               ))}
            </div>
        </div>
      ) : (
        <Virtuoso
            ref={virtuosoRef}
            totalCount={messages.length + (showThinking ? 1 : 0)}
            atBottomStateChange={(atBottom) => {
                setAtBottom(atBottom);
                setShowScrollButton(!atBottom);
            }}
            initialTopMostItemIndex={messages.length - 1} // Start at bottom
            alignToBottom={true} // Stick to bottom
            followOutput={atBottom ? 'auto' : false} // Auto-scroll only if already at bottom
            className="h-full scrollbar-thin"
            itemContent={(index) => {
                if (index >= messages.length) {
                    return (
                        <div className="py-2 max-w-3xl mx-auto px-2">
                            <ThinkingIndicator />
                        </div>
                    );
                }
               const msg = messages[index];
               return (
                   <div className="py-2 max-w-3xl mx-auto px-2">
                       <MessageItem 
                        key={msg.id} 
                        message={msg} 
                        isLast={index === messages.length - 1}
                        onRegenerate={() => onRegenerate(msg.id)}
                        onEdit={(newContent) => onEdit(msg.id, newContent)}
                        onTTS={onTTS}
                        onSaveMemory={() => onSaveMemory(msg.id)}
                      />
                   </div>
               );
            }}
        />
      )}
    </div>
  );
};
