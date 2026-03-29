import React, { useState, useEffect, useRef } from 'react';
import { Microphone, MicrophoneSlash, CircleNotch } from '@phosphor-icons/react';
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
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        
        if (event.results[last].isFinal) {
          onTranscript(transcript);
          stopListening();
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error("Speech recognition error", event.error);
        }
        stopListening();
      };

      recognition.onend = () => {
        if (recognitionRef.current === recognition) {
          setListening(false);
          recognitionRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
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
        relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all duration-300 group
        ${listening ? 'text-red-400 bg-red-400/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}
      `}
      title="Voice Input"
    >
      <AnimatePresence>
        {listening && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-400/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      
      {listening ? (
        <MicrophoneSlash size={20} weight="bold" />
      ) : (
        <Microphone size={20} weight="bold" className="group-hover:scale-110 transition-transform" />
      )}
    </button>
  );
};

