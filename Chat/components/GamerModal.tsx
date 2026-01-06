import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Brain, Sparkles } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface GamerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GamerModal: React.FC<GamerModalProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative z-10 bg-[#0c0c0e] border border-emerald-500/30 rounded-3xl p-8 max-w-2xl text-center shadow-2xl overflow-hidden"
                    >
                        {/* Glow Effect */}
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px]" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />

                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-white/5 rounded-full border border-white/10">
                                <Gamepad2 size={48} className="text-emerald-400" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2">Lira Companion Mode <span className="text-xs align-top text-emerald-400 font-mono border border-emerald-500/30 px-1 rounded">V2</span></h2>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            O antigo sistema de bot foi aposentado. Estamos construindo o novo <b>Co-Piloto Inteligente</b> usando a arquitetura JARVIS.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-8">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 text-purple-400 font-bold mb-1">
                                    <Brain size={18} />
                                    <span>Strategy Guide</span>
                                </div>
                                <p className="text-xs text-gray-500">Lira analisará sua tela para dar dicas de estratégia em tempo real.</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2 text-yellow-400 font-bold mb-1">
                                    <Sparkles size={18} />
                                    <span>Lore Master</span>
                                </div>
                                <p className="text-xs text-gray-500">Pergunte sobre a história, itens ou quests do jogo que você está jogando.</p>
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            Entendi, aguardando updates!
                        </button>

                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
