import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = uuidv4();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Toast Container rendered via Portal logic (conceptually) */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const icons = {
    success: <Check size={16} className="text-lira-secondary" />,
    error: <AlertCircle size={16} className="text-red-400" />,
    info: <Info size={16} className="text-lira-primary" />,
  };

  const borders = {
    success: 'border-lira-secondary/30',
    error: 'border-red-500/30',
    info: 'border-lira-primary/30',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      className={`
        pointer-events-auto min-w-[300px] max-w-sm
        bg-[#0c0c0e]/90 backdrop-blur-md border ${borders[toast.type]}
        shadow-lg rounded-xl p-4 flex items-center justify-between gap-3
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-white/5 border border-white/5`}>
          {icons[toast.type]}
        </div>
        <p className="text-sm font-medium text-white/90">{toast.message}</p>
      </div>
      <button 
        onClick={() => onRemove(toast.id)}
        className="text-gray-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};