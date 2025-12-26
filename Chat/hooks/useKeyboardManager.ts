import { useEffect, useState, useCallback } from 'react';

interface KeyboardManagerProps {
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onCloseModals: () => void;
  onGodMode: () => void;
  onStopGeneration?: () => void;
  onFocusInput?: () => void;
  onEditLastMessage?: () => void;
  onOpenStore?: () => void;
  onOpenDashboard?: () => void;
  onToggleModel?: () => void;
}

export function useKeyboardManager({
  onNewChat,
  onToggleSidebar,
  onOpenSettings,
  onOpenShortcuts,
  onCloseModals,
  onGodMode,
  onStopGeneration,
  onFocusInput,
  onEditLastMessage,
  onOpenStore,
  onOpenDashboard,
  onToggleModel
}: KeyboardManagerProps) {
  const [keyBuffer, setKeyBuffer] = useState<string[]>([]);
  
  // Easter Egg Sequences
  const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  const BARREL_ROLL_CODE = ['d', 'o', 'a', 'b', 'a', 'r', 'r', 'e', 'l', 'r', 'o', 'l', 'l'];
  const MATRIX_CODE = ['m', 'a', 't', 'r', 'i', 'x'];

  const [isBarrelRoll, setIsBarrelRoll] = useState(false);
  const [isMatrixMode, setIsMatrixMode] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Guard against undefined key
    if (!e.key) return;

    // 1. Standard Shortcuts
    
    // New Chat: Cmd/Ctrl + K
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      onNewChat();
      return;
    }

    // Toggle Sidebar: Cmd/Ctrl + B
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      onToggleSidebar();
      return;
    }

    // Open Settings: Cmd/Ctrl + ,
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault();
      onOpenSettings();
      return;
    }

    // Open Shortcuts: Cmd/Ctrl + /
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      onOpenShortcuts();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === '.') {
      e.preventDefault();
      onStopGeneration && onStopGeneration();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
      e.preventDefault();
      onFocusInput && onFocusInput();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      onEditLastMessage && onEditLastMessage();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      onOpenStore && onOpenStore();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      onOpenDashboard && onOpenDashboard();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      onToggleModel && onToggleModel();
      return;
    }

    // Close Modals: Escape
    if (e.key === 'Escape') {
      onCloseModals();
      // Do not return here, ESC might be part of a sequence
    }

    // 2. Easter Egg Logic (Buffer)
    setKeyBuffer((prev) => {
      // Ensure e.key is valid before adding
      if (!e.key) return prev;
      const newBuffer = [...prev, e.key].slice(-20); // Keep last 20 keys
      return newBuffer;
    });

  }, [onNewChat, onToggleSidebar, onOpenSettings, onOpenShortcuts, onCloseModals, onStopGeneration, onFocusInput, onEditLastMessage, onOpenStore, onOpenDashboard, onToggleModel]);

  // Check Buffer for matches
  useEffect(() => {
    const checkSequence = (sequence: string[], buffer: string[]) => {
      if (buffer.length < sequence.length) return false;
      const subBuffer = buffer.slice(buffer.length - sequence.length);
      // Safety check: ensure both val and sequence[index] exist
      return subBuffer.every((val, index) => 
        (val || '').toLowerCase() === (sequence[index] || '').toLowerCase()
      );
    };

    if (checkSequence(KONAMI_CODE, keyBuffer)) {
      onGodMode();
      setKeyBuffer([]); // Reset
    }

    if (checkSequence(BARREL_ROLL_CODE, keyBuffer)) {
      setIsBarrelRoll(true);
      setTimeout(() => setIsBarrelRoll(false), 2000); // Reset animation class after duration
      setKeyBuffer([]);
    }

    if (checkSequence(MATRIX_CODE, keyBuffer)) {
      setIsMatrixMode(prev => !prev);
      setKeyBuffer([]);
    }

  }, [keyBuffer, onGodMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { isBarrelRoll, isMatrixMode };
}
