import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Eye, HardDrive, Terminal, Zap, Shield, Wifi } from 'lucide-react';
import { useWakeWord } from '../hooks/useWakeWord';

// Mock types for now - integration comes next
interface SystemStats {
    cpu: number;
    ram: number;
    temp: number;
}

export const JarvisDashboard: React.FC = () => {
    const [visionImage, setVisionImage] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [stats, setStats] = useState<SystemStats>({ cpu: 12, ram: 45, temp: 55 });
    
    // Simulate live data flow
    useEffect(() => {
        const i = setInterval(() => {
            setStats(prev => ({
                cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() * 10 - 5))),
                ram: Math.min(100, Math.max(0, prev.ram + (Math.random() * 5 - 2.5))),
                temp: prev.temp
            }));
            
            if (Math.random() > 0.8) {
                addLog(`SYSTEM UPDATE: Process ID ${Math.floor(Math.random() * 9999)} analyzed.`);
            }
        }, 1000);
        return () => clearInterval(i);
    }, []);

    const addLog = (text: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev].slice(0, 15));
    };

    return (
        <div className="min-h-screen bg-black text-cyan-500 font-mono p-6 overflow-hidden relative">
            {/* Grid Background */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Header */}
            <header className="flex justify-between items-center mb-8 relative z-10 border-b border-cyan-500/30 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border-2 border-cyan-500 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-8 h-8 bg-cyan-500 rounded-full blur-md" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-widest text-white">LIRA<span className="text-cyan-500">OS</span></h1>
                        <div className="text-xs text-cyan-400/70 tracking-[0.3em]">SYSTEM INTEGRITY: 100%</div>
                    </div>
                </div>
                <div className="flex gap-8 text-sm">
                    <div className="flex items-center gap-2"><Wifi size={16} /> ONLINE</div>
                    <div className="flex items-center gap-2"><Shield size={16} /> SECURE</div>
                    <div className="flex items-center gap-2 text-purple-400"><Zap size={16} /> BRAIN: ACTIVE</div>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-12 gap-6 relative z-10 h-[80vh]">
                
                {/* Left Column: Vision & Sensors */}
                <div className="col-span-3 flex flex-col gap-6">
                    {/* Vision Feed */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="flex-1 border border-cyan-500/30 bg-black/50 p-4 rounded-xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-2 text-xs bg-cyan-500/10 border-bl border-cyan-500/30">VISUAL CORTEX</div>
                        <div className="h-full flex items-center justify-center border border-dashed border-cyan-500/20 rounded-lg bg-black">
                            {visionImage ? (
                                <img src={visionImage} alt="Vision" className="w-full h-full object-cover opacity-80" />
                            ) : (
                                <div className="text-center space-y-2">
                                    <Eye size={48} className="mx-auto animate-pulse text-cyan-800" />
                                    <div className="text-xs text-cyan-700">WAITING FOR INPUT...</div>
                                </div>
                            )}
                        </div>
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-4 animate-scanline pointer-events-none" />
                    </motion.div>

                    {/* Quick Actions */}
                    <div className="h-1/3 border border-cyan-500/30 bg-black/50 p-4 rounded-xl">
                         <div className="text-xs mb-2 flex items-center gap-2"><Terminal size={12} /> QUICK COMMANDS</div>
                         <div className="grid grid-cols-2 gap-2">
                             <button className="bg-cyan-900/30 hover:bg-cyan-500/20 border border-cyan-500/30 p-2 rounded text-xs transition-colors">CLEAN RAM</button>
                             <button className="bg-cyan-900/30 hover:bg-cyan-500/20 border border-cyan-500/30 p-2 rounded text-xs transition-colors">FLUSH DNS</button>
                             <button className="bg-cyan-900/30 hover:bg-cyan-500/20 border border-cyan-500/30 p-2 rounded text-xs transition-colors">SCAN DISK</button>
                             <button className="bg-red-900/30 hover:bg-red-500/20 border border-red-500/30 p-2 rounded text-xs text-red-400 transition-colors">LOCKDOWN</button>
                         </div>
                    </div>
                </div>

                {/* Center Column: Brain & Logs */}
                <div className="col-span-6 flex flex-col gap-6">
                    <div className="flex-1 border border-cyan-500/30 bg-black/50 p-6 rounded-xl flex flex-col relative">
                         <div className="absolute top-0 left-0 p-2 text-xs bg-cyan-500/10 border-br border-cyan-500/30">NEURAL LINK</div>
                         
                         {/* Central Hologram (Placeholder) */}
                         <div className="flex-1 flex items-center justify-center relative">
                             <div className="w-64 h-64 border rounded-full border-cyan-500/20 animate-spin-slow flex items-center justify-center">
                                 <div className="w-48 h-48 border rounded-full border-purple-500/30 animate-spin-reverse flex items-center justify-center">
                                      <div className="w-32 h-32 bg-cyan-500/5 rounded-full blur-xl animate-pulse" />
                                 </div>
                             </div>
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">LIRA V2</h2>
                             </div>
                         </div>

                         {/* Console Log */}
                         <div className="h-48 border-t border-cyan-500/20 pt-4 font-mono text-xs overflow-hidden">
                             {logs.map((log, i) => (
                                 <motion.div key={i} initial={{opacity:0, x: -10}} animate={{opacity: 1, x: 0}} className="mb-1 text-cyan-300/80 hover:text-cyan-100 transition-colors">
                                     <span className="opacity-50 mr-2">{'>'}</span>{log}
                                 </motion.div>
                             ))}
                         </div>
                    </div>
                </div>

                {/* Right Column: Vitals */}
                <div className="col-span-3 flex flex-col gap-6">
                    <StatCard title="CPU LOAD" value={stats.cpu} icon={<Cpu size={20} />} color="cyan" />
                    <StatCard title="MEMORY USAGE" value={stats.ram} icon={<Activity size={20} />} color="purple" />
                    <StatCard title="CORE TEMP" value={stats.temp} icon={<HardDrive size={20} />} unit="°C" color="orange" />
                    
                    <div className="flex-1 border border-cyan-500/30 bg-black/50 p-4 rounded-xl relative">
                        <div className="absolute top-0 right-0 p-2 text-xs bg-cyan-500/10 border-bl border-cyan-500/30">MODULES</div>
                        <ul className="mt-4 space-y-2 text-xs">
                            <ModuleItem name="Lira Link" status="CONNECTED" />
                            <ModuleItem name="Vision System" status="ACTIVE" />
                            <ModuleItem name="Proactive Brain" status="STANDBY" />
                            <ModuleItem name="File Cleaner" status="READY" />
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, unit = '%', color }: any) => {
    const isHigh = value > 80;
    return (
        <div className={`border bg-black/50 p-4 rounded-xl relative overflow-hidden transition-all ${isHigh ? 'border-red-500/50 shadow-[0_0_15px_rgba(255,0,0,0.2)]' : `border-${color}-500/30`}`}>
            <div className="flex justify-between items-start mb-2">
                <span className={`text-${color}-500 text-xs font-bold tracking-wider`}>{title}</span>
                <span className={`text-${color}-400`}>{icon}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
                {Math.round(value)}{unit}
            </div>
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${value}%` }} 
                    className={`h-full ${isHigh ? 'bg-red-500' : `bg-${color}-500`}`}
                />
            </div>
        </div>
    );
};

const ModuleItem = ({ name, status }: any) => (
    <li className="flex justify-between items-center border-b border-white/5 pb-2">
        <span className="text-gray-400">{name}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded ${status === 'CONNECTED' || status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {status}
        </span>
    </li>
);
