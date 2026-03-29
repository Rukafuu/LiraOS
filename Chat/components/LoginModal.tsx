import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Mail, Lock, LogIn, UserPlus, Github, BadgeCheck, Eye, EyeOff } from 'lucide-react';
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
    google: `${backendUrl}/api/auth/google/init?return_to=${encodeURIComponent(origin)}`,
    github: `${backendUrl}/auth/github/init?return_to=${encodeURIComponent(origin)}`,
    patreon: `${backendUrl}/auth/patreon/init?return_to=${encodeURIComponent(origin)}`
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-premium overflow-hidden">
            
            {/* Header with close button */}
            <div className="p-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                  {mode === 'forgot' ? 'Reset Password' : 'Welcome to LiraOS'}
              </h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>

            {/* LOGIN / REGISTER TABS */}
            {mode !== 'forgot' && (
              <div className="px-5 pb-2">
                <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                  <button
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      mode === 'login' 
                        ? 'bg-white text-black shadow-lg' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <LogIn size={14} />
                    {t('auth.sign_in')}
                  </button>
                  <button
                    onClick={() => setMode('register')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      mode === 'register' 
                        ? 'bg-white text-black shadow-lg' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <UserPlus size={14} />
                    {t('auth.create_account')}
                  </button>
                </div>
              </div>
            )}
            
            <div className="px-5 pb-5 space-y-4 pt-2">
              
              {/* LOGIN / REGISTER FIELDS */}
              {mode !== 'forgot' && (
                  <>
                    {mode === 'register' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-1.5"
                        >
                        <label className="text-xs text-gray-400">{t('auth.username')}</label>
                        <div className="relative">
                            <BadgeCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:border-white/30 outline-none transition-all" placeholder={t('auth.display_name_placeholder')} />
                        </div>
                        </motion.div>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-xs text-gray-400">{t('auth.email')}</label>
                        <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="w-full bg-[#18181b] border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:border-white/30 outline-none transition-all" placeholder={t('auth.email_placeholder')} />
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
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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

              {/* ACTION BUTTON */}
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="w-full px-4 py-3 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {mode === 'login' ? <span className="inline-flex items-center gap-2"><LogIn size={14} /> {t('auth.login_btn')}</span> : 
                 mode === 'register' ? <span className="inline-flex items-center gap-2"><UserPlus size={14} /> {t('auth.register_btn')}</span> :
                 <span className="inline-flex items-center gap-2">{isSubmitting ? 'Processing...' : recoveryStep === 'email' ? 'Send Reset Link' : 'Reset Password'}</span>
                }
              </button>
            
            {/* OAUTH SECTION */}
            {mode !== 'forgot' && (
             <div className="pt-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] text-gray-500 uppercase tracking-wider">{t('auth.continue_with')}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="flex gap-2">
                <a href={oauth.google} className="flex-1 px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 text-white text-sm text-center transition-all">
                  <span className="inline-flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Google
                  </span>
                </a>
                <a href={oauth.patreon} className="flex-1 px-3 py-2.5 bg-gradient-to-r from-[#FF424D]/20 to-[#FF5C5C]/20 hover:from-[#FF424D]/30 hover:to-[#FF5C5C]/30 rounded-xl border border-[#FF424D]/30 text-white text-sm text-center transition-all">
                  <span className="inline-flex items-center gap-2"><PatreonIcon size={16} /> Patreon</span>
                </a>
                <a href={oauth.github} className="flex-1 px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 text-white text-sm text-center transition-all">
                  <span className="inline-flex items-center gap-2"><Github size={16} /> GitHub</span>
                </a>
              </div>
             </div>
            )}

            <div className="px-5 pb-5 pt-3">
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
