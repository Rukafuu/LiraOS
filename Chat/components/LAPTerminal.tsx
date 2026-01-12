import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Send, Trash2, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../src/config';
import { getAuthHeaders } from '../services/userService';

interface TerminalProps {
    mode?: 'local' | 'remote';
}

interface CommandHistory {
    command: string;
    output: string;
    timestamp: number;
    status: 'success' | 'error';
}

export const LAPTerminal: React.FC<TerminalProps> = ({ mode = 'local' }) => {
    const [command, setCommand] = useState('');
    const [history, setHistory] = useState<CommandHistory[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [cwd, setCwd] = useState('.');
    const terminalEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const executeCommand = async () => {
        if (!command.trim() || isExecuting) return;

        const cmd = command.trim();
        setCommand('');
        setIsExecuting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/trae/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    tool: 'runCommand',
                    args: [cmd, cwd]
                })
            });

            const data = await response.json();

            if (data.success) {
                setHistory(prev => [...prev, {
                    command: cmd,
                    output: data.result.output || data.result.stdout || 'Command executed successfully',
                    timestamp: Date.now(),
                    status: 'success'
                }]);

                // Update cwd if it was a cd command
                if (cmd.startsWith('cd ')) {
                    const newPath = cmd.substring(3).trim();
                    setCwd(newPath);
                }
            } else {
                setHistory(prev => [...prev, {
                    command: cmd,
                    output: data.error || 'Command failed',
                    timestamp: Date.now(),
                    status: 'error'
                }]);
            }
        } catch (error: any) {
            setHistory(prev => [...prev, {
                command: cmd,
                output: `Error: ${error.message}`,
                timestamp: Date.now(),
                status: 'error'
            }]);
        } finally {
            setIsExecuting(false);
        }
    };

    const clearHistory = () => {
        setHistory([]);
    };

    return (
        <div className="flex flex-col h-full bg-black/40 rounded-xl border border-white/10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-mono text-green-400">
                        {mode === 'local' ? 'Local Terminal' : 'Remote Terminal'}
                    </span>
                    <span className="text-xs text-gray-500">({cwd})</span>
                </div>
                <button
                    onClick={clearHistory}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Clear history"
                >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2">
                {history.length === 0 && (
                    <div className="text-gray-600 text-xs">
                        <p>L.A.P Terminal v1.0</p>
                        <p>Type commands to execute on the {mode} system.</p>
                        <p className="mt-2 text-yellow-600">⚠️ Use with caution - commands run with full permissions</p>
                    </div>
                )}

                {history.map((entry, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-green-400">$</span>
                            <span className="text-white">{entry.command}</span>
                        </div>
                        <pre className={`pl-4 text-xs whitespace-pre-wrap ${
                            entry.status === 'error' ? 'text-red-400' : 'text-gray-300'
                        }`}>
                            {entry.output}
                        </pre>
                    </motion.div>
                ))}

                {isExecuting && (
                    <div className="flex items-center gap-2 text-yellow-400">
                        <div className="animate-spin">⏳</div>
                        <span className="text-xs">Executing...</span>
                    </div>
                )}

                <div ref={terminalEndRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 p-3 border-t border-white/10">
                <span className="text-green-400 font-mono">$</span>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') executeCommand();
                    }}
                    placeholder="Enter command..."
                    disabled={isExecuting}
                    className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder-gray-600 disabled:opacity-50"
                />
                <button
                    onClick={executeCommand}
                    disabled={!command.trim() || isExecuting}
                    className="p-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                    <Send className="w-4 h-4 text-white" />
                </button>
            </div>
        </div>
    );
};
