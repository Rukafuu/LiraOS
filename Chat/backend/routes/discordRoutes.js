import express from 'express';
import dotenv from 'dotenv';
import { discordService } from '../services/discordService.js';

dotenv.config();

const router = express.Router();

router.get('/status', (req, res) => {
    const appId = discordService.getAppId();
    const isReady = discordService.client?.isReady();
    const ownerId = process.env.DISCORD_OWNER_ID;

    res.json({
        enabled: isReady, // simplified status
        isConnected: isReady,
        applicationId: appId || null,
        inviteUrl: appId ? `https://discord.com/api/oauth2/authorize?client_id=${appId}&permissions=8&scope=bot` : null,
        ownerId: ownerId || null
    });
});

router.post('/config', async (req, res) => {
    const { token, applicationId } = req.body;
    
    if (!token || !applicationId) {
        return res.status(400).json({ error: 'Token and Application ID are required' });
    }

    const success = await discordService.setConfig(token, applicationId);
    if (success) {
        res.json({ success: true, message: 'Config saved. Bot restarting.' });
    } else {
        res.status(500).json({ error: 'Failed to save config.' });
    }
});

export default router;
