import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { discordService } from '../services/discordService.js';

import { isAdmin, getUserById, updateUser, getUserByDiscordId } from '../authStore.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

dotenv.config();

const router = express.Router();

router.get('/status', requireAuth, async (req, res) => {
    const appId = discordService.getAppId();
    const isReady = discordService.client?.isReady();
    const ownerId = process.env.DISCORD_OWNER_ID;
    
    // Check if user is admin and linked status
    // Note: requireAuth adds req.userId
    const user = await getUserById(req.userId);
    const canManage = user ? isAdmin(user.id) : false;
    const isLinked = !!(user && user.discordId);

    res.json({
        enabled: isReady, // simplified status
        isConnected: isReady,
        applicationId: appId || null,
        inviteUrl: appId ? `https://discord.com/api/oauth2/authorize?client_id=${appId}&permissions=8&scope=bot%20applications.commands` : null,
        ownerId: ownerId || null,
        canManage,
        isLinked
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

// --- OAuth Handling ---
router.get('/auth', (req, res) => {
    const appId = discordService.getAppId();
    if (!appId) return res.status(400).send("Discord App ID not configured");

    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?action=discord_callback`;
    const scope = 'identify email'; // We need email to auto-match or identify for linking to profile
    
    // Check if we have SECRET, if not, we can't do server-side token exchange easily without exposing secret
    // But for "link", we usually use code grant.
    
    const url = `https://discord.com/api/oauth2/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=link_account`;
    res.json({ url });
});

router.post('/callback', requireAuth, async (req, res) => {
    const { code } = req.body;
    const appId = discordService.getAppId();
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?action=discord_callback`;

    if (!code || !appId || !clientSecret) {
        return res.status(400).json({ error: "Missing code or server config (Secret/AppId)" });
    }

    try {
        // Exchange code for token
        const params = new URLSearchParams();
        params.append('client_id', appId);
        params.append('client_secret', clientSecret);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', redirectUri);

        const tokenRes = await axios.post('https://discord.com/api/oauth2/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token } = tokenRes.data;

        // Get User Info
        const userRes = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const discordUser = userRes.data; // { id, username, email, ... }
        
        // Link to current Lira User
        const currentUserId = req.userId;
        
        // Check if already linked to someone else
        const existing = await getUserByDiscordId(discordUser.id);
        if (existing && existing.id !== currentUserId) {
             return res.status(409).json({ error: "This Discord account is already linked to another LiraOS user." });
        }
        
        // Update User
        await updateUser(currentUserId, { discordId: discordUser.id });
        
        res.json({ success: true, discordUsername: discordUser.username });

    } catch (e) {
        console.error('Discord OAuth Error:', e.response?.data || e.message);
        res.status(500).json({ error: "Failed to authenticate with Discord." });
    }
});

export default router;
