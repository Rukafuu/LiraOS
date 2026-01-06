
import { useState, useEffect, useCallback, useRef } from 'react';

// Tipagem para WebkitSpeechRecognition
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

const triggerWords = ['lira tá aí', 'lira ta ai', 'lira ta aew', 'lira tá aew', 'lira', 'jarvis'];

export const useWakeWord = (enabled: boolean = false, onWake: () => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);

  // Inicializa o reconhecimento
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const { webkitSpeechRecognition } = window as unknown as IWindow;
    if (!webkitSpeechRecognition) {
      console.warn('Browser does not support Speech Recognition for Wake Word.');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true; // Escuta pra sempre
    recognition.interimResults = true; // Pega resultados parciais (mais rápido)
    recognition.lang = 'pt-BR'; // Ouve em PT-BR (ou detecta auto)

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart se estiver ativado (Loop Infinito)
      if (enabled) {
        restartTimerRef.current = setTimeout(() => {
          try { recognition.start(); } catch {}
        }, 500);
      }
    };

    recognition.onresult = (event: any) => {
      // Pega o último resultado
      const resultIndex = event.resultIndex;
      const transcript = event.results[resultIndex][0].transcript.toLowerCase().trim();
      const isFinal = event.results[resultIndex].isFinal;

      // Verifica palavras-chave
      const detected = triggerWords.some(word => transcript.includes(word));
      
      if (detected) {
        console.log(`[WAKE WORD] 👂 Heard: "${transcript}"`);
        // Toca um som de ativação sutil
        const audio = new Audio('https://www.myinstants.com/media/sounds/discord-notification.mp3'); // Placeholder
        audio.volume = 0.3;
        audio.play().catch(() => {});
        
        // Pára de ouvir para evitar auto-loop enquanto o user fala o comando
        recognition.stop();
        onWake();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      clearTimeout(restartTimerRef.current);
      recognition.stop();
    };
  }, [enabled, onWake]);

  // Controle de Start/Stop baseado no prop 'enabled'
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (enabled && !isListening) {
      try { recognitionRef.current.start(); } catch {}
    } else if (!enabled && isListening) {
      recognitionRef.current.stop();
    }
  }, [enabled]); // Removido isListening para evitar loop de dependência, controle via onend

  return { isListening };
};
