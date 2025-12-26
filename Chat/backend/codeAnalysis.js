// 🧠 Sistema Avançado de Análise de Código - LiraOS
// Funções para processar e analisar scripts/enviados

// Detectar linguagem de programação pela extensão
export const detectLanguage = (filename) => {
  const ext = filename.toLowerCase().split('.').pop();
  const languageMap = {
    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    
    // Python
    'py': 'python',
    'pyx': 'cython',
    
    // Web
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    
    // Config files
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'sql': 'sql',
    
    // Shell scripts
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'fish': 'fish',
    
    // Other languages
    'php': 'php',
    'rb': 'ruby',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'r': 'r',
    
    // Documentation
    'md': 'markdown',
    'txt': 'text',
    'log': 'log'
  };
  
  return languageMap[ext] || 'unknown';
};

// Detectar tipo de arquivo
export const detectFileType = (filename, content = '') => {
  const ext = filename.toLowerCase().split('.').pop();
  
  // Executáveis危险
  const dangerousExts = ['exe', 'bat', 'cmd', 'com', 'scr', 'msi', 'deb', 'rpm', 'dmg', 'pkg'];
  if (dangerousExts.includes(ext)) return 'executable';
  
  // Scripts de código
  const codeExts = ['js', 'jsx', 'ts', 'tsx', 'py', 'php', 'html', 'css', 'scss', 'sass', 'json', 'yaml', 'yml', 'xml', 'sql', 'sh', 'bash', 'rb', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'swift', 'kt', 'scala', 'r'];
  if (codeExts.includes(ext)) return 'script';
  
  // Imagens
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'];
  if (imageExts.includes(ext)) return 'image';
  
  // Documentos
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'];
  if (docExts.includes(ext)) return 'document';
  
  // Arquivos de texto
  if (content.startsWith('<?xml') || content.includes('<html') || content.includes('<')) return 'markup';
  if (content.includes('{') && content.includes('}')) return 'data';
  
  return 'text';
};

// Extrair informações do código
export const analyzeCode = (content, filename) => {
  const language = detectLanguage(filename);
  const analysis = {
    language,
    filename,
    lines: content.split('\n').length,
    characters: content.length,
    functions: [],
    classes: [],
    imports: [],
    exports: [],
    comments: 0,
    complexity: 'unknown'
  };
  
  // Analisar por linguagem
  switch (language) {
    case 'javascript':
    case 'typescript':
      // Detectar funções
      const funcRegex = /function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*:\s*(?:async\s*)?\(/g;
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        const name = match[1] || match[2] || match[3];
        if (name && !analysis.functions.includes(name)) {
          analysis.functions.push(name);
        }
      }
      
      // Detectar classes
      const classRegex = /class\s+(\w+)/g;
      while ((match = classRegex.exec(content)) !== null) {
        analysis.classes.push(match[1]);
      }
      
      // Detectar imports/exports
      const importRegex = /import.*from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g;
      while ((match = importRegex.exec(content)) !== null) {
        analysis.imports.push(match[1] || match[2]);
      }
      
      const exportRegex = /export\s+(default\s+)?(\w+)|module\.exports\s*=\s*(\w+)/g;
      while ((match = exportRegex.exec(content)) !== null) {
        analysis.exports.push(match[2] || match[3]);
      }
      
      break;
      
    case 'python':
      // Detectar funções e classes
      const pyFuncRegex = /def\s+(\w+)\s*\(/g;
      while ((match = pyFuncRegex.exec(content)) !== null) {
        analysis.functions.push(match[1]);
      }
      
      const pyClassRegex = /class\s+(\w+)/g;
      while ((match = pyClassRegex.exec(content)) !== null) {
        analysis.classes.push(match[1]);
      }
      
      // Imports
      const pyImportRegex = /import\s+(\w+)|from\s+(\w+)\s+import/g;
      while ((match = pyImportRegex.exec(content)) !== null) {
        analysis.imports.push(match[1] || match[2]);
      }
      break;
  }
  
  // Contar comentários
  const commentPatterns = [
    /\/\/.*$/gm,
    /\/\*[\s\S]*?\*\//g,
    /#.*$/gm,
    /"""[\s\S]*?"""/g,
    /'''[\s\S]*?'''/g
  ];
  
  commentPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) analysis.comments += matches.length;
  });
  
  // Estimar complexidade
  const complexityKeywords = ['if', 'for', 'while', 'switch', 'try', 'catch'];
  const complexityScore = complexityKeywords.reduce((score, keyword) => {
    const matches = content.match(new RegExp(keyword, 'g'));
    return score + (matches ? matches.length : 0);
  }, 0);
  
  if (complexityScore < 5) analysis.complexity = 'low';
  else if (complexityScore < 15) analysis.complexity = 'medium';
  else analysis.complexity = 'high';
  
  return analysis;
};

