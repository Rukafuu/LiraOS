import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, KeyRound, CheckCircle2, ChevronLeft, Sparkles, Eye, EyeOff } from 'lucide-react';
import NeuronBackground from './NeuronBackground';
import emailService from '../services/emailService';

interface AuthScreenProps {
  onLoginSuccess: (stayLoggedIn?: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

type AuthMode = 'LOGIN' | 'LOGIN_VERIFY' | 'SIGNUP' | 'VERIFY' | 'FORGOT';

const DangoLoader = () => (
  <div className="flex flex-col items-center justify-center animate-bounce">
    <svg width="40" height="30" viewBox="0 0 40 30" className="drop-shadow-sm">
       {/* Dango Body */}
       <ellipse cx="20" cy="15" rx="18" ry="14" fill="#fb7185" />
       {/* Eyes */}
       <circle cx="12" cy="13" r="1.5" fill="#4c0519" />
       <circle cx="28" cy="13" r="1.5" fill="#4c0519" />
       {/* Blush */}
       <ellipse cx="9" cy="16" rx="2" ry="1" fill="#fecdd3" opacity="0.6" />
       <ellipse cx="31" cy="16" rx="2" ry="1" fill="#fecdd3" opacity="0.6" />
    </svg>
  </div>
);

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, isDarkMode, toggleTheme }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loginVerificationCode, setLoginVerificationCode] = useState('');
  const [generatedLoginCode, setGeneratedLoginCode] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [booted, setBooted] = useState(false);

  // Trigger boot animation on mount
  useEffect(() => {
    setTimeout(() => setBooted(true), 100);
  }, []);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setShowPassword(false);
  };

  // Load users from localStorage (acts as simple database)
  const getStoredUsers = () => {
    try {
      const stored = localStorage.getItem('lira_users');
      return stored ? JSON.parse(stored) : [
        // Keep admin users for backwards compatibility
        { email: 'amarinthlira@gmail.com', password: 'lira2024', name: 'Amarinth Lira' },
        { email: 'herculespaulo.14.hp@gmail.com', password: 'beta2024', name: 'Hercules Paulo' },
        { email: 'lucas.frischeisen@gmail.com', password: 'lucas2024', name: 'Lucas Frischeisen' }
      ];
    } catch {
      return [];
    }
  };

  const saveUser = (newUser: { email: string; password: string; name: string }) => {
    const users = getStoredUsers();
    users.push(newUser);
    localStorage.setItem('lira_users', JSON.stringify(users));
  };

  const validUsers = getStoredUsers();

  // Generate random 6-digit code
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Simulation helpers
  const simulateApi = async (ms: number = 2000) => {
    setIsLoading(true);
    setError('');
    await new Promise(resolve => setTimeout(resolve, ms));
    setIsLoading(false);
  };

  const handleSuccessSequence = async (userName: string) => {
    setIsSuccess(true);
    
    // Store user info for welcome message
    const isSpecialUser = email === 'lucas.frischeisen@gmail.com' || email === 'amarinthlira@gmail.com';
    const welcomeName = isSpecialUser ? 'pai' : userName;
    
    // Store welcome name temporarily for the success overlay
    sessionStorage.setItem('lira_welcome_name', welcomeName);
    
    // Wait for the user to read the message
    setTimeout(() => {
      onLoginSuccess(stayLoggedIn);
    }, 2500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if user exists in our simple database
    const user = validUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      setIsLoading(false);
      setError('Invalid email or password. Please check your credentials and try again.');
      return;
    }
    
    try {
      // Generate and send real verification code
      const code = emailService.generateVerificationCode();
      setGeneratedLoginCode(code);
      
      // Send email with verification code
      const emailSent = await emailService.sendVerificationEmail(email, code, user.name);
      
      if (!emailSent) {
        setError('Failed to send verification email. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Show success message and go to verification
      setError('');
      switchMode('LOGIN_VERIFY');
      
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginVerificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    
    if (loginVerificationCode !== generatedLoginCode) {
      setError('Invalid verification code. Please check your email and try again.');
      return;
    }
    
    // Get user name for welcome message
    const user = validUsers.find(u => u.email === email);
    const userName = user?.name || 'User';
    
    await handleSuccessSequence(userName);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Please fill in all fields.');
      return;
    }

    // Check if email is already registered
    const existingUser = validUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      setError('This email is already registered. Please use the login form instead.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Generate and send real verification code
      const code = emailService.generateVerificationCode();
      setGeneratedLoginCode(code); // Reuse the same state for simplicity
      
      // Send email with verification code
      const emailSent = await emailService.sendVerificationEmail(email, code, name);
      
      if (!emailSent) {
        setError('Failed to send verification email. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Show success message and go to verification
      setError('');
      switchMode('VERIFY');
      
    } catch (error) {
      console.error('Signup error:', error);
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    
    if (verificationCode !== generatedLoginCode) {
      setError('Invalid verification code. Please check your email and try again.');
      return;
    }
    
    // Save the new user to localStorage
    const newUser = { email, password, name };
    saveUser(newUser);
    
    await handleSuccessSequence(name);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    // Check if email exists in our system
    const user = validUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      setError('Email not found in our system. Please check your email or contact support.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Generate reset token
      const resetToken = emailService.generateResetToken();
      
      // Store reset token temporarily (in a real app, this would be in a database)
      localStorage.setItem(`reset_token_${email}`, JSON.stringify({
        token: resetToken,
        expires: Date.now() + (60 * 60 * 1000), // 1 hour
        email: email
      }));
      
      // Send password reset email
      const emailSent = await emailService.sendPasswordResetEmail(email, resetToken, user.name);
      
      if (emailSent) {
        // Show success message
        setError('');
        
        // For development: show reset URL in console and alert
        const resetUrl = `${window.location.origin}${window.location.pathname}?token=${resetToken}`;
        console.log('🚧 DEV MODE - Password Reset URL:', resetUrl);
        
        alert(`✅ Password reset link sent to ${email}!\n\nDEV MODE: Check console for reset URL\n\nThe link expires in 1 hour.`);
        switchMode('LOGIN');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('An error occurred while sending the reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-900 transition-colors duration-1000">
      
      {/* Dynamic Background */}
      <NeuronBackground isDarkMode={isDarkMode} />

      {/* Theme Toggle (Absolute) */}
      <div className={`absolute top-6 right-6 z-20 transition-all duration-1000 ${booted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-rose-300 hover:text-white shadow-lg hover:scale-110 transition-transform"
        >
          <Sparkles size={20} />
        </button>
      </div>

      {/* SUCCESS OVERLAY */}
      {isSuccess && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-700">
          <div className="text-center space-y-4">
            <p className="text-green-400 font-mono text-sm tracking-widest animate-pulse">
              &gt; LiraOS NEURAL CORE ONLINE
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-white animate-in slide-in-from-bottom-4 duration-1000 delay-300 font-sans">
              Bem-vindo de volta, {sessionStorage.getItem('lira_welcome_name') || 'pai'}.
            </h1>
          </div>
        </div>
      )}

      {/* Glass Card */}
      <div className={`
        z-10 w-full max-w-md p-8 m-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-rose-500/20 shadow-2xl 
        flex flex-col relative overflow-hidden transition-all duration-[1500ms] ease-out
        ${booted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}
        ${isSuccess ? 'scale-90 opacity-0 filter blur-md' : ''}
      `}>
        
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-400 to-transparent opacity-70"></div>

        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center mb-6">
            {/* Glow effects */}
            <div className="absolute inset-0 w-20 h-20 bg-rose-400/20 dark:bg-rose-500/30 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute inset-0 w-16 h-16 bg-gradient-to-tr from-rose-300/40 to-orange-300/40 dark:from-rose-400/50 dark:to-rose-600/50 rounded-full blur-lg animate-pulse delay-75"></div>
            
            {/* Logo container with breath effect */}
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-2xl animate-pulse hover:scale-110 transition-all duration-700 bg-white/10 backdrop-blur-sm border border-white/20">
              <img 
                src="/src/LiraOS-logo.png" 
                alt="LiraOS Logo" 
                className={`w-full h-full object-contain transition-all duration-500 ${
                  isDarkMode 
                    ? 'filter brightness-110 contrast-110' 
                    : 'filter brightness-95 contrast-105 hue-rotate-12'
                }`}
              />
              
              {/* Additional glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-300/10 to-orange-200/10 dark:from-rose-500/20 dark:to-rose-700/20 mix-blend-soft-light"></div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-2">LiraOS</h1>
          <p className="text-slate-500 dark:text-rose-200/60 text-sm font-medium">
            {mode === 'LOGIN' && "Initialize Connection"}
            {mode === 'LOGIN_VERIFY' && "Security Verification"}
            {mode === 'SIGNUP' && "Join the Family"}
            {mode === 'VERIFY' && "Verify Identity"}
            {mode === 'FORGOT' && "System Recovery"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-500 text-xs text-center font-medium animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* Forms */}
        <div className="transition-all duration-300">
          
          {/* LOGIN FORM */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-400 transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-400 transition-colors" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all duration-200 outline-none focus:text-rose-500"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                {/* Stay Logged In Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={stayLoggedIn}
                      onChange={e => setStayLoggedIn(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`
                      w-4 h-4 border-2 rounded transition-all duration-200
                      ${stayLoggedIn 
                        ? 'bg-rose-500 border-rose-500' 
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                      }
                      group-hover:border-rose-400
                    `}>
                      {stayLoggedIn && (
                        <CheckCircle2 size={12} className="text-white absolute -top-0.5 -left-0.5" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 select-none">
                    Manter conectado
                  </span>
                </label>

                <button type="button" onClick={() => switchMode('FORGOT')} className="text-xs text-rose-500 hover:text-rose-600 font-medium">
                  Forgot Password?
                </button>
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className={`
                  w-full py-3 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white rounded-xl font-semibold shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2
                  ${isLoading ? 'cursor-not-allowed bg-rose-400' : ''}
                `}
              >
                {isLoading ? <DangoLoader /> : <>Login <ArrowRight size={18} /></>}
              </button>
              <div className="text-center mt-6 space-y-3">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  New to LiraOS?{' '}
                  <button type="button" onClick={() => switchMode('SIGNUP')} className="text-rose-500 font-semibold hover:underline">
                    Create Account
                  </button>
                </p>
                {/* Welcome Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs border border-blue-200 dark:border-blue-900/30">
                  <p className="text-blue-700 dark:text-blue-300 font-medium mb-2">🚀 Welcome to LiraOS</p>
                  <div className="space-y-1 text-blue-600 dark:text-blue-400">
                    <p>Create your account and start chatting with the AI assistant.</p>
                    <p>Powered by advanced language models for intelligent conversations.</p>
                    <p>Need help? Contact <strong>amarinthlira@gmail.com</strong></p>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* LOGIN VERIFICATION FORM */}
          {mode === 'LOGIN_VERIFY' && (
            <form onSubmit={handleLoginVerify} className="space-y-4">
               <div className="text-center mb-6 space-y-3">
                 <p className="text-slate-600 dark:text-slate-300 text-sm">
                   For security, we've sent a verification code to
                 </p>
                 <p className="text-rose-500 font-medium text-sm">{email}</p>
                 
                 {/* Email sent confirmation */}
                 <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 space-y-2">
                   <p className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                     📧 Verification email sent!
                   </p>
                   <p className="text-xs text-blue-600 dark:text-blue-400">
                     Check your email inbox for the 6-digit verification code and enter it below.
                   </p>
                   <p className="text-xs text-blue-500 dark:text-blue-400 italic">
                     Don't see the email? Check your spam folder or wait a few moments.
                   </p>
                   {/* DEV: Show code directly for testing */}
                   <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-2 mt-2">
                     <p className="text-yellow-800 dark:text-yellow-200 text-xs font-mono">
                       🚧 DEV MODE: Your verification code is <strong>{generatedLoginCode}</strong>
                     </p>
                   </div>
                 </div>
               </div>
               <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={loginVerificationCode}
                    onChange={e => setLoginVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400 tracking-widest font-mono text-center"
                    autoComplete="off"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`
                    w-full py-3 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white rounded-xl font-semibold shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2
                    ${isLoading ? 'cursor-not-allowed bg-rose-400' : ''}
                  `}
                >
                  {isLoading ? <DangoLoader /> : <>Verify & Login <CheckCircle2 size={18} /></>}
                </button>
                 <div className="text-center mt-4">
                  <button type="button" onClick={() => switchMode('LOGIN')} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center gap-1 mx-auto">
                    <ChevronLeft size={16} /> Back to Login
                  </button>
                </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'SIGNUP' && (
            <form onSubmit={handleSignup} className="space-y-4">
               <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400"
                  />
                </div>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-400 transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-400 transition-colors" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400"
                  />
                   <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 hover:scale-110 active:scale-95 transition-all duration-200 outline-none focus:text-rose-500"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`
                    w-full py-3 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white rounded-xl font-semibold shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2
                    ${isLoading ? 'cursor-not-allowed bg-rose-400' : ''}
                  `}
                >
                  {isLoading ? <DangoLoader /> : <>Create Account <ArrowRight size={18} /></>}
                </button>
                <div className="text-center mt-6">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Already have an account?{' '}
                    <button type="button" onClick={() => switchMode('LOGIN')} className="text-rose-500 font-semibold hover:underline">
                      Login
                    </button>
                  </p>
                </div>
            </form>
          )}

          {/* VERIFY FORM */}
          {mode === 'VERIFY' && (
            <form onSubmit={handleVerify} className="space-y-4">
               <div className="text-center mb-6 space-y-3">
                 <p className="text-slate-600 dark:text-slate-300 text-sm">
                   We've sent a 6-digit code to
                 </p>
                 <p className="text-rose-500 font-medium text-sm">{email}</p>
                 
                 {/* Email sent confirmation */}
                 <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 space-y-2">
                   <p className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                     📧 Verification email sent!
                   </p>
                   <p className="text-xs text-blue-600 dark:text-blue-400">
                     Check your email inbox for the 6-digit verification code and enter it below.
                   </p>
                   <p className="text-xs text-blue-500 dark:text-blue-400 italic">
                     Don't see the email? Check your spam folder or wait a few moments.
                   </p>
                   {/* DEV: Show code directly for testing */}
                   <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-2 mt-2">
                     <p className="text-yellow-800 dark:text-yellow-200 text-xs font-mono">
                       🚧 DEV MODE: Your verification code is <strong>{generatedLoginCode}</strong>
                     </p>
                   </div>
                 </div>
               </div>
               <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400 tracking-widest font-mono text-center"
                    autoComplete="off"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`
                    w-full py-3 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white rounded-xl font-semibold shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2
                    ${isLoading ? 'cursor-not-allowed bg-rose-400' : ''}
                  `}
                >
                  {isLoading ? <DangoLoader /> : <>Verify <CheckCircle2 size={18} /></>}
                </button>
                 <div className="text-center mt-4">
                  <button type="button" onClick={() => switchMode('SIGNUP')} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    Back
                  </button>
                </div>
            </form>
          )}

           {/* FORGOT FORM */}
           {mode === 'FORGOT' && (
            <form onSubmit={handleForgot} className="space-y-4">
               <div className="text-center mb-6">
                 <p className="text-slate-600 dark:text-slate-300 text-sm">
                   Enter your email and we'll send you a link to reset your password.
                 </p>
               </div>
               <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-400 transition-colors" size={18} />
                  <input 
                    type="email" 
                    placeholder="Email Address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`
                    w-full py-3 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white rounded-xl font-semibold shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center gap-2
                    ${isLoading ? 'cursor-not-allowed bg-rose-400' : ''}
                  `}
                >
                  {isLoading ? <DangoLoader /> : <>Send Reset Link <ArrowRight size={18} /></>}
                </button>
                 <div className="text-center mt-4">
                  <button type="button" onClick={() => switchMode('LOGIN')} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center gap-1 mx-auto">
                    <ChevronLeft size={16} /> Back to Login
                  </button>
                </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
