import React, { useEffect, useState } from 'react';
import { Lock, Mail, CheckCircle, Key, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { ParticleBackground } from './ui/ParticleBackground';

export const ResetPassword: React.FC<{ backendUrl?: string }> = ({ backendUrl = 'http://localhost:4000' }) => {
  const { addToast } = useToast();
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState(params.get('code') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!email || !code) {
      addToast('Invalid reset link', 'error');
    }
  }, []);

  const handleSubmit = async () => {
    if (!email || !code) {
      addToast('Missing email or code', 'error');
      return;
    }
    if (password.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (password !== confirm) {
      addToast('Passwords do not match', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`${backendUrl}/api/auth/recover/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword: password })
      });
      if (!r.ok) {
        const t = await r.text();
        addToast('Invalid or expired code', 'error');
        return;
      }
      const data = await r.json();
      
      // Save both session and user data
      localStorage.setItem('lira_session', JSON.stringify({ 
        userId: data.user.id, 
        token: data.token, 
        refreshToken: data.refreshToken, 
        expiresAt: Date.now() + 7 * 24 * 3600 * 1000 
      }));
      
      localStorage.setItem('lira_current_user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        username: data.user.username,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        profile: {}
      }));
      
      addToast('Password updated. You are signed in.', 'success');
      setDone(true);
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.pathname = '/';
        url.search = '';
        window.location.href = url.toString();
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f]">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 mb-4 shadow-lg shadow-pink-500/50">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Reset Password
          </h1>
          <p className="text-gray-400 text-sm">
            Create a new password for your account
          </p>
        </div>

        {/* Card */}
        <div className="relative group">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
          
          {/* Card Content */}
          <div className="relative bg-[#0c0c0e]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
            {done ? (
              <div className="text-center py-8 animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4 animate-bounce">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Password Updated!</h3>
                <p className="text-gray-400 text-sm mb-4">Redirecting you to LiraOS...</p>
                <div className="flex items-center justify-center gap-2 text-green-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">You're all set</span>
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    Email
                  </label>
                  <div className="relative group/input">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#18181b]/50 backdrop-blur-sm border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:border-pink-500/50 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all duration-300"
                      placeholder="you@example.com"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-blue-500/0 group-focus-within/input:from-pink-500/10 group-focus-within/input:via-purple-500/10 group-focus-within/input:to-blue-500/10 pointer-events-none transition-all duration-500" />
                  </div>
                </div>

                {/* Recovery Code Input */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Key className="w-3 h-3" />
                    Recovery Code
                  </label>
                  <div className="relative group/input">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-[#18181b]/50 backdrop-blur-sm border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 font-mono tracking-wider focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all duration-300"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-blue-500/0 group-focus-within/input:from-pink-500/10 group-focus-within/input:via-purple-500/10 group-focus-within/input:to-blue-500/10 pointer-events-none transition-all duration-500" />
                  </div>
                </div>

                {/* New Password Input */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    New Password
                  </label>
                  <div className="relative group/input">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#18181b]/50 backdrop-blur-sm border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300"
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-blue-500/0 group-focus-within/input:from-pink-500/10 group-focus-within/input:via-purple-500/10 group-focus-within/input:to-blue-500/10 pointer-events-none transition-all duration-500" />
                  </div>
                  {password && password.length < 8 && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-400" />
                      At least 8 characters required
                    </p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Confirm Password
                  </label>
                  <div className="relative group/input">
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full bg-[#18181b]/50 backdrop-blur-sm border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all duration-300"
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-blue-500/0 group-focus-within/input:from-pink-500/10 group-focus-within/input:via-purple-500/10 group-focus-within/input:to-blue-500/10 pointer-events-none transition-all duration-500" />
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-400" />
                      Passwords don't match
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !email || !code || password.length < 8 || password !== confirm}
                  className="relative w-full group/btn mt-6"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-xl blur opacity-50 group-hover/btn:opacity-75 transition duration-300" />
                  <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 group-hover/btn:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>

                {/* Info Text */}
                <p className="text-center text-xs text-gray-500 mt-4">
                  After updating, you'll be automatically signed in
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Powered by <span className="text-transparent bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text font-semibold">LiraOS</span></p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
