import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Upload, Sparkles, Command, ArrowRight, User, Terminal } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { LIRA_AVATAR } from '../constants';
import { ParticleBackground } from './ui/ParticleBackground';
import { useTranslation } from 'react-i18next';

interface LandingChatProps {
    onLoginReq: () => void;
}

export const LandingChat: React.FC<LandingChatProps> = ({ onLoginReq }) => {
    const { t } = useTranslation();
    const { currentTheme } = useTheme();
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([]);
    const [msgCount, setMsgCount] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const LIMIT = 10;

    // Start with a welcome message animation
    useEffect(() => {
        setTimeout(() => {
             setMessages([{ role: 'model', content: t('landing.welcome_message') }]);
        }, 800);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        if (msgCount >= LIMIT) {
            onLoginReq();
            return;
        }

        const newMsg = { role: 'user' as const, content: inputValue };
        setMessages(prev => [...prev, newMsg]);
        setInputValue('');
        setMsgCount(prev => prev + 1);
        setIsTyping(true);

        // Simulate Lira response (short demo)
        setTimeout(() => {
            const responses = [
                "Essa é uma ideia brilhante! A arquitetura base já está em nossa memória. Deseja expandir para o backend?",
                "Analisado. Posso gerar o código boilerplate para isso agora mesmo. 🚀",
                "Entendido. Estou processando os requisitos... Isso parece promissor!",
                "Você prefere que eu use React ou Vue para essa interface?",
                "Posso criar um script de automação para isso. Devo prosseguir?",
                "Interessante... Estou consultando minha base de conhecimento para otimizar essa função.",
                "Isso exigiria uma integração com API externa. Posso simular os dados por enquanto.",
                "Código gerado e validado. Quer ver o preview?",
                "Excelente escolha de design pattern!",
                "Estamos quase lá. Para salvar este projeto e ter acesso ao terminal real, você precisará fazer login."
            ];
            
            let reply = responses[msgCount];
            if (!reply) {
                 reply = t('landing.demo_limit_reached'); 
            }
            
            setMessages(prev => [...prev, { role: 'model', content: reply }]);
            setIsTyping(false);

            if (msgCount + 1 >= LIMIT) {
                 setTimeout(() => onLoginReq(), 2000);
            }
        }, 1500);
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#030305] text-white p-4 overflow-y-auto md:overflow-hidden font-sans selection:bg-purple-500/30">
            {/* ... Backgrounds ... */}
            <div className="absolute inset-0 opacity-40">
                <ParticleBackground />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

            <div className="z-10 w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center justify-center h-full">
                
                {/* Left Side: Branding (Hero) */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex-1 text-center md:text-left space-y-6"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase font-bold tracking-widest text-purple-300 mb-2 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <Sparkles size={10} />
                        LiraOS v2.0
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                            {t('landing.hero_title_1')}
                        </span>
                        <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-white">
                            {t('landing.hero_title_2')}
                        </span>
                    </h1>
                    
                    <p className="text-gray-400 text-lg md:text-xl max-w-md mx-auto md:mx-0 leading-relaxed">
                        {t('landing.hero_subtitle')}
                    </p>

                    <div className="flex w-full md:w-auto justify-center md:justify-start gap-4 pt-4">
                        <button onClick={onLoginReq} className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            <Terminal size={18} />
                            {t('landing.login_system')}
                        </button>
                    </div>
                </motion.div>

                {/* Right Side: Chat Interface (Card) */}
                <motion.div 
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    className="flex-1 w-full max-w-md"
                >
                    <div className="relative group rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl shadow-purple-900/20 overflow-hidden">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10">
                                    <div className="absolute inset-0 bg-purple-500 rounded-full blur opacity-40 animate-pulse" />
                                    <img src={LIRA_AVATAR} alt="Lira" className="w-full h-full rounded-full object-cover relative z-10 border border-white/20" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm">Lira</div>
                                    <div className="text-xs text-green-400 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        Online
                                    </div>
                                </div>
                            </div>
                            <button onClick={onLoginReq} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <User size={18} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="h-[350px] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                            <AnimatePresence mode="popLayout">
                                {messages.map((m, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`
                                            max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-lg
                                            ${m.role === 'user' 
                                                ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-br-sm' 
                                                : 'bg-neutral-800/80 border border-white/5 text-gray-100 rounded-bl-sm backdrop-blur-md'
                                            }
                                        `}>
                                            {m.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {isTyping && (
                                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                         <div className="bg-neutral-800/50 border border-white/5 rounded-2xl px-4 py-3 flex gap-1.5 items-center">
                                             <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                                             <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-75" />
                                             <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-150" />
                                         </div>
                                     </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white/5 border-t border-white/5">
                            <form onSubmit={handleSubmit} className="relative">
                                <input 
                                    type="text" 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={msgCount >= LIMIT ? t('landing.demo_limit_reached') : t('landing.placeholder')}
                                    disabled={msgCount >= LIMIT}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-gray-500"
                                    autoFocus
                                />
                                <button 
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:bg-gray-700"
                                >
                                    {msgCount >= LIMIT ? <ArrowRight size={14} /> : <Send size={14} />}
                                </button>
                            </form>
                            <div className="text-[10px] text-center text-gray-600 mt-2 font-mono">
                                {msgCount >= LIMIT ? t('landing.demo_limit_reached') : t('landing.messages_remaining', { count: LIMIT - msgCount })}
                            </div>
                        </div>

                    </div>
                </motion.div>

                {/* Mobile Login Button (Visible only on small screens) */}


            </div>
        </div>
    );
};
