import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, MessageSquare, Bot, Globe, Shield, ExternalLink, Settings, Link } from 'lucide-react';

interface DiscordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DiscordConfig {
  enabled: boolean;
  isConnected: boolean;
  inviteUrl: string | null;
  applicationId: string | null;
  canManage?: boolean;
  isLinked?: boolean;
}

const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';

export const DiscordModal: React.FC<DiscordModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<DiscordConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [editToken, setEditToken] = useState('');
  const [editAppId, setEditAppId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const headers = {
         'Content-Type': 'application/json',
         // Add auth header if needed, assuming getAuthHeaders() logic is available or public
         'Authorization': `Bearer ${localStorage.getItem('lira_token') || localStorage.getItem('lira_session') ? JSON.parse(localStorage.getItem('lira_session')!).token : ''}`
      };

      fetch(`${API_BASE_URL}/api/discord/status`, { headers })
        .then(res => res.json())
        .then(data => {
            setConfig(data);
            setLoading(false);
            // ONLY show config automatically if user is admin AND it's not enabled
            if (!data.enabled && data.canManage) {
                setShowConfig(true);
            }
            if (data.applicationId) setEditAppId(data.applicationId);
        })
        .catch(err => {
            console.error('Failed to fetch Discord status', err);
            setLoading(false);
        });
    }
  }, [isOpen]);

  const handleSaveConfig = async () => {
      setSaving(true);
      const headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('lira_token') || localStorage.getItem('lira_session') ? JSON.parse(localStorage.getItem('lira_session')!).token : ''}`
      };
      try {
          const res = await fetch(`${API_BASE_URL}/api/discord/config`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ token: editToken, applicationId: editAppId })
          });
          const data = await res.json();
          if (res.ok) {
              setShowConfig(false);
              setConfig(prev => prev ? { ...prev, enabled: true, applicationId: editAppId, inviteUrl: `https://discord.com/api/oauth2/authorize?client_id=${editAppId}&permissions=8&scope=bot` } : null);
          } else {
              alert(data.error || 'Failed to save');
          }
      } catch (e) { console.error(e); }
      setSaving(false);
  };

  const handleLinkAccount = async () => {
      const headers = { 
          'Content-Type': 'application/json', 
           'Authorization': `Bearer ${localStorage.getItem('lira_token') || localStorage.getItem('lira_session') ? JSON.parse(localStorage.getItem('lira_session')!).token : ''}`
      };
      try {
          const res = await fetch(`${API_BASE_URL}/api/discord/auth`, { headers });
          const data = await res.json();
          if (data.url) {
              window.open(data.url, '_blank', 'width=500,height=800');
          } else {
              alert('Erro ao iniciar vínculo. Verifique a configuração do servidor.');
          }
      } catch (e) {
          console.error(e);
      }
  };

  const isLinked = config?.isLinked || false;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-[#0E0E10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative h-32 bg-gradient-to-r from-[#5865F2] to-[#404EED] flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
             <Bot className="w-16 h-16 text-white drop-shadow-lg" />
             <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X size={18} />
              </button>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{t('discord.title')}</h2>
                <p className="text-gray-400 text-sm">
                    {t('discord.desc')}
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865F2]"></div>
                </div>
            ) : showConfig && config?.canManage ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-3">
                        <Shield className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-yellow-200">
                             <strong>Área Admin:</strong> Configure o Bot Token e Application ID para ativar a integração global. Usuários comuns não verão isso.
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bot Token</label>
                        <input 
                            type="password" 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5865F2] transition-colors"
                            placeholder="OT..."
                            value={editToken}
                            onChange={e => setEditToken(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-500">Found in Discord Developer Portal &gt; Bot &gt; Reset Token</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Application ID</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#5865F2] transition-colors"
                            placeholder="123456789..."
                            value={editAppId}
                            onChange={e => setEditAppId(e.target.value)}
                        />
                         <p className="text-[10px] text-gray-500">Found in Discord Developer Portal &gt; General Information</p>
                    </div>
                    <div className="pt-4 flex gap-3">
                        {config?.enabled && (
                            <button 
                                onClick={() => setShowConfig(false)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 font-medium rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button 
                            onClick={handleSaveConfig}
                            disabled={(!editToken && !config?.enabled) || !editAppId || saving}
                            className="flex-1 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center"
                        >
                            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Connect Bot'}
                        </button>
                    </div>
                </div>
            ) : !config?.enabled ? (
                 <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/5 rounded-xl text-center space-y-3">
                     <Bot className="w-12 h-12 text-gray-600 mb-2" />
                     <h3 className="text-white font-medium">Integração Indisponível</h3>
                     <p className="text-sm text-gray-500">O sistema Discord ainda não foi configurado pelo administrador.</p>
                     
                     {config?.canManage && (
                         <button 
                            onClick={() => setShowConfig(true)}
                            className="mt-4 px-4 py-2 bg-[#5865F2]/20 text-[#5865F2] hover:bg-[#5865F2]/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                         >
                            <Settings size={14} /> Configurar Agora
                         </button>
                     )}
                 </div>
            ) : (
                <div className="space-y-4">
                    {/* Status Banner */}
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-sm font-medium text-green-400">Bot Active</span>
                         </div>
                         <button onClick={() => setShowConfig(true)} className="text-xs text-gray-400 hover:text-white underline">
                             Configure
                         </button>
                    </div>

                    {/* Features List (Always Visible) */}
                     <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                            <Bot className="w-6 h-6 text-green-400 mb-2" />
                            <span className="text-xs font-medium text-gray-300">{t('discord.features.bot')}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                            <Shield className="w-6 h-6 text-purple-400 mb-2" />
                            <span className="text-xs font-medium text-gray-300">{t('discord.features.pc')}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                            <Globe className="w-6 h-6 text-blue-400 mb-2" />
                            <span className="text-xs font-medium text-gray-300">{t('discord.features.web')}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center text-center">
                            <MessageSquare className="w-6 h-6 text-pink-400 mb-2" />
                            <span className="text-xs font-medium text-gray-300">{t('discord.features.chat')}</span>
                        </div>
                     </div>

                     {/* Buttons */}
                     <div className="space-y-3">
                        <a 
                            href="https://discord.com/oauth2/authorize?client_id=1441163941224124636" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-full"
                         >
                            <button className="w-full py-3 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(88,101,242,0.39)] hover:shadow-[0_6px_20px_rgba(88,101,242,0.23)] flex items-center justify-center gap-2">
                                <Bot size={20} />
                                {t('discord.invite')} (Adicionar Bot)
                            </button>
                         </a>

                         {/* Link Account Button */}
                         {!isLinked ? (
                            <button 
                                onClick={handleLinkAccount}
                                className="w-full py-3 px-4 bg-[#2B2D31] hover:bg-[#35373C] text-white font-medium rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2"
                            >
                                <Link size={18} className="text-gray-400" />
                                Vincular Minha Conta Discord
                            </button> 
                         ) : (
                            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                                <div className="text-sm text-green-400 font-bold mb-1">Conta Vinculada! ✅</div>
                                <div className="text-xs text-gray-400">Você já pode usar os recursos premium no chat do bot.</div>
                            </div>
                         )}
                     </div>

                     {config?.applicationId ? (
                         <a 
                            href={`https://discord.com/users/${config.applicationId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-full"
                         >
                            <button className="w-full py-3 px-4 bg-[#2B2D31] hover:bg-[#35373C] text-gray-200 hover:text-white font-medium rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2">
                                <MessageSquare size={18} />
                                {t('discord.dm')}
                            </button>
                         </a>
                     ) : (
                         <button disabled className="w-full py-3 px-4 bg-white/5 text-gray-500 font-medium rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-white/5" title="Set DISCORD_APPLICATION_ID in .env">
                             <MessageSquare size={18} />
                             {t('discord.dm_missing')}
                         </button>
                     )}
                </div>
            )}
            
            <div className="pt-4 border-t border-white/5 text-center">
                <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1 transition-colors">
                    {t('discord.dev_portal')} <ExternalLink size={10} />
                </a>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
