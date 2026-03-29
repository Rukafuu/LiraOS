import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Database, BatteryCharging, WifiHigh, Pulse } from '@phosphor-icons/react';
import { getAuthHeaders } from '../services/userService';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

interface SystemStats {
    cpu_load: string;
    ram_usage: string;
    battery: string;
    uptime: string;
    platform: string;
}

export const CompactSystemStats: React.FC = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const [ping, setPing] = useState<number>(0);
    const { t } = useTranslation();

    const fetchStats = async () => {
        const start = Date.now();
        try {
            const res = await fetch(`${API_BASE_URL}/api/system/stats`, {
                headers: getAuthHeaders()
            });
            setPing(Date.now() - start);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) { 
            setPing(0);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // 10s for compact mode

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

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md"
        >
            <div className="flex items-center gap-1.5" title={t('telemetry.cpu_title') || "CPU Load"}>
                <Cpu size={14} className="text-blue-400" />
                <span className="text-[10px] font-mono font-bold text-blue-200">{stats.cpu_load}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5" title={t('telemetry.ram_title') || "RAM Usage"}>
                <Database size={14} className="text-purple-400" />
                <span className="text-[10px] font-mono font-bold text-purple-200">{(stats.ram_usage || '').split(' / ')[0]}</span>
            </div>

            <div className="flex items-center gap-1.5" title={t('telemetry.ping_title') || "Network Ping"}>
                <Pulse size={14} className={ping < 150 ? 'text-green-400' : ping < 300 ? 'text-yellow-400' : 'text-red-400'} />
                <span className="text-[10px] font-mono font-bold text-white/70">{ping}ms</span>
            </div>

            {batteryLevel !== null && (
                <div className="hidden md:flex items-center gap-1.5" title={t('telemetry.battery_title') || "Battery Level"}>
                    <BatteryCharging size={14} className={batteryLevel > 20 ? 'text-emerald-400' : 'text-red-400'} />
                    <span className="text-[10px] font-mono font-bold text-emerald-200">{batteryLevel}%</span>
                </div>
            )}
        </motion.div>
    );
};
