import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Check, Shield } from 'lucide-react';

interface CookieConsentModalProps {
  isOpen: boolean;
  onSave: (preferences: CookiePreferences) => void;
  onClose: () => void;
}

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none
      ${checked ? 'bg-lira-blue' : 'bg-white/10'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <span
      className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300
        ${checked ? 'translate-x-6' : 'translate-x-1'}
      `}
    />
  </button>
);

export const CookieConsentModal: React.FC<CookieConsentModalProps> = ({ isOpen, onSave, onClose }) => {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    marketing: true
  });

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAllowAll = () => {
    const allEnabled = { necessary: true, analytics: true, marketing: true };
    setPreferences(allEnabled);
    onSave(allEnabled);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-xl font-bold text-white">Cookie Preferences</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. By clicking "Allow All", you agree to this.
                <a href="#" className="text-lira-blue hover:underline ml-1">Privacy Policy</a>.
              </p>

              <div className="space-y-4">
                {/* Strictly Necessary */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                       <span className="font-semibold text-white text-sm">Strictly Necessary</span>
                       <span className="text-[10px] uppercase font-bold text-lira-dim tracking-wider">Always Active</span>
                    </div>
                    <Toggle checked={true} onChange={() => {}} disabled={true} />
                  </div>
                  <p className="text-xs text-gray-500">
                    Essential for the site to function properly. This category cannot be disabled.
                  </p>
                </div>

                {/* Analytics */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm">Analytics</span>
                    <Toggle 
                      checked={preferences.analytics} 
                      onChange={() => handleToggle('analytics')} 
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Helps us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                </div>

                {/* Marketing */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm">Marketing</span>
                    <Toggle 
                      checked={preferences.marketing} 
                      onChange={() => handleToggle('marketing')} 
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Used to track visitors across websites to display ads that are relevant and engaging.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-[#0c0c0e] flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onSave(preferences)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors"
              >
                Confirm Selection
              </button>
              <button
                onClick={handleAllowAll}
                className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-lira-blue transition-colors shadow-lg"
              >
                Allow All
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};