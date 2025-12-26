import { useMemo } from 'react';
import { Message } from '../types';

export type GlowMood = 'neutral' | 'calm' | 'excited' | 'alert';

export function useAmbientGlow(messages: Message[]) {
  const mood = useMemo((): GlowMood => {
    if (!messages || messages.length === 0) return 'neutral';
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return 'neutral';

    const text = (lastMessage.content || '').toLowerCase();

    // Heuristic sentiment analysis
    if (text.includes('error') || text.includes('warning') || text.includes('fail') || text.includes('alert')) {
      return 'alert';
    }
    if (text.includes('wow') || text.includes('amazing') || text.includes('great') || text.includes('!') || text.length > 500) {
      return 'excited';
    }
    if (text.includes('relax') || text.includes('calm') || text.includes('slow') || text.includes('peace')) {
      return 'calm';
    }

    return 'neutral';
  }, [messages]);

  const getGlowStyles = () => {
    switch (mood) {
      case 'alert':
        return 'from-red-500/10 via-transparent to-transparent';
      case 'excited':
        return 'from-lira-pink/10 via-lira-purple/5 to-transparent';
      case 'calm':
        return 'from-teal-500/10 via-blue-500/5 to-transparent';
      default: // neutral
        return 'from-lira-blue/5 via-transparent to-transparent';
    }
  };

  return { mood, glowClassName: getGlowStyles() };
}