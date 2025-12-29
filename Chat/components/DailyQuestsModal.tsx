import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Gift, Loader2, Trophy, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCurrentUser } from '../services/userService';

// Types (Defining here for speed, better in types.ts)
interface Quest {
    id: string;
    title: string;
    desc: string;
    target: number;
    progress: number;
    reward: number;
    claimed: boolean;
    type: string;
}

interface DailyQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  
  const currentUser = getCurrentUser();
  const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL as string;

  const fetchQuests = async () => {
      setLoading(true);
      try {
          const res = await fetch(`${API_BASE_URL}/api/gamification`, {
             headers: { 'Authorization': `Bearer ${currentUser?.token}` }
          });
          if (res.ok) {
              const data = await res.json();
              if (data.stats && data.stats.dailyQuests) {
                  setQuests(data.stats.dailyQuests.quests || []);
              }
          }
      } catch (e) {
          console.error("Failed to fetch quests", e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
     if (isOpen) fetchQuests();
  }, [isOpen]);

  const handleClaim = async (questId: string) => {
      setClaimingId(questId);
      try {
          const res = await fetch(`${API_BASE_URL}/api/gamification/claim`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${currentUser?.token}` 
              },
              body: JSON.stringify({ questId })
          });
          const result = await res.json();
          
          if (res.ok && result.success) {
              // Update local state to reflect claimed
              setQuests(prev => prev.map(q => 
                  q.id === questId ? { ...q, claimed: true } : q
              ));
              // Trigger a global user update event to refresh coins elsewhere
              window.dispatchEvent(new Event('user-updated'));
          } else {
              alert(result.error || 'Failed to claim');
          }
      } catch (e) {
          console.error("Claim error", e);
      } finally {
          setClaimingId(null);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-yellow-600/20 to-orange-500/20 flex flex-col items-center justify-center border-b border-white/5">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg mb-3 shadow-orange-500/20">
                <Gift size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Missões Diárias</h2>
            <p className="text-xs text-yellow-200/60 font-medium tracking-wider uppercase mt-1">Renova em 24h</p>
            
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Quest List */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-white/20" />
                </div>
            ) : quests.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                    Nenhuma missão disponível para hoje.
                </div>
            ) : (
                quests.map((quest, index) => {
                    const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
                    const isCompleted = quest.progress >= quest.target;
                    
                    return (
                        <motion.div 
                           key={quest.id}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: index * 0.1 }}
                           className={`relative p-4 rounded-xl border transition-colors ${
                               quest.claimed 
                               ? 'bg-white/5 border-white/5 opacity-50' 
                               : isCompleted 
                                 ? 'bg-yellow-500/10 border-yellow-500/30' 
                                 : 'bg-white/5 border-white/10'
                           }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className={`text-sm font-bold ${isCompleted && !quest.claimed ? 'text-yellow-400' : 'text-white'}`}>
                                        {quest.title || quest.desc}
                                    </h3>
                                    <p className="text-xs text-white/40 mt-0.5">{quest.desc}</p>
                                </div>
                                <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded text-xs text-yellow-200 font-mono border border-white/5">
                                    <span className="text-yellow-500 text-xs">🪙</span>
                                    {quest.reward}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-3">
                                <div className="flex justify-between text-[10px] text-white/40 mb-1 font-bold uppercase tracking-wider">
                                    <span>Progresso</span>
                                    <span>{quest.progress} / {quest.target}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        className={`h-full rounded-full ${isCompleted ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                    />
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-4 flex justify-end">
                                {quest.claimed ? (
                                    <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wider bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                                        <Check size={12} />
                                        Resgatado
                                    </div>
                                ) : isCompleted ? (
                                    <button 
                                        onClick={() => handleClaim(quest.id)}
                                        disabled={claimingId === quest.id}
                                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-yellow-500/20"
                                    >
                                        {claimingId === quest.id ? <Loader2 size={12} className="animate-spin" /> : <Gift size={12} />}
                                        Resgatar Recompensa
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 text-white/30 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-lg">
                                        <ArrowRight size={12} />
                                        Em Progresso
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })
            )}
        </div>
      </motion.div>
    </div>
  );
};
