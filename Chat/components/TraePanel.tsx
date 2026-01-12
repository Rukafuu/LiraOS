import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Terminal, 
    Code, 
    Play, 
    Pause, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    FileCode,
    GitBranch,
    Loader2,
    ChevronRight,
    ChevronDown,
    Eye,
    Trash2,
    RotateCcw
} from 'lucide-react';
import { getAuthHeaders } from '../services/userService';
import { traeService } from '../services/traeService';
import { API_BASE_URL } from '../src/config';
import { GitHubConfig } from './GitHubConfig';

interface TraeTask {
    id: string;
    description: string;
    status: 'pending' | 'running' | 'success' | 'error';
    steps: TraeStep[];
    createdAt: number;
    completedAt?: number;
}

interface TraeStep {
    id: string;
    tool: string;
    args: any[];
    status: 'pending' | 'running' | 'success' | 'error';
    result?: any;
    error?: string;
    startTime?: number;
    endTime?: number;
    description?: string;
}

interface FileChange {
    path: string;
    type: 'created' | 'modified' | 'deleted';
    diff?: string;
}

export const TraePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [taskInput, setTaskInput] = useState('');
    const [currentTask, setCurrentTask] = useState<TraeTask | null>(null);
    const [taskHistory, setTaskHistory] = useState<TraeTask[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
    const [availableTools, setAvailableTools] = useState<any>(null);
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'logs' | 'changes' | 'tools' | 'github'>('logs');
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Load available tools on mount
    useEffect(() => {
        loadTools();
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const loadTools = async () => {
        const res = await traeService.getTools();
        if (res.success && res.result) {
            setAvailableTools(res.result);
        } else {
            addLog(`❌ Failed to load tools: ${res.error}`, 'error');
        }
    };

    const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = {
            info: '📝',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        }[type];
        setLogs(prev => [...prev, `[${timestamp}] ${prefix} ${message}`]);
    };

    const executeTask = async () => {
        if (!taskInput.trim()) return;

        const task: TraeTask = {
            id: `task_${Date.now()}`,
            description: taskInput,
            status: 'running',
            steps: [],
            createdAt: Date.now()
        };

        setCurrentTask(task);
        setLogs([]);
        setFileChanges([]);
        addLog(`Starting task: "${taskInput}"`, 'info');

        await executeAIPlan(task);
    };

    const executeAIPlan = async (taskData: TraeTask) => {
        addLog('🤖 AI is planning your task...', 'info');
        
        // 1. Get Plan from Backend Gemini
        const planRes = await traeService.planTask(taskData.description);
        
        if (!planRes.success || !planRes.result) {
             addLog(`❌ Planning failed: ${planRes.error || 'No plan returned'}`, 'error');
             setCurrentTask(null);
             return;
        }
        
        const plan = planRes.result; // Array of steps
        addLog(`📋 Plan generated with ${plan.length} steps`, 'success');
        
        // Update task with steps
        const steps: TraeStep[] = plan.map((step: any, index: number) => ({
            id: `step_${index}`,
            tool: step.tool,
            args: step.args,
            status: 'pending',
            description: step.description 
        }));
        
        taskData.steps = steps;
        setCurrentTask({ ...taskData });
        
        // 2. Execute Steps
        for (const step of steps) {
            step.status = 'running';
            step.startTime = Date.now();
            setCurrentTask({ ...taskData });
            
            addLog(`Running: ${step.tool} - ${step.description || ''}`, 'info');
            
            // Execute tool
            const res = await traeService.executeTool(step.tool, step.args);
            
            step.endTime = Date.now();
            
            if (res.success) {
                step.status = 'success';
                step.result = res.result;
                addLog(`✅ ${step.tool} success`, 'success');
            } else {
                step.status = 'error';
                step.error = res.error;
                addLog(`❌ ${step.tool} failed: ${res.error}`, 'error');
                
                // Stop on error
                taskData.status = 'error';
                taskData.completedAt = Date.now();
                setTaskHistory(prev => [taskData, ...prev]);
                setCurrentTask(null);
                return;
            }
            
            setCurrentTask({ ...taskData });
            // Small visual delay
            await new Promise(r => setTimeout(r, 800));
        }
        
        taskData.status = 'success';
        taskData.completedAt = Date.now();
        setTaskHistory(prev => [taskData, ...prev]);
        setCurrentTask(null);
        addLog('✨ Task completed successfully!', 'success');
    };

    const executeTool = async (toolName: string, args: any[] = []) => {
        addLog(`Executing: ${toolName}(${args.join(', ')})`, 'info');

        const res = await traeService.executeTool(toolName, args);
            
        if (res.success) {
            addLog(`✅ ${toolName} completed`, 'success');
            addLog(JSON.stringify(res.result, null, 2), 'info');
        } else {
            addLog(`❌ ${toolName} failed: ${res.error}`, 'error');
        }
    };

    const toggleStep = (stepId: string) => {
        setExpandedSteps(prev => {
            const next = new Set(prev);
            if (next.has(stepId)) {
                next.delete(stepId);
            } else {
                next.add(stepId);
            }
            return next;
        });
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Terminal className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">L.A.P: Lira Agent Program</h2>
                        <p className="text-xs text-gray-400">Advanced Admin-Only Autonomous System</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            const width = 1400;
                            const height = 900;
                            const left = (screen.width - width) / 2;
                            const top = (screen.height - height) / 2;
                            window.open(
                                '/lap.html',
                                'LAP_Window',
                                `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
                            );
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Open in New Window"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Task Input & Execution */}
                <div className="w-1/2 border-r border-white/10 flex flex-col">
                    {/* Task Input */}
                    <div className="p-6 border-b border-white/10">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            What do you want to build or fix?
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={taskInput}
                                onChange={(e) => setTaskInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && executeTask()}
                                placeholder="e.g., Add dark mode support, Fix the login bug, Refactor API calls..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
                                disabled={!!currentTask}
                            />
                            <button
                                onClick={executeTask}
                                disabled={!!currentTask || !taskInput.trim()}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-white flex items-center gap-2 transition-all transform active:scale-95"
                            >
                                {currentTask ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Running
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5" />
                                        Execute
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Current Task Execution */}
                    {currentTask && (
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-center gap-2 mb-4">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                <span className="text-sm font-bold text-white">{currentTask.description}</span>
                            </div>
                            <div className="space-y-2">
                                {currentTask.steps.map((step) => (
                                    <div key={step.id} className="bg-white/5 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {step.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                                                {step.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                                                {step.status === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
                                                <span className="text-sm text-gray-300">{step.tool}</span>
                                            </div>
                                            <button
                                                onClick={() => toggleStep(step.id)}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                            >
                                                {expandedSteps.has(step.id) ? (
                                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                        <AnimatePresence>
                                            {expandedSteps.has(step.id) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="mt-2 text-xs text-gray-400 font-mono overflow-hidden"
                                                >
                                                    <pre className="bg-black/30 p-2 rounded overflow-x-auto">
                                                        {JSON.stringify(step.result || step.error, null, 2)}
                                                    </pre>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Task History */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Task History</h3>
                        <div className="space-y-2">
                            {taskHistory.map((task) => (
                                <div
                                    key={task.id}
                                    className="bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {task.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                                            {task.status === 'error' && <XCircle className="w-4 h-4 text-red-400" />}
                                            <span className="text-sm text-white">{task.description}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {task.steps.length} steps • {new Date(task.createdAt).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                            {taskHistory.length === 0 && (
                                <div className="text-center text-gray-600 py-8">
                                    <Terminal className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No tasks executed yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Logs, Changes, Tools */}
                <div className="w-1/2 flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        {[
                            { id: 'logs', label: 'Logs', icon: Terminal },
                            { id: 'changes', label: 'Changes', icon: FileCode },
                            { id: 'tools', label: 'Tools', icon: Code },
                            { id: 'github', label: 'GitHub', icon: GitBranch }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-white/10 text-white border-b-2 border-purple-500'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-hidden">
                        {activeTab === 'logs' && (
                            <div className="h-full overflow-y-auto p-4 font-mono text-xs">
                                {logs.map((log, i) => (
                                    <div key={i} className="text-gray-300 mb-1 hover:bg-white/5 px-2 py-1 rounded">
                                        {log}
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                                {logs.length === 0 && (
                                    <div className="text-center text-gray-600 py-8">
                                        <Terminal className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>Logs will appear here</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'changes' && (
                            <div className="h-full overflow-y-auto p-4">
                                {fileChanges.length === 0 && (
                                    <div className="text-center text-gray-600 py-8">
                                        <FileCode className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No file changes yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'tools' && (
                            <div className="h-full overflow-y-auto p-4">
                                {availableTools ? (
                                    <div className="space-y-4">
                                        {Object.entries(availableTools.categories || {}).map(([category, tools]: [string, any]) => (
                                            <div key={category}>
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                    {category} ({tools.length})
                                                </h4>
                                                <div className="space-y-1">
                                                    {tools.map((tool: string) => (
                                                        <button
                                                            key={tool}
                                                            onClick={() => executeTool(tool)}
                                                            className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
                                                        >
                                                            {tool}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-600 py-8">
                                        <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin opacity-20" />
                                        <p className="text-sm">Loading tools...</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'github' && (
                            <div className="h-full overflow-y-auto p-4">
                                <GitHubConfig onConnected={() => addLog('✅ GitHub repository connected', 'success')} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 bg-black/50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span>Connected</span>
                    </div>
                    <div>v1.0.0-beta</div>
                    <div>{availableTools?.count || 0} tools available</div>
                </div>
                <div className="text-xs text-gray-600">
                    Powered by Gemini AI • Inspired by Trae-Agent
                </div>
            </div>
        </div>
    );
};
