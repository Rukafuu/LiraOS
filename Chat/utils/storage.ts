/**
 * Storage utility functions for localStorage operations
 */

export const STORAGE_KEYS = {
  SESSIONS: 'lira_chat_sessions',
  MEMORIES: 'lira_memories',
  COOKIE_CONSENT: 'lira_cookie_consent',
  ONBOARDING_SEEN: 'lira_onboarding_seen'
} as const;

export function getStorageKey(baseKey: string, userId?: string): string {
  return userId ? `${baseKey}_${userId}` : baseKey;
}

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading from localStorage key "${key}":`, e);
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error writing to localStorage key "${key}":`, e);
    return false;
  }
}

export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error(`Error removing localStorage key "${key}":`, e);
    return false;
  }
}

export function clearUserStorage(userId: string): void {
  const keys = Object.values(STORAGE_KEYS);
  keys.forEach(key => {
    const userKey = getStorageKey(key, userId);
    removeFromStorage(userKey);
  });
}
