import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Palette, Users, Lock, Check } from 'lucide-react';
import { useGamification } from '../contexts/GamificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import { LiraThemeId, PersonaId } from '../types';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose }) => {
  const { stats, personas, buyTheme, buyPersona, unlockedPersonas, activePersonaId, setActivePersonaId, unlockedThemes } = useGamification();
  const { availableThemes, currentTheme, setTheme } = useTheme();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'themes' | 'personas'>('personas');

  const handleBuyTheme = (id: LiraThemeId, price: number, name: string) => {
     if (buyTheme(id, price)) {
        addToast(t('store.toast_unlocked', { name }), 'success');
     } else {
        addToast(t('store.not_enough_coins'), 'error');
     }
  };

  const handleBuyPersona = (id: PersonaId, price: number, name: string) => {
     if (buyPersona(id, price)) {
        addToast(t('store.toast_unlocked', { name }), 'success');
     } else {
        addToast(t('store.not_enough_coins'), 'error');
     }
  };

  const handleEquipPersona = (id: PersonaId) => {
     setActivePersonaId(id);
     addToast(t('store.toast_equipped'), 'info');
  };
  
  const handleApplyTheme = (id: LiraThemeId) => {
     setTheme(id);
     addToast(t('store.toast_applied'), 'info');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl h-[700px] bg-[#050510] border border-lira-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: 'var(--lira-bg)' }}
          >
             {/* Header */}
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-gradient-to-br from-lira-pink to-lira-purple rounded-lg text-white">
                      <ShoppingBag size={20} />
                   </div>
                    <div>
                       <h2 className="text-xl font-bold text-white">{t('store.title')}</h2>
                       <p className="text-xs text-lira-dim">{t('store.subtitle')}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                      <span className="font-mono font-bold text-yellow-400">{stats.coins} {t('store.coins')}</span>
                   </div>
                   <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-lira-dim hover:text-white transition-colors">
                      <X size={20} />
                   </button>
                </div>
             </div>

             {/* Tabs */}
             <div className="flex border-b border-white/5">
                <button 
                  onClick={() => setActiveTab('personas')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'personas' ? 'text-white' : 'text-lira-dim hover:text-white'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                       <Users size={16} /> {t('store.tabs.personas')}
                    </div>
                   {activeTab === 'personas' && <motion.div layoutId="storeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-lira-blue" />}
                </button>
                <button 
                  onClick={() => setActiveTab('themes')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === 'themes' ? 'text-white' : 'text-lira-dim hover:text-white'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                       <Palette size={16} /> {t('store.tabs.themes')}
                    </div>
                   {activeTab === 'themes' && <motion.div layoutId="storeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-lira-blue" />}
                </button>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-black/20">
                {activeTab === 'personas' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {personas.map(persona => {
                         const Icon = persona.icon;
                         const isUnlocked = !persona.isLocked;
                         const isActive = activePersonaId === persona.id;
                         const canAfford = stats.coins >= persona.price;

                         return (
                            <div key={persona.id} className={`relative p-5 rounded-2xl border transition-all duration-300 ${isActive ? 'bg-lira-blue/10 border-lira-blue shadow-[0_0_20px_-5px_rgba(var(--lira-secondary-rgb),0.3)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                               <div className="flex justify-between items-start mb-4">
                                  <div className={`p-3 rounded-xl ${isActive ? 'bg-lira-blue text-black' : 'bg-white/10 text-white'}`}>
                                     <Icon size={24} />
                                  </div>
                                  {isUnlocked ? (
                                     isActive ? (
                                         <div className="px-2 py-1 bg-lira-blue text-black text-[10px] font-bold rounded flex items-center gap-1">
                                            <Check size={10} /> {t('store.active')}
                                         </div>
                                     ) : (
                                        <button 
                                          onClick={() => handleEquipPersona(persona.id)}
                                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded transition-colors"
                                        >
                                            {t('store.equip')}
                                        </button>
                                     )
                                  ) : (
                                     <div className="flex items-center gap-1 text-yellow-400 font-mono text-sm font-bold bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20">
                                        <Lock size={12} /> {persona.price}
                                     </div>
                                  )}
                               </div>

                               <h3 className="text-lg font-bold text-white mb-1">{persona.name}</h3>
                               <p className="text-sm text-lira-dim mb-4 min-h-[40px]">{persona.description}</p>

                               {!isUnlocked && (
                                  <button 
                                    onClick={() => handleBuyPersona(persona.id, persona.price, persona.name)}
                                    disabled={!canAfford}
                                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${canAfford ? 'bg-white text-black hover:bg-lira-blue hover:scale-[1.02]' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                                  >
                                     {canAfford ? t('store.unlock_persona') : t('store.not_enough_coins')}
                                  </button>
                               )}
                            </div>
                         );
                      })}
                   </div>
                )}

                {activeTab === 'themes' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableThemes.map(theme => {
                         const isUnlocked = unlockedThemes.includes(theme.id);
                         const isActive = currentTheme.id === theme.id;
                         const canAfford = stats.coins >= theme.price;

                         return (
                            <div key={theme.id} className={`group relative rounded-xl overflow-hidden border transition-all ${isActive ? 'ring-2 ring-lira-primary border-transparent' : 'border-white/10 hover:border-white/30'}`}>
                               {/* Preview */}
                               <div className="h-24 relative" style={{ backgroundColor: theme.colors.bg }}>
                                  <div className="absolute top-2 left-2 right-2 h-2 rounded-full opacity-30" style={{ backgroundColor: theme.colors.card }}></div>
                                  <div className="absolute top-8 right-2 w-8 h-8 rounded-full blur-md opacity-60" style={{ backgroundColor: theme.colors.primary }}></div>
                                  
                                  {!isUnlocked && (
                                     <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                                        <Lock size={20} className="text-white/50" />
                                     </div>
                                  )}
                               </div>

                               <div className="p-3 bg-white/5">
                                  <div className="flex justify-between items-center mb-2">
                                     <span className="font-bold text-white text-sm">{theme.name}</span>
                                     {!isUnlocked && <span className="text-xs text-yellow-400 font-mono">{theme.price}</span>}
                                  </div>

                                  {isUnlocked ? (
                                     <button 
                                       onClick={() => handleApplyTheme(theme.id)}
                                       className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${isActive ? 'bg-lira-primary text-black cursor-default' : 'bg-white/10 hover:bg-white text-white hover:text-black'}`}
                                     >
                                        {isActive ? t('store.active') : t('store.apply')}
                                     </button>
                                  ) : (
                                     <button 
                                       onClick={() => handleBuyTheme(theme.id, theme.price, theme.name)}
                                       disabled={!canAfford}
                                       className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${canAfford ? 'bg-white text-black hover:bg-lira-primary' : 'bg-white/5 text-white/30'}`}
                                     >
                                        {t('store.unlock')}
                                     </button>
                                  )}
                               </div>
                            </div>
                         );
                      })}
                   </div>
                )}
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};