// components/LiraGamificationPanel.tsx
import React, { useEffect, useState } from "react";
import { fetchGamificationState, GamificationState } from "../services/gamificationService";

interface Props {
  refreshKey?: number; // pra forçar recarregar quando algo muda
}

export const LiraGamificationPanel: React.FC<Props> = ({ refreshKey }) => {
  const [state, setState] = useState<GamificationState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadState = async () => {
      setLoading(true);
      const data = await fetchGamificationState();
      setState(data);
      setLoading(false);
    };

    loadState();
  }, [refreshKey]);

  if (loading) {
    return (
      <div style={{
        padding: "20px",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #38bdf8",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "24px", marginBottom: "10px" }}>🎮</div>
        <div>Carregando status da Lira…</div>
      </div>
    );
  }

  if (!state) {
    return (
      <div style={{
        padding: "20px",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #ef4444",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "24px", marginBottom: "10px" }}>❌</div>
        <div>Erro ao carregar gamificação</div>
      </div>
    );
  }

  const percent =
    state.next_level_xp > 0 ? Math.min(100, (state.xp / state.next_level_xp) * 100) : 0;

  return (
    <div style={{
      display: "grid",
      gap: 16,
      padding: "20px",
      backgroundColor: "#0f172a",
      color: "#f8fafc",
      borderRadius: "8px",
      border: "1px solid #38bdf8"
    }}>
      <h2 style={{
        margin: 0,
        color: "#38bdf8",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}>
        🎮 Gamificação da Lira
      </h2>

      <div style={{
        backgroundColor: "#1e293b",
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid #64748b"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px"
        }}>
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>
            Nível: <span style={{ color: "#22c55e" }}>{state.level}</span>
          </span>
          <span style={{ fontSize: "14px", color: "#94a3b8" }}>
            ⭐ {state.xp} / {state.next_level_xp} XP
          </span>
        </div>

        <div style={{
          height: 12,
          backgroundColor: "#374151",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: "8px"
        }}>
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              borderRadius: 999,
              backgroundColor: "#22c55e",
              transition: "width 0.3s ease"
            }}
          />
        </div>

        <div style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
          {Math.round(percent)}% para o próximo nível
        </div>
      </div>

      <div style={{
        backgroundColor: "#1e293b",
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid #64748b"
      }}>
        <h3 style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>🏆 Badges</h3>
        {state.badges.length === 0 ? (
          <p style={{ margin: 0, color: "#94a3b8", fontStyle: "italic" }}>
            Nenhuma badge… ainda.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {state.badges.map((badge, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: "#38bdf8",
                  color: "#0f172a",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold"
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: "#1e293b",
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid #64748b"
      }}>
        <h3 style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>📊 Estatísticas</h3>
        {Object.keys(state.stats).length === 0 ? (
          <p style={{ margin: 0, color: "#94a3b8", fontStyle: "italic" }}>
            Nenhuma estatística disponível
          </p>
        ) : (
          <div style={{ display: "grid", gap: "6px" }}>
            {Object.entries(state.stats).map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  borderBottom: "1px solid #374151"
                }}
              >
                <span style={{ color: "#94a3b8" }}>{key}:</span>
                <span style={{ color: "#f8fafc", fontWeight: "bold" }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {state.history && state.history.length > 0 && (
        <div style={{
          backgroundColor: "#1e293b",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid #64748b",
          maxHeight: "200px",
          overflowY: "auto"
        }}>
          <h3 style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>📜 Últimas Atividades</h3>
          <div style={{ display: "grid", gap: "8px" }}>
            {state.history.slice(0, 5).map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#0f172a",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #374151",
                  fontSize: "12px"
                }}
              >
                <div style={{ color: "#38bdf8", fontWeight: "bold" }}>
                  {item.event.replace('_', ' ')}
                </div>
                <div style={{ color: "#94a3b8", marginTop: "2px" }}>
                  +{item.xp} XP • {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
