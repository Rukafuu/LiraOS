import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`[SERVER] Starting LiraOS Backend... (${new Date().toISOString()})`);
console.log(`[SERVER] Validating deployment integrity...`);
console.log(`[SERVER] Vision Module loaded from: ${path.resolve(__dirname, './routes/vision.js')}`);

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
import todosRoutes from './routes/todos.js';
import googleAuthRoutes from './routes/authGoogle.js';
import traeRoutes from './routes/trae.js';

// Services & Utils
import { discordService } from './services/discordService.js';
import { cleanupExpiredBans } from './utils/moderation.js';

dotenv.config();

console.log('[DEBUG] MINIMAX_API_KEY:', process.env.MINIMAX_API_KEY ? 'Língua preservada (Presente)' : 'AUSENTE ❌');
console.log('[DEBUG] MINIMAX_GROUP_ID:', process.env.MINIMAX_GROUP_ID || 'AUSENTE ❌');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
// Middleware - MANUAL CORS OVERRIDE
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }

  if (req.url.includes('/api/voice/tts')) {
    console.log(`[TTS] 🔊 Request from ${origin || 'local/unknown'}: "${req.body?.text?.substring(0, 20)}..."`);
  }

  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});
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
app.use('/api/auth/recover', recoveryRoutes); // Fix for frontend path mismatch
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/auth/google-calendar', googleAuthRoutes);
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

const videosPath = path.join(__dirname, 'videos');
app.use('/videos', express.static(videosPath));

app.use('/api/feedback', feedbackRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/iris', irisRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/discord', discordRoutes);
app.use('/api/discord', discordRoutes);
app.use('/api/patreon', patreonRoutes);
import copilotRoutes from './routes/copilot.js';

app.use('/api/instagram', instagramRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api/auth/google', googleAuthRoutes);
import whatsappHook from './routes/whatsappHook.js';
app.use('/api/webhook/whatsapp', whatsappHook);
app.use('/api/trae', traeRoutes);

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

// 🎭 WEBSOCKET SERVER FOR COMPANION APP
import { WebSocketServer } from 'ws';
import http from 'http';

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Store connected companions
const companions = new Set();

wss.on('connection', (ws, request) => {
  console.log('🎭 Lira Companion connected!');
  companions.add(ws);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Lira Backend!',
    timestamp: Date.now()
  }));
  
  // Handle messages from companion
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('[COMPANION] Message:', message);
      
      // Handle different message types
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch (e) {
      console.error('[COMPANION] Failed to parse message:', e);
    }
  });
  
  ws.on('close', () => {
    console.log('🎭 Companion disconnected');
    companions.delete(ws);
  });
  
  ws.on('error', (err) => {
    console.error('[COMPANION] WebSocket error:', err);
    companions.delete(ws);
  });
});

// Upgrade HTTP to WebSocket for /companion endpoint
server.on('upgrade', (request, socket, head) => {
  if (request.url === '/companion' || request.url === '/companion/') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Broadcast function for sending messages to all companions
export function broadcastToCompanions(message) {
  const data = JSON.stringify(message);
  companions.forEach((ws) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(data);
    }
  });
}

// Make it globally available
global.broadcastToCompanions = broadcastToCompanions;

// Start Server & Services
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`[SYSTEM] LiraOS Backend v1.1 Starter (Deploy Timestamp: ${new Date().toISOString()})`);
  console.log(`[SYSTEM] Server running on port ${PORT}`);
  console.log(`[SYSTEM] Environment: ${process.env.NODE_ENV}`);
  console.log(`[SYSTEM] Frontend URL: ${FRONTEND_URL}`);

  // Jobs
  // TODO: Migrate cleanupExpiredBans to support PostgreSQL
  // cleanupExpiredBans();

  // Start PC Controller Service
  import('./services/pcControllerService.js').then(service => {
    service.pcController.start();
  }).catch(err => console.error('Failed to load PC Controller Service:', err));

  // Discord Bot
  if (process.env.DISCORD_TOKEN) {
    console.log('[STARTUP] Starting Discord Bot...');
    await discordService.start().catch(err => console.error('Discord Bot require attention:', err.message));
  }

  // Start Local RPC (Only works on local desktop, not on Railway)
  if ((process.env.DISCORD_CLIENT_ID || process.env.DISCORD_APPLICATION_ID) && process.env.NODE_ENV !== 'production') {
    console.log('[STARTUP] Starting Discord Rich Presence (Local Only)...');
    import('./services/rpcService.js').then(({ rpcService }) => {
      rpcService.start();
    }).catch(err => console.error('Failed to load RPC:', err));
  } else if (process.env.NODE_ENV === 'production') {
    console.log('[STARTUP] Discord RPC skipped (not available on remote server)');
  }

  // Start Twitch Integration
  if (process.env.TWITCH_OAUTH_TOKEN && process.env.TWITCH_CHANNEL) {
    import('./services/twitchService.js').then(({ twitchService }) => {
      console.log('[STARTUP] Starting Twitch Integration...');
      twitchService.connect();
    }).catch(err => console.error('Failed to load Twitch Service:', err));
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
// Prevent crash on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[CRASH PREVENTED] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRASH PREVENTED] Unhandled Rejection at:', promise, 'reason:', reason);
});
