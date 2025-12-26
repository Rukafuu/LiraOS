import React, { createContext, useContext, useEffect, useState } from 'react';
import { LiraTheme, LiraThemeId } from '../types';

const themes: Record<string, LiraTheme> = {
  'lira-dark': {
    id: 'lira-dark',
    name: 'Lira Dark',
    price: 0,
    isLocked: false,
    colors: {
      bg: '#030308',
      card: 'rgba(15, 15, 25, 0.6)',
      border: 'rgba(77, 243, 255, 0.15)',
      primary: '#ff2fa5', // Pink
      secondary: '#4df3ff', // Blue
      accent: '#bd34fe', // Purple
      dim: '#8a8a9e',
    },
  },
  'lira-aurora': {
    id: 'lira-aurora',
    name: 'Lira Aurora',
    price: 100,
    isLocked: true,
    colors: {
      bg: '#050a0a',
      card: 'rgba(10, 20, 20, 0.6)',
      border: 'rgba(52, 211, 153, 0.15)',
      primary: '#34d399', // Emerald
      secondary: '#a78bfa', // Violet
      accent: '#60a5fa', // Blue
      dim: '#94a3b8',
    },
  },
  'lira-ice': {
    id: 'lira-ice',
    name: 'Lira Ice',
    price: 100,
    isLocked: true,
    colors: {
      bg: '#020617',
      card: 'rgba(15, 23, 42, 0.6)',
      border: 'rgba(56, 189, 248, 0.15)',
      primary: '#38bdf8', // Sky
      secondary: '#e0f2fe', // Light Blue
      accent: '#7dd3fc',
      dim: '#94a3b8',
    },
  },
  'lira-nature': {
    id: 'lira-nature',
    name: 'Lira Nature',
    price: 150,
    isLocked: true,
    colors: {
      bg: '#0c0f0a',
      card: 'rgba(20, 30, 20, 0.6)',
      border: 'rgba(132, 204, 22, 0.15)',
      primary: '#84cc16', // Lime
      secondary: '#22c55e', // Green
      accent: '#eab308', // Yellow
      dim: '#a1a1aa',
    },
  },
  'lira-desert': {
    id: 'lira-desert',
    name: 'Lira Desert',
    price: 150,
    isLocked: true,
    colors: {
      bg: '#1a0f0a',
      card: 'rgba(40, 20, 10, 0.4)',
      border: 'rgba(249, 115, 22, 0.15)',
      primary: '#f97316', // Orange
      secondary: '#facc15', // Yellow
      accent: '#b45309',
      dim: '#a8a29e',
    },
  },
  'lira-halloween': {
    id: 'lira-halloween',
    name: 'Lira Halloween',
    price: 200,
    isLocked: true,
    colors: {
      bg: '#1a0510',
      card: 'rgba(30, 5, 20, 0.5)',
      border: 'rgba(168, 85, 247, 0.15)',
      primary: '#a855f7', // Purple
      secondary: '#f97316', // Orange
      accent: '#84cc16', // Lime
      dim: '#a1a1aa',
    },
  },
  'lira-xmas': {
    id: 'lira-xmas',
    name: 'Lira Xmas',
    price: 200,
    isLocked: true,
    colors: {
      bg: '#021008',
      card: 'rgba(10, 40, 20, 0.5)',
      border: 'rgba(239, 68, 68, 0.15)',
      primary: '#ef4444', // Red
      secondary: '#22c55e', // Green
      accent: '#eab308', // Gold
      dim: '#9ca3af',
    },
  },
  'lira-carnival': {
    id: 'lira-carnival',
    name: 'Lira Carnival',
    price: 250,
    isLocked: true,
    colors: {
      bg: '#120a1f',
      card: 'rgba(40, 20, 60, 0.4)',
      border: 'rgba(232, 121, 249, 0.15)',
      primary: '#e879f9', // Fuchsia
      secondary: '#22d3ee', // Cyan
      accent: '#facc15', // Yellow
      dim: '#a1a1aa',
    },
  },
  // NEW PREMIUM THEMES FOR STORE
  'lira-cyberleaf': {
    id: 'lira-cyberleaf',
    name: 'Cyber Leaf',
    price: 500,
    isLocked: true,
    colors: {
      bg: '#001a10',
      card: 'rgba(0, 40, 20, 0.4)',
      border: 'rgba(0, 255, 150, 0.2)',
      primary: '#00ff9d', 
      secondary: '#008cff', 
      accent: '#ccff00', 
      dim: '#8a9e95',
    },
  },
  'lira-obsidian': {
    id: 'lira-obsidian',
    name: 'Obsidian Void',
    price: 1000,
    isLocked: true,
    colors: {
      bg: '#000000',
      card: 'rgba(20, 20, 20, 0.8)',
      border: 'rgba(255, 255, 255, 0.1)',
      primary: '#ffffff', 
      secondary: '#555555', 
      accent: '#ff0000', 
      dim: '#666666',
    },
  },
  'lira-royal': {
    id: 'lira-royal',
    name: 'Royal Gold',
    price: 800,
    isLocked: true,
    colors: {
      bg: '#1a1005',
      card: 'rgba(40, 30, 10, 0.4)',
      border: 'rgba(255, 215, 0, 0.2)',
      primary: '#ffd700', 
      secondary: '#ff6b6b', 
      accent: '#ffffff', 
      dim: '#d4c5a0',
    },
  },
  'lira-singularity': {
    id: 'lira-singularity',
    name: 'Singularity Void ⚫',
    price: 9999,
    isLocked: true,
    colors: {
      bg: '#000000',
      card: 'rgba(5, 5, 5, 0.9)',
      border: 'rgba(255, 255, 255, 0.08)',
      primary: '#ffffff', // Stark White
      secondary: '#1a1a1a', // Dark Gray
      accent: '#333333', 
      dim: '#444444',
    },
  },
};

interface ThemeContextType {
  currentTheme: LiraTheme;
  setTheme: (id: LiraThemeId) => void;
  availableThemes: LiraTheme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper to convert hex to rgb string for tailwind utility
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState<LiraThemeId>('lira-dark');

  useEffect(() => {
    const saved = localStorage.getItem('lira_theme');
    if (saved && themes[saved]) {
      setCurrentThemeId(saved as LiraThemeId);
    }
  }, []);

  useEffect(() => {
    const theme = themes[currentThemeId];
    if (!theme) return;
    
    const root = document.documentElement;

    root.style.setProperty('--lira-bg', theme.colors.bg);
    root.style.setProperty('--lira-card', theme.colors.card);
    root.style.setProperty('--lira-border', theme.colors.border);
    root.style.setProperty('--lira-primary', theme.colors.primary);
    root.style.setProperty('--lira-secondary', theme.colors.secondary);
    root.style.setProperty('--lira-accent', theme.colors.accent);
    root.style.setProperty('--lira-dim', theme.colors.dim);
    
    root.style.setProperty('--lira-primary-rgb', hexToRgb(theme.colors.primary));
    root.style.setProperty('--lira-secondary-rgb', hexToRgb(theme.colors.secondary));

    localStorage.setItem('lira_theme', currentThemeId);
  }, [currentThemeId]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: themes[currentThemeId],
        setTheme: setCurrentThemeId,
        availableThemes: Object.values(themes),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};