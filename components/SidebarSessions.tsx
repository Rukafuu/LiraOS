import React, { memo, useMemo } from 'react';
import { MessageSquare, Search, Trash2, Plus } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarSessionsProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  searchQuery: string;
  showHistorySidebar: boolean;
  onSearchChange: (query: string) => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
}

const SidebarSessions = memo<SidebarSessionsProps>(({ 
  sessions, 
  activeSessionId, 
  searchQuery, 
  showHistorySidebar,
  onSearchChange, 
  onSelectSession, 
  onDeleteSession, 
  onCreateNewSession 
}) => {
  const filteredSessions = useMemo(() => 
    sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [sessions, searchQuery]
  );

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    onDeleteSession(sessionId);
  };

  return (
    <div className={`
      absolute inset-y-0 left-0 z-20 bg-slate-50 dark:bg-slate-950 border-r border-rose-100 dark:border-rose-900/20 transform transition-all duration-300 ease-in-out flex flex-col
      ${showHistorySidebar ? 'translate-x-0 w-80' : '-translate-x-full w-80 lg:translate-x-0 lg:w-0 lg:opacity-0 lg:overflow-hidden'}
    `}>
      <div className="p-4 border-b border-rose-100 dark:border-rose-900/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 font-bold">
          <MessageSquare size={20} />
          <span>History</span>
        </div>
        <button 
          onClick={onCreateNewSession}
          className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 rounded-full hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
          title="New Chat"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 transition-all text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredSessions.map(session => (
          <div 
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`
              group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
              ${activeSessionId === session.id 
                ? 'bg-white dark:bg-slate-800 shadow-sm border border-rose-100 dark:border-rose-900/30' 
                : 'hover:bg-rose-50 dark:hover:bg-slate-900/50 border border-transparent'
              }
            `}
          >
            <div className={`
              shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
              ${activeSessionId === session.id 
                ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }
            `}>
              <MessageSquare size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-medium truncate ${activeSessionId === session.id ? 'text-rose-900 dark:text-rose-100' : 'text-slate-700 dark:text-slate-400'}`}>
                {session.title}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {new Date(session.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <button 
              onClick={(e) => handleDeleteSession(e, session.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {filteredSessions.length === 0 && (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
            No conversations found.
          </div>
        )}
      </div>
    </div>
  );
});

SidebarSessions.displayName = 'SidebarSessions';

export default SidebarSessions;
