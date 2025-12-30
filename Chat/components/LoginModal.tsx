import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Mail, Lock, LogIn, UserPlus, RefreshCw, Github, BadgeCheck, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { getCurrentUser } from '../services/userService';
import { PatreonIcon } from './icons/PatreonIcon';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoggedIn: () => void;
  backendUrl?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoggedIn, backendUrl = 'http://localhost:4000' }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  /* Recovery State */
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // Recovery specific
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'code'>('email');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
        setMode('login');
        setRecoveryStep('email');
        setRecoveryCode('');
        setNewPassword('');
    }
  }, [isOpen]);

  // ... useEffect for OAuth ...

  const handleLoginOrRegister = async () => {
     // ... Logic for Login/Register ...
     setIsSubmitting(true);
     try {
       if (mode === 'login') {
         const r = await fetch(`${backendUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
         if (!r.ok) {
           addToast(t('auth.invalid_creds'), 'error');
         } else {
           const data = await r.json();
           localStorage.setItem('lira_session', JSON.stringify({ userId: data.user.id, token: data.token, refreshToken: data.refreshToken, expiresAt: Date.now() + 7 * 24 * 3600 * 1000 }));
           localStorage.setItem('lira_current_user', JSON.stringify({ id: data.user.id, email: data.user.email, username: data.user.username, avatar: data.user.avatar, lastLogin: Date.now() }));
           addToast(t('auth.welcome_back'), 'success');
           onLoggedIn();
           onClose();
         }
       } else {
         const r = await fetch(`${backendUrl}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, username: username || email.split('@')[0], password }) });
         if (!r.ok) {
           addToast(t('auth.failed'), 'error');
         } else {
           const data = await r.json();
           localStorage.setItem('lira_session', JSON.stringify({ userId: data.user.id, token: data.token, refreshToken: data.refreshToken, expiresAt: Date.now() + 7 * 24 * 3600 * 1000 }));
           localStorage.setItem('lira_current_user', JSON.stringify({ id: data.user.id, email: data.user.email, username: data.user.username, avatar: data.user.avatar, lastLogin: Date.now() }));
           addToast(t('auth.account_created'), 'success');
           onLoggedIn();
           onClose();
         }
       }
     } catch (e) {
        addToast('Connection failed', 'error');
     } finally {
       setIsSubmitting(false);
     }
  };

  const handleRecoverySubmit = async () => {
      setIsSubmitting(true);
      try {
          if (recoveryStep === 'email') {
               // Phase 1: Send Email
               const r = await fetch(`${backendUrl}/api/recovery/init`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
               const data = await r.json().catch(() => ({}));
               
               if (!r.ok) {
                   if (data.devCode) {
                       setRecoveryCode(data.devCode);
                       addToast(`DEV CODE: ${data.devCode}`, 'info'); // Backup display
                       setRecoveryStep('code'); // Auto advance
                   } else {
                       addToast(data.error || t('auth.email_not_found'), 'error');
                   }
               } else {
                   if (data.devMode && data.code) {
                       setRecoveryCode(data.code);
                       addToast(`DEV MODE CODE: ${data.code}`, 'success');
                   } else {
                       addToast(t('auth.recovery_sent'), 'success');
                   }
                   setRecoveryStep('code');
               }
          } else {
              // Phase 2: Verify Code & Reset
              const r = await fetch(`${backendUrl}/api/recovery/complete`, { 
                  method: 'POST', 
                  headers: { 'Content-Type': 'application/json' }, 
                  body: JSON.stringify({ email, code: recoveryCode, newPassword }) 
              });
              
              if (r.ok) {
                  addToast('Password changed!', 'success');
                  // Auto login with new password logic if desired, or just switch to login
                  setMode('login');
                  setPassword(newPassword); // Pre-fill
                  setTimeout(() => handleLoginOrRegister(), 500); // Auto login
              } else {
                  const d = await r.json();
                  addToast(d.error || 'Invalid code', 'error');
              }
          }
      } catch (e) {
          addToast('Network error', 'error');
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleSubmit = () => {
      if (mode === 'forgot') handleRecoverySubmit();
      else handleLoginOrRegister();
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const oauth = {
    github: `${backendUrl}/auth/github/init?return_to=${encodeURIComponent(origin)}`,
    patreon: `${backendUrl}/auth/patreon/init?return_to=${encodeURIComponent(origin)}`
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-premium overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                  {mode === 'login' ? t('auth.sign_in') : mode === 'register' ? t('auth.create_account') : 'Reset Password'}
              </h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            
            <div className="px-5 pb-5 space-y-4">
              
              {/* LOGIN / REGISTER FIELDS */}
              {mode !== 'forgot' && (
                  <>
                    {mode === 'register' && (
                        <div className="space-y-1.5">
                        <label className="text-xs text-gray-400">{t('auth.username')}</label>
                        <div className="relative">
                            <BadgeCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:border-white/30 outline-none transition-all" placeholder={t('auth.display_name_placeholder')} />
                        </div>
                        </div>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-xs text-gray-400">{t('auth.email')}</label>
                        <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:border-white/30 outline-none transition-all" placeholder={t('auth.email_placeholder')} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs text-gray-400">{t('auth.password')}</label>
                        <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type={showPassword ? 'text' : 'password'}
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-9 pr-10 text-sm text-white focus:border-white/30 outline-none transition-all" 
                            placeholder="••••••••" 
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        </div>
                        <button onClick={() => setMode('forgot')} className="text-[11px] text-lira-blue hover:underline underline-offset-4">{t('auth.forgot_pass')}</button>
                    </div>
                  </>
              )}

              {/* RECOVERY FIELDS */}
              {mode === 'forgot' && (
                  <>
                    <div className="space-y-1.5">
                        <label className="text-xs text-gray-400">{t('auth.email')}</label>
                        <div className="relative">
                             <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                             <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={recoveryStep === 'code'} className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:border-white/30 outline-none transition-all disabled:opacity-50" placeholder={t('auth.email_placeholder')} />
                        </div>
                    </div>

                    {recoveryStep === 'code' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs text-gray-400">Recovery Code</label>
                                <div className="relative">
                                    <BadgeCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:border-white/30 outline-none transition-all uppercase tracking-widest font-mono" placeholder="ABCD12" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-gray-400">New Password</label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:border-white/30 outline-none transition-all" placeholder="New Password" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                    
                    <button onClick={() => setMode('login')} className="text-[11px] text-gray-500 hover:text-white transition-colors">
                        &larr; Back to Login
                    </button>
                  </>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2 pt-2">
                <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                  {mode === 'login' ? <span className="inline-flex items-center gap-1"><LogIn size={14} /> {t('auth.login_btn')}</span> : 
                   mode === 'register' ? <span className="inline-flex items-center gap-1"><UserPlus size={14} /> {t('auth.register_btn')}</span> :
                   <span className="inline-flex items-center gap-1">{isSubmitting ? 'Processing...' : recoveryStep === 'email' ? 'Send Reset Link' : 'Reset Password'}</span>
                  }
                </button>
                
                {mode !== 'forgot' && (
                    <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="px-4 py-2.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors">
                        <RefreshCw size={14} />
                    </button>
                )}
              </div>
            
            {/* OAUTH SECTION (Hidden in recovery mode) */}
            {mode !== 'forgot' && (
             <div className="pt-3">
              <div className="text-[11px] text-gray-500 mb-2">{t('auth.continue_with')}</div>
              <div className="flex gap-2">
                <a href={oauth.patreon} className="flex-1 px-3 py-2.5 bg-gradient-to-r from-[#FF424D] to-[#FF5C5C] hover:from-[#FF5C5C] hover:to-[#FF424D] rounded-lg border border-white/10 text-white text-sm text-center transition-all shadow-lg shadow-[#FF424D]/20">
                  <span className="inline-flex items-center gap-2"><PatreonIcon size={16} /> Patreon</span>
                </a>
                <a href={oauth.github} className="flex-1 px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 text-white text-sm text-center transition-colors">
                  <span className="inline-flex items-center gap-2"><Github size={16} /> GitHub</span>
                </a>
              </div>
             </div>
            )}

            <div className="px-5 pb-5">
              <p className="text-[11px] text-gray-500 text-center">
                {t('auth.by_signing')} <a href="/terms.html" className="underline hover:text-white">{t('auth.terms')}</a> {t('auth.and')} <a href="/privacy.html" className="underline hover:text-white">{t('auth.privacy')}</a>.
              </p>
            </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
