import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, X } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to LiraOS",
    description: "You have just accessed the most advanced conversational interface. Let us guide you through your new workspace.",
    target: "center"
  },
  {
    title: "The Store & Economy",
    description: "Earn Lira Coins by chatting and completing quests. Spend them here to unlock new Themes and Personalities like 'Tsundere' or 'Unfiltered'.",
    target: "dashboard"
  },
  {
    title: "Total Control",
    description: "Manage your memories, privacy, and system settings here. You decide what Lira remembers.",
    target: "settings"
  },
  {
    title: "Multimodal Input",
    description: "You can now attach images and documents directly in the chat for advanced analysis.",
    target: "input"
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
    <div className="fixed inset-0 z-[55] pointer-events-auto flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative z-50 w-full max-w-md bg-[#0a0a12] border border-lira-blue/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(77,243,255,0.15)]"
      >
        <div className="flex items-start justify-between mb-4">
           <div className="px-2 py-1 bg-lira-blue/10 text-lira-blue text-[10px] font-bold rounded uppercase tracking-wider">
              Step {currentStep + 1}/{steps.length}
           </div>
           <button onClick={onComplete} className="text-lira-dim hover:text-white transition-colors">
              <X size={16} />
           </button>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">{steps[currentStep].title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
           {steps[currentStep].description}
        </p>

        <div className="flex items-center justify-between">
           <div className="flex gap-1">
              {steps.map((_, idx) => (
                 <div 
                   key={idx} 
                   className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-lira-blue' : 'w-1.5 bg-white/20'}`} 
                 />
              ))}
           </div>
           
           <button 
             onClick={handleNext}
             className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl hover:bg-lira-blue transition-colors shadow-lg"
           >
             {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
             {currentStep === steps.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
           </button>
        </div>
      </motion.div>
    </div>
  );
};