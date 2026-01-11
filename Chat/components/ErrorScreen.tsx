import React from 'react';
import { motion } from 'framer-motion';

interface ErrorScreenProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden font-sans">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        {/* Helper Video Removed to prevent metadata errors during crash */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-lg w-full p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Glitch Title */}
          <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 animate-pulse tracking-tight">
            Oops... Crashou.
          </h1>
          
          <p className="text-xl text-white/80 mb-8 font-light leading-relaxed">
            A Lira tropeçou em alguns bits. Não se preocupe, ela já está se levantando.
          </p>

          {/* Error Details (Collapsible or small) */}
          {error && (
            <div className="mb-8 p-4 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 text-left overflow-auto max-h-32">
              <p className="text-xs text-red-400 font-mono">
                {error.toString()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-white text-black font-bold rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reiniciar Sistema
            </motion.button>
            
            {resetErrorBoundary && (
              <button
                onClick={resetErrorBoundary}
                className="text-sm text-white/50 hover:text-white transition-colors underline decoration-dotted"
              >
                Tentar recuperar sessão
              </button>
            )}
          </div>
        </motion.div>
      </div>
      
      {/* Decorative footer */}
      <div className="absolute bottom-8 text-center w-full">
         <p className="text-xs text-white/20 uppercase tracking-widest">System Failure // Auto-Recovery Protocol Ready</p>
      </div>
    </div>
  );
};
