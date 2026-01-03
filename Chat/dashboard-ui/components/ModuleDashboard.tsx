// components/ModuleDashboard.tsx
import React, { useEffect, useState } from "react";
import { LiraModule, getModuleMainFile } from "../services/modulesService";
import { CodeRefactorPanel } from "./CodeRefactorPanel";
import { LiraGamificationPanel } from "./LiraGamificationPanel";

interface Props {
  module: LiraModule;
  onGamificationUpdate: () => void;
}

export const ModuleDashboard: React.FC<Props> = ({ module, onGamificationUpdate }) => {
  const [mainFilePath, setMainFilePath] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModuleData = async () => {
      setLoading(true);

      // Obter caminho do arquivo principal
      const filePath = await getModuleMainFile(module);
      setMainFilePath(filePath);

      // Tentar carregar conteúdo do arquivo (simulado por enquanto)
      // Em produção, isso viria da API
      setFileContent(`# Arquivo principal do módulo ${module.name}
# Caminho: ${filePath}

# TODO: Carregar conteúdo real via API
print("Módulo ${module.id} inicializado")`);

      setLoading(false);
    };

    loadModuleData();
  }, [module]);

  if (loading) {
    return (
      <div style={{
        flex: 1,
        padding: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>📦</div>
          <div>Carregando módulo {module.name}...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 20
    }}>
      {/* Module Header */}
      <header style={{
        backgroundColor: "#1e293b",
        padding: 20,
        borderRadius: 8,
        border: "1px solid #38bdf8"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <h1 style={{
            margin: 0,
            color: "#38bdf8",
            fontSize: "24px"
          }}>
            {module.name}
          </h1>

          {/* Status badge */}
          <span style={{
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: "bold",
            textTransform: "uppercase",
            backgroundColor:
              module.status === 'active' ? '#22c55e' :
              module.status === 'developing' ? '#eab308' : '#64748b',
            color: "#0f172a"
          }}>
            {module.status}
          </span>

          {/* Priority badge */}
          <span style={{
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: "bold",
            textTransform: "uppercase",
            backgroundColor:
              module.priority === 'high' ? '#ef4444' :
              module.priority === 'medium' ? '#eab308' : '#22c55e',
            color: "#0f172a"
          }}>
            {module.priority} priority
          </span>
        </div>

        <p style={{
          margin: 0,
          color: "#94a3b8",
          fontSize: "16px",
          lineHeight: "1.5"
        }}>
          {module.description}
        </p>

        {/* Tags */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 16
        }}>
          {module.tags.map((tag, index) => (
            <span
              key={index}
              style={{
                padding: "4px 12px",
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: 16,
                color: "#38bdf8",
                fontSize: 12,
                fontWeight: "bold"
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Module Info */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginTop: 20
        }}>
          <div style={{
            backgroundColor: "#0f172a",
            padding: 12,
            borderRadius: 6,
            border: "1px solid #64748b"
          }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>TIPO</div>
            <div style={{ fontWeight: "bold", color: "#f8fafc", textTransform: "uppercase" }}>
              {module.type}
            </div>
          </div>

          <div style={{
            backgroundColor: "#0f172a",
            padding: 12,
            borderRadius: 6,
            border: "1px solid #64748b"
          }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>CAMINHO RAIZ</div>
            <div style={{ fontWeight: "bold", color: "#f8fafc", fontFamily: "monospace" }}>
              {module.root_path}
            </div>
          </div>

          <div style={{
            backgroundColor: "#0f172a",
            padding: 12,
            borderRadius: 6,
            border: "1px solid #64748b"
          }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>ARQUIVOS PRINCIPAIS</div>
            <div style={{ fontWeight: "bold", color: "#f8fafc" }}>
              {module.main_files.join(', ')}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 20,
        minHeight: 0
      }}>
        {/* Code Refactoring Panel */}
        <div style={{
          backgroundColor: "#1e293b",
          borderRadius: 8,
          border: "1px solid #64748b",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{
            padding: 16,
            borderBottom: "1px solid #64748b",
            backgroundColor: "#0f172a"
          }}>
            <h2 style={{
              margin: 0,
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              🔧 Self-Improvement: {module.name}
            </h2>
            <p style={{
              margin: "8px 0 0 0",
              color: "#94a3b8",
              fontSize: "14px"
            }}>
              Melhore automaticamente o código deste módulo com IA
            </p>
          </div>

          <div style={{ flex: 1, overflow: "hidden" }}>
            <CodeRefactorPanel
              filePath={mainFilePath}
              initialContent={fileContent}
              onGamificationUpdate={onGamificationUpdate}
              onApplyChanges={async (newContent) => {
                try {
                  // Simulação - em produção usaria fileManager
                  console.log('Aplicando mudanças no módulo:', module.id, newContent);
                  alert(`Mudanças aplicadas no módulo ${module.name}! (+25 XP)`);
                } catch (error) {
                  console.error('Erro ao aplicar mudanças:', error);
                  alert('Erro ao aplicar mudanças. Tente novamente.');
                }
              }}
            />
          </div>
        </div>

        {/* Gamification Panel */}
        <div style={{
          backgroundColor: "#1e293b",
          borderRadius: 8,
          border: "1px solid #38bdf8",
          height: "fit-content"
        }}>
          <LiraGamificationPanel refreshKey={Date.now()} />
        </div>
      </div>
    </div>
  );
};
