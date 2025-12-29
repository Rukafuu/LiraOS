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
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const emailParam = params.get('email');
    const nameParam = params.get('name');
    const uidParam = params.get('uid');
    const rtParam = params.get('refreshToken');
    if (token && (emailParam || nameParam)) {
      const uid = uidParam || `oauth_${Math.random().toString(36).slice(2,10)}`;
      localStorage.setItem('lira_session', JSON.stringify({ userId: uid, token, refreshToken: rtParam || null, expiresAt: Date.now() + 7 * 24 * 3600 * 1000 }));
      localStorage.setItem('lira_current_user', JSON.stringify({ id: uid, email: emailParam || '', username: nameParam || 'Lira User', avatar: null, lastLogin: Date.now() }));
      addToast(t('auth.logged_in_oauth'), 'success');
      onLoggedIn();
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, [onLoggedIn, addToast, t]);

  const handleSubmit = async () => {
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
          const t_text = await r.text();
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgot = async () => {
    const r = await fetch(`${backendUrl}/api/auth/recover/init`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    if (!r.ok) {
      addToast(t('auth.email_not_found'), 'error');
    } else {
      const data = await r.json();
      addToast(t('auth.recovery_sent'), 'success');
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const oauth = {
    github: `${backendUrl}/auth/github/init?return_to=${encodeURIComponent(origin)}`,
    patreon: `https://patreon.com/amarinthlira?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink`
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-premium overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{mode === 'login' ? t('auth.sign_in') : t('auth.create_account')}</h3>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="px-5 pb-5 space-y-4">
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
                <button onClick={handleForgot} className="text-[11px] text-lira-blue hover:underline underline-offset-4">{t('auth.forgot_pass')}</button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                  {mode === 'login' ? <span className="inline-flex items-center gap-1"><LogIn size={14} /> {t('auth.login_btn')}</span> : <span className="inline-flex items-center gap-1"><UserPlus size={14} /> {t('auth.register_btn')}</span>}
                </button>
                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="px-4 py-2.5 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors">
                  <RefreshCw size={14} />
                </button>
              </div>
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
