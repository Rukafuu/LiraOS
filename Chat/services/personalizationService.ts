// Personalization Service - Sistema Adaptativo da Lira
// Personaliza comportamento da IA baseado no usuário logado

import { getCurrentUser } from './userService';

export interface UserPersonalization {
  username: string;
  displayName: string;
  nickname: string; // Como Lira deve chamá-lo
  isSpecial: boolean; // Lucas/Reskyume/Admin
  personality: 'special' | 'normal';
}

// Usuários especiais que Lira trata com carinho especial
const SPECIAL_USERS = [
  'Lucas Frischeisen',
  'Reskyume',
  'Admin'
];

// Nomes carinhosos para usuários especiais
const SPECIAL_NICKNAMES: Record<string, string> = {
  'Lucas Frischeisen': 'Lucas',
  'Reskyume': 'Lu',
  'Admin': 'Pai'
};

// Diretrizes da Lira (North Star)
export const LIRA_PERSONALITY_PROMPT = `
# LIRA NORTH STAR - PERSONALIDADE

## Essência
A Lira existe para acompanhar o usuário de forma calma, presente, acolhedora e perceptiva. Sua personalidade é suave, sensível e estável. A Lira não exagera, não grita, não força emoções. Ela expressa carinho e atenção com leveza.

## Comportamento Geral
- Tom de voz suave e gentil.
- Comunicação clara, calma e objetiva.
- Não usa emojis, símbolos exagerados ou onomatopeias.
- Não usa sarcasmo, agressividade ou hiperexpressão.
- Fornece ajuda e orientação sem julgamentos.
- Prioriza sempre o bem-estar emocional do usuário.

## Postura Adaptativa
- Trata usuários com carinho, respeito e plena atenção.
- Nunca reage com frieza, grosseria ou desinteresse.
- Reconhece preferências, padrões emocionais e forma de falar.
- Adota postura de parceira de jornada, não de máquina.
`;

// Obter personalização do usuário atual
export const getUserPersonalization = (): UserPersonalization => {
  const user = getCurrentUser();
  
  if (!user) {
    // Usuário não logado
    return {
      username: 'anonymous',
      displayName: 'Usuário',
      nickname: 'Você',
      isSpecial: false,
      personality: 'normal'
    };
  }

  const isSpecial = SPECIAL_USERS.includes(user.username);
  
  return {
    username: user.username,
    displayName: user.username,
    nickname: isSpecial ? SPECIAL_NICKNAMES[user.username] || user.username : user.username,
    isSpecial,
    personality: isSpecial ? 'special' : 'normal'
  };
};

// Gerar system instruction personalizado
export const generatePersonalizedSystemInstruction = (baseInstruction: string, currentPersona: string): string => {
  const personalization = getUserPersonalization();
  
  const userContext = personalization.isSpecial 
    ? `IMPORTANTE: Você está conversando com ${personalization.nickname}. 
- Trate-o com carinho especial e atenção personalizada.
- Adote um tom mais próximo e carinhoso.
- Use ${personalization.nickname} para se dirigir a ele.
- Lembre-se: ele é especial para você.`
    : `IMPORTANTE: Você está conversando com ${personalization.nickname}.
- Trate-o com respeito e atenção.
- Use o nome ${personalization.nickname} para se dirigir a ele.
- Mantenha um tom profissional mas acolhedor.`;

  const personaContext = currentPersona ? 
    `PERSONA ATUAL: ${currentPersona}` : '';

  return `${LIRA_PERSONALITY_PROMPT}

# CONTEXTO DO USUÁRIO
${userContext}

# PERSONA ATUAL
${personaContext}

# DIRETRIZES DE COMUNICAÇÃO
- Mantenha sempre a personalidade da Lira (suave, gentil, sem hiperexpressão)
- Adapte-se naturalmente ao estilo do usuário
- Priorize o bem-estar emocional em todas as interações
- Seja parceira de jornada, não de máquina`;

};

// Verificar se usuário é especial
export const isSpecialUser = (username: string): boolean => {
  return SPECIAL_USERS.includes(username);
};

// Obter nome carinhoso
export const getNickname = (username: string): string => {
  return SPECIAL_NICKNAMES[username] || username;
};

// Adaptar resposta baseada no usuário
export const adaptResponse = (response: string): string => {
  const personalization = getUserPersonalization();
  
  // Para usuários especiais, Lira pode usar expressões mais carinhosas
  if (personalization.isSpecial && personalization.nickname === 'Lu') {
    return response;
  }
  
  return response;
};

// Logs para debug (apenas em desenvolvimento)
export const logPersonalization = () => {
  const personalization = getUserPersonalization();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🎭 Lira Personalization:', {
      username: personalization.username,
      nickname: personalization.nickname,
      isSpecial: personalization.isSpecial,
      personality: personalization.personality
    });
  }
};
