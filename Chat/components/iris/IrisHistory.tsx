import React from 'react';
import { FilmIcon, PlayIcon, Trash2 } from 'lucide-react';

const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [key, value] of Object.entries(intervals)) {
        const count = Math.floor(seconds / value);
        if (count >= 1) {
            return count === 1 ? `1 ${key} ago` : `${count} ${key}s ago`;
        }
    }
    return 'Just now';
};

interface IrisHistoryItem {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string; // Optional if not stored
  prompt: string;
  model: string;
  createdAt: number;
}

interface IrisHistoryProps {
  history: IrisHistoryItem[];
  onSelect: (item: IrisHistoryItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClose: () => void;
}

export const IrisHistory: React.FC<IrisHistoryProps> = ({ history, onSelect, onDelete, onClose }) => {
  return (
    <div className="absolute inset-x-0 bottom-0 bg-[#09090b] border-t border-white/10 z-30 flex flex-col max-h-[300px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-white/5">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <FilmIcon className="w-4 h-4 text-purple-400" />
            Your Creation History
        </h3>
        <button onClick={onClose} className="text-xs text-gray-500 hover:text-white transition-colors">
            Collapse
        </button>
      </div>

      <div className="flex-1 overflow-x-auto p-4 flex gap-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {history.length === 0 ? (
            <div className="w-full h-24 flex items-center justify-center text-gray-600 text-sm italic">
                No history yet. Start creating!
            </div>
        ) : (
            history.map((item) => (
            <div 
                key={item.id} 
                className="relative group min-w-[200px] w-[200px] aspect-video bg-gray-900 rounded-lg overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all cursor-pointer flex-shrink-0"
                onClick={() => onSelect(item)}
            >
                {/* Thumbnail / Placeholder */}
                <div className="w-full h-full flex items-center justify-center bg-black/50">
                    {/* Since we don't have thumbnails persisted yet, we show a generic icon or rely on browser cache if videoUrl is hot */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <FilmIcon className="w-8 h-8 text-gray-700 group-hover:text-purple-400 transition-colors" />
                        <span className="text-[10px] text-gray-500 px-2 text-center line-clamp-2">{item.prompt}</span>
                    </div>
                    {/* Overlay Play Button */}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <PlayIcon className="w-8 h-8 text-white drop-shadow-md" />
                     </div>
                </div>

                {/* Info Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm px-2 py-1.5 flex justify-between items-center text-[10px] text-gray-400">
                    <span>{formatTimeAgo(item.createdAt)}</span>
                    <button 
                        onClick={(e) => onDelete(item.id, e)}
                        className="p-1 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
                        title="Delete from history"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};
