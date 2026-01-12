import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Star, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SupportersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock Data - in production this would come from an API
const FOUNDERS = [
  { name: 'Unknown Architect', tier: 'singularity', joined: '2024' },
  { name: 'Null Pointer', tier: 'singularity', joined: '2025' },
];

const SUPPORTERS = [
  { name: 'Alex Chen', tier: 'supernova' },
  { name: 'Sarah Jones', tier: 'antares' },
  { name: 'Mike Ross', tier: 'antares' },
  { name: 'Jessica P.', tier: 'sirius' },
  { name: 'David K.', tier: 'sirius' },
];

export const SupportersModal: React.FC<SupportersModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#08080a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-lira-purple/10 to-transparent">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-lg">
                    <Crown size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Hall of Fame</h2>
                    <p className="text-xs text-gray-400">The visionaries powering LiraOS</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                 <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
               
               {/* Singularity / Founders Section */}
               <div className="mb-12 text-center">
                  <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5">
                      <div className="w-2 h-2 rounded-full bg-black border border-white shadow-[0_0_10px_white]" />
                      <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-white">The Singularity</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {FOUNDERS.map((founder, i) => (
                          <div key={i} className="group relative p-[1px] rounded-xl bg-gradient-to-b from-white/20 to-transparent hover:from-white/40 transition-all duration-500">
                              <div className="absolute inset-0 bg-white/5 blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
                              <div className="relative bg-[#0c0c0e] rounded-[11px] p-6 flex flex-col items-center">
                                  <div className="w-16 h-16 rounded-full bg-black border border-white/10 flex items-center justify-center mb-3 shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)]">
                                     <Crown size={24} className="text-white" />
                                  </div>
                                  <h3 className="text-lg font-bold text-white">{founder.name}</h3>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Founder • {founder.joined}</p>
                              </div>
                          </div>
                      ))}
                      
                      {/* Empty Slot Placeholder */}
                      <div className="relative p-6 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-help" title="Only 3 slots available worldwide.">
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                              <span className="text-xl">?</span>
                          </div>
                          <span className="text-xs text-gray-500">Reserved Slot</span>
                      </div>
                  </div>
               </div>

               {/* Standard Supporters */}
               <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-6 flex items-center gap-2">
                      <Heart size={14} className="text-lira-pink" />
                      Community Patrons
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {SUPPORTERS.map((s, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                              <div className={`w-2 h-2 rounded-full ${s.tier === 'supernova' ? 'bg-yellow-400 shadow-[0_0_8px_yellow]' : s.tier === 'antares' ? 'bg-red-500' : 'bg-blue-400'}`} />
                              <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-200">{s.name}</span>
                                  <span className="text-[10px] text-gray-500 capitalize">{s.tier} Tier</span>
                              </div>
                          </div>
                      ))}
                   </div>
                </div>

                {/* Call to Action - Become a Sponsor */}
                <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-purple-500/10 to-transparent border border-white/10 text-center">
                   <div className="flex justify-center mb-4">
                      <div className="p-3 bg-yellow-400/20 text-yellow-400 rounded-full animate-pulse">
                         <Star size={32} fill="currentColor" />
                      </div>
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Support the Future of LiraOS</h3>
                   <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                      Help us keep the servers running and Lira evolving. Sponsors get exclusive personas, themes, and "The Singularity" badge.
                   </p>
                   <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <a 
                        href="https://github.com/sponsors/Rukafuu" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all transform hover:scale-105"
                      >
                         <Star size={18} />
                         GitHub Sponsors
                      </a>
                      <a 
                        href="https://www.patreon.com/cw/amarinthlira?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FF424D] text-white font-bold rounded-xl hover:bg-[#e33b44] transition-all transform hover:scale-105"
                      >
                         <Heart size={18} fill="currentColor" />
                         Patreon
                      </a>
                   </div>
                </div>

             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
