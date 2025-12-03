import React, { useState, useEffect } from 'react';
import { ViewMode } from './types';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import AuthScreen from './components/AuthScreen';
import PasswordResetPage from './components/PasswordResetPage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.CHAT);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    // Check if we're on a password reset URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setIsPasswordReset(true);
      setIsAuthChecking(false);
      return;
    }

    // Check local storage for theme
    const storedTheme = localStorage.getItem('lira_theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // Only check for persistent login if user explicitly chose to stay logged in
    const stayLoggedIn = localStorage.getItem('lira_stay_logged_in') === 'true';
    const storedAuth = localStorage.getItem('lira_auth_token');
    
    if (stayLoggedIn && storedAuth) {
      setIsAuthenticated(true);
    }
    
    // Simulate a brief check
    setTimeout(() => {
      setIsAuthChecking(false);
    }, 500);

  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('lira_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('lira_theme', 'light');
      }
      return newMode;
    });
  };

  const handleLoginSuccess = (stayLoggedIn: boolean = false) => {
    localStorage.setItem('lira_auth_token', 'demo_token_' + Date.now());
    localStorage.setItem('lira_stay_logged_in', stayLoggedIn.toString());
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('lira_auth_token');
    localStorage.removeItem('lira_stay_logged_in');
    setIsAuthenticated(false);
    // Reset view state
    setCurrentView(ViewMode.CHAT);
  };

  const handleResetComplete = () => {
    // Clear URL parameters and return to login
    window.history.replaceState({}, document.title, window.location.pathname);
    setIsPasswordReset(false);
  };

  // Modify the Sidebar component inside App to support logout if needed
  // Since Sidebar is a separate component, we'll wrap the logic below

  if (isAuthChecking) {
     return (
       <div className="flex h-screen w-screen bg-rose-50 dark:bg-slate-950 items-center justify-center transition-colors duration-300">
         <div className="w-12 h-12 rounded-full border-4 border-rose-200 dark:border-rose-900 border-t-rose-500 animate-spin"></div>
       </div>
     );
  }

  // Show password reset page if we have a reset token
  if (isPasswordReset) {
    return (
      <PasswordResetPage
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onResetComplete={handleResetComplete}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen 
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-rose-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
      />
      <main className="flex-1 h-full relative flex overflow-hidden">
        {currentView === ViewMode.CHAT ? (
          <div className="h-full w-full animate-in fade-in zoom-in-95 duration-300">
            <ChatInterface />
          </div>
        ) : (
          <div className="h-full w-full animate-in fade-in zoom-in-95 duration-300">
            <Dashboard />
          </div>
        )}
      </main>
      
      {/* Hidden Logout trigger for now (or could be passed to settings in future updates) */}
      {/* To test logout manually during development, one might clear localStorage */}
    </div>
  );
};

export default App;
