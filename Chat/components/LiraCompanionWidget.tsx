import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiraCore } from '../lib/lira-avatar/liraCore';
import { X, Music, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';

interface LiraCompanionWidgetProps {
  onClose: () => void;
  isSpeaking: boolean;
}

// Widget Version v2.1 (Cache Buster)
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
  const [isDancing, setIsDancing] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState<string | null>(null);
  const [size, setSize] = useState(350);
  const [showControls, setShowControls] = useState(false); // Controls Auto-hide
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
          // Initial scale setup moved to handleResize
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
        // SAFETY: Do not destroy shared textures
        liraRef.current.destroy(); 
        liraRef.current = null;
      }
    };
  }, []);

  // Controls Auto-Hide Logic
  useEffect(() => {
    if (!showControls) return;
    const timer = setTimeout(() => setShowControls(false), 2000);
    return () => clearTimeout(timer);
  }, [showControls]);

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

  // Handle Resize Logic was removed here because it's handled internally in LiraCore now
  // We just ensure the wrapper size is correct.

  // Handle click on Lira
  const handleLiraClick = () => {
    // Show controls on click
    setShowControls(true);
    // Speech bubbles disabled as per user request
    // const randomPhrase = SILLY_PHRASES[Math.floor(Math.random() * SILLY_PHRASES.length)];
    // setCurrentPhrase(randomPhrase);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{ left: 0, top: 0, right: window.innerWidth - size, bottom: window.innerHeight - size }}
      initial={{ x: window.innerWidth - size - 20, y: window.innerHeight - size - 20, opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{ width: size, height: size, zIndex: 2147483647 }}
      className="fixed group" // Removed tailwind z-index class to favor inline style
      onMouseEnter={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      {/* Transparent container - ONLY the avatar visible */}
      <div className="relative w-full h-full">
        
        {/* Lira Canvas - Fully transparent background */}
        <div 
          id="lira-interaction-layer"
          className="absolute inset-0 cursor-pointer"
          onClick={handleLiraClick}
        >
          <div id={WIDGET_ID} className="w-full h-full" />
        </div>

        {/* CONTROLS BAR (Bottom) - Auto Hiding */}
        <AnimatePresence>
            {showControls && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#121214]/90 border border-white/10 p-2 rounded-2xl backdrop-blur-md shadow-xl z-[100000]"
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowControls(true); setSize(prev => Math.min(800, prev + 50)); }}
                        className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-colors"
                        title="Aumentar (Zoom)"
                    >
                        <ZoomIn size={18} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowControls(true); setSize(prev => Math.max(250, prev - 50)); }}
                        className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-colors"
                        title="Diminuir (Zoom)"
                    >
                        <ZoomOut size={18} />
                    </button>
                    
                    <div className="w-px h-4 bg-white/10 mx-1" />

                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowControls(true); setIsDancing(!isDancing); }}
                        className={`p-2 hover:bg-white/10 rounded-xl transition-colors ${isDancing ? 'text-lira-pink bg-lira-pink/10' : 'text-white/70 hover:text-white'}`}
                        title="Modo Dança"
                    >
                        <Music size={18} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClose(); }} 
                        className="p-2 hover:bg-red-500/20 rounded-xl text-white/70 hover:text-red-400 transition-colors"
                        title="Fechar"
                    >
                        <X size={18} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>


        {/* Speaking Indicator */}
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-md rounded-full px-3 py-1.5 shadow-xl"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-3 bg-pink-400 rounded-full"
                  animate={{
                    scaleY: [1, 1.8, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-white/90">Falando...</span>
          </motion.div>
        )}

        {/* Glow effect when dancing */}
        {isDancing && (
          <div className="absolute inset-0 -z-10 blur-2xl opacity-50">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-pulse" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
