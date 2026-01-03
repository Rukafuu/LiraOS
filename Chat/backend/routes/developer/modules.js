// Chat/backend/routes/developer/modules.js
import express from 'express';
const router = express.Router();

const modulesData = [
    {
        id: "lira-os-chat",
        name: "LiraOS Chat",
        type: "frontend",
        root_path: "Chat/client",
        main_files: ["src/App.tsx", "src/main.tsx"],
        description: "Interface de Chat da LiraOS",
        tags: ["react", "vite", "frontend"],
        status: "active",
        priority: "high"
    },
    {
        id: "lira-os-backend",
        name: "LiraOS Backend",
        type: "backend",
        root_path: "Chat/backend",
        main_files: ["server.js", "services/ai.js"],
        description: "API e Backend Principal",
        tags: ["node", "express", "backend"],
        status: "active",
        priority: "high"
    },
    {
        id: "lira-gamer",
        name: "Lira Gamer",
        type: "module",
        root_path: "LiraGamer",
        main_files: ["main.py", "game_agent.py"],
        description: "Módulo de Integração com Jogos",
        tags: ["python", "ai", "vision"],
        status: "developing",
        priority: "medium"
    },
    {
        id: "dashboard",
        name: "Lira Developer Dashboard",
        type: "tool",
        root_path: "lira-developer-dashboard",
        main_files: ["src/App.tsx"],
        description: "Dashboard de Desenvolvimento",
        tags: ["react", "vite", "dashboard"],
        status: "active",
        priority: "medium"
    }
];

// GET /api/developer/modules
router.get('/', (req, res) => {
    res.json(modulesData);
});

// GET /api/developer/modules/:id
router.get('/:id', (req, res) => {
    const mod = modulesData.find(m => m.id === req.params.id);
    if (mod) {
        res.json(mod);
    } else {
        res.status(404).json({ error: "Module not found" });
    }
});

export default router;
