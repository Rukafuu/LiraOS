import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, Trophy, Zap, Heart, Calendar, Target, Shield, Crown, Sparkles, Check, History, GripVertical, Layout, HelpCircle, Moon, Sun, Palette, Mic, Image as ImageIcon, Code, Save, Settings, Flame, MessageCircle, Languages, Edit, RefreshCw, Coins, Users, Brush, Send, Brain, Eye, Terminal, DollarSign, Grid, Star, RotateCcw, Cpu, Briefcase, Link, Ghost, Layers, Award, Shuffle, Infinity as InfinityIcon, Database, CheckCircle, Bug, FlaskConical, Search, Repeat, Share2 } from 'lucide-react';
import { useGamification } from '../contexts/GamificationContext';
import { useTranslation } from 'react-i18next';
import { Achievement, AchievementRarity } from '../types';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getRarityColor = (rarity: AchievementRarity) => {
  switch (rarity) {
    case 'common': return 'border-white/10 bg-white/5 text-gray-300';
    case 'uncommon': return 'border-green-500/30 bg-green-500/10 text-green-300';
    case 'rare': return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
    case 'epic': return 'border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
    case 'legendary': return 'border-orange-500/30 bg-orange-500/10 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.3)]';
    case 'galactic': return 'border-pink-500/30 bg-pink-500/10 text-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.4)]';
    case 'cosmic': return 'border-lira-primary/50 bg-black text-white shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-pulse';
    default: return 'border-white/10 bg-white/5';
  }
};

const AchievementIcon = ({ name, size = 14 }: { name: string, size?: number }) => {
  switch (name) {
    case 'zap': return <Zap size={size} />;
    case 'help-circle': return <HelpCircle size={size} />;
    case 'moon': return <Moon size={size} />;
    case 'sun': return <Sun size={size} />;
    case 'palette': return <Palette size={size} />;
    case 'mic': return <Mic size={size} />;
    case 'image': return <ImageIcon size={size} />;
    case 'code': return <Code size={size} />;
    case 'save': return <Save size={size} />;
    case 'settings': return <Settings size={size} />;
    case 'flame': return <Flame size={size} />;
    case 'message-circle': return <MessageCircle size={size} />;
    case 'languages': return <Languages size={size} />;
    case 'edit': return <Edit size={size} />;
    case 'refresh-cw': return <RefreshCw size={size} />;
    case 'coins': return <Coins size={size} />;
    case 'users': return <Users size={size} />;
    case 'brush': return <Brush size={size} />;
    case 'send': return <Send size={size} />;
    case 'brain': return <Brain size={size} />;
    case 'heart': return <Heart size={size} />;
    case 'message-square': return <MessageCircle size={size} />; // fallback
    case 'eye': return <Eye size={size} />;
    case 'terminal': return <Terminal size={size} />;
    case 'calendar': return <Calendar size={size} />;
    case 'dollar-sign': return <DollarSign size={size} />;
    case 'mask': return <Sparkles size={size} />; // fallback
    case 'grid': return <Grid size={size} />;
    case 'star': return <Star size={size} />;
    case 'rotate-ccw': return <RotateCcw size={size} />;
    case 'fire': return <Flame size={size} />;
    case 'scroll': return <Database size={size} />; // fallback
    case 'cpu': return <Cpu size={size} />;
    case 'briefcase': return <Briefcase size={size} />;
    case 'link': return <Link size={size} />;
    case 'ghost': return <Ghost size={size} />;
    case 'x-octagon': return <X size={size} />; // fallback
    case 'layers': return <Layers size={size} />;
    case 'award': return <Award size={size} />;
    case 'shuffle': return <Shuffle size={size} />;
    case 'infinity': return <InfinityIcon size={size} />;
    case 'anchor': return <Target size={size} />; // fallback
    case 'database': return <Database size={size} />;
    case 'check-circle': return <CheckCircle size={size} />;
    case 'bug': return <Bug size={size} />;
    case 'flask-conical': return <FlaskConical size={size} />;
    case 'search': return <Search size={size} />;
    case 'repeat': return <Repeat size={size} />;
    case 'share-2': return <Share2 size={size} />;
    case 'universe': return <Sparkles size={size} />; // fallback
    case 'wind': return <Zap size={size} />; // fallback
    default: return <Trophy size={size} />;
  }
};

