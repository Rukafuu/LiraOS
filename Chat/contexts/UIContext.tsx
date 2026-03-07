import React, { createContext, useContext, useState, useCallback } from 'react';

type ModalType = 
  | 'settings' | 'dashboard' | 'store' | 'pricing' 
  | 'whatsnew' | 'shortcuts' | 'cookies' | 'gamer' 
  | 'dailyquests' | 'jarvis' | 'admin' | 'todo' 
  | 'calendar' | 'supporters' | 'trae' | null;

interface UIContextType {
  // Modal States (Convenience getters)
  isSettingsOpen: boolean;
  isDashboardOpen: boolean;
  isStoreOpen: boolean;
  isPricingOpen: boolean;
  isWhatsNewOpen: boolean;
  isShortcutsOpen: boolean;
  isCookieModalOpen: boolean;
  isGamerOpen: boolean;
  isDailyQuestsOpen: boolean;
  isJarvisDashboardOpen: boolean;
  isAdminPanelOpen: boolean;
  isTodoPanelOpen: boolean;
  isCalendarOpen: boolean;
  isSupportersOpen: boolean;
  isTraePanelOpen: boolean;
  
  // UI Elements
  isVoiceActive: boolean;
  isSidebarOpen: boolean;

  // Actions
  setSettingsOpen: (open: boolean) => void;
  setDashboardOpen: (open: boolean) => void;
  setStoreOpen: (open: boolean) => void;
  setPricingOpen: (open: boolean) => void;
  setWhatsNewOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setCookieModalOpen: (open: boolean) => void;
  setGamerOpen: (open: boolean) => void;
  setDailyQuestsOpen: (open: boolean) => void;
  setJarvisDashboardOpen: (open: boolean) => void;
  setAdminPanelOpen: (open: boolean) => void;
  setTodoPanelOpen: (open: boolean) => void;
  setCalendarOpen: (open: boolean) => void;
  setSupportersOpen: (open: boolean) => void;
  setTraePanelOpen: (open: boolean) => void;
  
  setVoiceActive: (active: boolean) => void;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  closeAllModals: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isVoiceActive, setVoiceActive] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 768;
    return false;
  });

  const closeAllModals = useCallback(() => setActiveModal(null), []);

  const toggleModal = (type: ModalType, open: boolean) => {
    setActiveModal(open ? type : null);
  };

  const value: UIContextType = {
    isSettingsOpen: activeModal === 'settings',
    isDashboardOpen: activeModal === 'dashboard',
    isStoreOpen: activeModal === 'store',
    isPricingOpen: activeModal === 'pricing',
    isWhatsNewOpen: activeModal === 'whatsnew',
    isShortcutsOpen: activeModal === 'shortcuts',
    isCookieModalOpen: activeModal === 'cookies',
    isGamerOpen: activeModal === 'gamer',
    isDailyQuestsOpen: activeModal === 'dailyquests',
    isJarvisDashboardOpen: activeModal === 'jarvis',
    isAdminPanelOpen: activeModal === 'admin',
    isTodoPanelOpen: activeModal === 'todo',
    isCalendarOpen: activeModal === 'calendar',
    isSupportersOpen: activeModal === 'supporters',
    isTraePanelOpen: activeModal === 'trae',
    
    isVoiceActive,
    isSidebarOpen,

    setSettingsOpen: (open) => toggleModal('settings', open),
    setDashboardOpen: (open) => toggleModal('dashboard', open),
    setStoreOpen: (open) => toggleModal('store', open),
    setPricingOpen: (open) => toggleModal('pricing', open),
    setWhatsNewOpen: (open) => toggleModal('whatsnew', open),
    setShortcutsOpen: (open) => toggleModal('shortcuts', open),
    setCookieModalOpen: (open) => toggleModal('cookies', open),
    setGamerOpen: (open) => toggleModal('gamer', open),
    setDailyQuestsOpen: (open) => toggleModal('dailyquests', open),
    setJarvisDashboardOpen: (open) => toggleModal('jarvis', open),
    setAdminPanelOpen: (open) => toggleModal('admin', open),
    setTodoPanelOpen: (open) => toggleModal('todo', open),
    setCalendarOpen: (open) => toggleModal('calendar', open),
    setSupportersOpen: (open) => toggleModal('supporters', open),
    setTraePanelOpen: (open) => toggleModal('trae', open),
    
    setVoiceActive,
    setSidebarOpen,
    closeAllModals
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
