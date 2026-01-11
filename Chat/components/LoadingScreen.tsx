import React from 'react';
import { motion } from 'framer-motion';
import { LIRA_AVATAR } from '../constants';

interface LoadingScreenProps {
  status?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ status = "INITIALIZING SYSTEM..." }) => {
  const [bootLogs, setBootLogs] = React.useState<string[]>([]);

  React.useEffect(() => {
     const logs = [
         "LOADING KERNEL...",
         "MOUNTING FILE SYSTEM...",
         "ESTABLISHING SECURE CONNECTION...",
         "SYNCING NEURAL WEIGHTS...",
         "CHECKING INTEGRITY...",
         "STARTING INTERFACE..."
     ];
     let i = 0;
     const interval = setInterval(() => {
         if (i < logs.length) {
             setBootLogs(prev => [...prev.slice(-4), logs[i]]);
             i++;
         }
     }, 400);
     return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[99999] select-none" data-tauri-drag-region>
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,30,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(20,20,30,0.5)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

      {/* Main Spinner */}
      <div className="relative mb-12">
           <motion.div
            className="w-32 h-32 rounded-full border-t-2 border-l-2 border-lira-purple border-t-transparent shadow-[0_0_15px_rgba(235,0,255,0.5)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
           />
           <motion.div
            className="absolute inset-4 rounded-full border-b-2 border-r-2 border-cyan-400 border-b-transparent opacity-70"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
           />
           <div className="absolute inset-0 flex items-center justify-center">
             <img src={LIRA_AVATAR} alt="Lira" className="w-[72px] h-[72px] rounded-full object-cover opacity-90 drop-shadow-[0_0_10px_rgba(235,0,255,0.5)]" />
           </div>
      </div>

      {/* Text Status */}
      <h2 className="text-2xl font-mono font-bold tracking-[0.2em] text-white/90 mb-4">
        LIRA<span className="text-lira-purple">OS</span>
      </h2>
      
      <p className="font-mono text-cyan-400/80 text-sm mb-8 animate-pulse">
          {status}
      </p>

      {/* Boot Logs */}
      <div className="w-64 h-24 overflow-hidden border-l-2 border-white/10 pl-3 flex flex-col justify-end font-mono text-xs text-green-500/60">
          {bootLogs.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                  {">"} {log}
              </motion.div>
          ))}
      </div>
      
      <div className="absolute bottom-8 text-[10px] text-white/20 uppercase tracking-widest">
         System Version 2.5 (Alpha)
      </div>
    </div>
  );
};
