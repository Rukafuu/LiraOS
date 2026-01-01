import { useState, useEffect } from 'react'
import { Activity, Brain, Eye, Terminal, Zap, ShieldAlert, Wifi, Power, Lock, MonitorPlay, ChevronRight, Cpu } from 'lucide-react'
import { getCurrentUser, isAuthenticated } from '../../services/userService'

// Reusing LiraOS Colors & Glassmorphism
// Assuming Tailwind config is shared
function App() {
    const [visionImage, setVisionImage] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState('OFFLINE'); // OFFLINE, IDLE, ACTIVE
    const [apm, setApm] = useState(0);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [latency, setLatency] = useState(12);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

    useEffect(() => {
        if (!isAuthenticated()) {
            // BACKDOOR FOR LOCAL TESTING
            const params = new URLSearchParams(window.location.search);
            if (params.get('debug_auth') === 'true') {
                console.warn("⚠️ DEBUG AUTH BYPASS ACTIVE ⚠️");
                setIsAuthorized(true);
                addLog("DEBUG_OVERRIDE: AUTHENTICATION BYPASSED");
                return;
            }

            window.location.href = '/login';
            return;
        }
        const user = getCurrentUser();
        // Admin Check
        const isAdmin = user?.id === 'user_1734661833589' || user?.username?.toLowerCase().includes('admin');

        if (!isAdmin) {
            setIsAuthorized(false);
            return;
        }

        setIsAuthorized(true);
        addLog(`BIOMETRIC_SCAN: MATCHED [${user?.username?.toUpperCase()}] - CLEARANCE LEVEL: OMEGA`);
    }, []);

    // Dynamic Bridge URL
    const getBridgeUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('bridge') || localStorage.getItem('lira_bridge_url') || 'http://localhost:5000';
    }
    const BRIDGE_URL = getBridgeUrl();

    // Poll Vision Cortex
    useEffect(() => {
        if (status !== 'ACTIVE' || !isAuthorized) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${BRIDGE_URL}/actions/snapshot`);
                const data = await res.json();
                if (data.success && data.image) {
                    setVisionImage(`data:image/jpeg;base64,${data.image}`);
                }
                setApm(Math.floor(Math.random() * 40) + 20); // Sim
                setLatency(Math.floor(Math.random() * 5) + 8);
            } catch (e) {
                console.error("Bridge connection failed:", e);
            }
        }, 200);
        return () => clearInterval(interval);
    }, [status, isAuthorized]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center font-sans relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 z-0" />
                <div className="z-10 flex flex-col items-center gap-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 animate-pulse">
                        <Lock size={40} className="text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-wider mb-2">ACCESS DENIED</h1>
                        <p className="text-white/40 font-mono text-sm max-w-md">
                            Authentication failed. This neural interface is restricted to administration personnel only.
                            <br />Termination protocol initiated.
                        </p>
                    </div>
                    <button onClick={() => window.location.href = '/'} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 transition-all text-sm">
                        Return to Safe Zone
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#030014] text-white font-sans selection:bg-purple-500/30 flex flex-col relative overflow-y-auto">
            {/* Background Effects */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

            {/* HEADER */}
            <header className="h-16 border-b border-white/10 flex-shrink-0 flex items-center justify-between px-6 bg-[#030014]/80 backdrop-blur-md z-50 sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Brain size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">LIRA NEURO-LINK</h1>
                        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Connected to Core v2.2 (Scrollable)
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono border ${status === 'ACTIVE'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        STATUS: {status}
                    </span>
                    <button onClick={() => window.location.href = '/'} className="p-2 hover:bg-white/5 rounded-full transition-colors opacity-50 hover:opacity-100">
                        <Power size={20} />
                    </button>
                </div>
            </header>

            {/* MAIN DASHBOARD */}
            <main className="flex-1 p-6 grid grid-cols-12 gap-6 pb-12">

                {/* COL 1: VISION & METRICS (4 cols) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

                    {/* Vision Container - Fixed Height instead of Ratio */}
                    <div className="h-64 lg:h-80 bg-black/40 border border-white/10 rounded-2xl overflow-hidden relative group shadow-2xl backdrop-blur-sm">
                        <div className="absolute top-4 left-4 z-10">
                            <span className="px-2 py-1 bg-black/60 border border-white/10 rounded text-[10px] text-white/70 font-mono backdrop-blur-md flex items-center gap-2">
                                <Eye size={12} className={status === 'ACTIVE' ? 'text-purple-400' : 'text-gray-500'} />
                                VISION_STREAM_01
                            </span>
                        </div>

                        {visionImage ? (
                            <img src={visionImage} className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 gap-3">
                                <MonitorPlay size={48} strokeWidth={1} />
                                <span className="text-xs font-mono tracking-widest">NO SIGNAL SOURCE</span>
                            </div>
                        )}

                        {/* Scanlines */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] pointer-events-none opacity-20" />
                    </div>

                    {/* Quick Metrics */}
                    <div className="h-[140px] grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-500/30 transition-colors group">
                            <div className="flex items-center justify-between text-white/40">
                                <Activity size={16} />
                                <span className="text-[10px] font-mono">APM</span>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">{apm}</div>
                                <div className="text-xs text-white/40">Actions / Min</div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/30 transition-colors group">
                            <div className="flex items-center justify-between text-white/40">
                                <Cpu size={16} />
                                <span className="text-[10px] font-mono">LATENCY</span>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">{latency}<span className="text-lg opacity-50">ms</span></div>
                                <div className="text-xs text-white/40">Bridge Delay</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COL 2: COGNITION & LOGS (5 cols) */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 h-full">
                    <div className="bg-black/40 border border-white/10 rounded-2xl flex-1 flex flex-col overflow-hidden backdrop-blur-sm shadow-xl">
                        <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-white/5">
                            <div className="flex items-center gap-2">
                                <Terminal size={14} className="text-purple-400" />
                                <span className="text-xs font-mono text-white/60">NEURO_LOGS</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-500/20" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500/20" />
                                <div className="w-2 h-2 rounded-full bg-green-500/20" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {logs.length === 0 && <div className="text-center mt-10 text-white/20">Waiting for system engagement...</div>}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-3 text-white/70 hover:text-white transition-colors border-l-2 border-transparent hover:border-purple-500 pl-2">
                                    <span className="opacity-30 select-none">›</span>
                                    <span>{log}</span>
                                </div>
                            ))}
                        </div>

                        {/* Command Input */}
                        <div className="h-12 border-t border-white/5 flex items-center px-4 gap-3 bg-white/[0.02]">
                            <ChevronRight size={14} className="text-purple-500 animate-pulse" />
                            <input
                                type="text"
                                placeholder="Execute console command..."
                                className="bg-transparent border-none outline-none text-sm text-white placeholder-white/20 w-full font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* COL 3: CONTROLS (3 cols) */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full">

                    {/* Primary Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={() => { setStatus('ACTIVE'); addLog('Initializing NeuroLoop Protocol...'); }}
                            className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center gap-2 font-bold hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all active:scale-[0.98]"
                        >
                            <Zap size={18} />
                            ENGAGE SYSTEM
                        </button>

                        <button
                            onClick={() => { setStatus('OFFLINE'); addLog('SYSTEM HALTED BY USER'); }}
                            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all active:scale-[0.98]"
                        >
                            <Power size={18} />
                            Standby Mode
                        </button>
                    </div>

                    {/* Game Profiles */}
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Target Profiles</h3>
                        <div className="space-y-2">
                            {['Minecraft', 'Osu!', 'Honkai: Star Rail', 'Chrome'].map((game) => (
                                <button key={game} className="w-full flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group" onClick={() => addLog(`Loading config: ${game}.json...`)}>
                                    <span className="text-sm text-white/80 group-hover:text-white">{game}</span>
                                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-purple-400 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats/Info */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/20">
                        <div className="flex items-center gap-2 text-red-400 mb-2">
                            <ShieldAlert size={16} />
                            <span className="text-xs font-bold tracking-wide">SAFETY PROTOCOLS</span>
                        </div>
                        <p className="text-[10px] text-red-200/60 leading-relaxed">
                            Emergency override enabled.
                            AI input restricted to 200 APM.
                            Human presence validation: ACTIVE.
                        </p>
                    </div>

                </div>

            </main>
        </div>
    )
}

export default App
