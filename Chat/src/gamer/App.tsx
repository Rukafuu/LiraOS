import { useState, useEffect } from 'react'
import { Activity, Brain, Eye, Terminal, Zap, ShieldAlert, Wifi, Power, Lock } from 'lucide-react'
import { getCurrentUser, isAuthenticated } from '../../services/userService'

function App() {
    const [visionImage, setVisionImage] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState('OFFLINE'); // OFFLINE, IDLE, ACTIVE
    const [apm, setApm] = useState(0);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));

    useEffect(() => {
        // 🛡️ SECURITY GATE
        if (!isAuthenticated()) {
            window.location.href = '/login';
            return;
        }

        const user = getCurrentUser();

        // Admin Check (Hardcoded Super User or "admin" in name)
        const isAdmin = user?.id === 'user_1734661833589' || user?.username?.toLowerCase().includes('admin');

        if (!isAdmin) {
            setIsAuthorized(false); // Explicitly deny
            return;
        }

        setIsAuthorized(true);
        addLog(`AUTH_VERIFIED: ${user?.username?.toUpperCase() || 'UNKNOWN'} (ADMIN_CLEARANCE)`);
    }, []);

    // Poll Vision Cortex
    useEffect(() => {
        if (status !== 'ACTIVE' || !isAuthorized) return;

        const interval = setInterval(async () => {
            try {
                // Fetch Vision from Python Bridge (Port 5000)
                const res = await fetch('http://localhost:5000/actions/snapshot');
                const data = await res.json();
                if (data.success && data.image) {
                    setVisionImage(`data:image/jpeg;base64,${data.image}`);
                }
                // Fake APM for now
                setApm(Math.floor(Math.random() * 60) + 10);
            } catch (e) {
                // Silent fail
            }
        }, 200);

        return () => clearInterval(interval);
    }, [status, isAuthorized]);

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-mono flex-col gap-4">
                <Lock size={64} className="animate-pulse" />
                <h1 className="text-2xl font-bold tracking-widest">ACCESS DENIED</h1>
                <p className="opacity-50 text-sm">SECURITY CLEARANCE REQUIRED</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-green-500 font-mono p-4 flex gap-4 crt-effect selection:bg-green-500 selection:text-black">

            {/* LEFT COLUMN: VISION & SENSORS */}
            <div className="w-1/3 flex flex-col gap-4">
                {/* VISION CORTEX */}
                <div className="flex-1 bg-black border border-green-500/30 rounded-sm p-1 relative overflow-hidden group">
                    <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/80 px-2 py-1 border border-green-500/50 text-xs z-10">
                        <Eye size={14} className="animate-pulse" />
                        <span>VISUAL_CORTEX_STREAM_V1</span>
                    </div>

                    <div className="w-full h-full bg-green-900/10 flex items-center justify-center relative">
                        {visionImage ? (
                            <img src={visionImage} className="w-full h-full object-contain opacity-80" />
                        ) : (
                            <div className="text-center text-green-500/30 text-sm">
                                <Wifi size={48} className="mx-auto mb-2 opacity-20" />
                                NO_SIGNAL_DETECTED
                            </div>
                        )}

                        {/* Grid Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                    </div>
                </div>

                {/* METRICS */}
                <div className="h-48 grid grid-cols-2 gap-4">
                    <div className="bg-black border border-green-500/30 p-4 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-xs opacity-70">
                            <Activity size={14} />
                            <span>ACTIONS_PER_MIN</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{apm}</div>
                        <div className="w-full bg-green-900/30 h-1 mt-2">
                            <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${apm}%` }} />
                        </div>
                    </div>

                    <div className="bg-black border border-green-500/30 p-4 flex flex-col justify-between">
                        <div className="flex items-center gap-2 text-xs opacity-70">
                            <Zap size={14} />
                            <span>SYSTEM_LATENCY</span>
                        </div>
                        <div className="text-4xl font-bold text-white">12<span className="text-sm font-normal text-green-500/50">ms</span></div>
                        <div className="text-xs text-green-500/50">Stable connection</div>
                    </div>
                </div>
            </div>

            {/* MIDDLE COLUMN: COGNITION LOGS */}
            <div className="flex-1 bg-black border border-green-500/30 flex flex-col">
                <div className="h-12 border-b border-green-500/30 flex items-center px-4 bg-green-500/5 justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                        <Brain size={16} />
                        <span>NEURO_LOOP_PROCESSOR</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs">{status}</span>
                    </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1">
                    {logs.length === 0 && <div className="text-green-500/30 italic">Waiting for neural activity...</div>}
                    {logs.map((log, i) => (
                        <div key={i} className="border-l-2 border-green-500/20 pl-2 hover:bg-green-500/5 transition-colors cursor-default">
                            {log}
                        </div>
                    ))}
                </div>

                <div className="h-10 border-t border-green-500/30 flex items-center px-2 bg-black">
                    <Terminal size={14} className="mr-2 opacity-50" />
                    <input type="text" placeholder="inject_override_command..." className="bg-transparent border-none outline-none text-green-500 placeholder-green-500/30 w-full text-xs" />
                </div>
            </div>

            {/* RIGHT COLUMN: CONTROLS */}
            <div className="w-64 bg-black border border-green-500/30 flex flex-col gap-2 p-2">
                <button
                    onClick={() => { setStatus('ACTIVE'); addLog('Starting NeuroLoop...'); }}
                    className="h-16 border border-green-500/50 bg-green-500/10 hover:bg-green-500/20 text-white font-bold flex items-center justify-center gap-2 transition-all uppercase"
                >
                    <Power size={18} />
                    Engage System
                </button>

                <button
                    onClick={() => { setStatus('OFFLINE'); addLog('EMERGENCY STOP TRIGGERED'); }}
                    className="h-16 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold flex items-center justify-center gap-2 transition-all uppercase mt-auto"
                >
                    <ShieldAlert size={18} />
                    KILL SWITCH
                </button>

                <div className="mt-4 border-t border-green-500/30 pt-4">
                    <h3 className="text-xs font-bold mb-2 opacity-70">GAME PROFILE</h3>
                    <div className="space-y-1">
                        {['MINECRAFT', 'OSU!', 'HONKAI', 'NOTEPAD'].map(game => (
                            <button key={game} className="w-full text-left px-3 py-2 text-xs border border-green-500/10 hover:border-green-500/50 hover:bg-green-500/5 transition-colors" onClick={() => addLog(`Loading profile: ${game}...`)}>
                                {game}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    )
}

export default App
