import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { emit } from '@tauri-apps/api/event';

let overlayWindow: WebviewWindow | null = null;

/**
 * Toggle VTuber Overlay Mode
 * Creates a separate always-on-top transparent window with Lira
 */
export async function toggleOverlayMode(): Promise<boolean> {
    try {
        // Check if window already exists (getByLabel returns WebviewWindow | null)
        const existing: WebviewWindow | null = WebviewWindow.getByLabel('overlay');
        
        if (existing !== null) {
            // Window exists - close it
            await existing.close();
            overlayWindow = null;
            return false;
        }
        
        // Create new overlay window (constructor is synchronous in Tauri v2 frontend)
        const newWindow = new WebviewWindow('overlay', {
            url: '/overlay',
            title: 'Lira Overlay',
            width: 300,
            height: 400,
            transparent: true,
            decorations: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: false,
            visible: true
        });
        
        overlayWindow = newWindow;
        console.log('[Overlay] Window created');
        return true;
    } catch (error) {
        console.error('[Overlay] Toggle failed:', error);
        overlayWindow = null;
        return false;
    }
}

/**
 * Sync voice state to overlay window
 */
export async function syncVoiceState(speaking: boolean) {
    try {
        await emit('lira-voice-state', { speaking });
    } catch (e) {
        console.warn('[Overlay] Voice sync failed:', e);
    }
}

/**
 * Sync emotion state to overlay window
 */
export async function syncEmotionState(emotion: string) {
    try {
        await emit('lira-emotion-state', { emotion });
    } catch (e) {
        console.warn('[Overlay] Emotion sync failed:', e);
    }
}

/**
 * Check if overlay is currently active
 */
export function isOverlayActive(): boolean {
    const existing: WebviewWindow | null = WebviewWindow.getByLabel('overlay');
    return existing !== null;
}
