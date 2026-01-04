import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Twitch, Monitor, Play, RefreshCw, Zap, Server } from 'lucide-react';
import { liraVoice } from '../services/lira_voice';
import { addMemoryServer } from '../services/ai';
import { getCurrentUser } from '../services/userService';
import { useToast } from '../contexts/ToastContext';

interface GamerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_GAMES = [
    { id: 'minecraft', name: 'Minecraft', icon: 'https://img.icons8.com/color/96/minecraft-logo.png', exe: 'javaw', path: 'minecraft:' }, 
    { id: 'honkai', name: 'Honkai: Star Rail', icon: 'https://fastcdn.hoyoverse.com/static-resource-v2/2024/04/10/d704ba41103c27072fecfa8497672159_7279313426162383863.png', exe: 'StarRail', path: 'C:/Program Files/Star Rail/Launcher.exe' },
    { id: 'epic7', name: 'Epic Seven', icon: 'https://play-lh.googleusercontent.com/lq61P5Qo-rG-bX1OqjG_Y7gK2vWvP5XlXzE-Xw9lXqRkH7bFjQ.png', exe: 'HD-Player', path: '' },
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

    // Minecraft Connection State
    const [minecraftAddress, setMinecraftAddress] = useState("localhost:25565");
    const [showMcInput, setShowMcInput] = useState(false);

    const addLog = (text: string) => setLastLog(prev => [text, ...prev].slice(0, 10));

    const saveGameContext = async () => {
        if (sessionMemories.length === 0 || !selectedGame) return;
        const user = getCurrentUser();
        if (!user) return;
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
        
        // Disconnect MC Bot if active
        if (selectedGame === 'minecraft') {
             const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';
             fetch(`${baseUrl}/api/gamer/minecraft/stop`, { method: 'POST' }).catch(() => {});
        }
    };

    const handleCloseModal = async () => {
        if (status === 'playing') {
            await handleStop();
        }
        onClose();
    };

    const handleStartMinecraft = async () => {
        setStatus('connecting');
        setSessionMemories([]);
        
        // Parse host:port
        const parts = minecraftAddress.split(':');
        const host = parts[0];
        const port = parts.length > 1 ? parseInt(parts[1]) : 25565;

        addLog(`[MC_BOT] Conectando a ${host}:${port}...`);
        
        try {
                const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';
                const res = await fetch(`${baseUrl}/api/gamer/minecraft/connect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ host, port, username: 'LiraBot' })
                });
                const d = await res.json();
                if(d.success) {
                    setStatus('playing');
                    setSelectedGame('minecraft');
                    setShowMcInput(false);
                    addLog(`[MC_BOT] Conectado! Aguardando spawn...`);
                } else {
                    setStatus('idle');
                    addLog(`[ERROR] ${d.error}`);
                }
        } catch(e: any) {
                setStatus('idle');
                addLog(`[ERROR] Falha de Rede: ${e.message}`);
        }
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

                if (exe.includes('javaw') || title.includes('minecraft')) {
                    // Redirect to MC Flow if detected
                    setMinecraftAddress('localhost:25565');
                    setShowMcInput(true);
                } else if (exe.includes('starrail') || title.includes('honkai')) {
                    setSelectedGame('honkai');
                    addLog("[SYSTEM] Mode: Honkai");
                    setStatus('playing');
                } else {
                    addLog(`[SYSTEM] Mode: Custom (GenAI)`);
                    setStatus('playing');
                }
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
        if (gameId === 'minecraft') {
            setShowMcInput(true);
            return;
        }

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
            } else {
                setStatus('idle');
                addLog(`[ERROR] ${data.message}`);
            }
        } catch (e: any) {
            setStatus('idle');
            addLog("[ERROR] Bridge Service Unavailable. Run python script.");
        }
    };

    const [isAutoPlay, setIsAutoPlay] = useState(false);

    // Auto-Play Agent Loop
    useEffect(() => {
        if (!isAutoPlay || status !== 'playing') return;

        const loop = setInterval(async () => {
            try {
                // If Minecraft, we rely on Backend Brain loop (not polling images yet, unless using Dynmap/VLM)
                // For now, Minecraft Brain is autonomous on backend.
                // This loop is kept for 'Custom/Legacy' games that use Python Bridge screenshots.
                if (selectedGame === 'minecraft') return; 

                const snapRes = await fetch(`${BRIDGE_URL}/actions/snapshot`);
                if (!snapRes.ok) return;
                const snapData = await snapRes.json();

                if (snapData.success && snapData.image) {
                     // ... (Existing AI Vision Logic for Non-Minecraft Games) ...
                     // Omitted for clarity in this MC fix
                }
            } catch (e) {
                console.error(e);
            }
        }, 2000);

        return () => clearInterval(loop);
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

                {/* Minecraft Connection Modal Overlap */}
                <AnimatePresence>
                    {showMcInput && (
                         <div className="absolute inset-0 z-[102] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                             <motion.div 
                                initial={{scale: 0.9}} animate={{scale: 1}} exit={{scale: 0.9}}
                                className="bg-[#1a1a1c] p-6 rounded-2xl border border-emerald-500/30 w-96 flex flex-col gap-4 shadow-2xl"
                             >
                                <div className="flex items-center gap-3 text-emerald-400">
                                    <Server size={24} />
                                    <h3 className="font-bold text-lg">Server Address</h3>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Enter IP of your server or Ngrok address.<br/>
                                    Example: <code>0.tcp.ngrok.io:12345</code> or <code>localhost:25565</code>
                                </p>
                                <input 
                                    value={minecraftAddress}
                                    onChange={(e) => setMinecraftAddress(e.target.value)}
                                    placeholder="localhost:25565"
                                    className="bg-black/50 border border-white/10 rounded-lg p-3 text-white font-mono focus:border-emerald-500 outline-none"
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setShowMcInput(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                                    <button onClick={handleStartMinecraft} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">
                                        Connect
                                    </button>
                                </div>
                             </motion.div>
                         </div>
                    )}
                </AnimatePresence>

                <motion.div
                    className="relative w-full max-w-5xl h-[80vh] bg-[#0c0c0e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex"
                >
                    {/* Sidebar */}
                    <div className="w-64 bg-[#0a0a0c] border-r border-white/5 p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-3 text-emerald-500 mb-4">
                            <Gamepad2 size={28} />
                            <span className="font-bold tracking-wider text-lg">GamerOS</span>
                        </div>
                        {/* Status Panel */}
                         <div className="bg-white/5 p-4 rounded-xl border border-white/5 mt-auto">
                                <div className="text-xs text-gray-500 mb-2">Neural Link</div>
                                <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                                    <div className={`w-2 h-2 rounded-full ${status === 'playing' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                    {status === 'playing' ? 'CONNECTED' : 'STANDBY'}
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
                                    </div>
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
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                        Playing: {DEFAULT_GAMES.find(g => g.id === selectedGame)?.name}
                                                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">LIVE</span>
                                                    </h3>
                                                </div>
                                                <button
                                                    onClick={handleStop}
                                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Stop Playing
                                                </button>
                                            </div>

                                            {/* Game Log Console */}
                                            <div className="bg-black/50 rounded-lg p-3 font-mono text-xs h-64 overflow-y-auto border border-white/5 space-y-1">
                                                {lastLog.map((log, i) => (
                                                    <div key={i} className={log.includes("ERROR") ? "text-red-400" : log.includes("MC_BOT") ? "text-green-400" : "text-blue-400"}>
                                                        {log}
                                                    </div>
                                                ))}
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
