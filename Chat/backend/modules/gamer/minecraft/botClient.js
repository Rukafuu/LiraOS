
import mineflayer from 'mineflayer';
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder';
import { EventEmitter } from 'events';

const { GoalNear } = goals;

export class MinecraftBot extends EventEmitter {
    constructor() {
        super();
        this.bot = null;
        this.mcData = null;
        this.movements = null;
        
        // Anti-Griefing: Don't break blocks within radius of Home
        this.homeLocation = null; // { x, y, z, radius }
    }

    connect(options) {
        if (this.bot) this.disconnect();

        console.log(`[MC_BOT] Connecting to ${options.host}:${options.port}...`);
        
        this.bot = mineflayer.createBot({
            host: options.host,
            port: options.port,
            username: options.username || 'LiraBot',
            version: options.version || false, // Auto-detect
            auth: 'offline' // Change to 'microsoft' for premium accounts handling later
        });

        this.bot.loadPlugin(pathfinder);

        this.bot.once('spawn', async () => {
            console.log('[MC_BOT] Lira spawned!');
            this.mcData = await import('minecraft-data').then(m => m.default(this.bot.version));
            this.movements = new Movements(this.bot, this.mcData);
            this.bot.pathfinder.setMovements(this.movements);
            
            this.emit('spawn');
            this._startLoop();
        });

        this.bot.on('chat', (username, message) => {
            if (username === this.bot.username) return;
            this.emit('chat', { username, message });
        });

        this.bot.on('error', (err) => {
            console.error('[MC_BOT] Error:', err);
            this.emit('error', err);
        });

        this.bot.on('end', () => {
            console.log('[MC_BOT] Disconnected.');
            this.emit('end');
        });
    }

    disconnect() {
        if (this.bot) {
            this.bot.quit();
            this.bot = null;
        }
    }

    setHome(pos, radius = 20) {
        this.homeLocation = { ...pos, radius };
        console.log(`[MC_BOT] Home set at ${pos.x}, ${pos.z} (Radius: ${radius}). I will NOT mine here.`);
    }

    // --- Actions ---

    chat(message) {
        if (this.bot) this.bot.chat(message);
    }

    async goTo(x, y, z) {
        if (!this.bot) return;
        const goal = new GoalNear(x, y, z, 1);
        try {
            await this.bot.pathfinder.goto(goal);
            return true;
        } catch (e) {
            console.log('[MC_BOT] Pathfind failed:', e.message);
            return false;
        }
    }

    async mineBlockNearby(blockName) {
        if (!this.bot) return;
        
        // Find block
        const blockType = this.mcData.blocksByName[blockName];
        if (!blockType) return { error: "Unknown block type" };

        const block = this.bot.findBlock({
            matching: blockType.id,
            maxDistance: 32,
            count: 1
        });

        if (!block) return { error: "Block not found nearby" };

        // SAFETY CHECK: Is it Home?
        if (this.isHome(block.position)) {
            return { error: "Security Override: Cannot mine block inside Home Zone." };
        }

        try {
            await this.goTo(block.position.x, block.position.y, block.position.z);
            await this.bot.dig(block);
            return { success: true };
        } catch (e) {
            return { error: e.message };
        }
    }

    isHome(pos) {
        if (!this.homeLocation) return false;
        const dx = pos.x - this.homeLocation.x;
        const dz = pos.z - this.homeLocation.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        return dist < this.homeLocation.radius;
    }

    // --- Perception (What Lira Sees) ---
    
    getPerception() {
        if (!this.bot) return null;
        
        const pos = this.bot.entity.position;
        const health = this.bot.health;
        const food = this.bot.food;
        
        // Scan nearby entities
        const entities = Object.values(this.bot.entities)
            .filter(e => e.id !== this.bot.entity.id && e.position.distanceTo(pos) < 20)
            .map(e => ({ type: e.name, dist: Math.round(e.position.distanceTo(pos)) }));

        // Inventory summary
        const inventory = this.bot.inventory.items().map(i => `${i.name} x${i.count}`);

        return {
            status: { health, food, pos: { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) } },
            surroundings: { entities },
            inventory
        };
    }
    
    _startLoop() {
        // Heartbeat for UI updates
        setInterval(() => {
            if(this.bot) this.emit('status', this.getPerception());
        }, 1000);
    }
}

export const minecraftBot = new MinecraftBot();
