// Example: How to integrate desktop features in App.tsx

import { useEffect } from 'react';
import { 
    saveMessageLocal, 
    getMessagesLocal, 
    listenForNewChatRequest,
    copyToClipboard,
    autoSaveMessage 
} from './services/desktopService';
import { IS_DESKTOP } from './src/config';

// In your App component or chat handler:

// 1. Listen for "New Chat" from system tray
useEffect(() => {
    if (!IS_DESKTOP) return;
    
    const unlisten = listenForNewChatRequest(() => {
        // Create new chat session
        handleNewChat();
    });
    
    return () => {
        unlisten.then(fn => fn());
    };
}, []);

// 2. Auto-save messages to local SQLite
const handleSendMessage = async (content: string) => {
    const sessionId = currentSessionId || 'default';
    
    // Save user message
    if (IS_DESKTOP) {
        await autoSaveMessage(sessionId, 'user', content);
    }
    
    // ... send to backend ...
    
    // Save assistant response
    if (IS_DESKTOP && response) {
        await autoSaveMessage(sessionId, 'assistant', response);
    }
};

// 3. Load offline messages on startup
useEffect(() => {
    if (!IS_DESKTOP || !currentSessionId) return;
    
    const loadOfflineMessages = async () => {
        const messages = await getMessagesLocal(currentSessionId);
        if (messages.length > 0) {
            console.log('Loaded', messages.length, 'offline messages');
            // Merge with state...
        }
    };
    
    loadOfflineMessages();
}, [currentSessionId]);

// 4. Copy code blocks with one click
const handleCopyCode = async (code: string) => {
    if (IS_DESKTOP) {
        await copyToClipboard(code);
        addToast('Código copiado!', 'success');
    } else {
        // Fallback to navigator.clipboard
        navigator.clipboard.writeText(code);
    }
};
