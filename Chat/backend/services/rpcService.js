
import DiscordRPC from 'discord-rpc';
import dotenv from 'dotenv';
import { getState } from '../gamificationStore.js';

dotenv.config();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || process.env.DISCORD_APPLICATION_ID;

class RPCService {
    constructor() {
        this.client = new DiscordRPC.Client({ transport: 'ipc' }); // IPC for local client
        this.startTime = Date.now();
        this.isConnected = false;
    }

    async start() {
        if (!CLIENT_ID) {
            console.warn('[RPC] ⚠️ No DISCORD_CLIENT_ID found, skipping Rich Presence.');
            return;
        }

        this.client.on('ready', () => {
            console.log(`[RPC] 🎮 Rich Presence active for user: ${this.client.user.username}`);
            this.isConnected = true;
            this.updateActivity();
            
            // Update loop
            setInterval(() => this.updateActivity(), 15000);
        });

        try {
            await this.client.login({ clientId: CLIENT_ID });
        } catch (error) {
            console.error('[RPC] ❌ Failed to connect to local Discord client:', error.message);
            console.log('[RPC] (This is normal if Discord Desktop is not open)');
        }
    }

    async updateActivity() {
        if (!this.isConnected) return;

        try {
            await this.client.setActivity({
                details: '💻 Pair Programming with Lira',
                state: '🚀 Building the Future',
                startTimestamp: this.startTime,
                largeImageKey: 'lira_logo', // Upload this in Discord Dev Portal
                largeImageText: 'LiraOS - AI Assistant',
                smallImageKey: 'coding',
                smallImageText: 'Active',
                instance: false,
                buttons: [
                    { label: "🌐 Visit LiraOS", url: "https://liraos-production.up.railway.app" },
                    { label: "⭐ GitHub", url: "https://github.com/Rukafuu/LiraOS" }
                ]
            });
            console.log('[RPC] ✅ Activity updated successfully');
        } catch (error) {
            console.error('[RPC] ❌ Failed to update activity:', error.message);
            // Disconnect if update fails repeatedly
            if (error.message.includes('RPC_CONNECTION_TIMEOUT')) {
                this.isConnected = false;
                console.log('[RPC] Connection lost, will retry on next update');
            }
        }
    }
    
    // Method to update specific state (e.g. "Analyzing file.js")
    async setState(state, details = 'Pair Programming') {
        if (!this.isConnected) return;
        try {
             await this.client.setActivity({
                details: details,
                state: state,
                startTimestamp: this.startTime,
                largeImageKey: 'lira1', 
                largeImageText: 'LiraOS Assistant',
                instance: false,
            });
        } catch(e) {}
    }
}

export const rpcService = new RPCService();
