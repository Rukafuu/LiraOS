import React from 'react';
import { motion } from 'framer-motion';
import { LIRA_AVATAR } from '../../constants';

interface AvatarPulseProps {
  status: 'idle' | 'generating';
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarPulse: React.FC<AvatarPulseProps> = ({ status, size = 'md' }) => {
  const isGenerating = status === 'generating';

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
      {/* Pulse Rings */}
      {isGenerating && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full bg-lira-pink opacity-20"
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          />
           <motion.div
            className="absolute inset-0 rounded-full bg-lira-blue opacity-20"
            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
          />
        </>
      )}

      {/* Main Core */}
      <motion.div
        className={`
          relative z-10 rounded-full flex items-center justify-center overflow-hidden border border-white/10
          ${isGenerating ? 'shadow-glow-pink ring-2 ring-lira-pink/50' : 'shadow-glow-blue'}
          bg-[#0c0c0e]
        `}
        animate={isGenerating ? {
          scale: [1, 1.05, 1],
        } : {
          y: [0, -2, 0],
        }}
        transition={isGenerating ? {
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut"
        } : {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <img 
          src={LIRA_AVATAR} 
          alt="Lira" 
          className="w-full h-full object-cover"
        />
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </motion.div>
    </div>
  );
};