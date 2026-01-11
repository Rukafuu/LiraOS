
export function shouldSummon(event, botConfig = {}) {
    if (!event || !event.message) return false;

    const { text, hasMention, replyToLira } = event.message;

    // RULE 1: Explicit Mention
    if (hasMention) return true;

    // RULE 1.5: Name Trigger (Natural Language)
    if (text.toLowerCase().includes('lira')) return true;

    // RULE 2: Reply to Bot
    if (replyToLira) return true;

    // RULE 3: Command Start (e.g. /sticker, /menu)
    const prefixes = botConfig.commandPrefixes || ['/', '!'];
    if (prefixes.some(p => text.startsWith(p))) return true;

    // Otherwise, ignore (Passive Mode)
    return false;
}
