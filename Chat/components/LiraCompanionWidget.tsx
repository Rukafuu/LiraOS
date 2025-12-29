import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiraCore } from '../lib/lira-avatar/liraCore';
import { X, Minus, Maximize2, Music, MessageCircle, Sparkles } from 'lucide-react';

interface LiraCompanionWidgetProps {
  onClose: () => void;
  isSpeaking: boolean;
}

const SILLY_PHRASES = [
  "Oi! Tá precisando de ajuda? 💜",
  "Clicou em mim? Que fofo! 😊",
  "Estou aqui se precisar! ✨",
  "Bora programar juntos? 💻",
  "Tá tudo bem aí? 🌟",
  "Me dá um abraço virtual? 🤗",
  "Você é incrível! Continue assim! 🚀",
  "Precisa de café? ☕",
  "Vamos fazer algo legal hoje! 🎨",
  "Estou te observando... 👀",
  "Psiu! Tenho uma ideia! 💡",
  "Que tal uma pausa? 🎮"
];

export const LiraCompanionWidget: React.FC<LiraCompanionWidgetProps> = ({ onClose, isSpeaking }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lira, setLira] = useState<LiraCore | null>(null);
  const liraRef = useRef<LiraCore | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 320, height: 400 });
  const WIDGET_ID = 'lira-companion-widget-canvas';

  // Initialize Lira
  useEffect(() => {
    if (liraRef.current) return;

    const init = async () => {
      await new Promise(r => setTimeout(r, 100));
      
      try {
        const core = new LiraCore(WIDGET_ID);
        liraRef.current = core;

        await core.initLive2D();
        await core.loadModel('/assets/model/lira/youling.model3.json');
        
        if (core.model) {
          core.model.y = 0;
          core.model.scale.set(0.15);
        }
        
        setLira(core);
      } catch (err) {
        console.error('[Companion] Failed to init:', err);
      }
    };
    init();

    return () => {
      if (liraRef.current) {
        console.log('[Companion] Destroying Lira...');
        liraRef.current.destroy();
        liraRef.current = null;
      }
    };
  }, []);

  // Dance mode sync
  useEffect(() => {
    if (lira) {
      lira.setDanceMode(isDancing);
    }
  }, [isDancing, lira]);

  // Speech animation
  useEffect(() => {
    if (!lira) return;
    let animId: number;
    const animate = () => {
      if (isSpeaking) {
        lira.updateMouth(Math.random());
      } else {
        lira.updateMouth(0);
      }
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [lira, isSpeaking]);

  // Resize model when widget size changes
  useEffect(() => {
    if (!lira || !lira.model) return;
    
    lira.handleResize();
    const scale = Math.min(size.width, size.height) * 0.0008;
    lira.model.scale.set(scale);
  }, [size, lira]);

  // Auto-hide phrase after 3 seconds
  useEffect(() => {
    if (!currentPhrase) return;
    const timer = setTimeout(() => setCurrentPhrase(null), 3000);
    return () => clearTimeout(timer);
  }, [currentPhrase]);

  // Handle click on Lira
  const handleLiraClick = () => {
    const randomPhrase = SILLY_PHRASES[Math.floor(Math.random() * SILLY_PHRASES.length)];
    setCurrentPhrase(randomPhrase);
  };

  // Resize handlers
  const startResize = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = { ...size };

    const onMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startSize.width;
      let newHeight = startSize.height;

      if (direction.includes('e')) newWidth = Math.max(280, startSize.width + deltaX);
      if (direction.includes('w')) newWidth = Math.max(280, startSize.width - deltaX);
      if (direction.includes('s')) newHeight = Math.max(350, startSize.height + deltaY);
      if (direction.includes('n')) newHeight = Math.max(350, startSize.height - deltaY);

      setSize({ width: newWidth, height: newHeight });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  if (isMinimized) {
    return (
      <motion.div
        drag
        dragMomentum={false}
        initial={{ x: window.innerWidth - 220, y: window.innerHeight - 80 }}
        className="fixed z-50 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-6 py-3 shadow-2xl cursor-pointer group"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-white font-medium">Lira</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="ml-2 text-white/70 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{ left: 0, top: 0, right: window.innerWidth - size.width, bottom: window.innerHeight - size.height }}
      initial={{ x: window.innerWidth - size.width - 20, y: window.innerHeight - size.height - 20, opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ width: size.width, height: size.height }}
      className="fixed z-50 group"
    >
      {/* Main Container */}
      <div className="relative w-full h-full bg-gradient-to-br from-purple-900/90 via-pink-900/90 to-blue-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        
        {/* Title Bar */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-black/30 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-4 cursor-move z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
            <span className="text-white text-sm font-medium">Lira Companion</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDancing(!isDancing)}
              className={`p-1.5 rounded-lg transition-all ${isDancing ? 'bg-pink-500/30 text-pink-300' : 'hover:bg-white/10 text-white/70'}`}
              title="Dance Mode"
            >
              <Music size={16} />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
              title="Minimize"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-white/70 hover:text-red-400"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Lira Canvas */}
        <div 
          className="absolute inset-0 pt-12 cursor-pointer"
          onClick={handleLiraClick}
        >
          <div id={WIDGET_ID} className="w-full h-full" />
        </div>

        {/* Speech Bubble */}
        <AnimatePresence>
          {currentPhrase && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl max-w-[80%] z-20"
            >
              <div className="text-sm text-gray-800 font-medium text-center">
                {currentPhrase}
              </div>
              {/* Speech bubble arrow */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Indicator */}
        {isSpeaking && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-3 bg-pink-400 rounded-full"
                  animate={{
                    scaleY: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-white/80">Falando...</span>
          </div>
        )}

        {/* Resize Handles */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corners */}
          <div onMouseDown={(e) => startResize(e, 'se')} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize pointer-events-auto" />
          <div onMouseDown={(e) => startResize(e, 'sw')} className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize pointer-events-auto" />
          <div onMouseDown={(e) => startResize(e, 'ne')} className="absolute top-12 right-0 w-4 h-4 cursor-ne-resize pointer-events-auto" />
          <div onMouseDown={(e) => startResize(e, 'nw')} className="absolute top-12 left-0 w-4 h-4 cursor-nw-resize pointer-events-auto" />
          
          {/* Edges */}
          <div onMouseDown={(e) => startResize(e, 'e')} className="absolute top-12 right-0 bottom-0 w-2 cursor-e-resize pointer-events-auto" />
          <div onMouseDown={(e) => startResize(e, 'w')} className="absolute top-12 left-0 bottom-0 w-2 cursor-w-resize pointer-events-auto" />
          <div onMouseDown={(e) => startResize(e, 's')} className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize pointer-events-auto" />
          <div onMouseDown={(e) => startResize(e, 'n')} className="absolute top-12 left-0 right-0 h-2 cursor-n-resize pointer-events-auto" />
        </div>

        {/* Resize indicator (bottom-right corner) */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Maximize2 size={14} className="text-white/40" />
        </div>
      </div>
    </motion.div>
  );
};
