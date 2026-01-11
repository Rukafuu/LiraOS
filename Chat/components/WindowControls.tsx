import React, { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface WindowControlsProps {
  onToggleWidget?: () => void;
  isWidgetMode?: boolean;
}

export const WindowControls: React.FC<WindowControlsProps> = ({ onToggleWidget, isWidgetMode }) => {
  // In Tauri v2, getCurrentWindow returns the Window instance directly
  const appWindow = getCurrentWindow();
  const [isMaximized, setIsMaximized] = useState(false);

  // Check state on mount and listen for resize
  useEffect(() => {
     const updateState = () => {
         appWindow?.isMaximized().then(setIsMaximized).catch(() => {});
     };
     
     updateState();
     
     // Listen to Tauri window resize event (or generic window resize as proxy)
     const unlistenPromise = appWindow.onResized(updateState);
     return () => {
         unlistenPromise.then(unlisten => unlisten());
     };
  }, []);
  
  // If we are not in Tauri (e.g. browser), appWindow might throw or be mocked.
  // But let's assume if it exists we show buttons.
  
  if (!appWindow) return null;

  return (
    <div className="fixed top-0 right-0 z-[100000] flex items-center h-8">
      {onToggleWidget && (
        <button
          onClick={onToggleWidget}
          className={`h-full w-12 flex items-center justify-center hover:bg-white/10 ${isWidgetMode ? 'text-lira-pink' : 'text-gray-400'} hover:text-white transition-colors group`}
          title={isWidgetMode ? "Voltar ao App" : "Modo Widget (Mascote)"}
        >
          {/* Widget/Pip Icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" className="stroke-current opacity-80 group-hover:opacity-100" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <rect x="8" y="2" width="14" height="14" rx="2" ry="2"/>
             <rect x="2" y="14" width="8" height="8" rx="2" ry="2"/>
          </svg>
        </button>
      )}
      <button
        onClick={() => {
            console.log('Minimize clicked');
            appWindow.minimize();
        }}
        className="h-full w-12 flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors group"
        title="Minimize"
      >
        {/* Windows Minimize Icon */}
        <svg width="10" height="1" viewBox="0 0 10 1" className="fill-current">
          <rect width="10" height="1" />
        </svg>
      </button>
      <button
        onClick={() => {
             if (isMaximized) {
                 appWindow.unmaximize();
             } else {
                 appWindow.maximize();
             }
             // Optimistic update
             setIsMaximized(!isMaximized);
        }}
        className="h-full w-12 flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        title={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? (
          /* Windows Restore (Clean Version) */
          <svg width="10" height="10" viewBox="0 0 10 10" className="fill-none stroke-current" style={{ strokeWidth: 1 }}>
             {/* Front Square (Bottom-Left) - Full */}
            <path d="M1.5 3.5h6v6h-6z" />
            
             {/* Back Square (Top-Right) - Partial "L" shape */}
            <path d="M3.5 3.5V1.5h6v6h-2" />
          </svg>
        ) : (
           /* Windows Maximize (Single Square) */
           <svg width="10" height="10" viewBox="0 0 10 10" className="fill-none stroke-current" style={{ strokeWidth: 1 }}>
             <path d="M0.5 0.5h9v9h-9z" />
           </svg>
        )}
      </button>
      <button
        onClick={() => appWindow.close()}
        className="h-full w-12 flex items-center justify-center hover:bg-[#E81123] hover:text-white text-gray-400 transition-colors"
        title="Close"
      >
        {/* Windows Close (X) */}
        <svg width="10" height="10" viewBox="0 0 10 10" className="fill-none stroke-current" style={{ strokeWidth: 1 }}>
          <path d="M0.5 0.5L9.5 9.5" />
          <path d="M9.5 0.5L0.5 9.5" />
        </svg>
      </button>
    </div>
  );
};
