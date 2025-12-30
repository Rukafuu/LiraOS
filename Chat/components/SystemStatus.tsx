
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
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/system/stats`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                if (!data.error) setStats(data);
            }
        } catch (e) {
            // Silently fail if offline or PC Controller not available
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    if (!stats) return null;

    const parsePercent = (str: string) => parseFloat(str?.replace('%', '') || '0');
    // RAM is "Used/Total MB", roughly parse percentage?
    // Backend sends "3000 MB" only for used ram?
    // Wait, backend logic: CPU:$cpu|RAM:$usedRam/$totalRam|BATT:$batt
    // pcController returns { ram_usage: "3.5 MB" } ? No, split(':')[1].
    // Let's re-check backend output logic logic.
    // In backend: `ram_usage: ${ramStr.split(':')[1]} MB` -> ramStr was "RAM:Used/Total"
    // So split(':')[1] is "Used/Total". e.g. "4000/16000".
    
    // Let's refine parsing robustly in Frontend
    const ramParts = stats.ram_usage.replace(' MB', '').split('/');
    const usedRam = parseFloat(ramParts[0] || '0');
    const totalRam = parseFloat(ramParts[1] || '1');
    const ramPercent = (usedRam / totalRam) * 100;

    const cpuPercent = parsePercent(stats.cpu_load);
    const battPercent = parsePercent(stats.battery);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-3 mb-2 p-3 bg-white/5 border border-white/5 rounded-xl backdrop-blur-sm"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Zap size={12} className="text-lira-pink" />
                    Lira Core
                </span>
                <span className="text-[10px] text-gray-600 font-mono">{stats.uptime}</span>
            </div>

            <div className="space-y-2">
                {/* CPU */}
                <div className="group">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                        <span className="flex items-center gap-1"><Cpu size={10}/> CPU</span>
                        <span className="group-hover:text-white transition-colors">{stats.cpu_load}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-blue-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(cpuPercent, 100)}%` }}
                            transition={{ type: "spring", stiffness: 50 }}
                        />
                    </div>
                </div>

                {/* RAM */}
                <div className="group">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                        <span className="flex items-center gap-1"><Database size={10}/> RAM</span>
                        <span className="group-hover:text-white transition-colors">{usedRam.toFixed(1)} GB</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(ramPercent, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Battery (only if not AC/Desktop) */}
                {stats.battery !== 'AC/Desktop' && (
                    <div className="group">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                            <span className="flex items-center gap-1"><Battery size={10}/> PWR</span>
                            <span className="group-hover:text-white transition-colors">{stats.battery}%</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                                className={`h-full rounded-full ${battPercent < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(battPercent, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
