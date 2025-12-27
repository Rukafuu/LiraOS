import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  isListening?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ onTranscript }) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setSupported(false);
    }
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const toggleListening = () => {
    if (!supported) return;

    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    try {
      // @ts-ignore
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true; // Keep listening
      recognition.interimResults = true; // Get partial results
      recognition.lang = 'pt-BR'; // Portuguese
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('[VoiceButton] Recognition started');
        setListening(true);
      };

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        
        // Only send final results
        if (event.results[last].isFinal) {
          console.log('[VoiceButton] Final transcript:', transcript);
          onTranscript(transcript);
          stopListening();
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[VoiceButton] Recognition error:', event.error);
        // Ignore 'aborted' and 'no-speech' errors
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error("Speech recognition error", event.error);
        }
        stopListening();
      };

      recognition.onend = () => {
        console.log('[VoiceButton] Recognition ended');
        // Only reset if we're still supposed to be listening
        // (prevents race condition with manual stop)
        if (recognitionRef.current === recognition) {
          setListening(false);
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('[VoiceButton] Failed to start:', e);
      setListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setListening(false);
  };

  if (!supported) return null;

  return (
    <button
      onClick={toggleListening}
      className={`
        relative p-2.5 rounded-xl transition-all duration-300 group
        ${listening ? 'text-lira-pink bg-lira-pink/10' : 'text-lira-dim hover:text-white hover:bg-white/5'}
      `}
      title="Voice Input"
    >
      <AnimatePresence>
        {listening && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-lira-pink/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </AnimatePresence>
      
      {listening ? <MicOff size={20} /> : <Mic size={20} className="group-hover:scale-110 transition-transform" />}
    </button>
  );
};
