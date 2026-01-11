import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pino from 'pino';
import fs from 'fs';
import path from 'path';

// Load env
dotenv.config();

const logger = pino({ level: 'info' });
const app = express();
const PORT = process.env.WHATSAPP_GATEWAY_PORT || 3001; // Distinct from main API (3000)

app.use(cors());
app.use(express.json());

// Load Configuration
const configPath = path.resolve('../../config/whatsapp_mode.json');
let config = {};
try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch (e) {
    logger.error('Failed to load whatsapp_mode.json', e);
}

const MODE = process.env.WHATSAPP_MODE || config.mode || 'experimental';

logger.info(`Starting WhatsApp Gateway in ${MODE} mode`);

// Placeholder for adapters
let adapter = null;

// Initialize Adapter based on Mode
async function initAdapter() {
    if (MODE === 'experimental') {
        logger.info('Initializing Baileys Adapter...');
        const { startBaileys } = await import('./adapters/baileysAdapter.js');
        adapter = await startBaileys(config.experimental_config || {});
    } else if (MODE === 'official') {
        logger.info('Initializing Cloud API Adapter...');
        // await import('./adapters/cloudApiAdapter.js');
    } else {
        logger.error('Unknown mode selected');
    }
}

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', mode: MODE, adapter: adapter ? 'active' : 'inactive' });
});

// Outbound Message API (used by Core)
app.post('/api/send', async (req, res) => {
    const { to, content, type } = req.body;
    logger.info({ to, type }, 'Received outbound message request');
    
    // Validate and forward to adapter
    if (adapter && adapter.sendMessage) {
        let attempts = 0;
        while (attempts < 3) {
            try {
                await adapter.sendMessage(to, content);
                return res.json({ success: true, status: 'sent' });
            } catch (e) {
                attempts++;
                logger.warn({ err: e.message, attempt: attempts }, 'Adapter send failed, retrying...');
                await new Promise(r => setTimeout(r, 1000 * attempts)); // Exponential-ish backoff
                
                if (attempts >= 3) {
                    logger.error({ err: e.message }, 'Adapter send failed permanently');
                    return res.status(500).json({ success: false, error: e.message });
                }
            }
        }
    } else {
        res.status(503).json({ success: false, error: 'Adapter not ready' });
    }
});

// Group Participants API
app.post('/api/groups/participants', async (req, res) => {
    const { groupId, participants, action } = req.body;
    logger.info({ groupId, action, participants }, 'Group participants update request');
    
    if (adapter && adapter.groupParticipantsUpdate) {
        try {
            await adapter.groupParticipantsUpdate(groupId, participants, action);
            res.json({ success: true });
        } catch (e) {
            logger.error({ err: e.message }, 'Group action failed');
            res.status(500).json({ success: false, error: e.message });
        }
    } else {
        res.status(501).json({ error: 'Not supported by current adapter' });
    }
});


// Group Metadata API
app.get('/api/groups/:groupId', async (req, res) => {
    const { groupId } = req.params;
    if (adapter && adapter.sock) {
        try {
            const meta = await adapter.sock.groupMetadata(groupId);
            res.json(meta);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        res.status(501).json({ error: 'Adapter not ready' });
    }
});

// Profile Picture API
app.get('/api/users/photo', async (req, res) => {
    const { userId } = req.query;
    if (adapter && adapter.getProfilePicture) {
        try {
            const url = await adapter.getProfilePicture(userId);
            res.json({ url });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    } else {
        res.status(501).json({ error: 'Adapter not ready' });
    }
});

// Start Server
app.listen(PORT, async () => {
    logger.info(`WhatsApp Gateway running on port ${PORT}`);
    await initAdapter();
});

// Process handlers
process.on('SIGINT', () => {
    logger.info('Shutting down Gateway...');
    process.exit(0);
});
