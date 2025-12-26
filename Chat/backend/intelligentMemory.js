import { getMemories, addMemory } from './memoryStore.js';

/**
 * Sistema de Memória Inteligente - Extração e Relevância Automática
 * Baseado no ChatGPT-level memory system
 */

const MEMORY_CATEGORIES = {
  PERSONAL_INFO: 'personal_info',
  PREFERENCES: 'preferences', 
  PROJECTS: 'projects',
  CONVERSATIONS: 'conversations',
  LEARNING: 'learning',
  IMPORTANT_DATES: 'important_dates',
  CONTACTS: 'contacts',
  GENERAL: 'general'
};

const RELEVANCE_KEYWORDS = {
  [MEMORY_CATEGORIES.PERSONAL_INFO]: [
    'my name is', 'i am', "i'm", 'birthday', 'age', 'live in', 'from', 'city', 
    'phone', 'email', 'address', 'family', 'married', 'single'
  ],
  [MEMORY_CATEGORIES.PREFERENCES]: [
    'i like', 'i love', 'i prefer', 'i hate', 'i dislike', 'favorite',
    'hobby', 'interest', 'music', 'food', 'movie', 'book', 'color'
  ],
  [MEMORY_CATEGORIES.PROJECTS]: [
    'project', 'work', 'job', 'career', 'startup', 'business', 'company',
    'task', 'assignment', 'deadline', 'milestone'
  ],
  [MEMORY_CATEGORIES.IMPORTANT_DATES]: [
    'meeting', 'appointment', 'deadline', 'birthday', 'anniversary',
    'event', 'conference', 'trip', 'vacation'
  ],
  [MEMORY_CATEGORIES.CONTACTS]: [
    'friend', 'colleague', 'boss', 'client', 'contact', 'know',
    'met', 'introduction', 'recommendation'
  ]
};

/**
 * Extrai informações importantes automaticamente de uma mensagem
 */
export async function extractImportantInfo(message) {
  const content = message.content.toLowerCase();
  const extracted = {
    categories: [],
    entities: [],
    importanceScore: 0,
    extractedFacts: []
  };

  // Detectar categoria
  for (const [category, keywords] of Object.entries(RELEVANCE_KEYWORDS)) {
    const matches = keywords.filter(keyword => content.includes(keyword));
    if (matches.length > 0) {
      extracted.categories.push(category);
    }
  }

  // Extrair fatos específicos
  extracted.extractedFacts = extractFacts(content, extracted.categories);
  
  // Calcular score de importância
  extracted.importanceScore = calculateImportanceScore(content, extracted.categories);

  // Extrair entidades (nomes, lugares, etc.)
  extracted.entities = extractEntities(content);

  return extracted;
}

/**
 * Extrai fatos específicos baseado na categoria
 */
function extractFacts(content, categories) {
  const facts = [];
  
  if (categories.includes(MEMORY_CATEGORIES.PERSONAL_INFO)) {
    // Extrair informações pessoais
    const nameMatch = content.match(/my name is ([a-zA-Z\s]+)/i);
    if (nameMatch) facts.push(`Nome: ${nameMatch[1].trim()}`);
    
    const locationMatch = content.match(/i live in ([a-zA-Z\s]+)/i);
    if (locationMatch) facts.push(`Localização: ${locationMatch[1].trim()}`);
    
    const ageMatch = content.match(/i am (\d+) years old/i);
    if (ageMatch) facts.push(`Idade: ${ageMatch[1]} anos`);
  }

  if (categories.includes(MEMORY_CATEGORIES.PREFERENCES)) {
    // Extrair preferências
    const likeMatch = content.match(/i (?:like|love) ([^.,!?]+)/i);
    if (likeMatch) facts.push(`Gosta de: ${likeMatch[1].trim()}`);
    
    const hateMatch = content.match(/i (?:hate|dislike) ([^.,!?]+)/i);
    if (hateMatch) facts.push(`Não gosta de: ${hateMatch[1].trim()}`);
  }

  if (categories.includes(MEMORY_CATEGORIES.PROJECTS)) {
    // Extrair informações de projetos
    const projectMatch = content.match(/working on (.+?)(?:\.|,|$)/i);
    if (projectMatch) facts.push(`Projeto: ${projectMatch[1].trim()}`);
  }

  return facts;
}

/**
 * Calcula score de importância (0-100)
 */
