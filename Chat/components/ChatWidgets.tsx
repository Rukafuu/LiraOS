import React from 'react';
import { CheckSquare, X, Check, Activity, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Types ---
export type WidgetType = 'todo' | 'confirm' | 'status' | 'calendar';

export interface WidgetData {
  type: WidgetType;
  title?: string;
  items?: string[];
  message?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  date?: string;
}

interface WidgetRendererProps {
  type: string;
  data: any;
}

// --- Specific Widgets ---

const TodoWidget: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
  const [checked, setChecked] = React.useState<boolean[]>(new Array(items.length).fill(false));

  const toggle = (idx: number) => {
    const next = [...checked];
    next[idx] = !next[idx];
    setChecked(next);
  };

  return (
    <div className="bg-[#18181b] border border-white/10 rounded-xl overflow-hidden my-4 max-w-sm w-full shadow-lg">
      <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <CheckSquare size={16} className="text-lira-pink" />
        <span className="font-semibold text-sm text-gray-200">{title}</span>
      </div>
      <div className="p-2">
         {items.map((item, idx) => (
            <div 
                key={idx} 
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group"
                onClick={() => toggle(idx)}
            >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked[idx] ? 'bg-lira-pink border-lira-pink text-white' : 'border-white/20 group-hover:border-white/40'}`}>
                    {checked[idx] && <Check size={12} />}
                </div>
                <span className={`text-sm ${checked[idx] ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item}</span>
            </div>
         ))}
      </div>
    </div>
  );
};

const ConfirmationWidget: React.FC<{ message: string; onConfirm?: () => void }> = ({ message }) => {
    const [status, setStatus] = React.useState<'pending' | 'confirmed' | 'cancelled'>('pending');

    return (
        <div className="bg-[#18181b] border border-white/10 rounded-xl p-4 my-4 max-w-xs shadow-lg">
            <h4 className="text-sm font-medium text-gray-200 mb-4">{message}</h4>
            
            {status === 'pending' ? (
                <div className="flex gap-2">
                    <button 
                        onClick={() => setStatus('confirmed')}
                        className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 py-2 rounded-lg text-xs font-semibold transition-all"
                    >
                        Confirmar
                    </button>
                    <button 
                        onClick={() => setStatus('cancelled')}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-2 rounded-lg text-xs font-semibold transition-all"
                    >
                        Cancelar
                    </button>
                </div>
            ) : (
                <div className={`text-xs font-bold text-center py-2 rounded-lg ${status === 'confirmed' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {status === 'confirmed' ? 'CONFIRMADO' : 'CANCELADO'}
                </div>
            )}
        </div>
    );
};

const StatusWidget: React.FC<{ title: string; status: string; details?: string }> = ({ title, status, details }) => {
    const color = status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-blue-400';
    return (
        <div className="bg-[#18181b] border border-white/10 rounded-xl p-3 my-4 inline-flex items-center gap-4 shadow-lg min-w-[200px]">
            <div className={`p-2 rounded-full bg-white/5 ${color}`}>
                <Activity size={20} />
            </div>
            <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{title}</div>
                <div className="text-sm font-medium text-white">{details || status}</div>
            </div>
        </div>
    );
}

// --- Main Renderer ---

export const ChatWidgetRenderer: React.FC<WidgetRendererProps> = ({ type, data }) => {
  // Safe parsing if data is string
  const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

  switch (type) {
    case 'todo':
      return <TodoWidget title={parsedData.title || 'Tasks'} items={parsedData.items || []} />;
    case 'confirm':
      return <ConfirmationWidget message={parsedData.message || 'Are you sure?'} />;
    case 'status':
      return <StatusWidget title={parsedData.title} status={parsedData.status} details={parsedData.details} />;
    default:
      return (
        <div className="p-2 border border-red-500/50 bg-red-500/10 text-red-400 rounded text-xs">
          Unknown Widget: {type}
        </div>
      );
  }
};
