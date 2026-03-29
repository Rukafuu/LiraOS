import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Bug, Zap, Shield, Bell, ChevronRight, Gift } from 'lucide-react';
import changelog, { ChangelogEntry } from '../data/changelog';
import { useTranslation } from 'react-i18next';


const CHANGELOG_SEEN_KEY = 'lira_changelog_seen';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [expandedVersion, setExpandedVersion] = useState<string | null>(changelog[0]?.version || null);

  const TYPE_CONFIG = {
    feature: { icon: <Sparkles size={14} />, label: t('whats_new.type_feature'), color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    fix: { icon: <Bug size={14} />, label: t('whats_new.type_fix'), color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    improvement: { icon: <Zap size={14} />, label: t('whats_new.type_improvement'), color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    security: { icon: <Shield size={14} />, label: t('whats_new.type_security'), color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  };

  useEffect(() => {
    if (isOpen && changelog.length > 0) {
      localStorage.setItem(CHANGELOG_SEEN_KEY, changelog[0].version);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[80vh] flex flex-col bg-[#0c0c14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Gift size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t('whats_new.title')}</h2>
                <p className="text-xs text-gray-500">{t('whats_new.subtitle')}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Changelog List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {changelog.map((entry, index) => {
              const isExpanded = expandedVersion === entry.version;
              const isLatest = index === 0;

              return (
                <motion.div
                  key={entry.version}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-xl border transition-all ${
                    isExpanded 
                      ? 'border-purple-500/30 bg-white/[0.03]' 
                      : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Version Header */}
                  <button
                    onClick={() => setExpandedVersion(isExpanded ? null : entry.version)}
                    className="w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isLatest ? 'bg-purple-400 animate-pulse' : 'bg-gray-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{entry.title}</span>
                        {isLatest && (
                          <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-bold uppercase">{t('whats_new.latest')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 font-mono">v{entry.version}</span>
                        <span className="text-[10px] text-gray-600">•</span>
                        <span className="text-[10px] text-gray-500">{entry.date}</span>
                      </div>
                    </div>
                    <ChevronRight 
                      size={16} 
                      className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                    />
                  </button>

                  {/* Changes */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-1.5">
                          <p className="text-xs text-gray-400 mb-3">{entry.description}</p>
                          {entry.changes.map((change, ci) => {
                            const config = TYPE_CONFIG[change.type];
                            return (
                              <div key={ci} className="flex items-start gap-2.5">
                                <span className={`shrink-0 mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${config.bg} ${config.color} ${config.border} border`}>
                                  {config.icon}
                                  {config.label}
                                </span>
                                <span className="text-sm text-gray-300 leading-snug">{change.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-600">
              {t('whats_new.built_with')}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * Hook to check if there are unseen changelog entries
 */
export function useChangelogBadge(): { hasNew: boolean; latestVersion: string } {
  const [hasNew, setHasNew] = useState(false);
  const latestVersion = changelog[0]?.version || '0.0.0';

  useEffect(() => {
    const seen = localStorage.getItem(CHANGELOG_SEEN_KEY);
    setHasNew(seen !== latestVersion);
  }, [latestVersion]);

  return { hasNew, latestVersion };
}
