
import React, { useEffect, useRef, useState } from 'react';
import { LiraCore } from '../lib/lira-avatar/liraCore';
import { X, PhoneOff, Settings, Check, User, MessageCircle, Music, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { liraVoice, PREMIUM_VOICES } from '../services/lira_voice';
import { AudioService } from '../services/avatarAudioService';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { AudioVisualizer } from './ui/AudioVisualizer';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

interface VoiceCallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string, attachments: []) => void;
  userName: string;
  avatarUrl: string;
  currentResponse?: string;
  messages: Message[];
}

type CallState = 'listening' | 'thinking' | 'speaking' | 'error';

export const VoiceCallOverlay: React.FC<VoiceCallOverlayProps> = ({ 
  isOpen, 
  onClose, 
  onSendMessage,
  userName,
  currentResponse,
  messages
}) => {
  const [callState, setCallState] = useState<CallState>('listening');
  const callStateRef = useRef<CallState>('listening');
  const transcriptRef = useRef<HTMLDivElement>(null);
  
  // Songs Support
  const [showSongs, setShowSongs] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<string[]>([]);
  
  useEffect(() => {
    if (showSongs && availableSongs.length === 0) {
        // Fetch songs
        fetch(`${API_BASE_URL}/api/songs`)
            .then(res => res.json())
            .then(data => setAvailableSongs(data))
            .catch(err => console.error("Failed to load songs", err));
    }
  }, [showSongs]);

  const handlePlaySong = (filename: string) => {
      // Cast to any since playSong was recently added
      (liraVoice as any).playSong(`${API_BASE_URL}/songs/${filename}`).then(() => {
          // State is handled by subscribe listeners
          console.log("Playing song...");
      });
  };
  
  useEffect(() => {
    if (transcriptRef.current) {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, currentResponse]);
  
  // Lira Avatar & Audio
  const liraRef = useRef<LiraCore | null>(null);
  const audioServiceRef = useRef<AudioService>(new AudioService());
  const requestRef = useRef<number | undefined>(undefined);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(localStorage.getItem('lira_premium_voice_id') || PREMIUM_VOICES[0].id);
  const [localVoices, setLocalVoices] = useState<any[]>([]);
  
  // Microphone Settings
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>(localStorage.getItem('lira_audio_input_id') || 'default');
  
  // Speech Recognition
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const [userStream, setUserStream] = useState<MediaStream | undefined>(undefined);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  // Check audio state on mount
  useEffect(() => {
     const ctx = liraVoice.getAudioContext();
     // If no context or suspended, we strictly need a gesture
     if (!ctx || ctx.state === 'suspended') {
         setNeedsAudioUnlock(true);
     }
  }, []);

  const handleUnlockAudio = () => {
      liraVoice.unlock();
      setNeedsAudioUnlock(false);
  };

  const prevMsgsLength = useRef(messages.length);
  const lastSpokenIdRef = useRef<string | null>(null);
  const lastSnapshotIdRef = useRef<string | null>(null);

  // 1. On Mount: Mark existing history as "Read" (Silent Startup)
  useEffect(() => {
      if (messages.length > 0) {
          const last = messages[messages.length - 1];
          // Mark as spoken so we don't repeat history on reload
          lastSpokenIdRef.current = last.id;
          lastSnapshotIdRef.current = last.id;
          console.log("🤫 Silent Startup - Validated up to:", last.id);
      }
  }, []); // Run once on mount

  // 🗣️ TTS Trigger Logic
  const historyLoadedRef = useRef(false);

  // Main Trigger: Watch for Messages & Stream End
  useEffect(() => {
    // 1. If currently streaming, do nothing.
    if (currentResponse) return;

    // 2. Wait for messages to load
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];

    // 3. Handle Initial History Load (Async)
    // If this is the first time we see messages, mark the last one as "Read" and shut up.
    if (!historyLoadedRef.current) {
        if (lastMsg) {
            console.log("🤫 History Sync - Marking start point:", lastMsg.id);
            lastSpokenIdRef.current = lastMsg.id;
            lastSnapshotIdRef.current = lastMsg.id;
            historyLoadedRef.current = true;
        }
        return;
    }

    // 4. Normal Operation: Speak new messages
    if (lastMsg && lastMsg.role !== 'user') {
        // Log EVERYTHING to see why it fails
        console.log(`[TTS Check] ID: ${lastMsg.id} | Spoken: ${lastSpokenIdRef.current}`);

        // A. PHOTO BOOTH LOGIC 📸
        if (lastMsg.id !== lastSnapshotIdRef.current) {
            const selfieRegex = /\[INSTAGRAM_POST:\s*"?(.*?)"?\]/;
            const match = lastMsg.content.match(selfieRegex);
            
            if (match) {
                const caption = match[1];
                console.log("📸 Lira requested a selfie:", caption);
                lastSnapshotIdRef.current = lastMsg.id;

                setTimeout(async () => {
                    // Pose?
                    if (liraRef.current) {
                        // Random Expression for Selfie (f02 - f11)
                        const expressions = ['f02', 'f03', 'f04', 'f05', 'f06', 'f07', 'f08', 'f09', 'f10', 'f11'];
                        const randomExp = expressions[Math.floor(Math.random() * expressions.length)];
                        
                        console.log(`📸 Setting Random Expression ${randomExp}...`);
                        liraRef.current.setExpression(randomExp); 
                        liraRef.current.lookAt(window.innerWidth/2, window.innerHeight/2);
                        
                        // Hold Pose for 1.5s
                        await new Promise(r => setTimeout(r, 1500));

                        const snap = liraRef.current.takeSnapshot('image/png', 1.0);
                        
                        // Hold for another 0.5s so user sees the face clearly
                        await new Promise(r => setTimeout(r, 500));
                        
                        if (snap) {
                            console.log("📸 Snap taken! Uploading...");
                            // Reset pose to neutral (f01)
                            liraRef.current.setExpression("f01");

                            // Upload
                            fetch(`${API_BASE_URL}/api/instagram/upload-snapshot`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ image: snap, caption: caption, autoPost: true })
                            })
                            .then(res => res.json())
                            .then(d => console.log("📸 Upload Result:", d))
                            .catch(e => console.error("📸 Upload Failed:", e));
                        } else {
                            // Reset even if failed
                            liraRef.current.setExpression("f01");
                        }
                    }
                }, 1000); // Wait for speech start?
            }
        }

        // B. TTS LOGIC
        if (lastMsg.id !== lastSpokenIdRef.current) {
             console.log("🗣️ TRIGGERING VOICE NOW:", lastMsg.content);
             lastSpokenIdRef.current = lastMsg.id; // Lock it
             
             // Strip the command from speech
             const textToSpeak = lastMsg.content.replace(/\[INSTAGRAM_POST:.*?\]/g, "Postando no Instagram!");

             liraVoice.speak(textToSpeak, {
                usePremium: selectedVoiceId !== 'google-pt-BR',
                voiceId: selectedVoiceId !== 'google-pt-BR' ? 'xtts-local' : 'google-pt-BR'
             }).then(res => {
                if (res.ok) setCallState('speaking');
             });
        }
    }
  }, [messages, currentResponse]);

  // Load Settings Data
  useEffect(() => {
    if (showSettings) {
        setTimeout(() => {
            const locals = liraVoice.getLocalVoices();
            setLocalVoices(locals);
        }, 500);

        navigator.mediaDevices.enumerateDevices().then(devices => {
            setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
        });
    }
  }, [showSettings]);

  useEffect(() => {
      let mounted = true;
      let initTimer: NodeJS.Timeout;

      if (isOpen) {
          const initAvatar = async () => {
              // Give browser a breath before heavy WebGL init
              if (!mounted) return;

              try {
                 liraRef.current = new LiraCore('lira-container-overlay');
                 const modelPath = '/assets/model/lira/youling.model3.json';
                 
                 const tryLoad = async (path: string) => {
                     try {
                        console.log("[LiraAvatar] Loading:", path);
                        await liraRef.current?.loadModel(path);
                        return true;
                     } catch (e) {
                        console.warn("[LiraAvatar] Failed:", path, e);
                        return false;
                     }
                 };

                 // Prevent race condition if unmounted during load
                 if (!mounted) return;

                 const success = await tryLoad(modelPath);
                 if (!mounted) return;

                 if (!success) {
                    throw new Error("Failed to load any Avatar model.");
                 }

                 setModelLoaded(true);
                 
                 // 🚫 Remove Watermark (Param=1 hides it based on expression1)
                 setTimeout(() => {
                    liraRef.current?.setParameter('Param', 1);
                 }, 500);

                 startAnimationLoop();
                 window.addEventListener('mousemove', handleMouseMove);

                  try {
                    await audioServiceRef.current.startMicrophone();
                    // Setup User Stream for Visualizer
                    // We need to access the private stream from service or just get it again?
                    // AudioService usually keeps it private. Let's patch it or just get a new one for visualizer?
                    // Better to expose it from AudioService. checking AudioService... 
                    // Assuming AudioService has a method or we can just grab it here directly since we are in a component that manages devices.
                    // Actually, let's just grab a fresh stream for valid visualizer or modify AudioService.
                    // For now, let's just grab the stream here directly to be safe and independent.
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedAudioDeviceId } });
                    setUserStream(stream);
                  } catch (e) { console.error("LipSync Mic failed", e); }

               } catch (err: any) {
                  if (mounted) {
                      console.error("Avatar Init Error", err);
                      setModelError(err.message);
                  }
              }
          };
          
          // ⏳ Wait 500ms for DOM to settle and browser to free resources from previous destroy
          initTimer = setTimeout(initAvatar, 500);
          startCallLogic();

          return () => {
              mounted = false;
              clearTimeout(initTimer);
              stopCallLogic();
              if (requestRef.current) cancelAnimationFrame(requestRef.current);
              window.removeEventListener('mousemove', handleMouseMove);
              audioServiceRef.current.stop();
              liraRef.current?.destroy();
              liraRef.current = null;
          };
      }
  }, [isOpen]);

  const handleMouseMove = (e: MouseEvent) => {
      if (liraRef.current) {
          liraRef.current.lookAt(e.clientX, e.clientY);
      }
  };

  const [showChat, setShowChat] = useState(true);

  // ... (inside component)

  const startAnimationLoop = () => {
      const loop = () => {
          if (liraRef.current) {
             if (callStateRef.current === 'speaking') {
                 const analyser = liraVoice.getAnalyser();
                 if (analyser && liraVoice.isSpeaking()) {
                     const dataArray = new Uint8Array(analyser.frequencyBinCount);
                     analyser.getByteFrequencyData(dataArray);
                     let sum = 0;
                     for (let i = 0; i < dataArray.length; i++) { sum += dataArray[i]; }
                     const average = sum / dataArray.length;
                     const volume = Math.min(1.2, (average / 45)); 
                     liraRef.current.updateMouth(volume);
                 } else if (liraVoice.isSpeaking()) {
                     const simulatedVolume = 0.2 + (Math.sin(Date.now() / 50) + 1) * 0.4;
                     liraRef.current.updateMouth(simulatedVolume);
                 } else {
                     liraRef.current.updateMouth(0);
                 } 
             } else {
                 // 🔇 REMOVED USER LIP SYNC: Lira only moves mouth when SHE speaks
                 liraRef.current.updateMouth(0);
             }
          }
          requestRef.current = requestAnimationFrame(loop);
      };
      requestRef.current = requestAnimationFrame(loop);
  };

  // Watchdog: If stuck in 'thinking' for > 15s (backend timeout/error), reset to listening
  useEffect(() => {
      let watchdog: NodeJS.Timeout;
      if (callState === 'thinking') {
          watchdog = setTimeout(() => {
              console.warn("Thinking watchdog timed out - forcing listening state");
              setCallState('listening');
              startRecognition();
          }, 60000);
      }
      return () => clearTimeout(watchdog);
  }, [callState]);

  const startCallLogic = () => {
      const unsub = liraVoice.subscribe({
        onStart: () => {
          setCallState('speaking');
          stopRecognition();
          liraRef.current?.setExpression('f04');
        },
        onEnd: () => {
          // 🛑 Anti-Echo Delay: Wait 1s before listening again.
          // This prevents the mic from picking up the AI's last words/reverb
          // and triggering a false "user spoke" event immediately.
          setTimeout(() => {
              setCallState('listening');
              startRecognition();
              liraRef.current?.setExpression('f01');
          }, 1000);
        }
      });
      // Initial startup delay
      setTimeout(startRecognition, 500);
  };

  const stopCallLogic = () => {
      stopRecognition();
      liraVoice.stop();
  };

  const startRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    try {
      // Prevent multiple instances
      if (recognitionRef.current) return;
      
      // @ts-ignore
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
         console.log("🎤 Recognition started");
         if (callStateRef.current !== 'speaking') setCallState('listening');
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        console.log("🎤 Heard:", text);
        if (text.trim() && text.length > 1) { // Basic debris filter
           stopRecognition(); // Stop immediately to process
           setCallState('thinking');
           onSendMessage(text, []);
        }
      };

      recognition.onend = () => {
         // Auto-restart if we should still be listening
         if (callStateRef.current === 'listening' && !showSettings) {
             setTimeout(() => {
                 try { 
                     // Only restart if we haven't moved to another state (thinking/speaking)
                     if (callStateRef.current === 'listening') {
                         recognitionRef.current = null; // Clear ref to allow start
                         startRecognition(); 
                     }
                 } catch (e) {}
             }, 300);
         } else {
             recognitionRef.current = null;
         }
      };

      recognition.onerror = (event: any) => {
          console.warn("Mic Error:", event.error);
          recognitionRef.current = null; // Reset ref on error
          // Retry on no-speech or network errors after short delay
          if (event.error === 'no-speech' || event.error === 'network') {
               if (callStateRef.current === 'listening') {
                   setTimeout(startRecognition, 500);
               }
          }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) { 
        console.error("Recognition Start Error", e);
        recognitionRef.current = null;
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
    }
  };

  const handleHangup = () => {
    onClose();
  };

  const handleVoiceChange = (id: string) => {
      setSelectedVoiceId(id);
      localStorage.setItem('lira_premium_voice_id', id);
      localStorage.setItem('lira_force_premium_voice', 'true');
  };

  const handleLocalVoiceChange = (name: string) => {
      setSelectedVoiceId(name);
      localStorage.setItem('lira_force_premium_voice', 'false');
      liraVoice.setLocalVoice(name);
  };
  
  const handleAudioDeviceChange = (deviceId: string) => {
      setSelectedAudioDeviceId(deviceId);
      localStorage.setItem('lira_audio_input_id', deviceId);
      // Note: webkitSpeechRecognition always uses default system mic.
      // This setting only affects the visualizer (AudioService).
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={() => liraVoice.resumeAudioContext()}
      className="fixed inset-0 z-[100] bg-[#0a0a0b] flex flex-col items-center justify-center font-sans text-white animate-fade-in overflow-hidden select-none"
    >
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-lira-pink/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
        </div>
        
        {/* Lira Avatar Container */}
        <div id="lira-container-overlay" className="absolute inset-0 w-full h-full z-0 pointer-events-none" />

        {/* Global UI Overlays */}
        <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
            
            {/* Header Area */}
            <div className="p-6 flex justify-between items-center pointer-events-auto">
               <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                  <div className={`w-2 h-2 rounded-full ${callState === 'speaking' ? 'bg-green-500 animate-pulse' : 'bg-blue-400'}`} />
                  <span className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">{callState === 'speaking' ? 'Live Transmission' : 'Encrypted Link'}</span>
               </div>
               
               <div className="flex gap-2">
                  <button 
                     onClick={() => setShowSongs(!showSongs)}
                     className={`p-3 rounded-full transition-all active:scale-95 ${showSongs ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                     title="Lira Karaoke"
                  >
                     <Music size={20} />
                  </button>
                  <button 
                     onClick={() => setShowSettings(!showSettings)}
                     className={`p-3 rounded-full transition-all active:scale-95 ${showSettings ? 'bg-lira-pink text-white shadow-lg shadow-lira-pink/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                  >
                     <Settings size={20} />
                  </button>
                  <button onClick={handleHangup} className="p-3 rounded-full bg-white/5 text-gray-400 hover:bg-red-500 hover:text-white transition-all active:scale-95">
                     <X size={20} />
                  </button>
               </div>
            </div>

            {/* Voice Visualizers Removed per User Request */}

            {/* Twitch-style Chat Overlay (Right Side) */}
            <AnimatePresence>
            {showChat && (
                <div className="absolute bottom-24 right-8 w-[400px] flex flex-col pointer-events-auto z-50">
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-full"
                    >
                    <div 
                        ref={transcriptRef}
                        className="max-h-[60vh] overflow-y-auto pr-2 no-scrollbar space-y-4 mask-fade-top"
                    >
                        {/* Render Previous Messages */}
                        {messages.slice(-5).map((msg, i) => (
                            <motion.div 
                            key={msg.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: i === messages.slice(-5).length - 1 && callState === 'speaking' ? 1 : 0.8 }}
                            className={`flex flex-col items-start`}
                            >
                                <div className={`
                                px-5 py-3 rounded-2xl w-full backdrop-blur-md shadow-lg border border-white/5
                                ${msg.role === 'user' ? 'bg-black/40 text-white/90' : 'bg-lira-pink/10 text-white border-lira-pink/20'}
                                `}>
                                <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] font-bold uppercase tracking-wider">
                                    <span className={msg.role === 'user' ? 'text-blue-400' : 'text-lira-pink'}>
                                        {msg.role === 'user' ? userName : 'Lira'}
                                    </span>
                                    {msg.role !== 'user' && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log("▶️ Manual TTS Trigger:", msg.id);
                                                liraVoice.speak(msg.content, { usePremium: selectedVoiceId !== 'google-pt-BR', voiceId: selectedVoiceId !== 'google-pt-BR' ? 'xtts-local' : 'google-pt-BR' });
                                            }}
                                            className="ml-2 opacity-50 hover:opacity-100 transition-opacity text-white"
                                            title="Replay Audio"
                                        >
                                            ▶️
                                        </button>
                                    )}
                                </div>
                                <div className="markdown-content text-sm font-medium leading-relaxed overflow-wrap-anywhere">
                                    <ReactMarkdown 
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                    <div className="rounded-lg overflow-hidden my-2 border border-white/10 text-left bg-[#0c0c0e] max-w-full">
                                                        <pre className="p-3 font-mono text-[10px] text-gray-300 overflow-x-auto custom-scrollbar">
                                                            <code {...props}>{String(children).replace(/\n$/, '')}</code>
                                                        </pre>
                                                    </div>
                                                ) : (
                                                    <code className="bg-black/30 text-white/80 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>{children}</code>
                                                );
                                            },
                                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Current Streaming Text (if any) */}
                        {callState === 'speaking' && currentResponse && messages.length > 0 && messages[messages.length-1].content !== currentResponse && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-start w-full"
                            >
                                <div className="bg-lira-pink/20 backdrop-blur-xl px-5 py-4 rounded-2xl w-full border border-lira-pink/30 text-white shadow-xl shadow-lira-pink/5">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-lira-pink mb-1">Lira (Live)</div>
                                    <div className="text-sm font-medium leading-relaxed">
                                    <ReactMarkdown>
                                        {currentResponse}
                                    </ReactMarkdown>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                    </motion.div>

                    <AnimatePresence>
                        {callState === 'thinking' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex justify-start mt-3 scale-90 origin-left"
                            >
                                <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                        <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                                    </div>
                                    <span className="text-[9px] text-white/50 font-bold tracking-[0.2em] uppercase">Thinking</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
            </AnimatePresence>

                {/* Bottom Controls */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto flex items-center justify-center gap-8 z-50">
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-4 rounded-full transition-colors ${showSettings ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                    >
                        <User size={24} />
                    </button>
                    
                    <button 
                        onClick={handleHangup}
                        className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl shadow-red-500/20 hover:scale-110 active:scale-90 transition-all group"
                    >
                        <PhoneOff size={32} className="text-white group-hover:rotate-12 transition-transform" />
                    </button>
                    
                    <button 
                         onClick={() => setShowChat(!showChat)}
                         className={`p-4 rounded-full transition-colors ${showChat ? 'bg-white text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                    >
                        <MessageCircle size={24} />
                    </button>
                </div>
            </div>

        {/* Loading / Error Overlays */}
        <AnimatePresence>
            {!modelLoaded && !modelError && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center"
                >
                    <div className="w-16 h-16 border-4 border-lira-pink/20 border-t-lira-pink rounded-full animate-spin mb-6" />
                    <span className="text-sm font-bold tracking-[0.3em] text-white/40 uppercase">Linking Visual Cortex</span>
                </motion.div>
            )}
            
            {modelError && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8"
                >
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                        <X size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Cortex Initialization Failed</h2>
                    <p className="text-gray-500 text-center max-w-md mb-8 leading-relaxed">
                        The visual system encountered a fatal error: {modelError}. Reverting to neural-audio mode.
                    </p>
                    <button onClick={handleHangup} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors uppercase tracking-widest text-xs">
                        Abort Link
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* 🔓 Audio Unlock Overlay */}
        <AnimatePresence>
            {needsAudioUnlock && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer"
                    onClick={handleUnlockAudio}
                >
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-lira-pink px-8 py-4 rounded-full text-white font-bold text-lg shadow-2xl flex items-center gap-3 animate-pulse"
                    >
                        <span>🔊</span>
                        <span>Ativar Áudio & Voz</span>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Settings Modal Overlay */}
        <AnimatePresence>
        {showSettings && (
          <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: -20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: -20 }}
             className="absolute top-24 right-6 w-72 bg-[#121214] border border-white/5 rounded-3xl p-6 z-50 shadow-2xl text-left pointer-events-auto shadow-black"
          >
              <div className="text-[10px] uppercase text-white/30 font-black tracking-widest mb-4">Neural Vocals</div>
              <div className="space-y-1 max-h-[180px] overflow-y-auto no-scrollbar mb-6 pr-1">
                 {PREMIUM_VOICES.map(v => (
                    <button
                      key={v.id}
                      onClick={() => handleVoiceChange(v.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm transition-all ${selectedVoiceId === v.id ? 'bg-lira-pink/10 text-lira-pink border border-lira-pink/20' : 'hover:bg-white/5 text-gray-500'}`}
                    >
                       <span className="font-medium">{v.name}</span>
                       {selectedVoiceId === v.id && <div className="w-1.5 h-1.5 rounded-full bg-lira-pink" />}
                    </button>
                 ))}
              </div>
              
              <div className="text-[10px] uppercase text-white/30 font-black tracking-widest mb-4 border-t border-white/5 pt-6">Input Source</div>
              <div className="space-y-1 max-h-[150px] overflow-y-auto no-scrollbar">
                 {audioDevices.map((device, i) => (
                    <button
                      key={device.deviceId || i}
                      onClick={() => handleAudioDeviceChange(device.deviceId)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm text-left transition-all ${selectedAudioDeviceId === device.deviceId ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-500'}`}
                    >
                       <span className="truncate pr-4">{device.label || `Mic ${i+1}`}</span>
                       {selectedAudioDeviceId === device.deviceId && <Check size={14} className="text-lira-pink" />}
                    </button>
                 ))}
              </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Songs Modal Overlay */}
        <AnimatePresence>
        {showSongs && (
          <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: -20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: -20 }}
             className="absolute top-24 right-24 w-80 bg-[#121214] border border-white/5 rounded-3xl p-6 z-50 shadow-2xl text-left pointer-events-auto shadow-black"
          >
              <div className="text-[10px] uppercase text-violet-400 font-black tracking-widest mb-4 flex items-center gap-2">
                 <Music size={12} />
                 <span>Lira's Playlist</span>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                 {availableSongs.length === 0 ? (
                     <div className="text-gray-500 text-xs italic p-4 text-center">No songs found in /Songs directory</div>
                 ) : availableSongs.map((song, i) => (
                    <button
                      key={i}
                      onClick={() => handlePlaySong(song)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl text-sm transition-all hover:bg-white/5 text-gray-300 group hover:text-white hover:border-violet-500/30 border border-transparent"
                    >
                       <span className="truncate w-[85%] text-left font-medium">{song}</span>
                       <Play size={14} className="text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                 ))}
              </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Model Credits */}
        <div className="absolute bottom-4 left-4 text-[10px] text-white/20 pointer-events-none">
          <div>Model: Youling (幽澪)</div>
          <div>Art: @hatopon | Rigging: @星图司史</div>
          <div>© @互联网幽澪 (bilibili)</div>
        </div>
    </div>
  );
};
