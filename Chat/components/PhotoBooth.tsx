
import React, { useEffect, useRef, useState } from 'react';
import { LiraCore } from '../lib/lira-avatar/liraCore';
import { Message } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

interface PhotoBoothProps {
  messages: Message[];
}

export const PhotoBooth: React.FC<PhotoBoothProps> = ({ messages }) => {
  const containerId = 'lira-photo-booth';
  const liraRef = useRef<LiraCore | null>(null);
  const lastSnapshotIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 1. Initialize Background Avatar
  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
        try {
            console.log("[PhotoBooth] Initializing Background Studio...");
            
            // 🛡️ GPU GATE: Check if device can handle Live2D
            const { gpuGate } = await import('../utils/gpuGate');
            const gateResult = await gpuGate();
            
            if (!gateResult.ok) {
                console.warn("[PhotoBooth] GPU Gate blocked Live2D:", gateResult.reason);
                console.warn("[PhotoBooth] Selfies disabled on this device.");
                return; // Skip initialization
            }
            
            const core = new LiraCore(containerId);
            await core.loadModel('/assets/model/lira/youling.model3.json');
            
            
            if (mounted) {
                liraRef.current = core;
                setIsReady(true);
                console.log("[PhotoBooth] Studio Ready 📸");
            } else {
                core.destroy();
            }
        } catch (e) {
            console.warn("[PhotoBooth] Failed to initialize background avatar (likely WebGL limit). Selfies disabled.");
        }
    };

    // Slight delay to let main app load first
    const timer = setTimeout(init, 2000);

    return () => {
        mounted = false;
        clearTimeout(timer);
        liraRef.current?.destroy();
    };
  }, []);

  // 2. Watch for Selfie Commands
  useEffect(() => {
    if (!isReady || messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    
    // Only process AI messages that haven't been snapped yet
    if (lastMsg.role !== 'user' && lastMsg.id !== lastSnapshotIdRef.current) {
        
        const selfieRegex = /\[INSTAGRAM_POST:\s*"?(.*?)"?\]/;
        const match = lastMsg.content.match(selfieRegex);

        if (match) {
            const caption = match[1];
            console.log(`[PhotoBooth] 📸 Trigger detected via Chat/Discord: "${caption}"`);
            lastSnapshotIdRef.current = lastMsg.id;

            // Execute Snap Routine
            takeSnap(caption);
        }
    }
  }, [messages, isReady]);

  const takeSnap = async (caption: string) => {
      if (!liraRef.current) return;

      // 1. Random Expression
      const expressions = ['f02', 'f03', 'f04', 'f05', 'f06', 'f07', 'f08', 'f09', 'f10', 'f11'];
      const randomExp = expressions[Math.floor(Math.random() * expressions.length)];
      
      console.log(`[PhotoBooth] Posing with ${randomExp}...`);
      
      // 2. Pose
      liraRef.current.setExpression(randomExp);
      liraRef.current.lookAt(window.innerWidth / 2, window.innerHeight / 2); // Look center relative to container

      // 3. Wait for pose interpolation
      await new Promise(r => setTimeout(r, 1500));

      // 4. Snap
      const snap = liraRef.current.takeSnapshot('image/png', 1.0);
      
      // 5. Reset
      await new Promise(r => setTimeout(r, 500));
      liraRef.current.setExpression("f01");

      if (snap) {
          console.log("[PhotoBooth] Uploading global snapshot...");
          
          await fetch(`${API_BASE_URL}/api/instagram/upload-snapshot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: snap, caption: caption, autoPost: true })
          })
          .then(res => res.json())
          .then(d => console.log("[PhotoBooth] Result:", d))
          .catch(e => console.error("[PhotoBooth] Upload Error:", e));
      }
  };

  return (
    <div 
        id={containerId} 
        style={{ 
            position: 'fixed', 
            top: 0, 
            left: '-9999px', // Off-screen but renderable
            width: '1280px', // High Res Canvas
            height: '720px', 
            opacity: 0, 
            pointerEvents: 'none',
            zIndex: -1
        }} 
    />
  );
};
