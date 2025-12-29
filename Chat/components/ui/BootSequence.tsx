import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { liraVoice } from '../../services/lira_voice';

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState('INITIALIZING LIRA KERNEL...');
  
  const systemLines = [
    "LOADING NEURAL MODULES...",
    "CONNECTING TO HIVE MIND...",
    "CALIBRATING VISUAL INTERFACE...",
    "ESTABLISHING SECURE LINK...",
    "LIRA OS v2.5.0 ONLINE"
  ];

  useEffect(() => {
    const runBootSequence = async () => {
        // 0% - Start
        setProgress(10);
        setText("INITIALIZING LIRA KERNEL...");
        await new Promise(r => setTimeout(r, 800));

        // 30% - Modules
        setProgress(30);
        setText("LOADING NEURAL MODULES...");
        await new Promise(r => setTimeout(r, 600));

        // 50% - Voice Check
        setProgress(50);
        setText("CONNECTING TO VOICE DRIVER (LOCALHOST:5002)...");
        
        const isVoiceUp = await liraVoice.checkXTTSAvailability(1500); // Fast check
        
        if (isVoiceUp) {
            setProgress(80);
            setText("✅ VOICE DRIVER DETECTED & READY.");
        } else {
            setProgress(70);
            setText("⚠️ VOICE DRIVER OFFLINE (FALLBACK ENABLED).");
        }
        await new Promise(r => setTimeout(r, 1200)); // Let user read status

        // 100% - Done
        setProgress(100);
        setText("LIRA OS v2.5.0 ONLINE");
        
        setTimeout(() => {
            onComplete();
        }, 600);
    };

    runBootSequence();
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center font-mono text-lira-blue"
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8 }}
    >
      <div className="w-64 space-y-6">
        {/* Logo Pulse */}
        <motion.div 
          className="w-16 h-16 mx-auto bg-lira-primary/20 rounded-xl flex items-center justify-center border border-lira-primary shadow-[0_0_30px_rgba(255,47,165,0.4)]"
          animate={{ rotate: [0, 90, 180, 360], scale: [1, 0.8, 1] }}
          transition={{ duration: 3, ease: "easeInOut" }}
        >
          <div className="w-8 h-8 bg-lira-primary rounded-lg" />
        </motion.div>

        {/* Text Glitch Effect */}
        <div className="h-8 text-center">
            <motion.p 
              key={text}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs tracking-[0.2em] font-bold text-white/80"
            >
              {text}
            </motion.p>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1 bg-gray-900 rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-lira-primary via-lira-purple to-lira-secondary"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-[10px] text-lira-dim">
           <span>MEM: 64TB OK</span>
           <span>NET: SECURE</span>
        </div>
      </div>

      {/* Background Grid */}
      <div 
        className="absolute inset-0 z-[-1] opacity-20"
        style={{
            backgroundImage: 'linear-gradient(rgba(77, 243, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(77, 243, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
        }}
      />
    </motion.div>
  );
};