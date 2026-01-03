import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-400';
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'system': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-black/50 p-4 rounded-lg font-mono text-xs h-48 overflow-y-auto border border-lira-surface shadow-inner">
      {logs.length === 0 && <div className="text-gray-600 italic">System ready. Waiting for input...</div>}
      {logs.map((log) => (
        <div key={log.id} className="mb-1 break-words">
          <span className="text-gray-600">[{log.timestamp.toLocaleTimeString()}]</span>{' '}
          <span className={`font-bold ${getLevelColor(log.level)}`}>{log.level.toUpperCase()}</span>:{' '}
          <span className="text-gray-300">{log.message}</span>
          {log.details && (
            <div className="ml-8 mt-1 text-gray-500 border-l-2 border-gray-700 pl-2">
              {log.details}
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default Terminal;
