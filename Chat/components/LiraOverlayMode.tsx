import React, { useEffect, useState } from 'react';
import { LiraCompanionWidget } from './LiraCompanionWidget';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useToast } from '../contexts/ToastContext';

export const LiraOverlayMode: React.FC = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [emotion, setEmotion] = useState('neutral');

    useEffect(() => {
        // Listen to sync events from Main Window
        let unlistenSpeak: () => void;
        let unlistenEmotion: () => void;

        const setupListeners = async () => {
            unlistenSpeak = await listen<{ speaking: boolean }>('lira-voice-state', (event) => {
                setIsSpeaking(event.payload.speaking);
            });

            unlistenEmotion = await listen<{ emotion: string }>('lira-emotion-state', (event) => {
                setEmotion(event.payload.emotion);
            });
            
            // Allow clicking through transparent parts
            // This requires backend support (ignore_cursor_events) which is tricky with dynamic content.
            // For now, we assume the window is small and just the avatar.
            // But we can enable "ignore cursor events" on the window itself if needed,
            // but we need to capture clicks for interactions.
            // LiraCompanionWidget has interactions.
        };

        setupListeners();
        
        // Ensure this window is transparent
        document.body.style.backgroundColor = 'transparent';
        document.documentElement.style.backgroundColor = 'transparent';

        return () => {
            if (unlistenSpeak) unlistenSpeak();
            if (unlistenEmotion) unlistenEmotion();
        };
    }, []);

    // Mock close - just hide window
    const handleClose = async () => {
        try {
            await getCurrentWindow().hide();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="w-screen h-screen bg-transparent overflow-hidden flex items-center justify-center">
             {/* Pass props controlled by events */}
             <LiraCompanionWidget 
                onClose={handleClose} 
                isSpeaking={isSpeaking}
                currentEmotion={emotion}
             />
        </div>
    );
};
