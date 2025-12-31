import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Twitch, Monitor, Play, RefreshCw, Zap } from 'lucide-react';
import { liraVoice } from '../services/lira_voice';
import { addMemoryServer } from '../services/ai';
import { getCurrentUser } from '../services/userService';
import { useToast } from '../contexts/ToastContext';

interface GamerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_GAMES = [
    { id: 'minecraft', name: 'Minecraft', icon: 'https://img.icons8.com/color/96/minecraft-logo.png', exe: 'javaw', path: 'minecraft:' }, // Launches MS Store version
    { id: 'honkai', name: 'Honkai: Star Rail', icon: 'https://fastcdn.hoyoverse.com/static-resource-v2/2024/04/10/d704ba41103c27072fecfa8497672159_7279313426162383863.png', exe: 'StarRail', path: 'C:/Program Files/Star Rail/Launcher.exe' },
    { id: 'epic7', name: 'Epic Seven', icon: 'https://play-lh.googleusercontent.com/lq61P5Qo-rG-bX1OqjG_Y7gK2vWvP5XlXzE-Xw9lXqRkH7bFjQ.png', exe: 'HD-Player', path: '' }, // Bluestacks usually
    { id: 'osu', name: 'osu!', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Osu%21_Logo_2016.svg/1024px-Osu%21_Logo_2016.svg.png', exe: 'osu!', path: 'osu!.exe' },
    { id: 'notepad', name: 'Notepad Adventure', icon: 'https://img.icons8.com/color/96/notepad.png', exe: 'notepad', path: 'notepad.exe' },
    { id: 'chrome', name: 'Browser Surfing', icon: 'https://img.icons8.com/color/96/chrome--v1.png', exe: 'chrome', path: 'chrome.exe' }
];

const BRIDGE_URL = 'http://localhost:5000';

export const GamerModal: React.FC<GamerModalProps> = ({ isOpen, onClose }) => {
    const { addToast } = useToast();
    const [status, setStatus] = useState<'idle' | 'connecting' | 'playing'>('idle');
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [lastLog, setLastLog] = useState<string[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [sessionMemories, setSessionMemories] = useState<string[]>([]);
    const lastSpeakTime = useRef<number>(0);

    const addLog = (text: string) => setLastLog(prev => [text, ...prev].slice(0, 10));

    const saveGameContext = async () => {
        if (sessionMemories.length === 0 || !selectedGame) return;

        const user = getCurrentUser();
        if (!user) return;

        // Create a summary
        const uniqueThoughts = Array.from(new Set(sessionMemories)).slice(-15);
        if (uniqueThoughts.length === 0) return;

        const summary = `GAME SESSION REPORT: ${DEFAULT_GAMES.find(g => g.id === selectedGame)?.name || selectedGame}\n` +
            `Lira's Thoughts:\n` + uniqueThoughts.map(t => `- ${t}`).join('\n');

        addLog(`[SYSTEM] Saving session memory...`);
        try {
            await addMemoryServer(summary, ['game', 'session', selectedGame], 'note', 'medium', user.id);
            addToast('Lira lembrou dessa jogatina! 🧠', 'success');
        } catch (e) {
            console.error("Failed to save game memory", e);
        }
    };

    const handleStop = async () => {
        await saveGameContext();
        setStatus('idle');
        setIsAutoPlay(false);
        setSessionMemories([]);
    };

    const handleCloseModal = async () => {
        if (status === 'playing') {
            await saveGameContext();
        }
        onClose();
    };

    const startActiveWindowDetection = async () => {
        setSelectedGame('custom');
        setStatus('connecting');
        setSessionMemories([]);
        addLog("[SYSTEM] Prepare to switch window in 2 seconds...");

        try {
            const res = await fetch(`${BRIDGE_URL}/connect/active`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            if (data.success) {
                const title = (data.title || '').toLowerCase();
                const exe = (data.exe || '').toLowerCase();

                addLog(`[SYSTEM] Detected: "${data.title}" (${data.exe})`);

                // Auto-Detect Game ID
                if (exe.includes('osu') || title.includes('osu')) {
                    setSelectedGame('osu');
                    addLog("[SYSTEM] Mode: osu! (Bot Active)");
                } else if (exe.includes('javaw') || title.includes('minecraft')) {
                    setSelectedGame('minecraft');
                    addLog("[SYSTEM] Mode: Minecraft");
                } else if (exe.includes('starrail') || title.includes('honkai')) {
                    setSelectedGame('honkai');
                    addLog("[SYSTEM] Mode: Honkai");
                } else {
                    addLog(`[SYSTEM] Mode: Custom (GenAI)`);
                }

                setStatus('playing');
                addLog(`[SYSTEM] HWND: ${data.hwnd}`);
            } else {
                setStatus('idle');
                addLog(`[ERROR] ${data.message}`);
            }
        } catch (e) {
            setStatus('idle');
            addLog("[ERROR] Bridge Service Unavailable.");
        }
    };

    const startGame = async (gameId: string) => {
        // Find game config
        const game = DEFAULT_GAMES.find(g => g.id === gameId);
        if (!game) return;

        setSelectedGame(gameId);
        setStatus('connecting');
        setSessionMemories([]);
        addLog(`[SYSTEM] Searching for process: ${game.exe}...`);

        try {
            const res = await fetch(`${BRIDGE_URL}/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(game)
            });
            const data = await res.json();

            if (data.success) {
                setStatus('playing');
                addLog(`[SYSTEM] Hooked Custom Window: ${data.title}`);
                addLog(`[SYSTEM] HWND: ${data.hwnd}`);

                // AUTO-DETECT KNOWN GAMES
                const titleLower = (data.title || '').toLowerCase();
                const exeLower = (data.exe || '').toLowerCase();

                if (titleLower.includes('osu') || exeLower.includes('osu')) {
                    setSelectedGame('osu');
                    addLog("[SYSTEM] Osu! Detected -> Activating Rhythm Bot Mode 🔴");
                } else if (titleLower.includes('minecraft') || exeLower.includes('java')) {
                    setSelectedGame('minecraft');
                    addLog("[SYSTEM] Minecraft Detected -> Activating Steve Mode ⛏️");
                }
            } else {
                setStatus('idle');
                addLog(`[ERROR] ${data.message}`);
            }
        } catch (e: any) {
            setStatus('idle');
            addLog("[ERROR] Bridge Service Unavailable. Run python script.");
        }
    };

    // Polling handled by useEffect below

    // Status Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === 'playing') {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${BRIDGE_URL}/actions/snapshot`);
                    if (res.status === 400) {
                        // Backend lost context (restart?)
                        setStatus('idle');
                        addLog('[ERROR] Connection lost. Please reconnect.');
                        return;
                    }

                    const d = await res.json();
                    if (d.success) {
                        setPreviewImage(`data:image/jpeg;base64,${d.image}`);
                    }
                } catch { }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const [isAutoPlay, setIsAutoPlay] = useState(false);

    // Auto-Play Agent Loop (REAL AI)
    useEffect(() => {
        if (!isAutoPlay || status !== 'playing') return;

        // 🟢 OSU BOT ACTIVATION (Local Vision Loop)
        if (selectedGame === 'osu') {
            fetch(`${BRIDGE_URL}/bot/start`, { method: 'POST' })
                .then(() => addLog("[SYSTEM] Vision Bot Activated (Local Loop)"))
                .catch(e => console.error("Bot Start Fail", e));
        }

        const loop = setInterval(async () => {
            try {
                // 1. Get Eyes (Snapshot)
                const snapRes = await fetch(`${BRIDGE_URL}/actions/snapshot`);
                if (!snapRes.ok) return; // Skip if vision failing
                const snapData = await snapRes.json();

                if (snapData.success && snapData.image) {
                    addLog("[AGENT] Analyzing screen...");

                    // 2. Ask Brain (Node.js + Gemini)
                    const brainRes = await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000'}/api/gamer/action`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image: snapData.image,
                            gameId: selectedGame
                        })
                    });

                    const decision = await brainRes.json();
                    addLog(`[DEBUG] ACT: ${typeof decision.action === 'object' ? JSON.stringify(decision.action) : decision.action} T: ${decision.type} SUB: ${decision.subtype}`);

                    if (decision.thought) {
                        addLog(`[BRAIN] "${decision.thought}"`);
                        setSessionMemories(prev => {
                            const last = prev[prev.length - 1];
                            if (last !== decision.thought) return [...prev, decision.thought];
                            return prev;
                        });

                        // 🗣️ Voice Commentary (Humanized & Rate Limited)
                        const now = Date.now();
                        const timeSinceLast = now - lastSpeakTime.current;
                        // Urgent keywords force speech immediately
                        const isUrgent = /oops|wow|no!|yes!|damn|droga|quase|ai!|aha|gotcha|merda|puxa|nossa|missed/i.test(decision.thought);
                        // Technical jargon suppresses speech
                        const isTechnical = /clicking|pressing|moving|x=|y=|analyzing|calculating/i.test(decision.thought);

                        // Speak if: Urgent OR (Time > 8s AND Not Technical)
                        if (!liraVoice.isSpeaking() && (isUrgent || (timeSinceLast > 8000 && !isTechnical))) {
                            liraVoice.speak(decision.thought, { usePremium: true, voiceId: 'lira-local', volume: 1.0 });
                            lastSpeakTime.current = now;
                        }
                    }

                    // 3. Move Hands (Input)
                    // If OSU, skip VLM input (Local Bot handles input). Only execute input for other games.
                    if (selectedGame !== 'osu') {

                        // NORMALIZE INPUT: Model mixes 'value' and 'key' sometimes.
                        const inputVal = decision.value || decision.key;

                        if (decision.action === 'text' && inputVal) {
                            addLog(`[AGENT] Typing: "${inputVal}"`);
                            await fetch(`${BRIDGE_URL}/actions/input`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'text', text: inputVal })
                            });
                        } else if (decision.action === 'key' && inputVal) {
                            const dur = decision.duration || 0.1;
                            addLog(`[AGENT] Pressing: ${inputVal} (${dur}s)`);
                            await fetch(`${BRIDGE_URL}/actions/input`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'key',
                                    key: inputVal,
                                    duration: dur,
                                    x: decision.x,
                                    y: decision.y
                                })
                            });
                        } else if (decision.action === 'gamepad') {
                            addLog(`[GAMEPAD] ${decision.subtype} ${decision.key}`);
                            await fetch(`${BRIDGE_URL}/actions/input`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'gamepad',
                                    subtype: decision.subtype,
                                    key: decision.key,
                                    x: decision.x,
                                    y: decision.y,
                                    duration: decision.duration || 0.2
                                })
                            });
                        } else if (decision.action === 'mouse') {
                            addLog(`[MOUSE] ${decision.subtype || 'move'} at ${decision.x},${decision.y}`);
                            await fetch(`${BRIDGE_URL}/actions/input`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'mouse',
                                    subtype: decision.subtype || 'move',
                                    duration: 0.1,
                                    x: decision.x,
                                    y: decision.y
                                })
                            });
                        }
                    }
                }
            } catch (e) {
                console.error(e);
                addLog("[ERROR] Brain disconnected.");
            }
        }, 2000); // 2s polling mainly for Commentary

        return () => {
            clearInterval(loop);
            // STOP BOT on Cleanup
            if (selectedGame === 'osu') {
                fetch(`${BRIDGE_URL}/bot/stop`, { method: 'POST' }).catch(() => { });
            }
        };
    }, [status, isAutoPlay, selectedGame]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleCloseModal}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl h-[80vh] bg-[#0c0c0e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex"
                >
                    {/* Sidebar */}
                    <div className="w-64 bg-[#0a0a0c] border-r border-white/5 p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-emerald-500 mb-4">
                            <Gamepad2 size={28} />
                            <span className="font-bold tracking-wider text-lg">GamerOS</span>
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs uppercase text-gray-500 font-bold tracking-widest pl-1">Accounts</div>
                            <button className="w-full bg-[#6441a5]/10 hover:bg-[#6441a5]/20 border border-[#6441a5]/30 p-3 rounded-xl flex items-center gap-3 transition-all group">
                                <Twitch size={18} className="text-[#6441a5] group-hover:text-white" />
                                <span className="text-sm font-medium text-gray-300 group-hover:text-white">Twitch Linked</span>
                                <div className="w-2 h-2 rounded-full bg-green-500 ml-auto animate-pulse" />
                            </button>
                        </div>

                        <div className="mt-auto">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="text-xs text-gray-500 mb-2">Visual Cortex Status</div>
                                <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    ONLINE
                                </div>
                                <div className="text-[10px] text-gray-600 mt-1">Latency: 12ms</div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Game Library</h2>
                                <p className="text-gray-400 text-sm">Select a game for Lira to play</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Games Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {DEFAULT_GAMES.map(game => (
                                <motion.div
                                    key={game.id}
                                    whileHover={{ y: -5 }}
                                    onClick={() => startGame(game.id)}
                                    className={`relative group cursor-pointer rounded-2xl overflow-hidden border transition-all ${selectedGame === game.id ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-emerald-500/30'}`}
                                >
                                    <div className="aspect-video bg-black/40 flex items-center justify-center p-8">
                                        <img src={game.icon} alt={game.name} className="w-24 h-24 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-white font-bold">{game.name}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 group-hover:text-emerald-400 transition-colors">AUTO-PLAY</span>
                                        </div>
                                    </div>
                                    {selectedGame === game.id && (
                                        <div className="absolute top-4 right-4 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in">
                                            <Play size={14} className="text-white fill-current" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Add Custom Game */}
                            <button
                                onClick={startActiveWindowDetection}
                                className="border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/5 hover:border-white/20 transition-all group aspect-video relative overflow-hidden"
                            >
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Monitor size={20} className="text-gray-500 group-hover:text-white" />
                                </div>
                                <span className="text-sm font-medium text-gray-500 group-hover:text-white">Detect Active Window</span>
                                {status === 'connecting' && selectedGame === 'custom' && (
                                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-center p-4">
                                        <span className="text-emerald-400 font-mono text-sm animate-pulse">
                                            CLICK YOUR GAME WINDOW NOW!<br />
                                            Hooking in 2s...
                                        </span>
                                    </div>
                                )}
                            </button>
                        </div>

                        {/* Playing Interface (Overlay) */}
                        <AnimatePresence>
                            {status === 'playing' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-8 bg-[#111] rounded-2xl border border-emerald-500/20 p-6 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-shimmer" />
                                    <div className="flex items-start gap-6">
                                        <div className="w-64 aspect-video bg-black rounded-lg border border-white/10 flex items-center justify-center relative overflow-hidden">
                                            {/* Screen Capture Preview */}
                                            {previewImage ? (
                                                <img src={previewImage} alt="Live View" className="w-full h-full object-contain" />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                                                    <span className="text-xs text-emerald-500 font-mono flex items-center gap-2">
                                                        <RefreshCw size={12} className="animate-spin" />
                                                        WAITING FOR SIGNAL...
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                        Playing: {DEFAULT_GAMES.find(g => g.id === selectedGame)?.name}
                                                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">LIVE</span>
                                                    </h3>
                                                    <p className="text-sm text-gray-400 mt-1">Lira is analyzing the screen and simulating inputs.</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setIsAutoPlay(!isAutoPlay)}
                                                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isAutoPlay ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
                                                    >
                                                        <Zap size={16} className={isAutoPlay ? "fill-current animate-pulse" : ""} />
                                                        {isAutoPlay ? 'AI Agent ON' : 'Enable AI Agent'}
                                                    </button>
                                                    <button
                                                        onClick={handleStop}
                                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Stop Playing
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Game Log Console */}
                                            <div className="bg-black/50 rounded-lg p-3 font-mono text-xs h-32 overflow-y-auto border border-white/5 space-y-1">
                                                {lastLog.map((log, i) => (
                                                    <div key={i} className={log.includes("ERROR") ? "text-red-400" : log.includes("SYSTEM") ? "text-purple-400" : log.includes("AGENT") ? "text-yellow-400" : "text-emerald-400"}>
                                                        {log}
                                                    </div>
                                                ))}
                                                {lastLog.length === 0 && <div className="text-gray-500 italic">Initializing cortex logs...</div>}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
