import React from 'react';
import { motion } from 'framer-motion';

interface ParticleBackgroundProps {
  isHyperSpeed?: boolean;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ isHyperSpeed = false }) => {
  // Generate random particles
  const particles = Array.from({ length: isHyperSpeed ? 40 : 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * 200 + 50, // 50px to 250px
    x: Math.random() * 100, // 0-100%
    y: Math.random() * 100, // 0-100%
    duration: isHyperSpeed 
      ? Math.random() * 0.5 + 0.2 // Super fast duration (0.2s - 0.7s)
      : Math.random() * 20 + 20, // Normal slow duration (20s - 40s)
    delay: isHyperSpeed ? 0 : Math.random() * 5,
    opacity: Math.random() * 0.15 + 0.05, // Low opacity
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full blur-[60px] mix-blend-screen"
          style={{
            width: p.size,
            height: p.size,
            // Alternate colors between primary and secondary variables (set in CSS)
            background: p.id % 2 === 0 ? 'var(--lira-primary)' : 'var(--lira-secondary)',
          }}
          initial={{
            x: `${p.x}vw`,
            y: `${p.y}vh`,
            opacity: 0,
          }}
          animate={{
            x: isHyperSpeed 
              ? [`${p.x}vw`, `${(p.x + 10) % 100}vw`, `${(p.x - 10 + 100) % 100}vw`, `${p.x}vw`]
              : [`${p.x}vw`, `${(p.x + 20) % 100}vw`, `${(p.x - 10 + 100) % 100}vw`, `${p.x}vw`],
            y: isHyperSpeed
              ? [`${p.y}vh`, `${(p.y + 10) % 100}vh`, `${(p.y - 10 + 100) % 100}vh`, `${p.y}vh`]
              : [`${p.y}vh`, `${(p.y - 20 + 100) % 100}vh`, `${(p.y + 10) % 100}vh`, `${p.y}vh`],
            opacity: [0, p.opacity, p.opacity * 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear", // Linear for speed
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
};