import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ScanLine, Eye, EyeOff, Github, Globe, AlertCircle, X } from 'lucide-react';
import { LIRA_AVATAR } from '../constants';
import { register, login } from '../services/userService';

interface LoginScreenProps {
  onLogin: (username: string, userId: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    code: '',
    newPassword: ''
  });
  const BACKEND_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError(''); // Clear error on input change
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Phase 2: Verify Code & Set New Password
    if (isVerifyingCode) {
        if (!formData.code || !formData.newPassword) {
            setError('Please enter the code and your new password');
            return;
        }

        setIsScanning(true);
        (async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/api/recovery/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: formData.email, 
                        code: formData.code, 
                        newPassword: formData.newPassword 
                    })
                });

                setIsScanning(false);

                if (res.ok) {
                    setSuccessMessage('Password changed successfully! Signing you in...');
                    // Auto login logic or redirect
                    setTimeout(async () => {
                         // Try to auto-login with new password
                         const result = await login(formData.email, formData.newPassword);
                         if (result.success && result.user) {
                             onLogin(result.user.username, result.user.id);
                         } else {
                             setIsVerifyingCode(false);
                             setIsForgotPassword(false);
                             setIsLogin(true);
                         }
                    }, 1500);
                } else {
                    const data = await res.json();
                    setError(data.error || 'Failed to verify code');
                }
            } catch (e) {
                setIsScanning(false);
                setError('Network error during verification.');
            }
        })();
        return;
    }

    // Forgot password flow (Phase 1: Send Email)
    if (isForgotPassword) {
      if (!formData.email) {
        setError('Please enter your email');
        return;
      }
      
      setIsScanning(true);
      
      // Use backend API for password reset
      (async () => {
        try {
          const targetUrl = `${BACKEND_URL}/api/recovery/init?t=${Date.now()}`;
          console.log('[LOGIN] Requesting recovery from:', targetUrl);
          
          const res = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email })
          });
          
          setIsScanning(false);
          
          if (res.ok) {
            const data = await res.json();
            if (data.devMode && data.code) {
                 setSuccessMessage(`DEV CODE: ${data.code}`);
                 // Auto-fill for dev convenience
                 setFormData(prev => ({ ...prev, code: data.code }));
            } else {
                 setSuccessMessage('Code sent! Check your email.');
            }
            // Switch to Verification Phase
            setTimeout(() => {
              setSuccessMessage('');
              setIsVerifyingCode(true); // <--- Switch to Phase 2
            }, 1500);
          } else {
            const errorData = await res.json().catch(() => ({}));
            console.error('[LOGIN] Recovery error:', errorData);

            if (errorData.devCode) {
                // Emergency bypass
                setError(`SMTP Error. EMERGENCY CODE: ${errorData.devCode}`);
                setFormData(prev => ({ ...prev, code: errorData.devCode }));
                
                // Switch to Verification Phase automatically after delay
                setTimeout(() => {
                   setError('');
                   setIsVerifyingCode(true);
                }, 3000);
            } else {
                const errorMessage = errorData?.detail || errorData?.message || errorData?.error || 'Failed to send reset email';
                setError(errorMessage);
            }
          }
        } catch (error) {
          console.error('[LOGIN] Network error:', error);
          setIsScanning(false);
          setError('Network error. Check console for details.');
        }
      })();
      return;
    }
    
    // Login flow
    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        return;
      }
      
      setIsScanning(true);
      (async () => {
        const result = await login(formData.email, formData.password);
        setIsScanning(false);
        if (result.success && result.user) {
          onLogin(result.user.username, result.user.id);
        } else {
          setError(result.message);
        }
      })();
    } 
    // Register flow
    else {
      if (!formData.email || !formData.username || !formData.password) {
        setError('Please fill in all fields');
        return;
      }
      
      setIsScanning(true);
      (async () => {
        const result = await register(formData.email, formData.username, formData.password);
        setIsScanning(false);
        if (result.success && result.user) {
          setSuccessMessage(result.message);
          setTimeout(() => {
            onLogin(result.user!.username, result.user!.id);
          }, 500);
        } else {
          setError(result.message);
        }
      })();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden font-sans bg-[#030305]">
      {/* Clean Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      {/* Subtle Spotlight */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-lira-blue/5 to-transparent blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[380px] px-4"
      >
        <div className="bg-[#0a0a0f] rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          
          {/* Scanning Effect Overlay */}
          {isScanning && (
            <motion.div 
              initial={{ top: '-100%' }}
              animate={{ top: '200%' }}
              transition={{ duration: 1.5, ease: "linear" }}
              className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-lira-blue/10 to-transparent z-20"
            />
          )}

          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 shadow-lg shadow-black/50 overflow-hidden">
               <img src={LIRA_AVATAR} alt="Lira" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-center text-xl font-semibold text-white tracking-tight">
              {isVerifyingCode ? 'Verify Code' : isForgotPassword ? 'Reset Password' : isLogin ? 'Sign in to LiraOS' : 'Create Account'}
            </h1>
            <p className="text-gray-500 text-xs mt-1.5">
              {isVerifyingCode ? 'Enter the code and your new password.' : isForgotPassword ? 'Enter your email to reset password' : isLogin ? 'Welcome back, please enter your details.' : 'Join the network and sync your mind.'}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2"
            >
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </motion.div>
          )}
          
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2"
            >
              <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
              </div>
              <p className="text-xs text-green-300">{successMessage}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-2 space-y-4">
            <AnimatePresence mode='wait'>
                {isVerifyingCode ? (
                    <motion.div
                        key="verification"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                         {/* Code Field */}
                         <div className="mb-4">
                            <label htmlFor="code" className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Recovery Code</label>
                            <input 
                                type="text" 
                                id="code" 
                                placeholder="123456" 
                                value={formData.code}
                                onChange={handleChange}
                                className="w-full bg-[#15151a] border border-white/5 rounded-xl py-2.5 px-4 text-white text-sm placeholder-gray-600 outline-none focus:border-white/20 focus:bg-[#1a1a20] transition-all text-center tracking-widest font-mono text-lg" 
                            />
                        </div>

                        {/* New Password Field */}
                        <div className="mb-4">
                            <label htmlFor="newPassword" className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">New Password</label>
                            <div className="relative group">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    id="newPassword" 
                                    placeholder="New Password" 
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    className="w-full bg-[#15151a] border border-white/5 rounded-xl py-2.5 pl-10 pr-10 text-white text-sm placeholder-gray-600 outline-none focus:border-white/20 focus:bg-[#1a1a20] transition-all" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                <motion.div
                    key={isLogin ? 'login' : 'signup'}
                    initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Email Field */}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Email</label>
                        <div className="relative group">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input 
                                type="email" 
                                id="email" 
                                placeholder="name@example.com" 
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isVerifyingCode} // Disable if validating
                                className="w-full bg-[#15151a] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder-gray-600 outline-none focus:border-white/20 focus:bg-[#1a1a20] transition-all disabled:opacity-50" 
                            />
                        </div>
                    </div>

                    {/* Username Field (Signup Only) */}
                    {!isLogin && !isForgotPassword && (
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Username</label>
                            <div className="relative group">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                                <input 
                                    type="text" 
                                    id="username" 
                                    placeholder="Neo" 
                                    autoComplete="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-[#15151a] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder-gray-600 outline-none focus:border-white/20 focus:bg-[#1a1a20] transition-all" 
                                />
                            </div>
                        </div>
                    )}

                    {/* Password Field (Login/Signup Only) */}
                    {!isForgotPassword && (
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">Password</label>
                        <div className="relative group">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                id="password" 
                                placeholder="••••••••" 
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-[#15151a] border border-white/5 rounded-xl py-2.5 pl-10 pr-10 text-white text-sm placeholder-gray-600 outline-none focus:border-white/20 focus:bg-[#1a1a20] transition-all" 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {isLogin && (
                             <div className="mt-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => { setIsForgotPassword(true); setIsLogin(true); setFormData({ email: formData.email, username: '', password: '', code: '', newPassword: '' }); setError(''); setSuccessMessage(''); }}
                                  className="text-xs text-gray-500 hover:text-white transition-colors"
                                >
                                  Forgot password?
                                </button>
                            </div>
                        )}
                    </div>
                    )}
                </motion.div>
                )}
            </AnimatePresence>

            <button
                type="submit"
                disabled={isScanning}
                className="w-full py-2.5 rounded-xl font-medium text-sm bg-white text-black hover:bg-gray-200 transition-colors shadow-lg shadow-white/5 relative overflow-hidden mt-2"
            >
                {isScanning ? (
                     <div className="flex items-center justify-center gap-2">
                        <ScanLine size={16} className="animate-spin-slow" />
                        <span>Connecting...</span>
                     </div>
                ) : isVerifyingCode ? 'Set New Password' : isForgotPassword ? 'Send Recovery Email' : (isLogin ? 'Sign In' : 'Create account')}
            </button>
          </form>
        
          <div className="relative my-6 text-center">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5"></div>
            <span className="relative z-10 bg-[#0a0a0f] px-3 text-xs text-gray-500">Or continue with</span>
          </div>
        
          <div className="flex items-center justify-center">
             <button 
               type="button"
               onClick={() => {
                 const returnTo = window.location.origin;
                 window.location.href = `${BACKEND_URL}/auth/github/init?return_to=${encodeURIComponent(returnTo)}`;
               }}
               className="w-[70%] flex items-center justify-center gap-2 py-2 rounded-xl bg-[#15151a] border border-white/5 text-gray-200 hover:text-white hover:border-white/10 hover:bg-[#1a1a20] transition-all"
             >
               <Github size={16} />
               <span className="text-xs font-medium">Github</span>
             </button>
          </div>

          <p className="mt-4 text-center text-[10px] text-gray-500 px-4 leading-relaxed">
            By clicking on sign in, you agree to our{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }} className="text-gray-400 hover:text-white hover:underline transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }} className="text-gray-400 hover:text-white hover:underline transition-colors">Privacy Policy</a>.
          </p>

          <div className="mt-6 text-center">
             {isForgotPassword ? (
               <button
                 type="button"
                 onClick={() => { setIsForgotPassword(false); setIsLogin(true); setError(''); setSuccessMessage(''); }}
                 className="text-xs text-gray-500 hover:text-white transition-colors"
               >
                 Back to sign in
               </button>
             ) : (
               <button 
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
               >
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <span className="text-white font-medium underline decoration-white/20 underline-offset-2">
                     {isLogin ? 'Sign up' : 'Sign in'}
                  </span>
               </button>
             )}
          </div>
        </div>
        
        {isTermsOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div onClick={() => setIsTermsOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Terms of Service & Privacy Policy</h3>
                <button onClick={() => setIsTermsOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="text-[12px] text-gray-300 space-y-3 max-h-60 overflow-auto">
                <p>By continuing, you agree to our use of your data for authentication, personalization, and product improvement. You can revoke consent in Settings.</p>
                <p>We store sessions, memories, themes, and preferences per user to provide continuity across devices.</p>
                <p>For details, contact support.</p>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={() => setIsTermsOpen(false)} className="px-3 py-2 text-xs bg-white/10 border border-white/10 rounded-lg text-white">Close</button>
                <button
                  onClick={() => {
                    const payload = { accepted: true, timestamp: Date.now() };
                    try { localStorage.setItem('lira_cookie_consent', JSON.stringify(payload)); } catch {}
                    setIsTermsOpen(false);
                  }}
                  className="px-3 py-2 text-xs bg-white text-black rounded-lg"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}
        
        <p className="mt-8 text-center text-[10px] text-gray-600">
           © 2024 LiraOS Inc. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};
