import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bug, Lightbulb, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, userId }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature' | 'general'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);

    try {
      // Mock API call for now (replace with actual backend endpoint later)
      // await fetch('/api/feedback', { ... });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[Feedback]', { userId, category, content });
      
      addToast(t('feedback_modal.success'), 'success');
      setContent('');
      setCategory('general');
      onClose();
    } catch (error) {
      addToast(t('feedback_modal.error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
            className="relative bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare size={20} className="text-purple-400" />
                  {t('feedback_modal.title')}
                </h2>
                <p className="text-sm text-gray-400 mt-1">{t('feedback_modal.desc')}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Category Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">{t('feedback_modal.category')}</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCategory('bug')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      category === 'bug' 
                        ? 'bg-red-500/20 border-red-500 text-red-200' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Bug size={24} />
                    <span className="text-xs font-medium">{t('feedback_modal.cat_bug')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('feature')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      category === 'feature' 
                        ? 'bg-purple-500/20 border-purple-500 text-purple-200' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Lightbulb size={24} />
                    <span className="text-xs font-medium">{t('feedback_modal.cat_feature')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('general')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      category === 'general' 
                        ? 'bg-blue-500/20 border-blue-500 text-blue-200' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <MessageSquare size={24} />
                    <span className="text-xs font-medium">{t('feedback_modal.cat_general')}</span>
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-3">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('feedback_modal.placeholder')}
                  className="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none text-[15px]"
                  autoFocus
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/20"
              >
                {isSubmitting ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     {t('feedback_modal.submitting')}
                   </>
                ) : (
                   <>
                     <Send size={18} />
                     {t('feedback_modal.submit')}
                   </>
                )}
              </button>
            </form>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
