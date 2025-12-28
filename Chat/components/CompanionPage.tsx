
import React, { useEffect, useState, useRef } from 'react';
import { LiraCore } from '../lib/lira-avatar/liraCore';
import { X, Maximize2 } from 'lucide-react';

export const CompanionPage: React.FC = () => {
  const [lira, setLira] = useState<LiraCore | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [emotion, setEmotion] = useState('normal');
  const COMPANION_CONTAINER_ID = 'lira-companion-root';

  // Sincronização via BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel('lira_companion_channel');

    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      
      console.log('[Companion] Received:', type, payload);

      if (type === 'SPEAK_START') {
        setIsSpeaking(true);
      }
      if (type === 'SPEAK_END') {
        setIsSpeaking(false);
      }
      if (type === 'EMOTION') {
        setEmotion(payload);
        if (lira) lira.setExpression(payload);
      }
    };

    return () => channel.close();
  }, [lira]);

  // Inicializar Live2D
  useEffect(() => {
    if (lira) return;

    const initLira = async () => {
      try {
        const core = new LiraCore(COMPANION_CONTAINER_ID);
        await core.initLive2D();
        await core.loadModel('/assets/model/lira/youling.model3.json');
        
        // Ajuste fino: O LiraCore cuida do resize, mas podemos forçar um pouco via CSS ou parâmetros se tivermos acesso
        // Como 'model' é privado, confiamos no handleResize do LiraCore

        setLira(core);
        console.log('[Companion] Lira initialized');
      } catch (error) {
        console.error('[Companion] Failed to init Lira:', error);
      }
    };

    // Pequeno delay para garantir que o DOM existe
    setTimeout(initLira, 100);

    return () => {
      lira?.destroy();
    };
  }, []);

  // Update loop for animations
  useEffect(() => {
    if (!lira) return;

    let animationFrameId: number;

    const animate = () => {
        // Simular lip-sync básico baseado no estado isSpeaking
        if (isSpeaking) {
             const randomOpen = Math.random();
             lira.updateMouth(randomOpen); // Apenas 1 argumento
        } else {
             lira.updateMouth(0);
        }
        
        animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [lira, isSpeaking]);

  return (
    <div className="w-screen h-screen bg-[#0A0A0B] overflow-hidden relative flex items-center justify-center drag-region">
      {/* Background transparente simulate (chroma key style if needed in future) */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
      
      {/* Lira Container - Needs specific ID */}
      <div 
        id={COMPANION_CONTAINER_ID}
        className="w-full h-full flex items-center justify-center"
        style={{ cursor: 'move' }}
      />

      {/* Mini Controls */}
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity z-50">
        <button 
            onClick={() => window.close()}
            className="p-2 bg-black/50 text-white rounded-full hover:bg-red-500/50 transition-colors"
        >
            <X size={16} />
        </button>
      </div>
    </div>
  );
};
