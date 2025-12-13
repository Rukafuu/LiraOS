import React from 'react';
import { Message } from '../types';
import { Bot, User, Image as ImageIcon } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end self-end' : 'justify-start self-start'} ${isStreaming ? 'animate-pulse-soft' : ''}`}>
      {/* Avatar - Only for Lira */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-nagisa-accentSoft flex items-center justify-center text-xs font-semibold text-nagisa-text">
          L
        </div>
      )}

      {/* Message Content */}
      <div className={`max-w-[70%]`}>
        <div className={`rounded-3xl px-4 py-3 ${
          isUser
            ? 'bg-nagisa-accent text-white rounded-br-sm shadow-sm'
            : 'bg-nagisa-bgSoft dark:bg-nagisaDark-bgSoft border border-nagisa-border dark:border-nagisaDark-border text-nagisa-text dark:text-nagisaDark-text rounded-bl-sm shadow-sm'
        }`}>
          {message.type === 'image' && message.metadata?.imageUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-nagisa-textSoft">
                <ImageIcon size={16} />
                <span>Imagem gerada</span>
              </div>
              <img
                src={message.metadata.imageUrl}
                alt={message.content}
                className="rounded-xl max-w-full h-auto shadow-medium animate-image-appear"
              />
              {message.content && (
                <p className="text-sm text-nagisa-textSoft italic">
                  Prompt: {message.content}
                </p>
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              {message.content}
              {isStreaming && (
                <span className="animate-pulse-soft">▊</span>
              )}
            </div>
          )}
        </div>

        {/* Suggestions */}
        {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.metadata.suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="px-3 py-2 text-sm bg-nagisa-bgSoft hover:bg-nagisa-accentSoft/40 border border-nagisa-border rounded-3xl transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-nagisa-textSoft mt-2">
          {message.createdAt.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}
