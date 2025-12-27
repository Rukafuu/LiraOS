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
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setListening(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        // Ignore 'aborted' errors (user cancelled)
        if (event.error !== 'aborted') {
          console.error("Speech recognition error", event.error);
        }
        setListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
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
