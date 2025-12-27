import express from 'express';
import dotenv from 'dotenv';
import { discordService } from '../services/discordService.js';

import { isAdmin, getUserById } from '../authStore.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

dotenv.config();

const router = express.Router();

router.get('/status', requireAuth, async (req, res) => {
    const appId = discordService.getAppId();
    const isReady = discordService.client?.isReady();
    const ownerId = process.env.DISCORD_OWNER_ID;
    
    // Check if user is admin
    // Note: requireAuth adds req.userId
    const user = await getUserById(req.userId);
    const canManage = user ? isAdmin(user.id) : false;

    res.json({
        enabled: isReady, // simplified status
        isConnected: isReady,
        applicationId: appId || null,
        inviteUrl: appId ? `https://discord.com/api/oauth2/authorize?client_id=${appId}&permissions=8&scope=bot%20applications.commands` : null,
        ownerId: ownerId || null,
        canManage
    });
});

router.post('/config', async (req, res) => {
    const { token, applicationId } = req.body;
    
    // Allow partial updates
    if (!token && !applicationId) {
        return res.status(400).json({ error: 'Token or Application ID are required' });
    }

    const success = await discordService.setConfig(token, applicationId);
    if (success) {
        res.json({ success: true, message: 'Config saved. Bot restarting.' });
    } else {
        res.status(500).json({ error: 'Failed to save config.' });
    }
});

export default router;
