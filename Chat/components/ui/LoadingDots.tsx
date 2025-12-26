import React from 'react';
import { motion } from 'framer-motion';

export const LoadingDots: React.FC = () => {
  return (
    <div className="flex space-x-1 items-center h-6">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-lira-blue shadow-[0_0_8px_rgba(77,243,255,0.8)]"
          animate={{
            y: ["0%", "-50%", "0%"],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};