import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Check, X, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../src/config';
import { getAuthHeaders } from '../services/userService';

interface GitHubConfigProps {
    onConnected?: () => void;
}

export const GitHubConfig: React.FC<GitHubConfigProps> = ({ onConnected }) => {
    const [token, setToken] = useState('');
    const [owner, setOwner] = useState('Rukafuu');
    const [repo, setRepo] = useState('LiraOS');
    const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Load saved credentials on mount
    React.useEffect(() => {
        const loadCredentials = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/trae/github/credentials`, {
                    headers: getAuthHeaders()
                });
                const data = await response.json();
                
                if (data.success) {
                    if (data.owner) setOwner(data.owner);
                    if (data.repo) setRepo(data.repo);
                    if (data.hasToken) {
                        setStatus('success');
                        setToken('***'); // Don't show actual token
                    }
                }
            } catch (err) {
                console.error('Failed to load GitHub credentials:', err);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadCredentials();
    }, []);

    const handleConnect = async () => {
        if (!token || !owner || !repo) {
            setError('All fields are required');
            return;
        }

        setStatus('connecting');
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/api/trae/github/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ token, owner, repo })
            });

            const data = await response.json();

            if (data.success) {
                setStatus('success');
                onConnected?.();
                // Store connection info in localStorage for persistence
                localStorage.setItem('lap_github_config', JSON.stringify({ owner, repo }));
            } else {
                setStatus('error');
                setError(data.error || 'Connection failed');
            }
        } catch (err: any) {
            setStatus('error');
            setError(err.message || 'Network error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white/5 border border-white/10 rounded-xl"
        >
            <div className="flex items-center gap-2 mb-4">
                <Github className="w-5 h-5 text-white" />
                <h3 className="text-sm font-bold text-white">GitHub Repository Access</h3>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Personal Access Token</label>
                    <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Owner</label>
                        <input
                            type="text"
                            value={owner}
                            onChange={(e) => setOwner(e.target.value)}
                            placeholder="username"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">Repository</label>
                        <input
                            type="text"
                            value={repo}
                            onChange={(e) => setRepo(e.target.value)}
                            placeholder="repo-name"
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <X className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                        <Check className="w-4 h-4" />
                        Connected to {owner}/{repo}
                    </div>
                )}

                <button
                    onClick={handleConnect}
                    disabled={status === 'connecting'}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
                >
                    {status === 'connecting' ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            <Github className="w-4 h-4" />
                            Connect Repository
                        </>
                    )}
                </button>

                <p className="text-[10px] text-gray-500 leading-relaxed">
                    <strong>Note:</strong> Create a Personal Access Token at{' '}
                    <a
                        href="https://github.com/settings/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:underline"
                    >
                        github.com/settings/tokens
                    </a>
                    {' '}with <code className="bg-white/10 px-1 rounded">repo</code> scope.
                </p>
            </div>
        </motion.div>
    );
};
