import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatedProgress } from '../hooks/useSimulatedProgress';

interface ProgressiveImageProps {
  status: 'idle' | 'generating' | 'ready' | 'error';
  progress?: number; // Optional external progress (0-100)
  finalSrc?: string;
  alt?: string;
  aspectRatio?: number; // e.g., 1 for square, 16/9 for landscape
  onRetry?: () => void;
  prompt?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  status,
  progress: externalProgress,
  finalSrc,
  alt = 'Generated Image',
  aspectRatio = 1,
  onRetry,
  prompt
}) => {
  const simulatedProgress = useSimulatedProgress({ status });
  const progress = externalProgress ?? simulatedProgress;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (status === 'ready' && finalSrc) {
      // Preload image
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = finalSrc;
    } else {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [finalSrc, status]);

  const paddingBottom = `${(1 / aspectRatio) * 100}%`;

  return (
    <div 
      className="relative w-full max-w-2xl my-4"
      style={{ paddingBottom }}
      aria-busy={status === 'generating'}
      aria-live="polite"
    >
      <div className="absolute inset-0 rounded-lg overflow-hidden border border-white/10">
        <AnimatePresence mode="wait">
          {status === 'generating' && (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 shimmer-effect" />
              
              {/* Blur overlay */}
              <div 
                className="absolute inset-0 backdrop-blur-xl bg-black/40"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'repeat'
                }}
              />

              {/* Progress indicator */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                <div className="relative w-24 h-24">
                  {/* Circular progress */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                      animate={{ 
                        strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100)
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#EB00FF" />
                        <stop offset="100%" stopColor="#00D4FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Percentage text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>

                {/* Status text */}
                <div className="text-center">
                  <p className="text-sm font-medium text-white mb-1">
                    🎨 Gerando imagem...
                  </p>
                  {prompt && (
                    <p className="text-xs text-white/60 max-w-md line-clamp-2">
                      "{prompt}"
                    </p>
                  )}
                </div>

                {/* Animated dots */}
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-white/40"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 1, 0.4]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {status === 'ready' && finalSrc && imageLoaded && !imageError && (
            <motion.img
              key="final-image"
              src={finalSrc}
              alt={alt}
              initial={{ opacity: 0, filter: 'blur(20px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-0 w-full h-full object-contain"
              loading="lazy"
            />
          )}

          {(status === 'error' || imageError) && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-500/10 border-2 border-red-500/30 rounded-lg flex flex-col items-center justify-center gap-4 p-6"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">❌</div>
                <p className="text-sm font-semibold text-red-400 mb-1">
                  Falha ao gerar imagem
                </p>
                <p className="text-xs text-red-300/80">
                  O serviço pode estar temporariamente indisponível.
                </p>
              </div>
              
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-sm font-medium text-red-200 transition-colors"
                >
                  🔄 Tentar Novamente
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .shimmer-effect {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};
