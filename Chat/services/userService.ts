// User Service - Client-side interface for Backend Auth API

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt?: number;
  lastLogin?: number;
  loginCount?: number;
  profile?: { // Legacy support, mapped to preferences or flat fields
    bio?: string;
    location?: string;
    website?: string;
  };
}

export interface AuthSession {
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: number;
}

const SESSION_KEY = 'lira_session';
const CURRENT_USER_KEY = 'lira_current_user';
const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
const API_URL = `${API_BASE_URL}/api/auth`;

// --- Helpers ---

function getHeaders() {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (sessionStr) {
    const session = JSON.parse(sessionStr);
    return { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}` 
    };
  }
  return { 'Content-Type': 'application/json' };
}

export function getAuthHeaders() {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (!session || !session.token) throw new Error("Invalid session structure");
      return { 'Authorization': `Bearer ${session.token}` };
    } catch {
      // Self-healing: Clear corrupted session
      localStorage.removeItem(SESSION_KEY);
      return {};
    }
  }
  return {};
}

// --- Auth Functions ---

export const handleOAuthCallback = (params: URLSearchParams): boolean => {
  const token = params.get('token');
  const email = params.get('email');
  const name = params.get('name');
  const uid = params.get('uid');
  const refreshToken = params.get('refreshToken');
  
  if (token && (email || uid)) {
    const userObj: User = {
      id: uid || `user_${Date.now()}`,
      email: String(email || '').toLowerCase(),
      username: name || (email ? String(email).split('@')[0] : 'User'),
      createdAt: Date.now(),
      lastLogin: Date.now(),
      profile: {} // Legacy
    };
    
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userObj));
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: userObj.id,
        token,
        refreshToken: refreshToken || '',
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
      }));
      return true;
    } catch (e) {
      console.error('OAuth Callback Error:', e);
      return false;
    }
  }
  return false;
};

export const register = async (email: string, username: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      return { success: false, message: data.error || 'Registration failed' };
    }
    
    // Save session
    const session: AuthSession = {
      userId: data.user.id,
      token: data.token,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + (7 * 24 * 3600 * 1000)
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
    
    return { success: true, message: 'Account created', user: data.user };
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const login = async (email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      return { success: false, message: data.error === 'invalid_credentials' ? 'Invalid email or password' : (data.error || 'Login failed') };
    }
    
    // Save session
    const session: AuthSession = {
      userId: data.user.id,
      token: data.token,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + (7 * 24 * 3600 * 1000)
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
    
    return { success: true, message: 'Login successful', user: data.user };
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const logout = async () => {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken })
      });
    }
  } catch (e) {
    console.error('Logout error:', e);
  } finally {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    // Optional: Reload page or redirect
    window.location.href = '/login';
  }
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return false;
  try {
    const session: AuthSession = JSON.parse(sessionStr);
    // Basic check, ideally verify token signature or call /me
    return !!session.token; 
  } catch {
    return false;
  }
};

// --- Profile Functions ---

export const updateProfile = async (userId: string, updates: Partial<User>): Promise<{ success: boolean; message: string; user?: User }> => {
  try {
    const res = await fetch(`${API_URL}/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      return { success: false, message: data.error || 'Update failed' };
    }
    
    // Update local storage
    const currentUser = getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...data };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
    
    return { success: true, message: 'Profile updated', user: data };
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const updateAvatar = async (userId: string, base64: string): Promise<{ success: boolean; message: string }> => {
    return updateProfile(userId, { avatar: base64 });
};

// --- Settings Functions ---

const SETTINGS_API_URL = `${API_BASE_URL}/api/settings`;

export interface UserSettings {
  temperature?: number;
  systemInstructions?: string;
  model?: 'flash' | 'pro' | 'mistral';
  theme?: string;
  notifications?: boolean;
  dynamicPersona?: boolean; // Toggle for AI auto-switching personality
}

export const getSettings = async (): Promise<UserSettings> => {
  try {
    const res = await fetch(SETTINGS_API_URL, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
};

export const saveSettings = async (settings: UserSettings): Promise<boolean> => {
  try {
    const res = await fetch(SETTINGS_API_URL, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const changePassword = async (userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  // Not implemented in this iteration's backend API yet, but could be added.
  // For now, return error or mock success if critical.
  // Actually, we should implement a specific route for this or rely on recovery.
  return { success: false, message: 'Password change not supported via this form yet. Please use Reset Password.' };
};
