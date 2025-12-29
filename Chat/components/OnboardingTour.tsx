import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, X, Mic, Eye, Zap, Brain, Sparkles } from 'lucide-react';
import { LIRA_AVATAR } from '../constants';

interface OnboardingTourProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Hi, I'm Lira!",
    description: "I'm not just a chatbot. I'm your new AI companion designed to evolve with you. I can see, speak, and remember.",
    icon: <Sparkles className="text-purple-400" size={32} />
  },
  {
    title: "I Have a Voice",
    description: "My neural voice engine runs locally on your PC. I can speak with real emotion. Just enable 'Read Aloud' to hear me.",
    icon: <Mic className="text-blue-400" size={32} />
  },
  {
    title: "I Can See Everything",
    description: "Show me your work! Paste screenshots, upload images, or share code files. I'll visualize and analyze them instantly.",
    icon: <Eye className="text-green-400" size={32} />
  },
  {
    title: "Gamified Evolution",
    description: "Every interaction earns you XP and Lira Coins. Visit the Store to unlock new Personalities, Voices, and Themes.",
    icon: <Zap className="text-yellow-400" size={32} />
  },
  {
    title: "Long-term Memory",
    description: "I don't reset when you leave. I build a deep memory of our conversations, your projects, and your preferences.",
    icon: <Brain className="text-pink-400" size={32} />
  }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onComplete}
      />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50, rotateY: -10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          exit={{ opacity: 0, x: -50, rotateY: 10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative z-50 w-full max-w-lg bg-[#121216] border border-white/10 rounded-3xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden"
        >
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-lira-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Header with Avatar */}
            <div className="flex items-center gap-4 mb-6 relative">
                 <div className="relative group">
                    <div className="absolute inset-0 bg-lira-primary rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity" />
                    <img 
                        src={LIRA_AVATAR} 
                        alt="Lira" 
                        className="relative w-16 h-16 rounded-full border-2 border-white/20 object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-[#121216] p-1 rounded-full">
                        {steps[currentStep].icon}
                    </div>
                 </div>
                 <div>
                     <h3 className="text-2xl font-bold text-white tracking-tight">{steps[currentStep].title}</h3>
                     <div className="flex gap-1.5 mt-2">
                        {steps.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-lira-primary' : 'w-2 bg-white/10'}`} 
                            />
                        ))}
                    </div>
                 </div>
                 <button onClick={onComplete} className="absolute top-0 right-0 text-white/20 hover:text-white transition-colors">
                    <X size={20} />
                 </button>
            </div>

            {/* Content */}
            <div className="min-h-[100px] mb-8">
                <p className="text-lg text-gray-300 leading-relaxed font-light">
                    "{steps[currentStep].description}"
                </p>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-white/5">
               <button 
                 onClick={onComplete}
                 className="text-sm text-gray-500 hover:text-white transition-colors px-2"
               >
                 Skip Tour
               </button>
               
               <button 
                 onClick={handleNext}
                 className="group flex items-center gap-3 px-6 py-3 bg-white text-black text-sm font-bold rounded-2xl hover:bg-lira-primary hover:text-white transition-all shadow-lg hover:shadow-lira-primary/30"
               >
                 {currentStep === steps.length - 1 ? "Let's Start" : 'Next Step'}
                 {currentStep === steps.length - 1 ? <Check size={18} /> : <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
               </button>
            </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
};