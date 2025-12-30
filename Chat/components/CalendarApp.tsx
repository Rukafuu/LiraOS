import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, RefreshCw, ChevronLeft, ChevronRight, Trash2, Save } from 'lucide-react';
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
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({ summary: '', description: '', start: '', end: '' });

    const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/google-calendar/events`, {
                headers: getAuthHeaders()
            });
            
            if (res.status === 400) {
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

    // Calendar Logic
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const getEventsForDay = (day: number) => {
        return events.filter(e => {
            const eventDate = new Date(e.start.dateTime || e.start.date || '');
            return eventDate.getDate() === day && 
                   eventDate.getMonth() === currentDate.getMonth() && 
                   eventDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const handleDayClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date);
        setIsCreating(true);
        setSelectedEvent(null);
        
        // Default form data
        const dateStr = date.toISOString().split('T')[0];
        setFormData({
            summary: '',
            description: '',
            start: `${dateStr}T09:00`,
            end: `${dateStr}T10:00`
        });
    };

    const handleEventClick = (e: React.MouseEvent, evt: CalendarEvent) => {
        e.stopPropagation();
        setSelectedEvent(evt);
        setIsCreating(false);
        
        const start = evt.start.dateTime ? evt.start.dateTime.substring(0, 16) : `${evt.start.date}T00:00`;
        const end = evt.end.dateTime ? evt.end.dateTime.substring(0,16) : `${evt.end.date}T23:59`;

        setFormData({
            summary: evt.summary,
            description: evt.description || '',
            start,
            end
        });
    };

    const handleSave = async () => {
        try {
            const url = isCreating 
                ? `${API_BASE_URL}/api/auth/google-calendar/events`
                : `${API_BASE_URL}/api/auth/google-calendar/events/${selectedEvent?.id}`;
            
            const method = isCreating ? 'POST' : 'PUT';
            
            // Format dates simply for now
            const payload = {
                summary: formData.summary,
                description: formData.description,
                start: new Date(formData.start).toISOString(),
                end: new Date(formData.end).toISOString()
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save');
            
            await fetchEvents();
            setSelectedEvent(null);
            setIsCreating(false);
        } catch (e) {
            alert('Erro ao salvar evento');
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent) return;
        if (!confirm('Deletar este evento?')) return;

        try {
            await fetch(`${API_BASE_URL}/api/auth/google-calendar/events/${selectedEvent.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            await fetchEvents();
            setSelectedEvent(null);
        } catch (e) {
            alert('Erro ao deletar');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto" onClick={onClose} />
            
            <motion.div 
                className="relative z-10 pointer-events-auto bg-[#0a0a0f] w-full max-w-5xl h-[700px] rounded-2xl border border-white/10 shadow-2xl flex overflow-hidden flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()}
            >
                {/* LEFT: Calendar Grid */}
                <div className="flex-1 flex flex-col border-r border-white/5 bg-[#0a0a0f]">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-white capitalize">
                                {monthNames[currentDate.getMonth()]} <span className="text-gray-500">{currentDate.getFullYear()}</span>
                            </h2>
                            <div className="flex items-center bg-white/5 rounded-lg p-0.5">
                                <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded-md text-gray-400"><ChevronLeft size={16}/></button>
                                <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded-md text-gray-400"><ChevronRight size={16}/></button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={fetchEvents} className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><RefreshCw size={18} className={loading?"animate-spin":""}/></button>
                             <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-gray-400"><X size={18}/></button>
                        </div>
                    </div>

                    {/* Week Days */}
                    <div className="grid grid-cols-7 border-b border-white/5">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                            <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="flex-1 grid grid-cols-7 grid-rows-6">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="border-b border-r border-white/5 bg-white/[0.01]" />
                        ))}
                        
                        {Array.from({ length: days }).map((_, i) => {
                            const day = i + 1;
                            const dayEvents = getEventsForDay(day);
                            const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                            
                            return (
                                <div 
                                    key={day} 
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        border-b border-r border-white/5 p-2 transition-colors relative group
                                        cursor-pointer hover:bg-white/5
                                        ${selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth() ? 'bg-blue-500/10' : ''}
                                    `}
                                >
                                    <div className={`
                                        w-6 h-6 flex items-center justify-center rounded-full text-xs mb-1
                                        ${isToday ? 'bg-blue-500 text-white font-bold' : 'text-gray-400 group-hover:text-white'}
                                    `}>
                                        {day}
                                    </div>
                                    
                                    <div className="space-y-1 overflow-hidden max-h-[70px]">
                                        {dayEvents.map(evt => (
                                            <div 
                                                key={evt.id} 
                                                onClick={(e) => handleEventClick(e, evt)}
                                                className="text-[10px] truncate px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/20 hover:bg-blue-500/40 hover:border-blue-500/50 transition-colors cursor-pointer"
                                            >
                                                {evt.summary}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: Editor / Details Panel */}
                <div className="w-[350px] bg-[#0f0f15] border-l border-white/5 p-6 flex flex-col">
                    {error && error.includes('Not connected') ? (
                         <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <CalendarIcon size={48} className="text-gray-600 mb-4"/>
                            <h3 className="text-white font-medium mb-2">Login Necessário</h3>
                            <p className="text-sm text-gray-400 mb-4">Conecte seu Google Calendar para visualizar e criar eventos.</p>
                             <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors">
                                Ir para Configurações
                            </button>
                         </div>
                    ) : selectedEvent || isCreating ? (
                        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white">
                                    {isCreating ? 'Novo Evento' : 'Editar Evento'}
                                </h3>
                                {!isCreating && (
                                    <button 
                                        onClick={handleDelete}
                                        className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4 flex-1">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Título</label>
                                    <input 
                                        type="text" 
                                        value={formData.summary}
                                        onChange={e => setFormData({...formData, summary: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder-gray-600"
                                        placeholder="Jantar..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Início</label>
                                        <input 
                                            type="datetime-local" 
                                            value={formData.start}
                                            onChange={e => setFormData({...formData, start: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Fim</label>
                                        <input 
                                            type="datetime-local" 
                                            value={formData.end}
                                            onChange={e => setFormData({...formData, end: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Descrição</label>
                                    <textarea 
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all min-h-[100px] resize-none"
                                        placeholder="Adicionar detalhes..."
                                    />
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5 flex gap-3">
                                <button 
                                    onClick={() => { setSelectedEvent(null); setIsCreating(false); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all font-medium text-sm flex items-center justify-center gap-2"
                                >
                                    <Save size={16} />
                                    Salvar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                            <Clock size={48} className="text-gray-600 mb-4"/>
                            <p className="text-sm text-gray-400 max-w-[200px]">Selecione um dia para criar ou um evento para editar.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};
