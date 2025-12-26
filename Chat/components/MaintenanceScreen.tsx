import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Sparkles, Heart } from 'lucide-react';
// @ts-ignore
import videoSrc from '../assets/lira-sorry.mp4';

export const MaintenanceScreen: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden font-sans text-white">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-20"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Overlay - Dark Blue/Black gradient with low opacity for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0a0a12]/50 to-[#0a0a12]/70 -z-10 backdrop-blur-[2px]" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        
        {/* Glass Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="
            relative
            flex flex-col items-center text-center
            p-8 md:p-12
            max-w-xl w-full
            rounded-3xl
            border border-white/10
            bg-white/5 
            backdrop-blur-xl
            shadow-2xl shadow-black/20
          "
        >
          {/* Decorative Icon */}
          <motion.div 
            initial={{ rotate: -10 }}
            animate={{ rotate: 10 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            className="mb-6 p-4 rounded-full bg-white/5 border border-white/10 text-pink-300"
          >
            <Wrench size={32} />
          </motion.div>

          {/* Japanese Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-pink-100 to-blue-200 drop-shadow-lg">
            ごめんなさい!
          </h1>
          
          {/* Main Title */}
          <h2 className="text-xl md:text-2xl font-light text-white/90 mb-6 uppercase tracking-widest">
            Em Manutenção
          </h2>

          {/* Message */}
          <p className="text-base md:text-lg text-blue-100/80 leading-relaxed font-light mb-8">
            A Lira está fazendo alguns ajustes no sistema. <br className="hidden md:block"/>
            Prometo voltar logo!
          </p>

          {/* Cute Footer */}
          <div className="flex flex-col items-center gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95"
              >
                  Verificar Conexão
              </button>
              
              <div className="flex items-center gap-2 text-xs md:text-sm text-pink-200/60">
                <Sparkles size={14} />
                <span>Voltaremos mais fortes</span>
                <Heart size={14} className="fill-current" />
              </div>
          </div>

          {/* Progress Bar Decoration (Fake) */}
          <div className="w-full h-1 bg-white/10 rounded-full mt-8 overflow-hidden">
             <motion.div 
               className="h-full bg-gradient-to-r from-pink-400 to-blue-400"
               initial={{ width: "0%" }}
               animate={{ width: "100%" }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
             />
          </div>

        </motion.div>
      </div>
    </div>
  );
};
