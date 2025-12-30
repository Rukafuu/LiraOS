import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, MapPin, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAuthHeaders } from '../services/userService';

interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
}

interface CalendarAppProps {
    onClose: () => void;
}

export const CalendarApp: React.FC<CalendarAppProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/google-calendar/events`, {
                headers: getAuthHeaders()
            });
            
            if (res.status === 400) {
                 // Not connected logic
                 setError('Not connected to Google Calendar. Please connect in Settings.');
                 setLoading(false);
                 return;
            }

            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            setEvents(data);
        } catch (e) {
            setError('Failed to load events.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const formatDate = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (isoString?: string) => {
        if (!isoString) return 'All Day';
        const date = new Date(isoString);
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
            
            <motion.div 
                className="relative z-10 pointer-events-auto bg-[#0a0a0f] w-full max-w-2xl h-[600px] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#121218]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <CalendarIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Calendar</h2>
                            <p className="text-xs text-gray-400">Google Calendar Events</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={fetchEvents}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                             <RefreshCw size={32} className="animate-spin text-lira-primary/50" />
                             <p>Syncing timelines...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                            <div className="p-4 bg-red-500/10 rounded-full text-red-400">
                                <CalendarIcon size={32} />
                            </div>
                            <p>{error}</p>
                            {error.includes('Not connected') && (
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
                                    Open Settings to Connect
                                </button>
                            )}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <p>No upcoming events found.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {events.map((evt) => (
                                <motion.div 
                                    key={evt.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all cursor-default"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">{evt.summary}</h3>
                                            
                                            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={12} />
                                                    {evt.start.date ? (
                                                        <span>All Day · {formatDate(evt.start.date)}</span>
                                                    ) : (
                                                        <span>{formatDate(evt.start.dateTime)} · {formatTime(evt.start.dateTime)} - {formatTime(evt.end.dateTime)}</span>
                                                    )}
                                                </div>
                                                {evt.location && (
                                                    <div className="flex items-center gap-1.5 text-gray-500">
                                                        <MapPin size={12} />
                                                        <span className="max-w-[200px] truncate">{evt.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
