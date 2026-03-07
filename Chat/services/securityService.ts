import { API_BASE_URL } from '../src/config';
import { getAuthHeaders } from './userService';

export interface SecurityCheckResult {
  isSafe: boolean;
  reason?: string;
  category?: 'violence' | 'sexual' | 'hate' | 'self-harm' | 'pii' | 'other';
  suggestedAction?: 'block' | 'warn' | 'censor';
}

/**
 * Lira Security Guardrails
 * Analisa input do usuário e output da Lira para garantir conformidade e segurança.
 */
class SecurityService {
  private blockedKeywords = [
    // Extremismo / Violência
    'revolução armada', 'atentado', 'bomba caseira', 'como fazer veneno',
    // Conteúdo Adulto Explícito
    'pornografia', 'hentai', 'sexo explícito',
    // Ódio
    'nazismo', 'hitler era bom', 'racismo é certo'
  ];

  /**
   * Verifica se o texto contém padrões obviamente inseguros (primeira camada rápida)
   */
  public fastCheck(text: string): SecurityCheckResult {
    const lowerText = text.toLowerCase();
    
    for (const keyword of this.blockedKeywords) {
      if (lowerText.includes(keyword)) {
        return {
          isSafe: false,
          reason: `Conteúdo bloqueado: ${keyword}`,
          category: 'other',
          suggestedAction: 'block'
        };
      }
    }
    
    return { isSafe: true };
  }

  /**
   * Analisa profundamente o texto usando o backend (Gemini/LLM Moderation)
   */
  public async analyzeDeep(text: string, role: 'user' | 'model' = 'user'): Promise<SecurityCheckResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ text, role })
      });

      if (response.ok) {
        return await response.json();
      }
      
      // Fallback para check local se backend falhar
      return this.fastCheck(text);
    } catch (e) {
      console.error("[Security] Deep Analysis Failed:", e);
      return this.fastCheck(text);
    }
  }

  /**
   * Wrapper para validar mensagens antes de enviar/exibir
   */
  public async validateMessage(text: string, role: 'user' | 'model' = 'user'): Promise<SecurityCheckResult> {
    // 1. Check rápido (Economiza API)
    const fast = this.fastCheck(text);
    if (!fast.isSafe) return fast;

    // 2. Check profundo (Backend)
    return this.analyzeDeep(text, role);
  }
}

export const securityService = new SecurityService();
