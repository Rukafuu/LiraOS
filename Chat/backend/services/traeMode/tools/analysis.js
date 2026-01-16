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
export async function searchCode(query, searchPath = '.', options = {}) {
    const {
        caseSensitive = false,
        regex = false,
        filePattern = '*',
        excludePatterns = ['node_modules', '.git', 'dist', 'build']
    } = options;

    const excludeArgs = excludePatterns.map(p => `--exclude-dir=${p}`).join(' ');
    const caseFlag = caseSensitive ? '' : '-i';
    const regexFlag = regex ? '-E' : '-F';
    
    const command = `grep -rn ${caseFlag} ${regexFlag} ${excludeArgs} "${query}" ${searchPath}`;
    
    const result = await runCommand(command, WORKSPACE_ROOT);
    
    if (!result.success && result.exitCode !== 1) {
        // Exit code 1 means no matches found, which is not an error
        return { success: false, error: result.error };
    }

    const matches = result.stdout
        .split('\n')
        .filter(Boolean)
        .map(line => {
            const [filePath, lineNumber, ...contentParts] = line.split(':');
            return {
                file: filePath,
                line: parseInt(lineNumber, 10),
                content: contentParts.join(':').trim()
            };
        });

    return {
        success: true,
        query,
        matches,
        count: matches.length
    };
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