// Formatar conteúdo para análise da IA
export const formatCodeForAI = (content, filename) => {
  const analysis = analyzeCode(content, filename);
  const language = analysis.language;
  
  return `📄 **Arquivo: ${filename}**
🔤 **Linguagem:** ${language}
📊 **Estatísticas:**
- Linhas: ${analysis.lines}
- Caracteres: ${analysis.characters}
- Funções: ${analysis.functions.length}
- Classes: ${analysis.classes.length}
- Imports: ${analysis.imports.length}
- Comentários: ${analysis.comments}
- Complexidade: ${analysis.complexity}

${analysis.functions.length > 0 ? `🔧 **Funções detectadas:**\n${analysis.functions.map(f => `- ${f}`).join('\n')}` : ''}

${analysis.classes.length > 0 ? `🏗️ **Classes detectadas:**\n${analysis.classes.map(c => `- ${c}`).join('\n')}` : ''}

${analysis.imports.length > 0 ? `📦 **Imports detectados:**\n${analysis.imports.map(i => `- ${i}`).join('\n')}` : ''}

**Código completo:**
\`\`\`${language}
${content}
\`\`\`

Analise este código e forneça insights sobre sua estrutura, funcionalidade, possíveis melhorias e sugestões específicas para esta linguagem de programação.`;
};

// Processar anexos para o contexto da IA
export const processAttachmentsForAI = (attachments) => {
  if (!attachments || attachments.length === 0) return '';
  
  let context = '\n\n📎 **ARQUIVOS ANEXADOS:**\n';
  
  attachments.forEach((attachment, index) => {
    const { name, type, previewUrl, file, text, imageData } = attachment;
    
    context += `\n### Arquivo ${index + 1}: ${name}\n`;
    context += `📁 **Tipo:** ${type}\n`;
    
    if (type === 'image' && imageData) {
      context += `🖼️ **Imagem disponível para análise visual**\n`;
    } else if (type === 'script' && text) {
      context += `💻 **Código detectado - análise completa:**\n`;
      context += formatCodeForAI(text, name) + '\n';
    } else if (type === 'text' && text) {
      context += `📝 **Conteúdo de texto:**\n`;
      context += `\`\`\`\n${text.substring(0, 1000)}${text.length > 1000 ? '\n... (truncado)' : ''}\n\`\`\`\n`;
    } else if (type === 'document' && text) {
      context += `📄 **Documento:**\n`;
      context += `\`\`\`\n${text}\n\`\`\`\n`;
    } else {
      context += `📄 **Arquivo anexado** - conteúdo não disponível para análise\n`;
    }
  });
  
  context += '\n⚡ **Por favor, analise todos os arquivos anexados e forneça insights específicos baseados no tipo de conteúdo.**';
  
  return context;
};

// Extrair snippet de código relevante
export const extractCodeSnippet = (content, maxLength = 500) => {
  if (content.length <= maxLength) return content;
  
  // Tentar extrair uma seção significativa
  const lines = content.split('\n');
  const midPoint = Math.floor(lines.length / 2);
  const startLine = Math.max(0, midPoint - 10);
  const endLine = Math.min(lines.length, midPoint + 10);
  
  let snippet = lines.slice(startLine, endLine).join('\n');
  
  if (content.length > maxLength) {
    snippet += '\n... (código truncado)';
  }
  
  return snippet;
};

// Validar segurança de código
export const validateCodeSecurity = (content, filename) => {
  const warnings = [];
  const dangerousPatterns = [
    { pattern: /eval\s*\(/gi, message: 'Uso de eval() detectado - risco de execução de código malicioso' },
    { pattern: /document\.write/gi, message: 'document.write() detectado - pode ser usado para XSS' },
    { pattern: /innerHTML\s*=/gi, message: 'innerHTML detectado - risco de XSS' },
    { pattern: /import\s+os|import\s+subprocess/gi, message: 'Imports potencialmente perigosos (os, subprocess) em Python' },
    { pattern: /system\s*\(|exec\s*\(/gi, message: 'Chamadas de sistema detectadas' },
    { pattern: /rm\s+-rf|del\s+\//gi, message: 'Comandos de remoção detectados' }
  ];
  
  dangerousPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      warnings.push(message);
    }
  });
  
  return {
    isSafe: warnings.length === 0,
    warnings
  };
};

// Gerar sugestões de melhoria para código
export const generateCodeSuggestions = (content, filename) => {
  const analysis = analyzeCode(content, filename);
  const suggestions = [];
  
  // Sugestões baseadas na linguagem
  if (analysis.language === 'javascript' || analysis.language === 'typescript') {
    if (content.includes('var ')) {
      suggestions.push('Considere usar let/const em vez de var');
    }
    if (!content.includes('use strict')) {
      suggestions.push('Adicione "use strict" para melhor verificação de código');
    }
  }
  
  if (analysis.language === 'python') {
    if (!content.includes('if __name__ == "__main__":')) {
      suggestions.push('Considere usar if __name__ == "__main__": para scripts executáveis');
    }
  }
  
  // Sugestões baseadas na complexidade
  if (analysis.complexity === 'high') {
    suggestions.push('Alta complexidade detectada - considere refatorar em funções menores');
  }
  
  if (analysis.functions.length > 10) {
    suggestions.push('Muitas funções detectadas - considere dividir em módulos menores');
  }
  
  if (analysis.comments / analysis.lines < 0.1) {
    suggestions.push('Poucos comentários - adicione documentação para melhor manutenção');
  }
  
  return suggestions;
};
