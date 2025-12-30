import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Code, CheckCircle, XCircle, Zap, Image, MessageSquare, 
  Calendar, CheckSquare, Activity, AlertCircle, Sparkles 
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FunctionCapability {
  id: string;
  name: string;
  description: string;
  category: 'widgets' | 'tools' | 'integrations';
  status: 'working' | 'broken' | 'untested';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  example?: string;
}

const LIRA_CAPABILITIES: FunctionCapability[] = [
  // Widgets
  {
    id: 'todo_widget',
    name: 'Todo List Widget',
    description: 'Cria listas de tarefas interativas com checkboxes',
    category: 'widgets',
    status: 'working',
    icon: CheckSquare,
    example: '[[WIDGET:todo|{"title":"Minhas Tarefas","items":["Item 1","Item 2"]}]]'
  },
  {
    id: 'confirm_widget',
    name: 'Confirmation Widget',
    description: 'Cria diálogos de confirmação com botões Sim/Não',
    category: 'widgets',
    status: 'working',
    icon: AlertCircle,
    example: '[[WIDGET:confirm|{"message":"Tem certeza?"}]]'
  },
  {
    id: 'status_widget',
    name: 'Status Widget',
    description: 'Exibe status de operações com ícones coloridos',
    category: 'widgets',
    status: 'working',
    icon: Activity,
    example: '[[WIDGET:status|{"title":"Sistema","status":"success","details":"Online"}]]'
  },
  {
    id: 'gen_image_widget',
    name: 'Generating Image Widget',
    description: 'Mostra animação de loading durante geração de imagem',
    category: 'widgets',
    status: 'working',
    icon: Image,
    example: '[[WIDGET:gen_image|{"prompt":"Um gato espacial"}]]'
  },
  {
    id: 'progressive_image_widget',
    name: 'Progressive Image Widget',
    description: 'Carrega imagens progressivamente com polling',
    category: 'widgets',
    status: 'working',
    icon: Sparkles,
    example: '[[WIDGET:progressive_image|{"jobId":"abc123","prompt":"..."}]]'
  },
  
  // Tools
  {
    id: 'image_generation',
    name: 'Image Generation',
    description: 'Gera imagens usando DALL-E ou Stable Diffusion',
    category: 'tools',
    status: 'untested',
    icon: Image,
    example: 'Peça: "Gere uma imagem de..."'
  },
  {
    id: 'code_analysis',
    name: 'Code Analysis',
    description: 'Analisa código e fornece sugestões',
    category: 'tools',
    status: 'untested',
    icon: Code
  },
  {
    id: 'pc_control',
    name: 'PC Controller',
    description: 'Controla funções do PC (volume, apps, etc)',
    category: 'integrations',
    status: 'untested',
    icon: Zap
  },
  {
    id: 'discord_integration',
    name: 'Discord Integration',
    description: 'Integração com Discord (mensagens, status)',
    category: 'integrations',
    status: 'untested',
    icon: MessageSquare
  },
  {
    id: 'calendar_widget',
    name: 'Calendar Widget',
    description: 'Exibe eventos de calendário',
    category: 'widgets',
    status: 'untested',
    icon: Calendar
  }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'widgets' | 'tools' | 'integrations'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'working' | 'broken' | 'untested'>('all');

  const filteredCapabilities = LIRA_CAPABILITIES.filter(cap => {
    const categoryMatch = selectedCategory === 'all' || cap.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || cap.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'broken': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'untested': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working': return <CheckCircle size={14} />;
      case 'broken': return <XCircle size={14} />;
      case 'untested': return <AlertCircle size={14} />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl h-[80vh] bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-premium overflow-hidden flex flex-col z-50"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-lira-pink/5 to-transparent">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Code className="text-lira-pink" size={24} />
              Admin Panel - Lira Functions
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Todas as capacidades e function calls disponíveis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-white/5 bg-[#121215] flex flex-wrap gap-3">
          <div className="flex gap-2">
            <span className="text-xs text-gray-500 uppercase font-bold self-center">Categoria:</span>
            {['all', 'widgets', 'tools', 'integrations'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-lira-pink text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            <span className="text-xs text-gray-500 uppercase font-bold self-center">Status:</span>
            {['all', 'working', 'broken', 'untested'].map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedStatus === status
                    ? 'bg-lira-blue text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCapabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <motion.div
                  key={cap.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#18181b] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-lira-pink/10 rounded-lg text-lira-pink shrink-0">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-sm">{cap.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 border ${getStatusColor(cap.status)}`}>
                          {getStatusIcon(cap.status)}
                          {cap.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{cap.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-1 bg-white/5 rounded text-gray-500 uppercase font-bold">
                          {cap.category}
                        </span>
                      </div>
                      {cap.example && (
                        <div className="mt-3 p-2 bg-black/40 rounded border border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Exemplo:</p>
                          <code className="text-[11px] text-green-400 font-mono break-all">
                            {cap.example}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredCapabilities.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma função encontrada com esses filtros</p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-white/10 bg-[#121215] flex items-center justify-between">
          <div className="flex gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-400">
                {LIRA_CAPABILITIES.filter(c => c.status === 'working').length} Funcionando
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-gray-400">
                {LIRA_CAPABILITIES.filter(c => c.status === 'untested').length} Não Testadas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-gray-400">
                {LIRA_CAPABILITIES.filter(c => c.status === 'broken').length} Quebradas
              </span>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            Total: {LIRA_CAPABILITIES.length} funções
          </span>
        </div>
      </motion.div>
    </div>
  );
};
