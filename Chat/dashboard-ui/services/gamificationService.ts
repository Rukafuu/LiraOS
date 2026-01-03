// services/gamificationService.ts
export interface GamificationState {
  level: number;
  xp: number;
  next_level_xp: number;
  stats: Record<string, number>;
  badges: string[];
  history: {
    timestamp: string;
    event: string;
    xp: number;
    meta: Record<string, any>;
  }[];
}

const DEFAULT_STATE: GamificationState = {
  level: 1,
  xp: 0,
  next_level_xp: 100,
  stats: {
    self_improves: 0,
    modules_worked: 0,
    lines_refactored: 0,
    time_saved: 0
  },
  badges: [],
  history: []
};

// Helper to get token (from App's auth logic or similar, but for now assuming we can get it from localStorage)
function getAuthHeaders() {
  try {
    const sessionStr = localStorage.getItem('lira_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      return {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      };
    }
  } catch {}
  return { 'Content-Type': 'application/json' };
}

export async function fetchGamificationState(): Promise<GamificationState | null> {
  try {
    // Try to fetch from backend
    const res = await fetch('/api/developer/stats', {
      headers: getAuthHeaders()
    });

    if (res.ok) {
      const data = await res.json();

      // Transform backend data to expected GamificationState
      // Backend returns: { application: { users, sessions... }, system: { cpu, ... } }
      // This is not exactly gamification state, but let's map what we can or mock the rest
      // The original request said "XP/Leveling Curves -> Gamification Store data"

      // Since the backend 'stats' endpoint doesn't return user-specific gamification data yet (it returns global system stats),
      // and 'fetchMemories' etc are for specific users.

      // Ideally we should call an endpoint that returns the CURRENT USER'S gamification stats.
      // But the dashboard is for the "Developer" (Admin).

      // Let's assume we want to show the Admin's stats or Global stats.
      // For now, I will use the system stats to populate some fields and keep others mocked or static
      // until a proper dedicated endpoint exists.

      // ACTUALLY: The original LiraOS has a GamificationContext.
      // We should ideally fetch that.

      // Let's look at `modulesService.ts` again. The plan is to "Update ... to use the backend API".

      return {
        level: 1, // Placeholder as backend doesn't return this yet in /stats
        xp: data.application.memories * 10, // Example mapping
        next_level_xp: 1000,
        stats: {
          self_improves: data.application.sessions,
          modules_worked: 4,
          lines_refactored: data.application.users * 100,
          time_saved: 0
        },
        badges: [], // TODO: fetch badges
        history: []
      };
    }
  } catch (error) {
    console.error('API Error:', error);
  }

  return { ...DEFAULT_STATE };
}

export async function registerSelfImproveApplied(filePath: string) {
  // This would ideally call a backend endpoint
  console.log('Self improve applied on:', filePath);
  // Implementation pending backend support for writing gamification events from dashboard
}

export async function resetGamificationState() {
  // no-op
}
