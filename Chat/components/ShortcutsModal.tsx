import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Keyboard, Command, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutRow: React.FC<{ label: string; keys: React.ReactNode[] }> = ({ label, keys }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group">
    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{label}</span>
    <div className="flex items-center gap-1">
      {keys.map((k, idx) => (
        <React.Fragment key={idx}>
          <div className="min-w-[24px] px-2 h-7 flex items-center justify-center rounded bg-white/10 border border-white/10 text-xs font-mono text-gray-200 shadow-sm">
            {k}
          </div>
          {idx < keys.length - 1 && <span className="text-gray-600 text-xs">+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-premium overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/5 rounded-lg text-white">
                    <Keyboard size={20} />
                 </div>
                 <h2 className="text-lg font-bold text-white">{t('shortcuts.title')}</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-1">
              <ShortcutRow label={t('shortcuts.new_chat')} keys={[<Command size={12} key="cmd"/>, 'K']} />
              <ShortcutRow label={t('shortcuts.toggle_sidebar')} keys={[<Command size={12} key="cmd"/>, 'B']} />
              <ShortcutRow label={t('shortcuts.open_settings')} keys={[<Command size={12} key="cmd"/>, ',']} />
              <ShortcutRow label={t('shortcuts.show_shortcuts')} keys={[<Command size={12} key="cmd"/>, '/']} />
              <ShortcutRow label={t('shortcuts.close_modals')} keys={['Esc']} />
              <ShortcutRow label={t('shortcuts.stop_gen')} keys={[<Command size={12} key="cmd"/>, '.']} />
              <ShortcutRow label={t('shortcuts.focus_input')} keys={[<Command size={12} key="cmd"/>, 'J']} />
              <ShortcutRow label={t('shortcuts.edit_msg')} keys={[<Command size={12} key="cmd"/>, 'E']} />
              <ShortcutRow label={t('shortcuts.open_store')} keys={[<Command size={12} key="cmd"/>, 'Shift', 'S']} />
              <ShortcutRow label={t('shortcuts.open_dashboard')} keys={[<Command size={12} key="cmd"/>, 'Shift', 'D']} />
              <ShortcutRow label={t('shortcuts.toggle_model')} keys={[<Command size={12} key="cmd"/>, 'M']} />
            </div>

            {/* Footer / Easter Egg Hint */}
            <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
               <p className="text-[10px] text-gray-600 font-mono">
                  {t('shortcuts.pro_tip')} <br/>
                  {t('shortcuts.konami')} <span className="text-lira-blue">↑ ↑ ↓ ↓ ← → ← → B A</span>
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
