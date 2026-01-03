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

// Estado padrão inicial
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

// Chave para localStorage
const STORAGE_KEY = 'lira_developer_gamification';

// Função para calcular nível baseado no XP
function calculateLevel(xp: number): { level: number; next_level_xp: number } {
  const baseXP = 100;
  const multiplier = 1.5;

  let level = 1;
  let requiredXP = baseXP;

  while (xp >= requiredXP) {
    level++;
    requiredXP = Math.floor(requiredXP * multiplier);
  }

  return { level, next_level_xp: requiredXP };
}

export async function fetchGamificationState(): Promise<GamificationState | null> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Retorna estado padrão se não existir
      return { ...DEFAULT_STATE };
    }

    const state: GamificationState = JSON.parse(stored);

    // Atualiza nível baseado no XP atual
    const levelInfo = calculateLevel(state.xp);
    state.level = levelInfo.level;
    state.next_level_xp = levelInfo.next_level_xp;

    return state;
  } catch (error) {
    console.error('Erro ao buscar estado da gamificação:', error);
    return { ...DEFAULT_STATE };
  }
}

export async function registerSelfImproveApplied(filePath: string) {
  try {
    const currentState = await fetchGamificationState();
    if (!currentState) return;

    // Atualiza estatísticas
    currentState.xp += 25;
    currentState.stats.self_improves += 1;

    // Atualiza nível
    const levelInfo = calculateLevel(currentState.xp);
    currentState.level = levelInfo.level;
    currentState.next_level_xp = levelInfo.next_level_xp;

    // Adiciona ao histórico
    currentState.history.unshift({
      timestamp: new Date().toISOString(),
      event: 'SELF_IMPROVE_APPLIED',
      xp: 25,
      meta: {
        file: filePath,
        module: extractModuleFromPath(filePath)
      }
    });

    // Mantém apenas os últimos 50 eventos
    currentState.history = currentState.history.slice(0, 50);

    // Verifica badges
    checkAndAwardBadges(currentState);

    // Salva no localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));

    console.log('🎉 Gamificação atualizada! +25 XP - Nível:', currentState.level);

  } catch (error) {
    console.error('Erro ao registrar evento de gamificação:', error);
  }
}

// Função auxiliar para extrair módulo do caminho do arquivo
function extractModuleFromPath(filePath: string): string {
  const parts = filePath.split('/');
  if (parts.length >= 2) {
    return parts[1]; // lira/module_name/...
  }
  return 'unknown';
}

// Sistema de badges
function checkAndAwardBadges(state: GamificationState) {
  const badgesToCheck = [
    { id: 'first_improve', condition: state.stats.self_improves >= 1, name: '🚀 Primeiro Passo' },
    { id: 'code_crafter', condition: state.stats.self_improves >= 5, name: '⚡ Artesão do Código' },
    { id: 'refactor_master', condition: state.stats.self_improves >= 10, name: '🎯 Mestre da Refatoração' },
    { id: 'level_5', condition: state.level >= 5, name: '⭐ Nível 5 Alcançado' },
    { id: 'level_10', condition: state.level >= 10, name: '🏆 Nível 10 Alcançado' },
  ];

  for (const badge of badgesToCheck) {
    if (badge.condition && !state.badges.includes(badge.id)) {
      state.badges.push(badge.id);
      console.log(`🏅 Badge conquistada: ${badge.name}`);

      // Adiciona evento de badge ao histórico
      state.history.unshift({
        timestamp: new Date().toISOString(),
        event: 'BADGE_AWARDED',
        xp: 0,
        meta: { badge: badge.id, name: badge.name }
      });
    }
  }
}

// Função para resetar progresso (útil para desenvolvimento)
export async function resetGamificationState() {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🔄 Estado da gamificação resetado');
}
