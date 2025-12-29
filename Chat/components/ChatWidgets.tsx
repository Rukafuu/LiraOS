import React from 'react';
import { CheckSquare, X, Check, Activity, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProgressiveImage } from './ProgressiveImage';
import { getAuthHeaders } from '../services/userService';
const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

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

const GeneratingImageWidget: React.FC<{ prompt: string }> = ({ prompt }) => {
  return (
    <div className="bg-[#18181b] border border-white/10 rounded-xl overflow-hidden my-4 max-w-md w-full shadow-lg p-4">
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
           <div className="absolute inset-0 bg-white/20 animate-pulse rounded-lg"></div>
           <Activity className="text-white animate-spin-slow" size={24} />
        </div>
        <div className="flex-1 min-w-0">
           <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-1 uppercase tracking-widest">
             Criando Imagem
           </div>
           <div className="text-sm text-gray-300 truncate italic">"{prompt}"</div>
        </div>
      </div>
      <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
         <motion.div 
           className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
           initial={{ x: '-100%' }}
           animate={{ x: '100%' }}
           transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
         />
      </div>
    </div>
  );
};

const SmartProgressiveWidget: React.FC<{ jobId: string; prompt: string }> = ({ jobId, prompt }) => {
  const [status, setStatus] = React.useState<'idle' | 'generating' | 'ready' | 'error'>('generating');
  const [finalSrc, setFinalSrc] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    let isMounted = true;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/images/${jobId}`, {
           headers: getAuthHeaders()
        });
        if (res.ok) {
           const job = await res.json();
           if (isMounted) {
               if (job.status === 'completed') {
                   setFinalSrc(job.result);
                   setStatus('ready');
                   clearInterval(interval);
               } else if (job.status === 'failed') {
                   setStatus('error');
                   clearInterval(interval);
               }
           }
        } else {
            if (res.status === 404) {
                 // Job might be expired or invalid
                 setStatus('error');
                 clearInterval(interval);
            }
        }
      } catch (e) {
         console.error("Polling error", e);
      }
    };

    interval = setInterval(poll, 1000);
    poll(); // Initial check

    return () => {
        isMounted = false;
        clearInterval(interval);
    };
  }, [jobId]);

  return <ProgressiveImage status={status} prompt={prompt} finalSrc={finalSrc} />;
};

// --- Main Renderer ---

export const ChatWidgetRenderer: React.FC<WidgetRendererProps> = ({ type, data }) => {
  // Safe parsing if data is string
  let parsedData;
  try {
    parsedData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    // If parsing fails (e.g. streaming incomplete json), don't crash
    console.warn("Widget JSON parse failed:", e);
    return null;
  }

  switch (type) {
    case 'todo':
      return <TodoWidget title={parsedData.title || 'Tasks'} items={parsedData.items || []} />;
    case 'confirm':
      return <ConfirmationWidget message={parsedData.message || 'Are you sure?'} />;
    case 'status':
      return <StatusWidget title={parsedData.title} status={parsedData.status} details={parsedData.details} />;
    case 'gen_image':
      return <GeneratingImageWidget prompt={parsedData.prompt || 'Thinking...'} />;
    case 'progressive_image':
      return <SmartProgressiveWidget jobId={parsedData.jobId} prompt={parsedData.prompt} />;
    default:
      return (
        <div className="p-2 border border-red-500/50 bg-red-500/10 text-red-400 rounded text-xs">
          Unknown Widget: {type}
        </div>
      );
  }
};
