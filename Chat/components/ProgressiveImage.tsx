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

export const ProgressiveImage: React.FC<ProgressiveImageProps> = React.memo(({ 
  status, 
  prompt, 
  finalSrc, 
  onRetry,
  aspectRatio = "1/1"
}) => {
  const progress = useSimulatedProgress(status);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const hasShownOverlayRef = React.useRef(false);

  // Only show overlay during active generation, not on page reload
  useEffect(() => {
    if (status === 'generating' && !hasShownOverlayRef.current) {
      setShowOverlay(true);
      hasShownOverlayRef.current = true;
    } else if (status === 'ready' && !imageLoaded && hasShownOverlayRef.current) {
      setShowOverlay(true);
    } else if (imageLoaded || status === 'error') {
      setShowOverlay(false);
    }
  }, [status, imageLoaded]);

  // Overlay Component for Focus Mode
  const LoadingOverlay = () => (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
        <div className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-[#0c0c0e]">
             <div style={{ aspectRatio }} className="w-full relative">
                 {/* Shimmer Effect */}
                  <motion.div 
                     className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                     initial={{ x: '-100%' }}
                     animate={{ x: '100%' }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-transparent to-black/60">
                     <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                        <svg className="w-full h-full transform -rotate-90">
                           <circle 
                              cx="40" cy="40" r="36" 
                              stroke="url(#gradient-lg)" strokeWidth="4" fill="transparent"
                              strokeDasharray="226"
                              strokeDashoffset={226 - (226 * progress) / 100}
                              strokeLinecap="round"
                              className="transition-all duration-300 ease-linear"
                           />
                           <defs>
                              <linearGradient id="gradient-lg" x1="0%" y1="0%" x2="100%" y2="0%">
                                 <stop offset="0%" stopColor="#c084fc" />
                                 <stop offset="100%" stopColor="#db2777" />
                              </linearGradient>
                           </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                           {Math.round(progress)}%
                        </div>
                     </div>
                     
                     <p className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 font-bold uppercase tracking-widest animate-pulse mb-2">
                        {status === 'ready' ? "Renderizando..." : "Criando Arte"}
                     </p>
                     <p className="text-xs text-gray-400 italic text-center max-w-[90%] line-clamp-2">
                        "{prompt}"
                     </p>
                  </div>
             </div>
        </div>
    </motion.div>
  );

  return (
    <>
        <AnimatePresence>
            {showOverlay && <LoadingOverlay />}
        </AnimatePresence>

        <div className="relative w-full max-w-md my-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0c0c0e]">
        {/* Placeholder within chat flow to reserve space */}
        <div style={{ aspectRatio }} className="w-full relative bg-white/5 flex items-center justify-center">
            
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
                
                {/* Fallback text while loading (hidden by overlay but good for layout) */}
                {(status === 'generating' || !imageLoaded) && status !== 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                         <Activity className="animate-spin text-white" />
                    </div>
                )}

            </AnimatePresence>
        </div>
        </div>
    </>
  );
});
