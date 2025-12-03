import React from 'react';
import { ViewMode } from '../types';
import { MessageSquare, LayoutDashboard, Settings, Power, Leaf, ChevronLeft, ChevronRight } from 'lucide-react';
import liraLogo from '../assets/lira-logo.png';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isDarkMode, toggleTheme, isCollapsed, toggleCollapse, onLogout }) => {
  const navItemClass = (view: ViewMode) => `
    flex items-center justify-center lg:justify-start w-12 h-12 lg:h-12 lg:px-4 rounded-2xl transition-all duration-300 mb-4 cursor-pointer overflow-hidden
    ${isCollapsed ? 'lg:w-12 lg:px-0 lg:justify-center' : 'lg:w-full'}
    ${currentView === view 
      ? 'bg-rose-400 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/40 scale-105' 
      : 'text-rose-400 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-slate-800'
    }
  `;

  const textClass = `hidden lg:flex ml-3 font-medium whitespace-nowrap transition-all duration-300 origin-left ${isCollapsed ? 'w-0 opacity-0 translate-x-4' : 'w-auto opacity-100 translate-x-0'}`;

  return (
    <div className={`h-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-rose-100 dark:border-rose-900/20 flex flex-col items-center py-8 z-40 shadow-sm transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-20 lg:w-64'}`}>
      
      {/* Collapse Toggle Button - Desktop Only */}
      <button 
        onClick={toggleCollapse}
        className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30 rounded-full items-center justify-center text-rose-400 dark:text-rose-300 shadow-sm hover:scale-110 transition-transform z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="mb-10 flex flex-col items-center">
        <div className="relative">
          {/* Glow effects */}
          <div className="absolute inset-0 w-12 h-12 bg-rose-400/20 dark:bg-rose-500/30 rounded-full blur-lg animate-pulse"></div>
          <div className="absolute inset-0 w-10 h-10 bg-gradient-to-tr from-rose-300/40 to-orange-300/40 dark:from-rose-400/50 dark:to-rose-600/50 rounded-full blur-md animate-pulse delay-75"></div>
          
          {/* Logo container */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:scale-110 transition-all duration-500">
            <img
              src={liraLogo}
              alt="LiraOS Logo"
              className="w-full h-full object-contain transition-all duration-500 filter brightness-110 contrast-110"
            />
            
            {/* Breath effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-300/10 to-orange-200/10 dark:from-rose-500/20 dark:to-rose-700/20 mix-blend-soft-light animate-pulse"></div>
          </div>
        </div>
        <span className={`mt-2 font-bold text-xl text-rose-500 dark:text-rose-400 tracking-wide transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:h-0 lg:mt-0 lg:scale-0' : 'hidden lg:block lg:opacity-100 lg:h-auto lg:scale-100'}`}>LiraOS</span>
      </div>

      <nav className="flex-1 w-full px-4 flex flex-col items-center lg:items-stretch">
        <button 
          onClick={() => onViewChange(ViewMode.CHAT)}
          className={navItemClass(ViewMode.CHAT)}
          title="Chat"
        >
          <div className="shrink-0 flex items-center justify-center w-12 h-12 lg:w-5 lg:h-5">
            <MessageSquare size={20} />
          </div>
          <span className={textClass}>Chat</span>
        </button>

        <button 
          onClick={() => onViewChange(ViewMode.DASHBOARD)}
          className={navItemClass(ViewMode.DASHBOARD)}
          title="Dashboard"
        >
          <div className="shrink-0 flex items-center justify-center w-12 h-12 lg:w-5 lg:h-5">
            <LayoutDashboard size={20} />
          </div>
          <span className={textClass}>Dashboard</span>
        </button>
      </nav>

      <div className="w-full px-4 flex flex-col items-center lg:items-stretch mt-auto gap-4">
        
        {/* Dango Theme Toggle */}
        <div className={`flex flex-col items-center w-full transition-all duration-300 ${isCollapsed ? 'lg:items-center' : 'lg:items-start'}`}>
           <button 
             onClick={toggleTheme}
             className={`relative h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl p-1 shadow-inner border border-slate-200 dark:border-slate-700 transition-all duration-300 group overflow-hidden
               ${isCollapsed ? 'w-12 lg:w-12 lg:h-20' : 'w-12 h-20 lg:w-full lg:h-12'}
             `}
             title="Toggle Theme"
           >
             {/* Background Indicator that moves */}
             <div className={`
               absolute transition-all duration-500 ease-in-out bg-white dark:bg-slate-700 rounded-full shadow-sm
               ${isCollapsed
                 ? 'w-10 h-9 left-1 ' + (isDarkMode ? 'top-1' : 'top-[calc(100%-2.5rem)]')
                 : 'lg:w-1/2 lg:h-full w-10 h-9 left-1 lg:left-0 lg:top-0 ' + (isDarkMode 
                    ? 'top-1 lg:translate-x-full' 
                    : 'bottom-1 lg:translate-x-0'
                   )
               }
             `} />

             <div className={`relative w-full h-full flex items-center justify-between ${isCollapsed ? 'flex-col' : 'flex-col lg:flex-row'}`}>
                
                {/* Dark Dango */}
                <div className={`
                   flex items-center justify-center z-10 transition-all duration-300
                   ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10 lg:w-1/2 lg:h-full'}
                   ${isDarkMode ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}
                   ${isCollapsed ? 'order-1' : 'order-1 lg:order-2'}
                `}>
                   <div className="w-5 h-5 rounded-full bg-slate-700 dark:bg-indigo-400 shadow-sm"></div>
                </div>

                {/* Light Dango */}
                 <div className={`
                   flex items-center justify-center z-10 transition-all duration-300
                   ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10 lg:w-1/2 lg:h-full'}
                   ${!isDarkMode ? 'opacity-100 scale-110' : 'opacity-40 scale-90'}
                   ${isCollapsed ? 'order-2' : 'order-2 lg:order-1'}
                `}>
                   <div className="w-5 h-5 rounded-full bg-orange-300 dark:bg-orange-200 shadow-sm"></div>
                </div>

             </div>
             <span className="sr-only">Toggle Theme</span>
           </button>
           <p className={`text-xs text-center w-full mt-1 text-slate-400 dark:text-slate-500 transition-all duration-300 ${isCollapsed ? 'lg:hidden' : 'hidden lg:block'}`}>Theme</p>
        </div>

        <button className={`flex items-center justify-center lg:justify-start w-12 h-12 lg:h-12 lg:px-4 rounded-2xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 cursor-not-allowed opacity-50 overflow-hidden ${isCollapsed ? 'lg:w-12 lg:px-0 lg:justify-center' : 'lg:w-full'}`}>
          <div className="shrink-0 flex items-center justify-center w-12 h-12 lg:w-5 lg:h-5">
            <Settings size={20} />
          </div>
          <span className={textClass}>Settings</span>
        </button>
        <button 
          onClick={onLogout}
          className={`flex items-center justify-center lg:justify-start w-12 h-12 lg:h-12 lg:px-4 rounded-2xl text-rose-400 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-300 transition-all duration-300 overflow-hidden ${isCollapsed ? 'lg:w-12 lg:px-0 lg:justify-center' : 'lg:w-full'}`} 
          title="Logout"
        >
          <div className="shrink-0 flex items-center justify-center w-12 h-12 lg:w-5 lg:h-5">
            <Power size={20} />
          </div>
          <span className={textClass}>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
