import React, { useState } from "react";
import { safeGenerateCodeChange } from "../services/llmOrchestrator";
import { registerSelfImproveApplied } from "../services/gamificationService";

interface Props {
  filePath: string;
  initialContent: string;
  onGamificationUpdate?: () => void;
  onApplyChanges?: (newContent: string) => void;
}

type WorkflowStep = 'input' | 'review' | 'approved' | 'applied';

export const CodeRefactorPanel: React.FC<Props> = ({
  filePath,
  initialContent,
  onGamificationUpdate,
  onApplyChanges,
}) => {
  const [goal, setGoal] = useState("");
  const [learningMode, setLearningMode] = useState(true);
  const [output, setOutput] = useState("");
  const [explanation, setExplanation] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('input');
  const [isUsingAI, setIsUsingAI] = useState(false);
  const [aiStatus, setAiStatus] = useState<'checking' | 'ai' | 'fallback'>('checking');

  async function handleGenerateProposal() {
    setLoading(true);
    setExplanation("");
    setWarnings([]);
    setCurrentStep('review');
    try {
      const result = await safeGenerateCodeChange({
        filePath,
        currentContent: initialContent,
        goal,
        learningMode,
      });
      setOutput(result.updatedContent);
      if (result.explanation) {
        setExplanation(result.explanation);
      }
      if (result.warnings) {
        setWarnings(result.warnings);
      }
    } catch (e: any) {
      setExplanation("Erro ao gerar mudança de código: " + (e?.message ?? String(e)));
      setCurrentStep('input');
    } finally {
      setLoading(false);
    }
  }

  function handleApprove() {
    setCurrentStep('approved');
  }

  function handleReject() {
    setOutput("");
    setExplanation("");
    setWarnings([]);
    setCurrentStep('input');
  }

  async function handleApplyChanges() {
    if (output && onApplyChanges) {
      try {
        // 1) Aplicar mudanças no arquivo
        await onApplyChanges(output);

        // 2) Registrar evento de gamificação
        await registerSelfImproveApplied(filePath);

        // 3) Avisar o painel de gamificação para atualizar
        onGamificationUpdate?.();

        setCurrentStep('applied');
      } catch (error) {
        console.error('Erro ao aplicar mudanças:', error);
        alert('Erro ao aplicar mudanças. Tente novamente.');
      }
    }
  }

  function handleNewProposal() {
    setOutput("");
    setExplanation("");
    setWarnings([]);
    setCurrentStep('input');
  }

  // Verificar status da IA na inicialização
  React.useEffect(() => {
    const checkAIStatus = () => {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log('🔍 Verificando API key:', {
        apiKey: apiKey ? apiKey.substring(0, 10) + '...' : 'não encontrada',
        isValid: apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey !== 'your_real_gemini_api_key_here' && apiKey !== 'PLACEHOLDER_API_KEY',
        allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
      });

      if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey !== 'your_real_gemini_api_key_here' && apiKey !== 'PLACEHOLDER_API_KEY') {
        setAiStatus('ai');
        console.log('✅ IA Real detectada');
      } else {
        setAiStatus('fallback');
        console.log('🎭 Modo simulação ativo');
      }
    };
    checkAIStatus();
  }, []);

  return (
    <div style={{ display: "grid", gap: 16, padding: "20px", backgroundColor: "#0f172a", color: "#f8fafc", borderRadius: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ margin: 0, color: "#38bdf8" }}>🔧 Refatoração Guiada pela Lira</h2>
          <div style={{
            fontSize: "11px",
            padding: "4px 8px",
            borderRadius: "12px",
            backgroundColor: aiStatus === 'ai' ? "#22c55e" : "#eab308",
            color: aiStatus === 'ai' ? "#0f172a" : "#0f172a",
            fontWeight: "bold",
            textTransform: "uppercase"
          }}>
            {aiStatus === 'ai' ? '🤖 IA Real' : '🎭 Simulação'}
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "#64748b" }}>
          Passo: {currentStep === 'input' && '📝 Entrada'}
          {currentStep === 'review' && '👁️ Revisão'}
          {currentStep === 'approved' && '✅ Aprovado'}
          {currentStep === 'applied' && '🚀 Aplicado'}
        </div>
      </div>

      {aiStatus === 'fallback' && (
        <div style={{
          backgroundColor: "#eab308",
          color: "#0f172a",
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid #d97706",
          fontSize: "14px"
        }}>
          <strong>⚠️ Modo Simulação Ativo:</strong> Configure uma chave da API Gemini para usar IA real.
          Copie <code>.env.example</code> para <code>.env.local</code> e adicione sua chave.
        </div>
      )}

      {currentStep === 'input' && (
        <>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontWeight: "bold" }}>
              🎯 Objetivo da modificação:
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  backgroundColor: "#1e293b",
                  border: "1px solid #38bdf8",
                  borderRadius: "4px",
                  padding: "8px",
                  color: "#f8fafc",
                  fontFamily: "monospace",
                  resize: "vertical"
                }}
                placeholder="Ex: adicionar error handling, melhorar tipagem..."
              />
            </label>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={learningMode}
              onChange={(e) => setLearningMode(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span>🎓 Modo de aprendizado (explicação das mudanças)</span>
          </label>

          <button
            onClick={handleGenerateProposal}
            disabled={loading || !goal.trim()}
            style={{
              backgroundColor: loading || !goal.trim() ? "#64748b" : "#38bdf8",
              color: "#0f172a",
              border: "none",
              padding: "12px 20px",
              borderRadius: "4px",
              cursor: loading || !goal.trim() ? "not-allowed" : "pointer",
              fontWeight: "bold",
              justifyContent: "center"
            }}
          >
            {loading ? "🤖 Gerando..." : "🚀 Gerar Proposta da Lira"}
          </button>
        </>
      )}

      {currentStep === 'review' && output && (
        <>
          <div>
            <h3 style={{ margin: "0 0 8px 0", color: "#38bdf8" }}>👁️ Revisar Mudanças</h3>
          </div>

          {/* Simple diff display */}
          <div style={{ backgroundColor: "#1e293b", padding: "16px", borderRadius: "4px", border: "1px solid #38bdf8" }}>
            <h4 style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>🔍 Comparação:</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "12px", fontFamily: "monospace" }}>
              <div>
                <div style={{ color: "#ef4444", marginBottom: "8px" }}>❌ ANTES:</div>
                <pre style={{ color: "#94a3b8", maxHeight: "200px", overflowY: "auto", margin: 0 }}>
                  {initialContent.length > 500 ? initialContent.substring(0, 500) + "..." : initialContent}
                </pre>
              </div>
              <div>
                <div style={{ color: "#22c55e", marginBottom: "8px" }}>✅ DEPOIS:</div>
                <pre style={{ color: "#94a3b8", maxHeight: "200px", overflowY: "auto", margin: 0 }}>
                  {output.length > 500 ? output.substring(0, 500) + "..." : output}
                </pre>
              </div>
            </div>
          </div>

          {learningMode && explanation && (
            <div>
              <h4 style={{ margin: "0 0 8px 0", color: "#a78bfa" }}>🎓 Explicação das Mudanças</h4>
              <div style={{
                backgroundColor: "#1e293b",
                padding: "12px",
                borderRadius: "4px",
                border: "1px solid #a78bfa",
                whiteSpace: "pre-wrap",
                fontFamily: "sans-serif",
                lineHeight: "1.6"
              }}>
                {explanation}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div style={{
              backgroundColor: "#eab308",
              color: "#0f172a",
              padding: "12px",
              borderRadius: "4px",
              border: "1px solid #d97706"
            }}>
              <strong>⚠️ Avisos:</strong>
              <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                {warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={handleApprove}
              style={{
                backgroundColor: "#22c55e",
                color: "#0f172a",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              ✅ Aprovar Mudanças
            </button>
            <button
              onClick={handleReject}
              style={{
                backgroundColor: "#ef4444",
                color: "#f8fafc",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              ❌ Rejeitar
            </button>
          </div>
        </>
      )}

      {currentStep === 'approved' && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <h3 style={{ color: "#22c55e", margin: "0 0 8px 0" }}>Mudanças Aprovadas!</h3>
          <p style={{ color: "#64748b", margin: "0 0 16px 0" }}>
            Clique em "Aplicar Mudanças" para executar no arquivo real.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={handleApplyChanges}
              style={{
                backgroundColor: "#38bdf8",
                color: "#0f172a",
                border: "none",
                padding: "12px 24px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              🚀 Aplicar Mudanças
            </button>
            <button
              onClick={handleNewProposal}
              style={{
                backgroundColor: "#64748b",
                color: "#f8fafc",
                border: "none",
                padding: "12px 24px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Nova Proposta
            </button>
          </div>
        </div>
      )}

      {currentStep === 'applied' && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
          <h3 style={{ color: "#22c55e", margin: "0 0 8px 0" }}>Mudanças Aplicadas com Sucesso!</h3>
          <p style={{ color: "#64748b", margin: "0 0 16px 0" }}>
            O arquivo foi atualizado e um backup foi criado automaticamente.
          </p>
          <button
            onClick={handleNewProposal}
            style={{
              backgroundColor: "#38bdf8",
              color: "#0f172a",
              border: "none",
              padding: "12px 24px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Nova Refatoração
          </button>
        </div>
      )}
    </div>
  );
};
