import { simpleStore } from '../data/simpleStore.js';
import { groupStore } from '../data/groupStore.js';

export async function trackActivity(event) {
    try {
        const { userId, groupId, type, message } = event;
        
        let statType = 'message';
        if (message.media) {
            statType = 'image'; // Default media
            if (message.media.type === 'sticker') statType = 'sticker';
        }
        if (message.text && message.text.startsWith('/')) statType = 'command';
        
        // Update User Stats
        await simpleStore.updateStats(userId, statType);
        
        // Update Group Stats
        if (groupId) {
            await groupStore.updateStats(groupId, statType);
        }
        
    } catch (e) {
        console.error('[WA Tracker] Failed to track:', e);
    }
}
