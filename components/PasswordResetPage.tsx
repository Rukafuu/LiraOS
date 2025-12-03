import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, AlertCircle, Home } from 'lucide-react';
import NeuronBackground from './NeuronBackground';

interface PasswordResetPageProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onResetComplete: () => void;
}

interface ResetTokenData {
  token: string;
  expires: number;
  email: string;
}

const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ 
  isDarkMode, 
  toggleTheme, 
  onResetComplete 
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState('');

  // Verificar token na URL ao montar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setError('Invalid or missing reset token.');
      setTokenValid(false);
      return;
    }

    // Verificar se token existe no localStorage (simulando database)
    let found = false;
    const users = ['amarinthlira@gmail.com', 'herculespaulo.14.hp@gmail.com'];
    
    for (const email of users) {
      const storedData = localStorage.getItem(`reset_token_${email}`);
      if (storedData) {
        try {
          const resetData: ResetTokenData = JSON.parse(storedData);
          
          // Verificar se o token corresponde
          if (resetData.token === token) {
            // Verificar se não expirou
            if (Date.now() < resetData.expires) {
              setTokenValid(true);
              setUserEmail(email);
              found = true;
              break;
            } else {
              setError('Reset token has expired. Please request a new one.');
              setTokenValid(false);
              // Limpar token expirado
              localStorage.removeItem(`reset_token_${email}`);
              return;
            }
          }
        } catch (e) {
          console.error('Error parsing reset token data:', e);
        }
      }
    }

    if (!found) {
      setError('Invalid or expired reset token.');
      setTokenValid(false);
    }
  }, []);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. ') + '.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Aqui você normalmente faria uma chamada para a API para atualizar a senha
      // Por enquanto, vamos simular o sucesso
      console.log(`Password reset successful for ${userEmail}`);

      // Limpar o token usado
      localStorage.removeItem(`reset_token_${userEmail}`);

      // Simular atualização da senha (em um app real, isso seria feito no backend)
      // Podemos atualizar nossa "base de dados" local para fins de demonstração
      const validUsers = [
        { email: 'amarithlira@gmail.com', password: 'lira2024', name: 'Amarith Lira' },
        { email: 'herculespaulo.14.hp@gmail.com', password: 'beta2024', name: 'Hercules Paulo' }
      ];

      // Note: Em uma aplicação real, NUNCA armazene senhas em texto simples
      // Este é apenas um exemplo para demonstração
      console.log(`Password updated for ${userEmail} to: ${newPassword}`);

      setSuccess(true);
      
      // Redirecionar após sucesso
      setTimeout(() => {
        onResetComplete();
      }, 3000);

    } catch (error) {
      console.error('Password reset error:', error);
      setError('An error occurred while resetting your password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    onResetComplete();
  };

  if (tokenValid === null) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-900">
        <NeuronBackground isDarkMode={isDarkMode} />
        <div className="z-10 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-900">
        <NeuronBackground isDarkMode={isDarkMode} />
        <div className="z-10 w-full max-w-md p-8 m-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-rose-500/20 shadow-2xl">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Invalid Reset Link</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              This password reset link is invalid or has expired.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-500 text-xs text-center">
              {error}
            </div>
          )}

          <button 
            onClick={goToLogin}
            className="w-full py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-900 transition-colors duration-1000">
      
      <NeuronBackground isDarkMode={isDarkMode} />

      {/* SUCCESS OVERLAY */}
      {success && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-700">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <p className="text-green-400 font-mono text-sm tracking-widest animate-pulse">
              PASSWORD RESET SUCCESSFUL
            </p>
            <h1 className="text-3xl md:text-4xl font-light text-white animate-in slide-in-from-bottom-4 duration-1000 delay-300">
              Senha atualizada com sucesso!
            </h1>
            <p className="text-white/80 text-sm">
              Redirecionando para o login...
            </p>
          </div>
        </div>
      )}

      {/* Glass Card */}
      <div className={`
        z-10 w-full max-w-md p-8 m-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-rose-500/20 shadow-2xl 
        flex flex-col relative overflow-hidden transition-all duration-700
        ${success ? 'scale-90 opacity-0 filter blur-md' : 'opacity-100 scale-100'}
      `}>
        
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-70"></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-300 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-2">Reset Password</h1>
          <p className="text-slate-500 dark:text-blue-200/60 text-sm font-medium">
            Create a new secure password for <strong>{userEmail}</strong>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-500 text-xs text-center font-medium animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-4">
          {/* New Password */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={18} />
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={18} />
            <input 
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all dark:text-white placeholder-slate-400"
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password Requirements */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-xs border border-blue-200 dark:border-blue-900/30">
            <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Password Requirements:</h3>
            <ul className="space-y-1 text-blue-600 dark:text-blue-400">
              <li className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-slate-300'}`} />
                At least 8 characters
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                One uppercase letter
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                One lowercase letter
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-slate-300'}`} />
                One number
              </li>
            </ul>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !newPassword || !confirmPassword}
            className={`
              w-full py-3 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2
              ${isLoading || !newPassword || !confirmPassword ? 'cursor-not-allowed bg-blue-400 opacity-50' : ''}
            `}
          >
            {isLoading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                Reset Password <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="text-center mt-4">
            <button 
              type="button" 
              onClick={goToLogin}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center gap-1 mx-auto"
            >
              <Home size={16} /> Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetPage;