export const DashboardModal: React.FC<DashboardModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { stats: rawStats, quests, achievements, leaderboard, claimReward, rankTitle } = useGamification();
  const stats = rawStats || { 
      level: 1, currentXp: 0, nextLevelXp: 100, bondLevel: 0, streakDays: 0, 
      username: 'Loading...', coins: 0, plan: 'free' 
  };
   
  const [questTab, setQuestTab] = useState<'active' | 'history'>('active');
  const [isEditMode, setIsEditMode] = useState(false);
  const [items, setItems] = useState(['quests', 'leaderboard', 'achievements']);

  // Load saved layout
  useEffect(() => {
    const savedLayout = localStorage.getItem('lira_hub_layout');
    if (savedLayout) {
        try {
            setItems(JSON.parse(savedLayout));
        } catch {}
    }
  }, []);

  // Save layout
  useEffect(() => {
      localStorage.setItem('lira_hub_layout', JSON.stringify(items));
  }, [items]);

  const xpProgress = (stats.currentXp / stats.nextLevelXp) * 100;
  const activeQuests = quests.filter(q => !q.isClaimed);
  const historyQuests = quests.filter(q => q.isClaimed);

  const renderBlock = (id: string) => {
      switch (id) {
          case 'quests':
              return (
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full min-h-[300px]">
                     <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                           {isEditMode && <GripVertical className="text-white/20 cursor-grab active:cursor-grabbing" size={16} />}
                           <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                              <Target size={16} className="text-lira-purple" /> {t('dashboard.quests.title')}
                           </h3>
                        </div>
                        <div className="flex bg-black/30 rounded-lg p-0.5 border border-white/10">
                           <button onClick={() => setQuestTab('active')} className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${questTab === 'active' ? 'bg-white/10 text-white' : 'text-lira-dim hover:text-white'}`}>{t('dashboard.quests.active')}</button>
                           <button onClick={() => setQuestTab('history')} className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${questTab === 'history' ? 'bg-white/10 text-white' : 'text-lira-dim hover:text-white'}`}>{t('dashboard.quests.history')}</button>
                        </div>
                     </div>
                     <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[300px] scrollbar-thin">
                        {questTab === 'active' ? (
                           activeQuests.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-lira-dim gap-2 p-8">
                                 <Check size={24} />
                                 <span className="text-xs">{t('dashboard.quests.all_completed')}</span>
                              </div>
                           ) : (
                              activeQuests.map(quest => (
                                 <div key={quest.id} className="p-2.5 rounded-xl bg-black/20 border border-white/5 flex justify-between items-center group hover:bg-white/5 transition-colors">
                                    <div className="flex gap-2.5 items-center">
                                       <div className={`w-4 h-4 rounded border ${quest.isCompleted ? 'bg-lira-primary border-lira-primary' : 'border-white/30'} flex items-center justify-center`}>
                                          {quest.isCompleted && <Check size={10} className="text-black" />}
                                       </div>
                                       <div>
                                          <div className="text-xs font-medium text-white group-hover:text-lira-primary transition-colors">{quest.title}</div>
                                          <div className="text-[10px] text-lira-dim hidden sm:block">{quest.description}</div>
                                          <div className="mt-1 w-20 bg-white/10 h-0.5 rounded-full overflow-hidden">
                                             <div className="bg-lira-primary h-full" style={{ width: `${(quest.progress / quest.maxProgress) * 100}%` }} />
                                          </div>
                                       </div>
                                    </div>
                                    {quest.isCompleted ? (
                                       <button onClick={() => claimReward(quest.id)} className="px-2 py-1 bg-lira-primary text-black text-[10px] font-bold rounded hover:bg-white transition-colors">{t('dashboard.quests.claim')}</button>
                                    ) : (
                                       <div className="text-[10px] font-mono text-lira-primary bg-lira-primary/10 px-1.5 py-0.5 rounded">{t('dashboard.quests.xp_reward', { amount: quest.xpReward })}</div>
                                    )}
                                 </div>
                              ))
                           )
                        ) : (
                           historyQuests.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-lira-dim gap-2 p-8">
                                 <History size={24} />
                                 <span className="text-xs">{t('dashboard.quests.no_history')}</span>
                              </div>
                           ) : (
                              historyQuests.map(quest => (
                                 <div key={quest.id} className="p-2.5 rounded-xl bg-black/10 border border-white/5 flex justify-between items-center opacity-60">
                                    <div className="flex gap-2.5 items-center">
                                       <Check size={12} className="text-lira-dim" />
                                       <div className="text-xs font-medium text-gray-300 line-through decoration-white/20">{quest.title}</div>
                                    </div>
                                    <div className="text-[9px] text-lira-dim border border-white/10 px-1.5 py-0.5 rounded">{t('dashboard.quests.claimed')}</div>
                                 </div>
                              ))
                           )
                        )}
                     </div>
                  </div>
              );
          case 'leaderboard':
              return (
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full min-h-[300px]">
                     <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                        {isEditMode && <GripVertical className="text-white/20 cursor-grab active:cursor-grabbing" size={16} />}
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                           <Crown size={16} className="text-yellow-400" /> {t('dashboard.ranking.title')}
                        </h3>
                     </div>
                     <div className="flex-1 overflow-y-auto max-h-[300px] scrollbar-thin">
                        {leaderboard.map((user) => (
                           <div key={user.id} className={`flex items-center gap-3 p-2.5 border-b border-white/5 last:border-0 ${user.isCurrentUser ? 'bg-lira-blue/10' : ''}`}>
                              <div className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded ${user.rank <= 3 ? 'bg-yellow-400 text-black' : 'text-lira-dim'}`}>{user.rank}</div>
                              <div className="flex-1 min-w-0">
                                 <div className="text-xs font-medium text-white truncate flex items-center gap-1">
                                    {user.username}
                                    {user.isCurrentUser && <span className="text-[9px] text-lira-blue">{t('dashboard.ranking.you')}</span>}
                                 </div>
                                 <div className="text-[9px] text-lira-dim">{(user.xp || 0).toLocaleString()} XP</div>
                              </div>
                              <div className="text-xs">{user.badges && user.badges[0]}</div>
                           </div>
                        ))}
                     </div>
                  </div>
              );
          case 'achievements':
              return (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[150px]">
                     <div className="flex items-center gap-3 mb-3">
                        {isEditMode && <GripVertical className="text-white/20 cursor-grab active:cursor-grabbing" size={16} />}
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <Trophy size={16} className="text-lira-pink" /> {t('dashboard.trophies.title')}
                        </h3>
                     </div>
                     <div className="grid grid-cols-5 gap-2">
                        {achievements.filter(a => !a.isHidden || a.unlockedAt).map((ach) => (
                           <div key={ach.id} className={`aspect-square rounded-lg flex items-center justify-center border transition-all hover:scale-105 cursor-help relative group/tooltip ${ach.unlockedAt ? getRarityColor(ach.rarity) : 'bg-black/40 border-white/5 text-white/10'}`}>
                              <AchievementIcon name={ach.icon} size={ach.unlockedAt ? 16 : 14} />
                              
                              {/* Tooltip */}
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-black/90 border border-white/10 rounded-lg p-2 text-center pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                                <div className="text-xs font-bold text-white mb-0.5">{ach.title}</div>
                                <div className="text-[10px] text-gray-400">{ach.description}</div>
                                {ach.unlockedAt && (
                                   <div className="text-[9px] text-lira-dim mt-1 pt-1 border-t border-white/10">
                                      {t('dashboard.trophies.unlocked', { date: new Date(ach.unlockedAt).toLocaleDateString() })}
                                   </div>
                                )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
              );
          default: return null;
      }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#050510] border-l border-white/10 shadow-2xl flex flex-col z-50"
            style={{ backgroundColor: 'var(--lira-bg)' }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5 backdrop-blur-md z-10">
               <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <span className="bg-clip-text text-transparent bg-gradient-to-r from-lira-pink to-lira-blue">{t('dashboard.title')}</span>
                     <span className="px-1.5 py-0.5 rounded border border-white/10 text-[10px] text-lira-dim font-mono">3.0</span>
                  </h2>
               </div>
               <div className="flex items-center gap-2">
                   <button 
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`p-2 rounded-lg transition-colors ${isEditMode ? 'bg-lira-primary text-black' : 'text-lira-dim hover:text-white hover:bg-white/10'}`}
                      title={t('dashboard.edit_layout')}
                   >
                      <Layout size={18} />
                   </button>
                   <button 
                      onClick={onClose} 
                      className="p-2 rounded-full hover:bg-white/10 text-lira-dim hover:text-white transition-colors"
                   >
                      <X size={20} />
                   </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
               
               {/* FIXED SECTION: Level, Bond, Streak */}
               <div className="grid grid-cols-2 gap-4">
                  {/* Level Card */}
                  <div className="col-span-2 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={64} />
                     </div>
                     <div className="flex justify-between items-start mb-3 relative z-10">
                        <div>
                           <div className="text-[10px] font-bold text-lira-pink uppercase tracking-widest mb-1">{t('dashboard.level')} {stats.level}</div>
                           <div className="text-2xl font-bold text-white">{rankTitle}</div>
                        </div>
                     </div>
                     <div className="space-y-1.5 relative z-10">
                        <div className="flex justify-between text-[10px] text-lira-dim">
                           <span>{stats.currentXp} XP</span>
                           <span>{stats.nextLevelXp} XP</span>
                        </div>
                        <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${xpProgress}%` }}
                              className="h-full bg-gradient-to-r from-lira-pink to-lira-purple"
                           />
                        </div>
                     </div>
                  </div>

                  {/* Bond Card */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-lira-blue/30 transition-colors">
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="text-lira-blue relative"
                      >
                         <Heart size={24} fill="currentColor" />
                         <div className="absolute inset-0 blur-lg bg-lira-blue/50 opacity-50" />
                      </motion.div>
                      <div>
                         <div className="text-lg font-bold text-white">{stats.bondLevel}%</div>
                          <div className="text-[10px] text-lira-dim uppercase">{t('dashboard.bond')}</div>
                      </div>
                  </div>
                  
                  {/* Streak Card */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover:border-orange-500/30 transition-colors">
                     <div className="text-orange-400">
                        <Calendar size={24} />
                     </div>
                     <div>
                        <div className="text-lg font-bold text-white">{stats.streakDays}</div>
                         <div className="text-[10px] text-lira-dim uppercase">{t('dashboard.streak')}</div>
                     </div>
                  </div>
               </div>

               {/* MOVABLE SECTION */}
               <Reorder.Group axis="y" values={items} onReorder={isEditMode ? setItems : () => {}} className="space-y-6">
                  {items.map(item => (
                      <Reorder.Item key={item} value={item} dragListener={isEditMode} className="relative">
                          {renderBlock(item)}
                      </Reorder.Item>
                  ))}
               </Reorder.Group>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};