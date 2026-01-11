import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { isAdmin } from '../authStore.js';
import { tools, getAllTools, getToolCategories } from '../services/traeMode/index.js';

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

export default router;
