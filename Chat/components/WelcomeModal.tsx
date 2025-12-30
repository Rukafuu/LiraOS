import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LIRA_AVATAR } from '../constants';

interface WelcomeModalProps {
  isOpen: boolean;
  username: string;
  isReturning: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, username, isReturning, onClose, onNewChat }) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }} className="relative w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden">
            <div className="bg-lira-gradient p-1">
              <div className="bg-[#0c0c0e] rounded-3xl p-8 flex items-center gap-6">
                <div className="w-20 h-20 rounded-full overflow-hidden border border-white/10 shadow-glow-blue">
                  <img src={LIRA_AVATAR} alt="Lira" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-widest text-lira-blue/70 mb-1">
                    {isReturning ? t('welcome_modal.welcome_back') : t('welcome_modal.welcome')}
                  </div>
                  <div className="text-3xl font-extrabold text-white">{username}</div>
                  <div className="mt-3 text-sm text-gray-400">
                    {t('welcome_modal.message')}
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button onClick={onClose} className="px-4 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                      {t('welcome_modal.resume')}
                    </button>
                    <button 
                      onClick={() => {
                        onNewChat();
                        onClose();
                      }} 
                      className="px-4 py-2.5 bg-white/10 text-white text-sm rounded-xl hover:bg-white/20 border border-white/10 transition-colors"
                    >
                      {t('welcome_modal.new_chat')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
