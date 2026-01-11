import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
// import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager'; // Missing package
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';

// SQLite Local Storage
export async function saveMessageLocal(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
): Promise<void> {
    try {
        await invoke('save_message_local', {
            sessionId,
            role,
            content
        });
    } catch (error) {
        console.error('Failed to save message locally:', error);
    }
}

export async function getMessagesLocal(sessionId: string): Promise<any[]> {
    try {
        return await invoke('get_messages_local', { sessionId });
    } catch (error) {
        console.error('Failed to get local messages:', error);
        return [];
    }
}

// Clipboard Utilities
export async function copyToClipboard(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
    }
}

export async function getClipboardText(): Promise<string> {
    try {
        return await navigator.clipboard.readText() || '';
    } catch (error) {
        console.error('Failed to read clipboard:', error);
        return '';
    }
}

// Listen for new chat requests from tray
export function listenForNewChatRequest(callback: () => void) {
    return listen('new-chat-requested', () => {
        callback();
    });
}

// Auto-save messages to local DB (call this after each message)
export async function autoSaveMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
) {
    // Save to local SQLite in background
    saveMessageLocal(sessionId, role, content).catch(err => {
        console.warn('Background save failed:', err);
    });
}

// Window Management for Widget Mode

export async function enterWidgetMode() {
    try {
        const win = getCurrentWindow();
        await win.setSize(new LogicalSize(400, 600)); // Tamanho compacto vertical
    } catch (e) {
        console.error('Failed to resize window:', e);
    }
}

export async function exitWidgetMode() {
    try {
        const win = getCurrentWindow();
        await win.setSize(new LogicalSize(1200, 800)); // Tamanho padrão
    } catch (e) {
        console.error('Failed to restore window:', e);
    }
}
