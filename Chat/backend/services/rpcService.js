
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

        // Get Lira Stats if available (or mock)
        // We can get gamification stats from store? But store needs userId. 
        // For local single user desktop app, we can assume typical usage.
        // Or just generic "LiraOS" state.
        
        try {
            await this.client.setActivity({
                details: 'Pair Programming',
                state: 'Building the Future 🚀',
                startTimestamp: this.startTime,
                largeImageKey: 'lira1', // User needs to upload this asset in Discord Dev Portal
                largeImageText: 'LiraOS Assistant',
                smallImageKey: 'vscode_icon',
                smallImageText: 'Editing Code',
                instance: false,
                buttons: [
                    { label: "Visitar LiraOS", url: "http://localhost:5173" },
                    { label: "GitHub", url: "https://github.com/Antigravity" }
                ]
            });
        } catch (error) {
            console.error('[RPC] Failed to update activity:', error);
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
