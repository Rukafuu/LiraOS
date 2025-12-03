import React, { memo, useRef, useEffect } from 'react';
import { Message } from '../types';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isCompactMode: boolean;
  copiedMessageId: string | null;
  speakingMessageId: string | null;
  onCopyText: (text: string, messageId: string) => void;
  onSpeakText: (text: string, messageId: string) => void;
  onStopSpeaking: () => void;
}

const MessageList = memo<MessageListProps>(({ 
  messages, 
  isCompactMode, 
  copiedMessageId, 
  speakingMessageId, 
  onCopyText, 
  onSpeakText, 
  onStopSpeaking 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth ${isCompactMode ? 'space-y-3' : 'space-y-6'}`}>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isCompactMode={isCompactMode}
          copiedMessageId={copiedMessageId}
          speakingMessageId={speakingMessageId}
          onCopyText={onCopyText}
          onSpeakText={onSpeakText}
          onStopSpeaking={onStopSpeaking}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
