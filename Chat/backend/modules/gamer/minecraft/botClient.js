import mineflayer from 'mineflayer';
import pkg from 'mineflayer-pathfinder';
const { pathfinder, Movements, goals } = pkg;
import { EventEmitter } from 'events';

const { GoalNear, GoalFollow } = goals;
import collectBlock from 'mineflayer-collectblock';


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
        this.bot.loadPlugin(collectBlock.plugin);

        this.bot.once('spawn', async () => {
            console.log('[MC_BOT] Lira spawned!');
            this.mcData = await import('minecraft-data').then(m => m.default(this.bot.version));
            this.movements = new Movements(this.bot, this.mcData);
            
            // Allow breaking blocks to get to target (smarts)
            this.movements.canDig = true;
            this.movements.digCost = 10; // Prefer not to dig if possible
            this.movements.allowParkour = true; // Allow jumping
            
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

    async follow(entity, range = 4) {
        if (!this.bot || !entity) return;
        const goal = new GoalFollow(entity, range);
        try {
            this.bot.pathfinder.setGoal(goal, true); // true = dynamic goal (keeps following)
            return true;
        } catch (e) {
            console.log('[MC_BOT] Follow failed:', e.message);
            return false;
        }
    }

    async stopMoving() {
        if (!this.bot) return;
        this.bot.pathfinder.setGoal(null);
    }

    async goTo(x, y, z) {
        if (!this.bot) return;
        // Increase range to 2 blocks to be less strict
        const goal = new GoalNear(x, y, z, 2);
        try {
            await this.bot.pathfinder.goto(goal);
            return true;
        } catch (e) {
            console.log('[MC_BOT] Pathfind failed:', e.message);
            if (e.message.includes('stopped') || e.message.includes('timeout')) {
                this.chat("Não consigo chegar aí! O caminho é muito complicado ou estou presa.");
            } else {
                this.chat(`Erro ao andar: ${e.message}`);
            }
            return false;
        }
    }

    async mineBlockNearby(blockName) {
        if (!this.bot) return;
        
        // Find block (Exact or Partial Match)
        let blockType = this.mcData.blocksByName[blockName];
        
        // If not exact match, try to find a block that *contains* the name (e.g. 'log' -> 'oak_log')
        if (!blockType) {
            const allBlocks = Object.keys(this.mcData.blocksByName);
            const match = allBlocks.find(b => b.includes(blockName) && !b.includes('stripped') && !b.includes('bamboo'));
            if (match) {
                console.log(`[MC_BOT] Fuzzy match: '${blockName}' -> '${match}'`);
                blockType = this.mcData.blocksByName[match];
            }
        }

        if (!blockType) return { error: `Unknown block type: ${blockName}` };

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

        // TOOL CHECK: Can we actually harvest this?
        if (!this.bot.canDigBlock(block)) {
             return { error: `Cannot dig ${blockName} (unbreakable or liquid).` };
        }
        
        // Optional: Check if we have the right tool for drops (simple heuristic)
        // For now, relies on brain complying with "Don't mine stone without pickaxe"
        // and auto-equipping best tool available.

        try {
            await this.goTo(block.position.x, block.position.y, block.position.z);
            
            // Auto Equip Best Tool
            const bestTool = this.bot.pathfinder.bestHarvestTool(block);
            if (bestTool) {
                await this.bot.equip(bestTool, 'hand');
            }
            
            await this.bot.dig(block);
            return { success: true };
        } catch (e) {
            return { error: e.message };
        }
    }

    async collect(blockName, count = 1) {
        if (!this.bot) return;

        // 1. Resolve Block Type
        // Try exact match first
        let blockType = this.mcData.blocksByName[blockName];
        
        // Fuzzy match if needed
        if (!blockType) {
            const allBlocks = Object.keys(this.mcData.blocksByName);
            const match = allBlocks.find(b => b.includes(blockName) && !b.includes('stripped') && !b.includes('bamboo'));
            if (match) {
                console.log(`[MC_BOT] Collect Fuzzy: '${blockName}' -> '${match}'`);
                blockType = this.mcData.blocksByName[match];
            }
        }

        if (!blockType) return { error: `Unknown block: ${blockName}` };

        // 2. Delegate to Plugin
        try {
            // Find block first to ensure it exists nearby? The plugin handles search.
            // But we want to give feedback if none found.
            const block = this.bot.findBlock({ matching: blockType.id, maxDistance: 32 }); // Reduced radius to 32 for stability
            if (!block) return { error: `I don't see any ${blockName} nearby.` };

            console.log(`[MC_BOT] Starting collection of ${count} ${blockType.name}...`);
            await this.bot.collectBlock.collect(block, { count: count }); 
            return { success: true };
        } catch (e) {
            console.error('[MC_BOT] Collect Error:', e);
            return { error: `Could not collect: ${e.message}` };
        }
    }

    async craftItem(itemName, count = 1) {
        if (!this.bot) return;

        // Get ID
        const item = this.mcData.itemsByName[itemName];
        if (!item) return { error: `Unknown item: ${itemName}` };

        // Find Recipe
        const recipes = this.bot.recipesFor(item.id, null, 1, null); // Check for 2x2 recipes first
        let recipe = recipes[0];
        let craftingTable = null;

        // If no 2x2 recipe, check for 3x3 (needs table)
        if (!recipe) {
             const nearbyTable = this.bot.findBlock({ matching: this.mcData.blocksByName.crafting_table.id, maxDistance: 4 });
             if (nearbyTable) {
                 craftingTable = nearbyTable;
                 const recipesTable = this.bot.recipesFor(item.id, null, 1, nearbyTable);
                 recipe = recipesTable[0];
             } else {
                 return { error: `Recipe for ${itemName} requires a nearby Crafting Table.` };
             }
        }

        if (!recipe) return { error: `No recipe found for ${itemName} (or missing ingredients).` };

        try {
            if (craftingTable) {
                await this.goTo(craftingTable.position.x, craftingTable.position.y, craftingTable.position.z);
            }
            await this.bot.craft(recipe, count, craftingTable);
            return { success: true };
        } catch (e) {
            return { error: `Crafting failed: ${e.message}` };
        }
    }

    async placeBlock(blockName) {
        if (!this.bot) return;
        
        const item = this.mcData.itemsByName[blockName];
        if (!item) return { error: `Invalid item to place: ${blockName}` };

        const hasItem = this.bot.inventory.count(item.id) > 0;
        if (!hasItem) return { error: `I don't have ${blockName} in inventory.` };

        // Find a solid block to place ON TOP OF
        const referenceBlock = this.bot.findBlock({
            matching: (blk) => blk.type !== 0 && blk.boundingBox === 'block', // Not air, solid
            maxDistance: 4,
            useExtraInfo: true
        });

        if (!referenceBlock) return { error: "No good spot to place it nearby." };

        try {
            await this.goTo(referenceBlock.position.x, referenceBlock.position.y, referenceBlock.position.z);
            await this.bot.equip(item.id, 'hand');
            // Check reference block face? simplified: try to place on top (vector 0,1,0)
            await this.bot.placeBlock(referenceBlock, { x: 0, y: 1, z: 0 }); 
            return { success: true };
        } catch (e) {
            return { error: `Placing failed: ${e.message}` };
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

        // Check for nearby crafting table
        const craftingTable = this.bot.findBlock({
            matching: this.mcData.blocksByName.crafting_table.id,
            maxDistance: 4
        });

        return {
            status: { 
                health, 
                food, 
                pos: { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z) },
                nearCraftingTable: !!craftingTable
            },
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
