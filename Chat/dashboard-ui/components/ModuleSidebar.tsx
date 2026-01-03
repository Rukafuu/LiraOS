// components/ModuleSidebar.tsx
import React, { useEffect, useState } from "react";
import { fetchModules, LiraModule, getModuleStatusColor, getModulePriorityColor } from "../services/modulesService";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const ModuleSidebar: React.FC<Props> = ({ selectedId, onSelect }) => {
  const [modules, setModules] = useState<LiraModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModules = async () => {
      setLoading(true);
      const data = await fetchModules();
      setModules(data);
      setLoading(false);
    };

    loadModules();
  }, []);

  if (loading) {
    return (
      <aside style={{
        width: 280,
        borderRight: "1px solid #64748b",
        padding: 16,
        backgroundColor: "#1e293b"
      }}>
        <h3 style={{ margin: "0 0 20px 0", color: "#38bdf8" }}>📦 Carregando módulos...</h3>
        <div style={{ color: "#94a3b8" }}>Aguarde...</div>
      </aside>
    );
  }

  // Agrupar módulos por prioridade
  const groupedModules = modules.reduce((acc, module) => {
    if (!acc[module.priority]) {
      acc[module.priority] = [];
    }
    acc[module.priority].push(module);
    return acc;
  }, {} as Record<string, LiraModule[]>);

  const priorityOrder = ['high', 'medium', 'low'];

  return (
    <aside style={{
      width: 280,
      borderRight: "1px solid #64748b",
      padding: 16,
      backgroundColor: "#1e293b",
      overflowY: "auto"
    }}>
      <h3 style={{ margin: "0 0 20px 0", color: "#38bdf8" }}>📦 Módulos da Lira</h3>

      {priorityOrder.map(priority => {
        const priorityModules = groupedModules[priority];
        if (!priorityModules || priorityModules.length === 0) return null;

        return (
          <div key={priority} style={{ marginBottom: 24 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              paddingBottom: 4,
              borderBottom: "1px solid #374151"
            }}>
              <span style={{
                color: getModulePriorityColor(priority),
                fontSize: "12px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                {priority === 'high' && '🔴'}
                {priority === 'medium' && '🟡'}
                {priority === 'low' && '🟢'}
                {priority}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {priorityModules.map((module) => (
                <div
                  key={module.id}
                  onClick={() => onSelect(module.id)}
                  style={{
                    padding: "12px",
                    cursor: "pointer",
                    borderRadius: 6,
                    border: selectedId === module.id ? "2px solid #38bdf8" : "1px solid #64748b",
                    backgroundColor: selectedId === module.id ? "#0f172a" : "#1a2332",
                    transition: "all 0.2s ease",
                    position: "relative"
                  }}
                  onMouseEnter={(e) => {
                    if (selectedId !== module.id) {
                      e.currentTarget.style.backgroundColor = "#252f3f";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedId !== module.id) {
                      e.currentTarget.style.backgroundColor = "#1a2332";
                    }
                  }}
                >
                  {/* Status indicator */}
                  <div style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: getModuleStatusColor(module.status)
                  }} />

                  <div style={{ fontWeight: 600, marginBottom: 4, color: "#f8fafc" }}>
                    {module.name}
                  </div>

                  <div style={{
                    fontSize: 13,
                    color: "#94a3b8",
                    marginBottom: 6,
                    lineHeight: "1.4"
                  }}>
                    {module.description}
                  </div>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {module.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          fontSize: 11,
                          color: "#38bdf8",
                          backgroundColor: "rgba(56, 189, 248, 0.1)",
                          padding: "2px 6px",
                          borderRadius: 10,
                          border: "1px solid rgba(56, 189, 248, 0.3)"
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {module.tags.length > 3 && (
                      <span style={{
                        fontSize: 11,
                        color: "#64748b"
                      }}>
                        +{module.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Type badge */}
                  <div style={{
                    marginTop: 8,
                    display: "inline-block",
                    fontSize: 11,
                    color: "#0f172a",
                    backgroundColor: "#38bdf8",
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontWeight: "bold",
                    textTransform: "uppercase"
                  }}>
                    {module.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </aside>
  );
};
