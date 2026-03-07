
/**
 * LiraOS Tier Limits Configuration
 * Defines resource limits and feature access for each user tier.
 */

export const TIERS = {
    FREE: 'free',
    VEGA: 'vega', // Premium Tier 1
    SIRIUS: 'sirius', // Premium Tier 2
    SINGULARITY: 'singularity', // Admin / Founder Tier
};

export const TIER_LIMITS = {
    [TIERS.FREE]: {
        name: 'Observer (Free)',
        imagesPerDay: 5,
        maxMemories: 100,
        maxTodoLists: 3,
        proToolsCooldownHours: 24,
        deepMode: false,
        models: ['gemini-2.0-flash', 'gemini-1.5-flash'],
        imageQuality: 'standard',
        features: ['basic_chat', 'system_stats', 'calendar_view', 'todo_basic']
    },
    [TIERS.VEGA]: {
        name: 'Vega Nebula',
        imagesPerDay: 50,
        maxMemories: 1000,
        maxTodoLists: 10,
        proToolsCooldownHours: 0, // Unlimited
        deepMode: true,
        models: ['gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-thinking-exp-01-21'],
        imageQuality: 'high',
        features: ['all_tools', 'deep_memory', 'priority_support', 'copilot', 'voice_hd']
    },
    [TIERS.SIRIUS]: {
        name: 'Sirius Galaxy',
        imagesPerDay: 200,
        maxMemories: 5000,
        maxTodoLists: 50,
        proToolsCooldownHours: 0,
        deepMode: true,
        models: ['gemini-2.0-flash-thinking-exp-01-21', 'gemini-1.5-pro'],
        imageQuality: 'ultra',
        features: ['all_tools', 'unlimited_memory', 'voice_pro', 'copilot', 'voice_hd']
    },
    [TIERS.SINGULARITY]: {
        name: 'Singularity (Infinite)',
        imagesPerDay: 9999,
        maxMemories: 99999,
        maxTodoLists: 999,
        proToolsCooldownHours: 0,
        deepMode: true,
        models: ['gemini-2.0-flash-thinking-exp-01-21', 'gemini-1.5-pro'],
        imageQuality: 'ultra',
        features: ['all_features_enabled']
    }
};

/**
 * Pro Tools identification
 */
export const PRO_TOOLS = [
    'read_project_file',
    'list_directory',
    'search_code',
    'analyze_file',
    'get_project_structure',
    'execute_system_command',
    'organize_folder',
    'generate_video'
];

/**
 * Gets the limit for a specific tier and key
 */
export function getTierLimit(tier = 'free', key) {
    const limits = TIER_LIMITS[tier] || TIER_LIMITS[TIERS.FREE];
    return limits[key];
}

/**
 * Validates if a user can use a feature based on their tier
 */
export async function canUseFeature(userTier = 'free', feature) {
    const limits = TIER_LIMITS[userTier] || TIER_LIMITS[TIERS.FREE];
    return limits.features.includes(feature) || limits.features.includes('all_features_enabled');
}
