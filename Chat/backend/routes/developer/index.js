import express from 'express';
import { requireAuth } from '../../middlewares/authMiddleware.js';
import { isAdmin } from '../../authStore.js';
import prisma from '../../prismaClient.js';
import { pcController } from '../../services/pcControllerService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../../');

const router = express.Router();

// Middleware: Require Admin
router.use(requireAuth);
router.use(async (req, res, next) => {
  const isAdm = await isAdmin(req.userId);
  if (!isAdm) return res.status(403).json({ error: 'Developer access only' });
  next();
});

// GET /api/developer/stats - Global System Stats
router.get('/stats', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();
    const memoryCount = await prisma.memory.count();
    const activeJobs = await prisma.imageJob.count({ where: { status: 'generating' } });

    // System Resource Stats
    const systemStats = await pcController.getSystemStats();

    res.json({
      application: {
        users: userCount,
        sessions: sessionCount,
        memories: memoryCount,
        active_jobs: activeJobs
      },
      system: systemStats,
      timestamp: Date.now()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/developer/logs - Recent Application Logs
router.get('/logs', async (req, res) => {
  try {
    const logPath = path.join(BACKEND_ROOT, 'backend.log');
    if (fs.existsSync(logPath)) {
      // Read last 1000 lines or last 50KB roughly
      const content = fs.readFileSync(logPath, 'utf-8');
      const lines = content.split('\n').slice(-200); // Last 200 lines
      res.json({ logs: lines });
    } else {
      res.json({ logs: [], message: 'No log file found' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/developer/config - View AI Config (Redacted)
router.get('/config', (req, res) => {
  res.json({
    mistral_model: process.env.MISTRAL_MODEL || 'mistral-medium',
    xiaomi_model: process.env.XIAOMI_MODEL,
    voice_provider: process.env.ELEVENLABS_API_KEY ? 'ElevenLabs' : 'XTTS (Local)',
    vision_enabled: !!process.env.MISTRAL_PIXTRAL_API_KEY
  });
});

export default router;
