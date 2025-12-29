import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypewriterReveal } from '../../hooks/useTypewriterReveal';
import { ChatWidgetRenderer } from '../ChatWidgets'; 

interface StreamingMessageBubbleProps {
  content: string; // The full content available (streaming or final)
  isStreaming: boolean; // True if backend is still sending chunks
  status?: 'thinking' | 'streaming' | 'done' | 'error';
  isModel?: boolean;
}

export const StreamingMessageBubble: React.FC<StreamingMessageBubbleProps> = ({
  content,
  isStreaming,
  status = 'done',
  isModel = true
}) => {
  // Logic: 
  // If status == 'thinking', show Thinking bubble.
  // If status == 'streaming', show text with typewriter effect.
  // If status == 'done', show text immediately without animation.
  
  const { displayedContent, isTyping } = useTypewriterReveal({
      content,
      isEnabled: isStreaming || status === 'streaming', // Only animate during active streaming
      speed: 10 // Fast 10ms default
  });

  const showCursor = (isStreaming || isTyping) && status !== 'error';

  return (
    <div className={`relative ${isModel ? 'text-gray-100' : 'text-white'}`}>
        
        {/* Main Content Area */}
        <div className="prose prose-invert max-w-none text-sm leading-relaxed tracking-wide">
                {/* Thinking State */}
                {status === 'thinking' && !displayedContent && (
                    <div className="flex items-center gap-2 text-gray-400 italic py-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span className="animate-pulse">Pensando...</span>
                    </div>
                )}

                {/* Content Render (Splitting Widgets & Text) */}
                {(() => {
                    // Split content by Widgets
                    const parts = displayedContent.split(/((?:\[\[)?WIDGET:[^|]+\|[\s\S]+?(?:\]\]|\]))/g);
                    
                    return parts.map((part, idx) => {
                        // Check if part is a Widget
                        const match = part.match(/^(?:\[\[)?WIDGET:([^|]+)\|([\s\S]+?)(?:\]\]|\])$/);
                        if (match) {
                            return <ChatWidgetRenderer key={idx} type={match[1]} data={match[2]} />;
                        }

                        // Regular Text (Markdown)
                        return (
                           <MemoizedMarkdown key={idx} content={part} showCursor={showCursor && idx === parts.length - 1} />
                        );
                    });
                })()}
            </div>
        
        {/* Error State */}
        {status === 'error' && (
             <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20 flex items-center justify-between">
                 <span>⚠ Erro na geração</span>
             </div>
        )}
    </div>
  );
};

// --- Helpers ---

// Memoized Markdown to prevent re-renders of stable parts
const MemoizedMarkdown = React.memo(({ content, showCursor }: { content: string, showCursor: boolean }) => {
    return (
        <ReactMarkdown 
            components={{
                code({node, inline, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                        <div className="rounded-lg overflow-hidden my-4 border border-white/10 text-left shadow-lg bg-[#0c0c0e] w-full max-w-full">
                            <div className="bg-white/5 px-3 py-2 text-xs text-gray-400 flex justify-between items-center border-b border-white/5">
                                <span className="font-mono ml-2 opacity-50">{match[1]}</span>
                            </div>
                            <div className="p-4 overflow-x-auto relative group-code custom-scrollbar">
                            <pre className="font-mono text-[13px] text-gray-300 whitespace-pre">
                                <code {...props}>
                                {String(children).replace(/\n$/, '')}
                                </code>
                            </pre>
                            </div>
                        </div>
                        ) : (
                        <code className={`bg-white/10 text-white px-1.5 py-0.5 rounded text-sm font-mono ${className}`} {...props}>
                            {children}
                        </code>
                        );
                    },
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed break-words">{children}{showCursor && <span className="inline-block w-1.5 h-4 bg-purple-400 align-middle ml-0.5 animate-pulse" />}</p>,
                // images, links etc can be added here
            }}
        >
            {content}
        </ReactMarkdown>
    );
});
