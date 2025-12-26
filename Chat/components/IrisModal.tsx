
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import IrisModule from './iris/IrisModule'; // Adjust path if needed

interface IrisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IrisModal: React.FC<IrisModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-[90vw] h-[90vh] bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/5 relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button Override */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-colors backdrop-blur-sm border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>

          {/* The Actual Iris App */}
          <div className="flex-1 h-full overflow-hidden">
            <IrisModule onClose={onClose} />
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
