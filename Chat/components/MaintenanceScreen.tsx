import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Activity, Terminal } from 'lucide-react';
import { LIRA_AVATAR } from '../constants';

interface MaintenanceScreenProps {
  onRetry: () => void;
  errorDetails?: string;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ onRetry, errorDetails }) => {
  return (
    <div className="fixed inset-0 bg-black z-[99999] flex flex-col items-center justify-center text-zinc-400 select-none overflow-hidden" data-tauri-drag-region>
      {/* Background Grid & Noise */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,21,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,21,0)_1px,transparent_1px)] bg-[size:40px_40px] [background-position:center] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />

      {/* Main Content Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center max-w-md w-full p-8 rounded-2xl border border-red-900/20 bg-zinc-900/50 backdrop-blur-xl shadow-2xl"
      >
        {/* Offline Avatar Effect */}
        <div className="relative mb-8">
          <motion.div
            animate={{ boxShadow: ['0 0 0px rgba(239,68,68,0)', '0 0 20px rgba(239,68,68,0.2)', '0 0 0px rgba(239,68,68,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="rounded-full"
          >
            <img 
              src={LIRA_AVATAR} 
              alt="Lira Offline" 
              className="w-24 h-24 rounded-full object-cover grayscale opacity-50 blur-[1px]"
            />
          </motion.div>
          {/* Error Icon Overlay */}
          <div className="absolute -bottom-2 -right-2 bg-zinc-950 rounded-full p-2 border border-red-900/50">
            <WifiOff className="w-5 h-5 text-red-500" />
          </div>
        </div>

        {/* Status Text */}
        <motion.h1 
          className="text-2xl font-bold text-red-500 mb-2 tracking-wider uppercase font-mono"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Neural Uplink Offline
        </motion.h1>
        
        <p className="text-center text-zinc-500 mb-8 font-light">
          Unable to establish a secure connection to the LiraOS Core. 
          The neural network is currently unreachable.
        </p>

        {/* Diagnostic Terminal */}
        <div className="w-full bg-black/80 rounded-lg p-4 mb-8 font-mono text-xs border border-zinc-800/50">
          <div className="flex items-center gap-2 text-zinc-600 mb-2 border-b border-zinc-800 pb-2">
            <Terminal className="w-3 h-3" />
            <span>DIAGNOSTIC LOG</span>
          </div>
          <div className="space-y-1 text-red-400/80">
            <p>&gt; PING LiraOS_Core... TIMEOUT</p>
            <p>&gt; CHECKING_INTEGRITY... OK</p>
            <p>&gt; PROTOCOL_HANDSHAKE... FAILED</p>
            {errorDetails && <p className="text-red-500 break-all">&gt; ERR: {errorDetails}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(239,68,68,0.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="w-full py-3 px-4 bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 rounded-lg text-red-400 font-medium flex items-center justify-center gap-2 transition-colors group"
          >
            <RefreshCw className="w-4 h-4 group-hover:animate-spin" />
            RETRY CONNECTION
          </motion.button>
          
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-600 mt-2">
            <Activity className="w-3 h-3" />
            <span>Local Systems Operational</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
