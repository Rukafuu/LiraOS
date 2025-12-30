
import React, { useEffect, useState, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { LiraCore } from '../lib/lira-avatar/liraCore';
import { X, Maximize2, Move, Music, ZoomIn, ZoomOut } from 'lucide-react';

interface LiraFloatingWidgetProps {
  onClose: () => void;
  onInteraction: (type: 'drag' | 'resize') => void;
  isSpeaking: boolean;
}

export const LiraFloatingWidget: React.FC<LiraFloatingWidgetProps> = ({ onClose, onInteraction, isSpeaking }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lira, setLira] = useState<LiraCore | null>(null);
  const liraRef = useRef<LiraCore | null>(null); // ✅ Ref para cleanup seguro
  const [size, setSize] = useState(300); 
  const [isDancing, setIsDancing] = useState(false);
  const WIDGET_ID = 'lira-floating-widget-root';

  // Inicializar Lira
  useEffect(() => {
    // Se já tiver ref, aborta (React 18 Strict Mode double-mount safety)
    if (liraRef.current) return;

    const init = async () => {
        // Pequeno delay para o DOM montar
        await new Promise(r => setTimeout(r, 100));
        
        try {
            const core = new LiraCore(WIDGET_ID);
            liraRef.current = core; // Guarda na ref imediatamente

            await core.initLive2D();
            await core.loadModel('/assets/model/lira/youling.model3.json');
            
            if (core.model) {
                core.model.y = 0; 
                core.model.scale.set(0.15);
            }
            
            setLira(core); // Atualiza estado para renderizações
        } catch (err) {
            console.error('Failed to init floating widget:', err);
        }
    };
    init();

    // Cleanup: Destroi a instância correta
    return () => {
        if (liraRef.current) {
            console.log('[Widget] Destroying Lira instance...');
            liraRef.current.destroy();
            liraRef.current = null;
        }
    };
  }, []);

  // Sync Dance Mode
  useEffect(() => {
      if (lira) {
          lira.setDanceMode(isDancing);
      }
  }, [isDancing, lira]);

  // Animação de fala
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

  // Sincronizar tamanho do modelo com o widget
  useEffect(() => {
    if (!lira || !lira.model) return;
    
    // 1. Deixa o LiraCore ajustar o tamanho do canvas e centralizar
    lira.handleResize();

    // 2. Sobrescreve a escala para garantir que ela preencha bem o circulo
    // Aumentei o fator para dar um zoom legal
    const forcedScale = size * 0.0008; 
    lira.model.scale.set(forcedScale);
    
    // Re-centralizar caso a escala mude o ponto de ancoragem visual
    // (O handleResize já seta x/y no meio, e ancora no 0.5, então só mudar scale é seguro)
    
  }, [size, lira]);

  // Resize Handler
  const handleResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startSize = size;

    const onMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newSize = Math.max(150, Math.min(600, startSize + delta));
        setSize(newSize);
    };

    const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        onInteraction('resize');
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('mouseup', onUp);
  };

  const handleWheel = (e: React.WheelEvent) => {
      // Allow scroll resizing
      const delta = e.deltaY * -0.2; // Sensitivity factor
      const newSize = Math.max(150, Math.min(600, size + delta));
      setSize(newSize);
      onInteraction('resize');
  };

  return (
    <motion.div
        drag
        dragMomentum={false}
        onDragEnd={() => onInteraction('drag')}
        onWheel={handleWheel}
        initial={{ x: window.innerWidth - 350, y: window.innerHeight - 400, opacity: 0, scale: 0.8 }}
        animate={{ 
            opacity: 1, 
            scale: 1,
            rotate: isDancing ? [0, -2, 2, -2, 2, 0] : 0,
            y: isDancing ? [0, -10, 0] : 0
        }}
        transition={{
            rotate: isDancing ? { repeat: Infinity, duration: 0.5, ease: "easeInOut" } : {},
            y: isDancing ? { repeat: Infinity, duration: 0.4, ease: "easeInOut" } : {}
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{ width: size, height: size }}
        className="fixed z-50 group"
    >
        {/* Container Circular/Recortado */}
        <div className={`
            relative w-full h-full overflow-hidden rounded-full border-2 
            ${isDancing ? 'border-lira-pink shadow-[0_0_30px_rgba(236,72,153,0.6)]' : 'border-white/5 bg-black/40 shadow-2xl'}
            backdrop-blur-sm hover:border-purple-500/30 transition-all duration-500
        `}>
            {/* ID do Canvas */}
            <div id={WIDGET_ID} className="w-full h-full" />
        </div>

        {/* External Controls Bar (Floating Below) */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#121214]/90 border border-white/10 p-2 rounded-2xl backdrop-blur-md shadow-xl transition-opacity opacity-100 z-[60]">
             <button 
                onClick={(e) => { e.stopPropagation(); setSize(Math.min(600, size + 30)); onInteraction('resize'); }}
                className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-colors"
                title="Aumentar"
            >
                <ZoomIn size={18} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); setSize(Math.max(150, size - 30)); onInteraction('resize'); }}
                className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-colors"
                title="Diminuir"
            >
                <ZoomOut size={18} />
            </button>
            
            <div className="w-px h-4 bg-white/10 mx-1" />

            <button 
                onClick={() => setIsDancing(!isDancing)} 
                className={`p-2 hover:bg-white/10 rounded-xl transition-colors ${isDancing ? 'text-lira-pink bg-lira-pink/10' : 'text-white/70 hover:text-white'}`}
                title="Modo Dança"
            >
                <Music size={18} />
            </button>
            <button 
                onClick={onClose} 
                className="p-2 hover:bg-red-500/20 rounded-xl text-white/70 hover:text-red-400 transition-colors"
                title="Fechar"
            >
                <X size={18} />
            </button>
        </div>

        {/* Resize Handle (Optional Visual Indicator) */}
        <div 
            onMouseDown={handleResize}
            className="absolute bottom-0 right-0 w-8 h-8 bg-transparent cursor-se-resize z-50"
        />
    </motion.div>
  );
};
