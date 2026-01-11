import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../services/apiClient';
import { useToast } from '../contexts/ToastContext';
import { liraVoice } from '../services/lira_voice';

export function useCopilot(isLoggedIn: boolean) {
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<any>(null);
    const { addToast } = useToast();

    // Configuration
    const TICK_INTERVAL = 10000; // 10 seconds

    const start = () => {
        if (!isLoggedIn) {
            addToast('Login required for Copilot', 'error');
            return;
        }
        setIsActive(true);
        addToast('Lira Copilot Activated! 👁️', 'success');
        
        // Initial tick
        tick();
        
        intervalRef.current = setInterval(tick, TICK_INTERVAL);
    };

    const stop = () => {
        setIsActive(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        addToast('Lira Copilot Deactivated', 'info');
    };

    const toggle = () => (isActive ? stop() : start());

    const tick = async () => {
        try {
            const res = await apiFetch('/api/copilot/tick', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'fun' })
            });

            if (res.ok) {
                const data = await res.json();
                
                if (data.status === 'no_bridge') {
                     // Bridge not running
                     console.warn('Copilot Bridge missing');
                     // Don't spam toasts, just log
                     return;
                }

                console.log('[COPILOT] Reaction:', data.comment);

                // Play Audio
                if (data.audio) {
                    // We can reuse liraVoice to play base64 if it supports it, 
                    // or just creating an Audio element directly since it's a specific buffer.
                    // liraVoice usually takes text.
                    // Let's decode base64 and play.
                    try {
                        const audioSrc = `data:audio/mp3;base64,${data.audio}`;
                        const audio = new Audio(audioSrc);
                        audio.volume = 0.8;
                        audio.play();
                    } catch (e) {
                        console.error('Audio Play Error:', e);
                    }
                }

                // Check for Video
                if (data.video) {
                    addToast(`🎬 Lira clipped that! Saved as ${data.video.filename}`, 'success');
                }
            }
        } catch (error) {
            console.error('[COPILOT] Tick failed:', error);
        }
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return {
        isActive,
        toggle
    };
}
