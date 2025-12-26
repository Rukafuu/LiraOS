import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Eye, Loader2, Image as ImageIcon, MessageSquare, Terminal, AlertTriangle } from 'lucide-react';
import { getAuthHeaders } from '../../services/userService';
import { VideoResult } from './VideoResult'; // Reuse specific components if needed, though this is for vision
import ReactMarkdown from 'react-markdown';

export const IrisVision: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [method, setMethod] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [question, setQuestion] = useState("");

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setImage(e.target.result as string);
                    setAnalysis(null);
                    setErrorMessage(null);
                }
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1
    });

    const handleAnalyze = async () => {
        if (!image) return;

        setIsLoading(true);
        setErrorMessage(null);

        const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

        try {
            // Remove data:image/png;base64, prefix
            const base64Data = image.split(',')[1];
            const mimeType = image.split(':')[1].split(';')[0];

            const response = await fetch(`${API_BASE_URL}/api/vision/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    imageData: {
                        data: base64Data,
                        mimeType: mimeType
                    },
                    prompt: question || "O que você vê nesta imagem? Descreva detalhadamente para mim."
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Falha na análise');
            }

            const data = await response.json();
            setAnalysis(data.analysis);
            setMethod(data.method);

        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || "Erro desconhecido ao processar imagem.");
        } finally {
            setIsLoading(false);
        }
    };

    const clearAll = () => {
        setImage(null);
        setAnalysis(null);
        setQuestion("");
    };

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 animate-in fade-in zoom-in-95">
             <div className="flex items-center justify-center gap-3 mb-8">
                <div className="p-3 rounded-full bg-lira-pink/10 text-lira-pink border border-lira-pink/20">
                    <Eye size={32} />
                </div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-lira-pink to-purple-400">
                    Visão Computacional
                </h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
                {/* Left: Input */}
                <div className="flex flex-col gap-4">
                    {/* Dropzone */}
                    <div 
                        {...getRootProps()} 
                        className={`
                            border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-[300px] relative overflow-hidden group
                            ${isDragActive ? 'border-lira-pink bg-lira-pink/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
                            ${image ? 'border-none p-0' : ''}
                        `}
                    >
                        <input {...getInputProps()} />
                        {image ? (
                            <>
                                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-white font-medium flex items-center gap-2"><Upload size={16} /> Trocar Imagem</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
                                    <ImageIcon size={32} />
                                </div>
                                <p className="text-lg font-medium text-white">Arraste uma imagem</p>
                                <p className="text-sm">ou clique para selecionar</p>
                            </div>
                        )}
                    </div>

                    {/* Question Input */}
                    <div className="relative">
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Faça uma pergunta sobre a imagem... (Opcional)"
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-lira-pink/50 transition-colors"
                        />
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!image || isLoading}
                        className={`
                            w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all
                            ${!image || isLoading 
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-lira-pink to-purple-600 hover:from-lira-pink/80 hover:to-purple-500 text-white transform active:scale-95'}
                        `}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" /> Analisando...
                            </>
                        ) : (
                            <>
                                <Eye /> Analisar Imagem
                            </>
                        )}
                    </button>
                    
                    {errorMessage && (
                         <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-3">
                             <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                             {errorMessage}
                         </div>
                    )}
                </div>

                {/* Right: Analysis Result */}
                <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl p-6 flex flex-col h-full min-h-[400px]">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Terminal size={18} className="text-lira-blue" /> Análise Neural
                        </h3>
                        {method && (
                            <span className="text-[10px] uppercase font-mono px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">
                                Engine: {method}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {analysis ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown>{analysis}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                                <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                                    <Eye className="opacity-20" size={32} />
                                </div>
                                <p className="text-sm">Aguardando dados visuais...</p>
                            </div>
                        )}
                    </div>
                    
                     {analysis && (
                        <div className="pt-4 mt-4 border-t border-white/5 flex justify-end">
                            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-white transition-colors">
                                Nova Análise
                            </button>
                        </div>
                    )}
                </div>
             </div>
        </div>
    );
};
