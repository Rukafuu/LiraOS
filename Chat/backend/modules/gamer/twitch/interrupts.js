/**
 * Twitch Interrupts
 * Injects chat relevance into the Gamer Loop.
 */
class TwitchInterrupts {
    constructor() {
        this.recentMessages = [];
        this.highPriorityQueue = []; // Subs, Donations, Mods
    }

    /**
     * Ingest a message from Twitch Service.
     * @param {string} user 
     * @param {string} message 
     * @param {boolean} isHighPriority 
     */
    ingest(user, message, isHighPriority = false) {
        // 1. Filter: Ignore spam/short messages unless urgent
        if (message.length < 2) return;

        // 2. Keyword Detection (Simple Attention Mechanism)
        const urgentKeywords = ['cuidado', 'atrás', 'morreu', 'gg', 'olha', 'esquerda', 'direita', 'cura', 'heal'];
        const isUrgent = urgentKeywords.some(k => message.toLowerCase().includes(k));

        const interrupt = {
            user,
            text: message,
            timestamp: Date.now(),
            tags: isUrgent ? ['URGENT'] : []
        };

        if (isHighPriority || isUrgent) {
            this.highPriorityQueue.push(interrupt);
        } else {
            this.recentMessages.push(interrupt);
            if (this.recentMessages.length > 5) this.recentMessages.shift(); // Keep last 5
        }
    }

    /**
     * Called by NeuroLoop.buildState() to get chat context.
     */
    getRelevantContext() {
        // Pop critical alerts first
        if (this.highPriorityQueue.length > 0) {
            const alert = this.highPriorityQueue.shift();
            return {
                type: 'CHAT_ALERT',
                content: `${alert.user} grita: "${alert.text}"`
            };
        }

        // Otherwise return ambient chatter summary
        if (this.recentMessages.length > 0) {
            const summary = this.recentMessages.map(m => `${m.user}: ${m.text}`).join(' | ');
            return { type: 'CHAT_AMBIENT', content: summary };
        }

        return null;
    }
}

export const twitchInterrupts = new TwitchInterrupts();
