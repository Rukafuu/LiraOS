import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../authStore.js';
import { tools, getAllTools, getToolCategories } from '../services/traeMode/index.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import githubService from '../services/githubService.js';
import { credentialStore } from '../services/credentialStore.js';
import { Octokit } from "@octokit/rest";

const router = express.Router();

// Admin-only middleware for Trae Mode
const requireAdmin = async (req, res, next) => {
    try {
        const userId = req.userId;
        const admin = await isAdmin(userId);
        
        if (!admin) {
            return res.status(403).json({ 
                error: 'Trae Mode is currently in beta and only available to administrators' 
            });
        }
        
        next();
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

router.use(requireAuth);
router.use(requireAdmin);

/**
 * Get available tools
 */
router.get('/tools', (req, res) => {
    try {
        const allTools = getAllTools();
        const categories = getToolCategories();
        
        res.json({
            success: true,
            tools: allTools,
            categories,
            count: allTools.length
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * Execute a tool
 */
router.post('/execute', async (req, res) => {
    try {
        const { tool, args = [] } = req.body;
        
        if (!tool) {
            return res.status(400).json({ error: 'Tool name is required' });
        }
        
        const toolFunction = tools[tool];
        
        if (!toolFunction) {
            return res.status(404).json({ 
                error: `Tool '${tool}' not found`,
                availableTools: getAllTools()
            });
        }
        
        console.log(`[TRAE] Executing tool: ${tool} with args:`, args);
        
        const result = await toolFunction(...args);
        
        res.json({
            success: true,
            tool,
            result
        });
    } catch (e) {
        console.error('[TRAE] Tool execution error:', e);
        res.status(500).json({ 
            error: e.message,
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        });
    }
});

router.post('/github/connect', requireAuth, async (req, res) => {
    const { token, owner, repo } = req.body;
    
    if (!token) {
        return res.status(400).json({ error: "Token is required" });
    }

    try {
        // Validation: Try to fetch repo details or user details to verify token acts correctly
        const octokit = new Octokit({ auth: token });
        const user = await octokit.rest.users.getAuthenticated();
        
        console.log(`[GITHUB] Token validated for user: ${user.data.login}`);
        
        // Save to JSON Store (Bypassing DB issues)
        credentialStore.set(req.userId, {
             githubToken: token,
             githubOwner: owner || user.data.login,
             githubRepo: repo
        });

        // Also try to update DB for consistency if columns exist (Optional/Best Effort)
        try {
            await updateUser(req.userId, {
                githubToken: token,
                githubOwner: owner || user.data.login,
                githubRepo: repo
            });
        } catch (dbErr) {
            console.warn("[GITHUB] DB Update failed (ignoring, used JSON store):", dbErr.message);
        }

        res.json({ 
            success: true, 
            message: "GitHub connected successfully",
            username: user.data.login 
        });

    } catch (e) {
        console.error('[GITHUB] Connection failed:', e.message);
        res.status(401).json({ error: "Invalid GitHub Token or Network Error" });
    }
});

/**
 * Execute multiple tools in sequence
 */
router.post('/execute-batch', async (req, res) => {
    try {
        const { operations = [] } = req.body;
        
        if (!Array.isArray(operations) || operations.length === 0) {
            return res.status(400).json({ error: 'Operations array is required' });
        }
        
        const results = [];
        
        for (const op of operations) {
            const { tool, args = [] } = op;
            
            if (!tool) {
                results.push({
                    success: false,
                    tool: null,
                    error: 'Tool name is required'
                });
                continue;
            }
            
            const toolFunction = tools[tool];
            
            if (!toolFunction) {
                results.push({
                    success: false,
                    tool,
                    error: `Tool '${tool}' not found`
                });
                continue;
            }
            
            try {
                console.log(`[TRAE] Batch executing: ${tool}`);
                const result = await toolFunction(...args);
                results.push({
                    success: true,
                    tool,
                    result
                });
            } catch (e) {
                results.push({
                    success: false,
                    tool,
                    error: e.message
                });
            }
        }
        
        res.json({
            success: true,
            results,
            total: operations.length,
            succeeded: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * Get project info
 */
router.get('/project-info', async (req, res) => {
    try {
        const [repoInfo, structure] = await Promise.all([
            tools.getRepoInfo(),
            tools.getProjectStructure('.', 2)
        ]);
        
        res.json({
            success: true,
            repository: repoInfo,
            structure: structure.structure
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * Search codebase
 */
router.post('/search', async (req, res) => {
    try {
        const { query, path = '.', options = {} } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const result = await tools.searchCode(query, path, options);
        
        res.json({
            success: true,
            ...result
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * Analyze file
 */
router.post('/analyze-file', async (req, res) => {
    try {
        const { filePath } = req.body;
        
        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }
        
        const [content, outline, info] = await Promise.all([
            tools.readFile(filePath),
            tools.getFileOutline(filePath),
            tools.getFileInfo(filePath)
        ]);
        
        res.json({
            success: true,
            file: filePath,
            content: content.content,
            outline: outline.outline,
            info
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'operational',
        version: '1.0.0',
        features: {
            fileSystem: true,
            execution: true,
            git: true,
            analysis: true
        }
    });
});

/**
 * Plan a task using Gemini
 */
router.post('/plan', async (req, res) => {
    try {
        const { task } = req.body;
        if (!task) return res.status(400).json({ error: 'Task description is required' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
             return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        // Tool definitions for the AI to understand capabilities
        const toolDefinitions = `
File System:
- readFile(path): Read file content
- writeFile(path, content): Write file content (creates if missing)
- replaceInFile(path, old, new): Replace text within a file (surgical edit)
- listDirectory(path): List files in directory
- exists(path): Check if path exists
- deleteFile(path): Delete file
- copyFile(source, dest): Copy file
- moveFile(source, dest): Move/Rename file
- getFileInfo(path): Get file stats

Execution:
- runCommand(cmd, cwd?): Run shell command (safely whitelisted)
- runNpm(args): Run npm commands (install, run, etc)
- runTests(path?): Run project tests
- lintCode(path?): Run linter
- typeCheck(): Run TypeScript compiler
- buildProject(): Run build script

Git:
- gitStatus(): Get changed files
- gitDiff(path?): Get file diffs
- gitAdd(files): Stage files
- gitCommit(message): Commit staged changes
- gitBranch(name?, create?): Get/Create/Switch branch
- getRepoInfo(): Get current branch/repo info
- gitLog(limit?): Get commit history

Analysis:
- searchCode(query, path?, options?): Search text in files
- findFiles(pattern, path?): Find files by glob pattern
- getFileOutline(path): Get symbols/classes in file
- analyzeError(error): Parse error output
- getProjectStructure(path?, depth?): Get tree view

Utility:
- think(thought): Log a thought or reasoning step (no side effects)
`;

        // Get detailed project structure for context
        let projectStructure = '';
        try {
            // Scan deeper (depth 5) to see files inside backend/services/
            const structureResult = await tools.getProjectStructure('.', 5);
            
            if (structureResult.success) {
                // Convert tree to clean text format
                const formatTree = (node, depth = 0) => {
                    if (depth > 2) return '';
                    const indent = '  '.repeat(depth);
                    let output = `${indent}- ${node.name}${node.type === 'directory' ? '/' : ''}\n`;
                    if (node.children) {
                        for (const child of node.children) {
                            output += formatTree(child, depth + 1);
                        }
                    }
                    return output;
                };
                projectStructure = formatTree(structureResult.structure);
            }
        } catch (e) {
            console.warn('[TRAE] Failed to get project structure for prompt:', e);
            projectStructure = 'Failed to load structure';
        }

        const prompt = `
        You are Trae, an autonomous senior software engineer agent.
        Your goal is to create a precise, step-by-step execution plan to accomplish the user's task.
        
        USER TASK: "${task}"
        
        WORKING DIRECTORY: /app (root of LiraOS project)
        PROJECT STRUCTURE (Current State):
${projectStructure}
        
        KEY PATHS:
        - /app/Chat/ - Main application code
        - /app/Chat/backend/ - Backend services
        
        AVAILABLE TOOLS (ONLY USE THESE):
        ${toolDefinitions}
        
        CRITICAL RULES:
        1. FILE PATHS: All paths are relative to /app. Examples:
           - To read App.tsx: use "Chat/App.tsx" (NOT "app.tsx" or "/app/app.tsx")
           - To read Sidebar: use "Chat/components/Sidebar.tsx"
           - To list Chat directory: use "Chat"
        
        2. UNKNOWN PATHS: If you are not sure where a file is (e.g. asked to verify 'discord.js'), ALWAYS search broadly.
           Strategy:
           Step 1: findFiles("*discord*")  <-- Use broad keyword, REMOVE EXTENSION to find variations like discordService.js
           Step 2: readFile(path_found_in_step_1)
        
        3. IF SEARCH FAILS: If findFiles returns 0 results, DO NOT proceed to readFile. Stop and report failure.
        
        3. TOOL NAMES: ONLY use tools from the list above. DO NOT invent tools.
           - WRONG: "analyzeCode" (doesn't exist)
           - RIGHT: Use "readFile" + "getFileOutline" to analyze code
        
        4. MULTI-STEP ANALYSIS: To analyze a file, create multiple steps:
           Step 1: readFile("Chat/App.tsx")
           Step 2: getFileOutline("Chat/App.tsx")
        
        5. ALWAYS READ BEFORE WRITE: Read files before editing them.
        
        RESPONSE FORMAT:
        Return a generic JSON object (no markdown code blocks) with this exact structure:
        {
            "plan": [
                {
                    "tool": "toolName",
                    "args": ["arg1", "arg2"],
                    "description": "Brief explanation of what this step does"
                }
            ]
        }
        `;

        const result = await model.generateContent({
             contents: [{ role: "user", parts: [{ text: prompt }] }],
             generationConfig: { responseMimeType: "application/json" }
        });
        
        const responseText = result.response.text();
        
        // Clean markdown if present (defensive)
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const planData = JSON.parse(cleanJson);
        
        res.json({ success: true, plan: planData.plan });

    } catch (e) {
        console.error('[TRAE] Planning error:', e);
        res.status(500).json({ error: e.message });
    }
});

/**
 * GitHub Integration Routes
 */

// Initialize GitHub connection
router.post('/github/connect', async (req, res) => {
    try {
        const { token, owner, repo } = req.body;
        const userId = req.userId; // From requireAuth middleware
        
        if (!token || !owner || !repo) {
            return res.status(400).json({ 
                error: 'token, owner, and repo are required' 
            });
        }

        // Test connection first
        const result = await githubService.initialize(token, owner, repo);
        
        if (result.success) {
            // Save credentials to database (encrypted in production)
            const { updateUser } = await import('../authStore.js');
            await updateUser(userId, {
                githubToken: token, // TODO: Encrypt this in production
                githubOwner: owner,
                githubRepo: repo
            });
            
            console.log(`[GITHUB] ✅ Credentials saved for user ${userId}`);
        }
        
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get saved GitHub credentials
router.get('/github/credentials', async (req, res) => {
    try {
        const userId = req.userId;
        const { getUserById } = await import('../authStore.js');
        const user = await getUserById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            success: true,
            hasToken: !!user.githubToken,
            owner: user.githubOwner || '',
            repo: user.githubRepo || ''
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// List files in GitHub repo
router.get('/github/files', async (req, res) => {
    try {
        const { path = '' } = req.query;
        const result = await githubService.listFiles(path);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Read file from GitHub
router.get('/github/file', async (req, res) => {
    try {
        const { path } = req.query;
        if (!path) {
            return res.status(400).json({ error: 'path is required' });
        }
        
        const result = await githubService.readFile(path);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Write file to GitHub
router.post('/github/file', async (req, res) => {
    try {
        const { path, content, message, sha } = req.body;
        
        if (!path || !content || !message) {
            return res.status(400).json({ 
                error: 'path, content, and message are required' 
            });
        }
        
        const result = await githubService.writeFile(path, content, message, sha);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get repository tree
router.get('/github/tree', async (req, res) => {
    try {
        const { branch = 'main' } = req.query;
        const result = await githubService.getTree(branch);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Search code in GitHub repo
router.get('/github/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'query (q) is required' });
        }
        
        const result = await githubService.searchCode(q);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get recent commits
router.get('/github/commits', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const result = await githubService.getCommits(parseInt(limit));
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
