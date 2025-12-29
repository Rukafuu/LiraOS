import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes Imports
import authRoutes from './routes/auth.js';
import memoryRoutes from './routes/memories.js';
import chatRoutes from './routes/chat.js';
import visionRoutes from './routes/vision.js';
import voiceRoutes from './routes/voice.js';
import gamerRoutes from './routes/gamer.js';
import gamificationRoutes from './routes/gamification.js';
import feedbackRoutes from './routes/feedback.js';
import settingsRoutes from './routes/settings.js';
import recoveryRoutes from './routes/recovery.js';
import moderationRoutes from './routes/moderation.js';
import irisRoutes from './routes/iris.js';
import systemRoutes from './routes/system.js';
import discordRoutes from './routes/discordRoutes.js';
import patreonRoutes from './routes/patreonRoutes.js';
import instagramRoutes from './routes/instagram.js';
import imagesRoutes from './routes/images.js';

// Services & Utils
import { discordService } from './services/discordService.js';
import { cleanupExpiredBans } from './utils/moderation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? FRONTEND_URL : true, 
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));

// Debug Middleware (Less verbose in Production)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[INCOMING] ${req.method} ${req.url}`);
  }
  next();
});

// Health Check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// Routes Mounting
console.log('[DEBUG] Mounting routes...');
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/chat', chatRoutes);
// Mount specific routes BEFORE the generic /api fallback
app.use('/api/vision', visionRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/gamer', gamerRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/images', imagesRoutes);
// Serve Songs Statically
const songsPath = path.join(__dirname, 'songs');
app.use('/songs', express.static(songsPath));
app.get('/api/songs', (req, res) => {
    import('fs').then(fs => {
        fs.readdir(songsPath, (err, files) => {
            if (err) return res.status(500).json({ error: 'Failed to list songs' });
            // Filter audio files
            const audioFiles = files.filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));
            res.json(audioFiles);
        });
    });
});

app.use('/api/feedback', feedbackRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/iris', irisRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/discord', discordRoutes);
app.use('/api/discord', discordRoutes);
app.use('/api/patreon', patreonRoutes);
app.use('/api/instagram', instagramRoutes);
// Generic fallback (must be last)
app.use('/api', chatRoutes);
console.log('[DEBUG] All routes mounted successfully');

// 📦 SERVE FRONTEND IN PRODUCTION
// This handles SPA routing (like /companion) by falling back to index.html
if (process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true') {
    const distPath = path.join(__dirname, '..', 'dist');
    console.log(`[STATIC] Serving frontend from: ${distPath}`);
    
    // Serve static files
    app.use(express.static(distPath));

    // SPA Fallback for unknown routes (e.g. /companion, /settings)
    app.get('*', (req, res) => {
        if (req.url.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// 🛡️ GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR] 💥', err);
  const status = err.statusCode || 500;
  const message = err.clientMessage || 'Internal Server Error';
  res.status(status).json({ error: message, id: Date.now() });
});

// Start Server & Services
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[SYSTEM] LiraOS Backend v1.1 Starter (Deploy Timestamp: ${new Date().toISOString()})`);
  console.log(`[SYSTEM] Server running on port ${PORT}`);
  console.log(`[SYSTEM] Environment: ${process.env.NODE_ENV}`);
  console.log(`[SYSTEM] Frontend URL: ${FRONTEND_URL}`);
  
  // Jobs
  // TODO: Migrate cleanupExpiredBans to support PostgreSQL
  // cleanupExpiredBans();
  
  // Start PC Controller Service
  import('./services/pcControllerService.js').then(service => {
      service.pcControllerService.start();
  }).catch(err => console.error('Failed to load PC Controller Service:', err));
  
  // Discord Bot
  if (process.env.DISCORD_TOKEN) {
      console.log('[STARTUP] Starting Discord Bot...');
      await discordService.start().catch(err => console.error('Discord Bot require attention:', err.message));
  }

  // Start Local RPC
  if (process.env.DISCORD_CLIENT_ID || process.env.DISCORD_APPLICATION_ID) {
      import('./services/rpcService.js').then(({ rpcService }) => {
          rpcService.start();
      }).catch(err => console.error('Failed to load RPC:', err));
  }
});

// --- Start Python Game Bridge ---
import { spawn } from 'child_process';
const startGameBridge = () => {
    console.log('[STARTUP] Launching Game Bridge (Python)...');
    
    const bridgePath = path.join(__dirname, 'python', 'game_bridge.py');
    console.log(`[BRIDGE] Target: ${bridgePath}`);

    const pyProcess = spawn('python', [bridgePath], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true 
    });

    pyProcess.on('error', (err) => {
        console.error('[BRIDGE] SPAWN ERROR:', err);
    });
     
    pyProcess.on('close', (code) => {
        console.log(`[BRIDGE] Process exited with code ${code}`);
    });
};

// Só inicia o Game Bridge se explicitamente ativado ou se estiver em dev (e não desativado)
const shouldStartBridge = process.env.ENABLE_GAME_BRIDGE === 'true';

if (shouldStartBridge) {
    startGameBridge();
} else {
    console.log('[STARTUP] Game Bridge disabled (ENABLE_GAME_BRIDGE != true). Running in headless/cloud mode.');
}
