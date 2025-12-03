import React, { useState, useEffect } from 'react';
import { Activity, MessageSquare, Users, Settings, Server, Database, Zap, BarChart3 } from 'lucide-react';

interface DashboardProps {
  onBackToChat?: () => void;
}

interface SystemStats {
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
  systemUptime: string;
  memoryUsage: string;
  apiCalls: number;
}

const Dashboard: React.FC<DashboardProps> = ({ onBackToChat }) => {
  const [stats, setStats] = useState<SystemStats>({
    totalConversations: 0,
    totalMessages: 0,
    activeUsers: 0,
    systemUptime: '00:00:00',
    memoryUsage: '0 MB',
    apiCalls: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading system stats
  useEffect(() => {
    const loadStats = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get data from localStorage
      const sessions = JSON.parse(localStorage.getItem('lira_sessions') || '[]');
      const totalMessages = sessions.reduce((total: number, session: any) =>
        total + (session.messages?.length || 0), 0
      );

      // Mock some stats
      setStats({
        totalConversations: sessions.length,
        totalMessages,
        activeUsers: Math.floor(Math.random() * 10) + 1, // Mock active users
        systemUptime: '02:30:15', // Mock uptime
        memoryUsage: '45.2 MB', // Mock memory usage
        apiCalls: Math.floor(Math.random() * 1000) + 500 // Mock API calls
      });

      setIsLoading(false);
    };

    loadStats();
  }, []);

  const StatCard = ({ icon: Icon, title, value, color }: {
    icon: any;
    title: string;
    value: string | number;
    color: string;
  }) => (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h3>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <BarChart3 size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                  LiraOS Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Monitoramento e controle do sistema
                </p>
              </div>
            </div>

            <button
              onClick={() => onBackToChat?.()}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <MessageSquare size={18} />
              Voltar ao Chat
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={MessageSquare}
            title="Conversas Totais"
            value={isLoading ? "..." : stats.totalConversations}
            color="bg-blue-500"
          />
          <StatCard
            icon={Activity}
            title="Mensagens Enviadas"
            value={isLoading ? "..." : stats.totalMessages}
            color="bg-green-500"
          />
          <StatCard
            icon={Users}
            title="Usuários Ativos"
            value={isLoading ? "..." : stats.activeUsers}
            color="bg-purple-500"
          />
          <StatCard
            icon={Server}
            title="Uptime do Sistema"
            value={isLoading ? "..." : stats.systemUptime}
            color="bg-indigo-500"
          />
          <StatCard
            icon={Database}
            title="Uso de Memória"
            value={isLoading ? "..." : stats.memoryUsage}
            color="bg-orange-500"
          />
          <StatCard
            icon={Zap}
            title="Chamadas de API"
            value={isLoading ? "..." : stats.apiCalls}
            color="bg-cyan-500"
          />
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* System Health */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Server size={20} />
              Status do Sistema
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Status do Backend</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">Online</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Status da IA</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">Ativo</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Banco de Dados</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">Conectado</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Sistema de Email</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-600 font-medium">Configurando</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Activity size={20} />
              Atividade Recente
            </h2>

            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 dark:text-slate-200">Nova conversa iniciada</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">há 2 minutos</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 dark:text-slate-200">Mensagem processada com sucesso</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">há 5 minutos</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 dark:text-slate-200">Usuário fez login</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">há 10 minutos</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 dark:text-slate-200">Sistema de memória atualizado</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">há 15 minutos</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Settings size={20} />
            Ações Rápidas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300">
              Limpar Cache
            </button>
            <button className="p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300">
              Gerar Relatório
            </button>
            <button className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300">
              Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
