import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * Lê o conteúdo de um arquivo do projeto
 */
export async function readProjectFile(relativePath) {
  try {
    const fullPath = path.isAbsolute(relativePath) ? relativePath : path.join(PROJECT_ROOT, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return {
      success: true,
      path: relativePath,
      content: content,
      lines: content.split('\n').length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Lista arquivos em um diretório
 */
export async function listProjectDirectory(relativePath = '') {
  try {
    const fullPath = (relativePath && path.isAbsolute(relativePath)) ? relativePath : path.join(PROJECT_ROOT, relativePath);
    console.log(`[DEBUG] listProjectDirectory listing: ${fullPath}`);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    console.log(`[DEBUG] Found ${entries.length} entries raw.`);
    
    const files = [];
    const directories = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        directories.push(entry.name);
      } else {
        const stats = await fs.stat(path.join(fullPath, entry.name));
        files.push({
          name: entry.name,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }
    
    return {
      success: true,
      path: relativePath || '/',
      directories,
      files
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Busca texto no código do projeto
 */
export async function searchInProject(query, filePattern = '*.js') {
  try {
    const results = [];
    
    const searchDir = async (dir, depth = 0) => {
      if (depth > 5) return; // Limit depth
      
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules, .git, etc
          if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
            continue;
          }
          await searchDir(fullPath, depth + 1);
        } else if (entry.isFile()) {
          // Check file pattern
          const ext = path.extname(entry.name);
          const patterns = {
            '*.js': ['.js', '.mjs', '.cjs'],
            '*.ts': ['.ts', '.tsx'],
            '*.jsx': ['.jsx'],
            '*.tsx': ['.tsx'],
            '*': null // all files
          };
          
          const allowedExts = patterns[filePattern];
          if (allowedExts && !allowedExts.includes(ext)) {
            continue;
          }
          
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');
            
            lines.forEach((line, idx) => {
              if (line.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                  file: path.relative(PROJECT_ROOT, fullPath),
                  line: idx + 1,
                  content: line.trim()
                });
              }
            });
          } catch (e) {
            // Skip binary or unreadable files
          }
        }
      }
    };
    
    await searchDir(PROJECT_ROOT);
    
    return {
      success: true,
      query,
      totalResults: results.length,
      results: results.slice(0, 100) // Limit to 100 results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtém estrutura do projeto
 */
export async function getProjectStructure(maxDepth = 3) {
  try {
    const structure = {};
    
    const buildTree = async (dir, depth = 0, currentPath = '') => {
      if (depth >= maxDepth) return null;
      
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const tree = {};
      
      for (const entry of entries) {
        if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          continue;
        }
        
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          tree[entry.name] = await buildTree(fullPath, depth + 1, relativePath);
        } else {
          tree[entry.name] = 'file';
        }
      }
      
      return tree;
    };
    
    const tree = await buildTree(PROJECT_ROOT);
    
    return {
      success: true,
      structure: tree
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Analisa um arquivo específico
 */
export async function analyzeFile(relativePath) {
  try {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const stats = await fs.stat(fullPath);
    
    const lines = content.split('\n');
    const analysis = {
      path: relativePath,
      size: stats.size,
      lines: lines.length,
      modified: stats.mtime,
      extension: path.extname(relativePath),
      imports: [],
      exports: [],
      functions: [],
      todos: []
    };
    
    // Simple analysis
    lines.forEach((line, idx) => {
      if (line.includes('import ')) {
        analysis.imports.push({ line: idx + 1, content: line.trim() });
      }
      if (line.includes('export ')) {
        analysis.exports.push({ line: idx + 1, content: line.trim() });
      }
      if (line.includes('function ') || line.includes('const ') && line.includes('=>')) {
        analysis.functions.push({ line: idx + 1, content: line.trim() });
      }
      if (line.includes('TODO') || line.includes('FIXME')) {
        analysis.todos.push({ line: idx + 1, content: line.trim() });
      }
    });
    
    return {
      success: true,
      analysis
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
