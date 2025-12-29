import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, RefreshCcw, AlertCircle } from 'lucide-react';
import { useSimulatedProgress } from '../hooks/useSimulatedProgress';

interface ProgressiveImageProps {
  status: 'idle' | 'generating' | 'ready' | 'error';
  prompt: string;
  finalSrc?: string;
  jobId?: string; // Optional for debugging or retry logic
  onRetry?: () => void;
  aspectRatio?: string; // "1/1", "16/9"
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({ 
  status, 
  prompt, 
  finalSrc, 
  onRetry,
  aspectRatio = "1/1"
}) => {
  const progress = useSimulatedProgress(status);
  const [imageLoaded, setImageLoaded] = useState(false);

  // If status is ready but image hasn't loaded yet, we still show some loading state (or keep blur)
  
  return (
    <div className="relative w-full max-w-md my-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0c0c0e]">
       {/* Container with constrained aspect ratio */}
       <div style={{ aspectRatio }} className="w-full relative">
          
          <AnimatePresence mode="wait">
            {/* ERROR STATE */}
            {status === 'error' && (
               <motion.div 
                 key="error"
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/5 p-6 text-center"
               >
                 <AlertCircle className="text-red-400 mb-3" size={32} />
                 <p className="text-red-200 text-sm font-medium mb-4">Falha ao gerar imagem</p>
                 {onRetry && (
                   <button onClick={onRetry} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-xs transition-colors flex items-center gap-2">
                     <RefreshCcw size={14} /> Tentar Novamente
                   </button>
                 )}
               </motion.div>
            )}

            {/* GENERATING / LOADING STATE */}
            {(status === 'generating' || (status === 'ready' && !imageLoaded)) && (
               <motion.div 
                 key="loading"
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="absolute inset-0 z-10"
               >
                  {/* Background Blur Mesh */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-[#1a1a2e] to-black" />
                  
                  {/* Shimmer Effect */}
                  <motion.div 
                     className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
                     initial={{ x: '-100%' }}
                     animate={{ x: '100%' }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                     <div className="relative w-16 h-16 mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                        <svg className="w-full h-full transform -rotate-90">
                           <circle 
                              cx="32" cy="32" r="28" 
                              stroke="url(#gradient)" strokeWidth="4" fill="transparent"
                              strokeDasharray="176"
                              strokeDashoffset={176 - (176 * progress) / 100}
                              className="transition-all duration-500 ease-out"
                           />
                           <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                 <stop offset="0%" stopColor="#c084fc" />
                                 <stop offset="100%" stopColor="#db2777" />
                              </linearGradient>
                           </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                           {Math.round(progress)}%
                        </div>
                     </div>
                     
                     <p className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 font-medium uppercase tracking-widest animate-pulse">
                        {status === 'ready' ? "Imagem Pronta! Renderizando..." : "Criando Arte"}
                     </p>
                     <p className="text-[11px] text-gray-500 mt-2 italic line-clamp-2 text-center max-w-[80%]">
                        "{prompt}"
                     </p>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
          
          {/* FINAL IMAGE */}
          {status === 'ready' && finalSrc && (
             <motion.img 
                src={finalSrc} 
                alt={prompt}
                initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                animate={imageLoaded ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
                transition={{ duration: 0.8, ease: "easeOut" }}
                onLoad={() => setImageLoaded(true)}
                className="w-full h-full object-cover"
             />
          )}

       </div>
    </div>
  );
};
