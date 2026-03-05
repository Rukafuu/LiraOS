/**
 * 📋 CHANGELOG DATA
 * 
 * Adicione novas entradas NO TOPO do array.
 * O sistema mostra automaticamente um badge quando o usuário
 * não viu a versão mais recente.
 * 
 * Tipos: 'feature' | 'fix' | 'improvement' | 'security'
 */

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: {
    type: 'feature' | 'fix' | 'improvement' | 'security';
    text: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '2.7.0',
    date: '2025-03-05',
    title: '💳 Sistema de Pagamento & Melhorias',
    description: 'Novo sistema de assinatura Premium com Stripe e diversas melhorias de qualidade.',
    changes: [
      { type: 'feature', text: 'Novo sistema de pagamento via Stripe (Vega, Sirius, Antares, Supernova)' },
      { type: 'feature', text: 'Página de pricing com toggle BRL/USD' },
      { type: 'feature', text: 'Portal do cliente para gerenciar assinatura' },
      { type: 'improvement', text: 'Geração de imagem agora usa Google Gemini para todos os tiers' },
      { type: 'fix', text: 'Correção do erro email_not_found na recuperação de senha' },
      { type: 'improvement', text: 'Sistema de feedback agora captura logs de erro automaticamente' },
      { type: 'security', text: 'Migração do user_store de Firestore para PostgreSQL/Prisma' },
      { type: 'fix', text: 'Correção do erro de foreign key na gamificação' },
    ]
  },
  {
    version: '2.6.0',
    date: '2025-02-28',
    title: '🎨 Frutiger Aero & Novas Features',
    description: 'Design renovado, novas integrações e melhorias de performance.',
    changes: [
      { type: 'feature', text: 'Novo design Frutiger Aero com glassmorphism' },
      { type: 'feature', text: 'Integração com Discord Bot' },
      { type: 'feature', text: 'Sistema de gamificação com XP e moedas' },
      { type: 'improvement', text: 'Performance melhorada no carregamento de sessões' },
      { type: 'feature', text: 'Photo Booth com Live2D' },
    ]
  }
];

export default changelog;
