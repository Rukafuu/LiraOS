import express from 'express';
// import { requireAuth } from '../middlewares/authMiddleware.js'; 
import { pcController } from '../services/pcControllerService.js';
import os from 'os';

const router = express.Router();

/**
 * SSE Endpoint for Local PC Agent (Lira Link)
 * Client should connect here to receive commands
 */
router.get('/connect', (req, res) => {
    // Basic formatting for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Register this connection
    pcController.addClient(res);

    // Keep alive heartbeat
    const interval = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 15000);

    req.on('close', () => clearInterval(interval));
});

router.post('/control', async (req, res) => {
    try {
        const { action, payload } = req.body;
        // action: 'open', 'volume', 'media', 'type'
        
        let result = { success: false };

        console.log(`[SYSTEM] Action: ${action}, Payload: ${payload}`);

        switch (action) {
            case 'open':
                result = await pcController.openApp(payload);
                break;
            case 'volume':
                // payload: 'up', 'down', 'mute'
                result = await pcController.setVolume(payload);
                break;
            case 'media':
                // payload: 'playpause', 'next', 'prev'
                result = await pcController.mediaControl(payload);
                break;
            case 'type':
                result = await pcController.typeText(payload);
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        res.json(result);

    } catch (error) {
        console.error('[SYSTEM CTRL ERROR]', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/alert', async (req, res) => {
    try {
        const { type, message, stats } = req.body;
        console.log(`[SYSTEM ALERT] ${type}: ${message}`, stats || '');

        // Broadcast to Companion (Frontend)
        if (global.broadcastToCompanions) {
            global.broadcastToCompanions({
                type: 'proactive',
                content: `⚠️ Alert: ${message}`,
                emotion: 'concerned'
            });
        }

        res.json({ success: true, message: 'Alert received' });
    } catch (error) {
        console.error('[SYSTEM ALERT ERROR]', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function for uptime formatting
const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

router.get('/stats', async (req, res) => {
  try {
    const load = os.loadavg();
    const cpuCount = os.cpus()?.length || 1;
    const cpuUsage = Math.min(100, (load[0] / cpuCount) * 100).toFixed(1);
    
    let totalMem = os.totalmem();
    let freeMem = os.freemem();

    // Container limit detection (Linux only)
    if (os.platform() === 'linux') {
      try {
        const fs = await import('fs');
        // Read Memory Limit
        if (fs.existsSync('/sys/fs/cgroup/memory/memory.limit_in_bytes')) {
          const limit = parseInt(fs.readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8'));
          if (limit > 0 && limit < totalMem) {
            totalMem = limit;
          }
        }
        // Read Memory Usage
        if (fs.existsSync('/sys/fs/cgroup/memory/memory.usage_in_bytes')) {
          const usage = parseInt(fs.readFileSync('/sys/fs/cgroup/memory/memory.usage_in_bytes', 'utf8'));
          freeMem = totalMem - usage;
        }
      } catch (err) {
        console.warn('[System] Failed to read cgroup memory:', err.message);
      }
    }

    const usedMem = totalMem - freeMem;
    const ramFormatted = `${(usedMem / 1024 / 1024 / 1024).toFixed(2)}/${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`;

    res.json({
      cpu: `${cpuUsage}%`,
      ram: ramFormatted,
      uptime: formatUptime(os.uptime()),
      platform: os.platform().toUpperCase()
    });
  } catch (e) {
    console.error('[System Stats Error]', e);
    res.status(500).json({ error: 'Internal stats error' });
  }
});

export default router;