function calculateImportanceScore(content, categories) {
  let score = 0;
  
  // Base score por categoria
  score += categories.length * 10;
  
  // Bonus por palavras-chave importantes
  const importantWords = ['important', 'remember', 'don\'t forget', 'crucial', 'vital'];
  for (const word of importantWords) {
    if (content.includes(word)) score += 20;
  }
  
  // Bonus por informações pessoais
  if (categories.includes(MEMORY_CATEGORIES.PERSONAL_INFO)) score += 30;
  
  // Bonus por preferências
  if (categories.includes(MEMORY_CATEGORIES.PREFERENCES)) score += 25;
  
  // Penalty por conversas casuais
  if (content.includes('just') || content.includes('btw') || content.includes('lol')) score -= 10;
  
  return Math.min(100, Math.max(0, score));
}

/**
 * Extrai entidades (nomes, lugares, etc.)
 */
function extractEntities(content) {
  const entities = [];
  
  // Nomes próprios (simplificado)
  const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  const names = content.match(namePattern);
  if (names) entities.push(...names);
  
  // Lugares (simplificado)
  const placePattern = /\b(?:in|at|from) ([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g;
  const places = content.matchAll(placePattern);
  for (const match of places) {
    entities.push(`Lugar: ${match[1]}`);
  }
  
  return entities;
}

/**
 * Busca memórias relevantes para o contexto atual
 */
export async function getRelevantMemories(currentMessage, allMemories, limit = 5) {
  if (!allMemories || allMemories.length === 0) return [];
  
  const scoredMemories = allMemories.map(memory => {
    const relevance = calculateRelevance(currentMessage, memory);
    return {
      ...memory,
      relevanceScore: relevance
    };
  });
  
  // Filtrar apenas memórias relevantes e ordenar por score
  const relevant = scoredMemories
    .filter(m => m.relevanceScore > 20) // Threshold mínimo
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
  
  return relevant;
}

/**
 * Calcula relevância entre mensagem atual e memória
 */
function calculateRelevance(currentMessage, memory) {
  const current = currentMessage.toLowerCase();
  const stored = memory.content.toLowerCase();
  
  let score = 0;
  
  // Overlap de palavras-chave
  const currentWords = current.split(/\s+/);
  const storedWords = stored.split(/\s+/);
  const commonWords = currentWords.filter(word => 
    word.length > 3 && storedWords.includes(word)
  );
  score += commonWords.length * 5;
  
  // Categoria similar
  const currentCategories = extractImportantInfo({ content: currentMessage }).categories;
  const memoryCategories = memory.categories || [];
  const commonCategories = currentCategories.filter(cat => memoryCategories.includes(cat));
  score += commonCategories.length * 15;
  
  // Recência (memórias mais recentes são mais relevantes)
  const daysDiff = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24);
  const recencyBonus = Math.max(0, 30 - daysDiff);
  score += recencyBonus;
  
  // Bonus por informações pessoais
  if (memory.categories?.includes(MEMORY_CATEGORIES.PERSONAL_INFO)) {
    score += 25;
  }
  
  return Math.min(100, score);
}

/**
 * Processa uma nova mensagem e extrai informações automaticamente
 */
export async function processMessageForMemory(message, userId = 'default') {
  try {
    const extracted = await extractImportantInfo(message);
    
    // Só salvar se tiver relevância mínima
    if (extracted.importanceScore >= 30 && extracted.categories.length > 0) {
      const memoryContent = formatMemoryContent(message, extracted);
      
      const memory = await addMemory(
        memoryContent, 
        [
          ...extracted.categories,
          `auto_extracted`,
          `score_${extracted.importanceScore}`
        ],
        'note',
        'medium',
        userId
      );
      
      return memory;
    }
    
    return null;
  } catch (error) {
    console.error('Error processing message for memory:', error);
    return null;
  }
}

/**
 * Formata o conteúdo da memória de forma otimizada
 */
function formatMemoryContent(message, extracted) {
  let formatted = message.content;
  
  // Adicionar fatos extraídos
  if (extracted.extractedFacts.length > 0) {
    formatted += `\n\n[Fatos extraídos: ${extracted.extractedFacts.join('; ')}]`;
  }
  
  // Adicionar entidades
  if (extracted.entities.length > 0) {
    formatted += `\n[Entidades: ${extracted.entities.join('; ')}]`;
  }
  
  // Adicionar importância
  formatted += `\n[Importância: ${extracted.importanceScore}/100]`;
  
  return formatted;
}

/**
 * Sistema de resumo de conversas longas
 */
export async function generateConversationSummary(conversation) {
  if (!conversation || conversation.length < 10) return null;
  
  // Simplificado - em produção usaria IA para resumo
  const recentMessages = conversation.slice(-10);
  const summary = recentMessages
    .filter(m => m.role === 'user')
    .map(m => m.content.substring(0, 100))
    .join('; ');
  
  return {
    id: `summary_${Date.now()}`,
    content: `Resumo da conversa: ${summary}...`,
    createdAt: Date.now(),
    categories: ['conversation_summary'],
    tags: ['auto_generated', 'summary']
  };
}
