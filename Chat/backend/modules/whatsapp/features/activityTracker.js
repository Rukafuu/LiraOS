import { simpleStore } from '../data/simpleStore.js';

export async function trackActivity(event) {
    try {
        const { userId, type, message } = event;
        
        let statType = 'message';
        if (message.media) statType = 'image'; // Generic media
        if (message.text && message.text.startsWith('/')) statType = 'command';
        
        // Update User Stats
        await simpleStore.updateStats(userId, statType);
        
        // TODO: Update Group Stats (if we add groupStore later)
        
    } catch (e) {
        console.error('[WA Tracker] Failed to track:', e);
    }
}
