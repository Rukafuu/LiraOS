
import React, { useEffect, useState, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { LiraCore } from '../lib/lira-avatar/liraCore';
import { X, Maximize2, Move } from 'lucide-react';

interface LiraFloatingWidgetProps {
  onClose: () => void;
  onInteraction: (type: 'drag' | 'resize') => void;
  isSpeaking: boolean;
}

export const LiraFloatingWidget: React.FC<LiraFloatingWidgetProps> = ({ onClose, onInteraction, isSpeaking }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lira, setLira] = useState<LiraCore | null>(null);
  const [size, setSize] = useState(300); // Tamanho inicial
  const WIDGET_ID = 'lira-floating-widget-root';

  // Inicializar Lira
  useEffect(() => {
    if (lira) return;

    const init = async () => {
        // Pequeno delay para o DOM montar
        await new Promise(r => setTimeout(r, 100));
        
        try {
            const core = new LiraCore(WIDGET_ID);
            await core.initLive2D();
            await core.loadModel('/assets/model/lira/youling.model3.json');
            
            // Ajustar posição inicial do modelo dentro do canvas
            if (core.model) {
                core.model.y = 0; 
                core.model.scale.set(0.15); // Escala relativa ao canvas
            }
            
            setLira(core);
        } catch (err) {
            console.error('Failed to init floating widget:', err);
        }
    };
    init();

    return () => lira?.destroy();
  }, []);

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
  };

  return (
    <motion.div
        drag
        dragMomentum={false}
        onDragEnd={() => onInteraction('drag')}
        initial={{ x: window.innerWidth - 350, y: window.innerHeight - 400, opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        style={{ width: size, height: size }}
        className="fixed z-50 rounded-full group"
    >
        {/* Container Circular/Recortado */}
        <div className="relative w-full h-full overflow-hidden rounded-full border-2 border-white/5 bg-black/40 backdrop-blur-sm shadow-2xl hover:border-purple-500/30 transition-colors">
            
            {/* ID do Canvas */}
            <div id={WIDGET_ID} className="w-full h-full" />

            {/* Controls Overlay (Hover) */}
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end p-4">
                <button onClick={onClose} className="text-white/70 hover:text-red-400">
                    <X size={20} />
                </button>
            </div>

            {/* Drag Handle (Centro Invisível) */}
            {/* O próprio componente é draggável, mas podemos por um icone indicador se quiser */}
        </div>

        {/* Resize Handle */}
        <div 
            onMouseDown={handleResize}
            className="absolute bottom-4 right-4 w-6 h-6 bg-white/10 rounded-full cursor-se-resize hover:bg-purple-500 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
            <Maximize2 size={12} className="text-white" />
        </div>
    </motion.div>
  );
};
