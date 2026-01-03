import React, { useState, useEffect } from 'react';
import { ModuleSidebar } from './components/ModuleSidebar';
import { ModuleDashboard } from './components/ModuleDashboard';
import { LiraModule, fetchModule } from './services/modulesService';

const App: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<LiraModule | null>(null);
  const [refreshGamification, setRefreshGamification] = useState(0);

  useEffect(() => {
    const loadSelectedModule = async () => {
      if (selectedModuleId) {
        const module = await fetchModule(selectedModuleId);
        setSelectedModule(module);
      } else {
        setSelectedModule(null);
      }
    };

    loadSelectedModule();
  }, [selectedModuleId]);

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif',
      minHeight: '100vh',
      overflowY: 'auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <img
            src="/assets/lira-pfp.png"
            alt="Lira Logo"
            style={{
              width: "140px",
              marginBottom: "20px",
              objectFit: "contain"
            }}
          />
        </div>
        <p style={{ color: '#94a3b8' }}>
          Sistema baseado em módulos! Selecione um módulo para trabalhar.
        </p>
      </div>

      <div style={{
        display: 'flex',
        height: 'calc(100vh - 140px)',
        gap: '20px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Module Sidebar */}
        <ModuleSidebar
          selectedId={selectedModuleId}
          onSelect={setSelectedModuleId}
        />

        {/* Main Content Area */}
        {selectedModule ? (
          <ModuleDashboard
            module={selectedModule}
            onGamificationUpdate={() => setRefreshGamification((v) => v + 1)}
          />
        ) : (
          <div style={{
            flex: 1,
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            border: '1px solid #64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>📦</div>
              <h2 style={{ color: '#38bdf8', marginBottom: '16px' }}>
                Selecione um Módulo da Lira
              </h2>
              <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
                Escolha um módulo na barra lateral para:<br />
                • Visualizar detalhes e arquivos<br />
                • Melhorar código com IA<br />
                • Ganhar XP e subir de nível<br />
                • Ver status e métricas
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
