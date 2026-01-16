import { readFile, listDirectory } from './fileSystem.js';
import { runCommand } from './execution.js';
import path from 'path';

/**
 * Code Analysis Tools for Trae Mode
 * Provides code search, parsing, and analysis capabilities
 */

const WORKSPACE_ROOT = path.resolve(process.cwd(), '..');

/**
 * Search for text in files (grep)
 */
/**
 * Search for text in files (Native Node.js implementation)
 */
export async function searchCode(query, searchPath = '.', options = {}) {
    const fs = await import('fs/promises');
    const path = await import('path');
    const {
        caseSensitive = false,
        regex = false,
        filePattern = '*', // Default to check all files if * passed
        excludePatterns = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage']
    } = options;

    const results = [];
    const MAX_MATCHES = 200; // Limit total results preventing overflows
    let matchCount = 0;

    // Helper: Escape regex special chars if not using regex mode
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create search regex
    const flags = caseSensitive ? 'g' : 'gi';
    const searchRegex = new RegExp(regex ? query : escapeRegExp(query), flags);

    // Create file filter regex from pattern (simple glob to regex)
    const fileFilterRegex = filePattern === '*' 
        ? null 
        : new RegExp('^' + filePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');

    async function searchRecursively(currentPath, depth = 0) {
        if (matchCount >= MAX_MATCHES) return;
        if (depth > 12) return;

        try {
            const absolutePath = path.join(WORKSPACE_ROOT, currentPath);
            const items = await fs.readdir(absolutePath, { withFileTypes: true });

            for (const item of items) {
                if (matchCount >= MAX_MATCHES) break;

                const relativePath = path.join(currentPath, item.name);
                
                // Excludes
                if (excludePatterns.some(p => item.name === p || relativePath.includes(p))) continue;

                if (item.isDirectory()) {
                    await searchRecursively(relativePath, depth + 1);
                } else if (item.isFile()) {
                    // Check file pattern
                    if (fileFilterRegex && !fileFilterRegex.test(item.name)) continue;
                    
                    // Skip binary/large files roughly by extension or check
                    const ext = path.extname(item.name).toLowerCase();
                    if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.exe', '.dll', '.bin', '.db', '.sqlite'].includes(ext)) continue;

                    try {
                        const content = await fs.readFile(path.join(absolutePath, item.name), 'utf-8');
                        const lines = content.split('\n');

                        lines.forEach((line, index) => {
                            if (matchCount >= MAX_MATCHES) return;
                            
                            // Reset lastIndex for stateful regex with 'g' flag
                            searchRegex.lastIndex = 0;
                            
                            if (searchRegex.test(line)) {
                                results.push({
                                    file: relativePath.replace(/\\/g, '/'), // Normalized for output
                                    line: index + 1,
                                    content: line.trim().substring(0, 200) // Truncate very long lines
                                });
                                matchCount++;
                            }
                        });
                    } catch (readErr) {
                        // Ignore read errors
                    }
                }
            }
        } catch (err) {
            // Ignore directory access errors
        }
    }

    try {
        await searchRecursively(searchPath);
        return {
            success: true,
            query,
            matches: results,
            count: results.length,
            limitReached: matchCount >= MAX_MATCHES
        };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Find files by name pattern (Native Node.js implementation)
 */
export async function findFiles(pattern, searchPath = '.') {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Normalize pattern for simple wildcard matching
    // Converts "*.js" to Regex /.*\.js$/
    const regexPattern = new RegExp(
        '^' + pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*') 
        + '$'
    );
    
    const results = [];
    const maxFiles = 100; // Safety limit
    
    async function searchRecursively(currentPath, depth = 0) {
        if (results.length >= maxFiles) return;
        if (depth > 10) return; // Prevent infinite loops
        
        try {
            const items = await fs.readdir(path.join(WORKSPACE_ROOT, currentPath), { withFileTypes: true });
            
            for (const item of items) {
                const relativePath = path.join(currentPath, item.name);
                
                // Skip ignored directories
                if (item.isDirectory()) {
                    if (['node_modules', '.git', 'dist', 'build', 'coverage'].includes(item.name)) continue;
                    await searchRecursively(relativePath, depth + 1);
                } else {
                    // Check if file matches pattern
                    // Supports exact match ("discord.js") or wildcards ("*.js")
                    if (item.name === pattern || regexPattern.test(item.name)) {
                        results.push(relativePath);
                    }
                }
            }
        } catch (error) {
            // Ignore access errors
        }
    }
    
    try {
        await searchRecursively(searchPath);
        
        return {
            success: true,
            pattern,
            files: results,
            count: results.length
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Get file outline/structure (simple AST)
 */
export async function getFileOutline(filePath) {
    const fileResult = await readFile(filePath);
    
    if (!fileResult.success) {
        return { success: false, error: fileResult.error };
    }

    const content = fileResult.content;
    const ext = path.extname(filePath);
    
    let outline = [];

    // JavaScript/TypeScript
    if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
        outline = parseJavaScriptOutline(content);
    }
    // Python
    else if (ext === '.py') {
        outline = parsePythonOutline(content);
    }
    // CSS
    else if (['.css', '.scss', '.sass'].includes(ext)) {
        outline = parseCSSOutline(content);
    }

    return {
        success: true,
        file: filePath,
        outline,
        language: getLanguage(ext)
    };
}

/**
 * Parse JavaScript/TypeScript outline
 */
function parseJavaScriptOutline(content) {
    const outline = [];
    const lines = content.split('\n');

    // Simple regex-based parsing (not a full AST parser)
    const patterns = {
        function: /(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
        arrowFunction: /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
        class: /(?:export\s+)?class\s+(\w+)/,
        interface: /(?:export\s+)?interface\s+(\w+)/,
        type: /(?:export\s+)?type\s+(\w+)/,
        const: /(?:export\s+)?const\s+(\w+)/,
        import: /import\s+.*from\s+['"]([^'"]+)['"]/
    };

    lines.forEach((line, index) => {
        for (const [type, pattern] of Object.entries(patterns)) {
            const match = line.match(pattern);
            if (match) {
                outline.push({
                    type,
                    name: match[1],
                    line: index + 1,
                    content: line.trim()
                });
                break;
            }
        }
    });

    return outline;
}

/**
 * Parse Python outline
 */
function parsePythonOutline(content) {
    const outline = [];
    const lines = content.split('\n');

    const patterns = {
        class: /class\s+(\w+)/,
        function: /def\s+(\w+)/,
        import: /(?:from\s+\w+\s+)?import\s+(\w+)/
    };

    lines.forEach((line, index) => {
        for (const [type, pattern] of Object.entries(patterns)) {
            const match = line.match(pattern);
            if (match) {
                outline.push({
                    type,
                    name: match[1],
                    line: index + 1,
                    content: line.trim()
                });
                break;
            }
        }
    });

    return outline;
}

/**
 * Parse CSS outline
 */
function parseCSSOutline(content) {
    const outline = [];
    const lines = content.split('\n');

    const selectorPattern = /^([.#]?[\w-]+(?:\s*[>+~]\s*[\w-]+)*)\s*\{/;

    lines.forEach((line, index) => {
        const match = line.match(selectorPattern);
        if (match) {
            outline.push({
                type: 'selector',
                name: match[1].trim(),
                line: index + 1,
                content: line.trim()
            });
        }
    });

    return outline;
}

/**
 * Get language from file extension
 */
function getLanguage(ext) {
    const languageMap = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.css': 'css',
        '.scss': 'scss',
        '.html': 'html',
        '.json': 'json',
        '.md': 'markdown'
    };
    
    return languageMap[ext] || 'text';
}

/**
 * Analyze error message
 */
export function analyzeError(errorMessage) {
    const analysis = {
        type: 'unknown',
        file: null,
        line: null,
        column: null,
        message: errorMessage,
        suggestions: []
    };

    // TypeScript error pattern
    const tsPattern = /(.+)\((\d+),(\d+)\):\s*error\s+TS(\d+):\s*(.+)/;
    const tsMatch = errorMessage.match(tsPattern);
    if (tsMatch) {
        analysis.type = 'typescript';
        analysis.file = tsMatch[1];
        analysis.line = parseInt(tsMatch[2], 10);
        analysis.column = parseInt(tsMatch[3], 10);
        analysis.code = `TS${tsMatch[4]}`;
        analysis.message = tsMatch[5];
    }

    // ESLint error pattern
    const eslintPattern = /(.+):(\d+):(\d+):\s*(.+)\s+\[(.+)\]/;
    const eslintMatch = errorMessage.match(eslintPattern);
    if (eslintMatch) {
        analysis.type = 'eslint';
        analysis.file = eslintMatch[1];
        analysis.line = parseInt(eslintMatch[2], 10);
        analysis.column = parseInt(eslintMatch[3], 10);
        analysis.message = eslintMatch[4];
        analysis.rule = eslintMatch[5];
    }

    // Runtime error pattern
    const runtimePattern = /at\s+(.+)\s+\((.+):(\d+):(\d+)\)/;
    const runtimeMatch = errorMessage.match(runtimePattern);
    if (runtimeMatch) {
        analysis.type = 'runtime';
        analysis.function = runtimeMatch[1];
        analysis.file = runtimeMatch[2];
        analysis.line = parseInt(runtimeMatch[3], 10);
        analysis.column = parseInt(runtimeMatch[4], 10);
    }

    return analysis;
}

/**
 * Get project structure
 */
export async function getProjectStructure(rootPath = '.', maxDepth = 3) {
    async function buildTree(dirPath, depth = 0) {
        if (depth >= maxDepth) return null;

        const result = await listDirectory(dirPath);
        if (!result.success) return null;

        const tree = {
            name: path.basename(dirPath) || 'root',
            type: 'directory',
            children: []
        };

        for (const item of result.items) {
            if (item.type === 'directory' && !shouldIgnore(item.name)) {
                const subtree = await buildTree(item.path, depth + 1);
                if (subtree) {
                    tree.children.push(subtree);
                }
            } else if (item.type === 'file') {
                tree.children.push({
                    name: item.name,
                    type: 'file',
                    size: item.size
                });
            }
        }

        return tree;
    }

    function shouldIgnore(name) {
        const ignoreList = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
        return ignoreList.includes(name);
    }

    const tree = await buildTree(rootPath);
    
    return {
        success: true,
        structure: tree
    };
}
