
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Battery, Cpu, Database, Zap } from 'lucide-react';
import { getAuthHeaders } from '../services/userService';

const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

interface SystemStats {
    cpu_load: string;
    ram_usage: string;
    battery: string;
    uptime: string;
    platform: string;
}

export const SystemStatus: React.FC = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/system/stats`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) { }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000);

        // Fetch local battery if available
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((batt: any) => {
                setBatteryLevel(Math.floor(batt.level * 100));
                batt.addEventListener('levelchange', () => {
                    setBatteryLevel(Math.floor(batt.level * 100));
                });
            });
        }

        return () => clearInterval(interval);
    }, []);

    if (!stats) return null;

    const parsePercent = (val?: string) => val ? parseFloat(val.replace('%', '')) || 0 : 0;
    const cpuVal = parsePercent(stats.cpu_load);
    
    const ramParts = (stats.ram_usage || '0 / 1').split('/');
    const ramUsed = parseFloat(ramParts[0]) || 0;
    const ramTotal = parseFloat((ramParts[1] || '1').split(' ')[0]) || 1;
    const ramPercent = (ramUsed / ramTotal) * 100;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-2 mb-4 p-3 bg-[#0d0d0d]/80 border border-white/5 rounded-2xl shadow-lg ring-1 ring-white/10"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-lira-pink animate-pulse shadow-[0_0_8px_rgba(255,107,157,0.5)]" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">CORE TELEMETRY</span>
                </div>
                <span className="text-[9px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-widest">{stats.platform || 'SYSTEM'}</span>
            </div>

            <div className="space-y-3">
                {/* CPU */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-gray-500 flex items-center gap-1.5"><Cpu size={10} className="text-blue-400" /> CPU LOAD</span>
                        <span className="text-blue-300 font-bold">{stats.cpu_load}</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
                            animate={{ width: `${Math.min(cpuVal, 100)}%` }}
                        />
                    </div>
                </div>

                {/* RAM */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-gray-500 flex items-center gap-1.5"><Database size={10} className="text-purple-400" /> RAM USAGE</span>
                        <span className="text-purple-300 font-bold">{ramUsed.toFixed(1)}GB</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-400"
                            animate={{ width: `${Math.min(ramPercent, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Battery/Power (Prefer real battery from browser if available) */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-gray-500 flex items-center gap-1.5"><Battery size={10} className="text-emerald-400" /> SYSTEM PWR</span>
                        <span className="text-emerald-300 font-bold">{batteryLevel !== null ? `${batteryLevel}%` : (stats.battery || 'AC')}</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                        <motion.div 
                            className={`h-full bg-gradient-to-r ${ (batteryLevel || 100) < 20 ? 'from-red-600 to-orange-400' : 'from-emerald-600 to-green-400' }`}
                            animate={{ width: `${batteryLevel !== null ? batteryLevel : 100}%` }}
                        />
                    </div>
                </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-[8px] text-gray-600 font-mono tracking-tighter">UPTIME: {stats.uptime}</span>
                <span className="text-[8px] text-emerald-500/50 font-bold animate-pulse">● LIVE_SYNC</span>
            </div>
        </motion.div>
    );
};
