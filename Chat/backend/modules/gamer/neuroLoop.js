import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { screenCapture } from './capture/screenCapture.js';
import { stateBuilder } from './state/stateBuilder.js';
import { decisionEngine } from './brain/decisionEngine.js';
import { inputController } from './controller/inputController.js';
import { twitchInterrupts } from './twitch/interrupts.js';

// Load Policy
const POLICY_PATH = path.join(process.cwd(), 'config', 'gamer_policy.json');
let POLICY;
try {
    POLICY = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf-8'));
} catch (e) {
    POLICY = { gameCategories: { blacklist: [] } };
}

/**
 * NeuroLoop: The main "Consciousness" Loop for Gamer Mode.
 */
export class NeuroLoop extends EventEmitter {
    constructor() {
        super();
        this.isRunning = false;
        this.tickRate = 1000;
        this.gameId = null;
        this.loopTimer = null;
        this.emergencyStop = false;
    }

    start(gameId) {
        if (this.isRunning) return;

        if (POLICY.gameCategories.blacklist.includes(gameId)) {
            console.error(`[NEURO] BLOCKED: ${gameId} is blacklisted.`);
            this.emit('error', 'SAFETY_VIOLATION');
            return;
        }

        this.gameId = gameId;
        this.isRunning = true;
        this.emergencyStop = false;
        console.log(`[NEURO] Spawning Cortex for: ${gameId}`);

        this._loop();
    }

    stop() {
        this.isRunning = false;
        if (this.loopTimer) clearTimeout(this.loopTimer);
        console.log(`[NEURO] Cortex Shutdown.`);
    }

    emergencyHalt() {
        this.emergencyStop = true;
        this.stop();
        console.warn(`[NEURO] 🚨 EMERGENCY HALT 🚨`);
    }

    async _loop() {
        if (!this.isRunning || this.emergencyStop) return;

        const startTime = Date.now();

        try {
            // 1. Observe
            const perception = await this._observe();

            // 2. Build State
            const state = await this._buildState(perception);

            // 3. Decide
            const plan = await this._decide(state);

            // 4. Act
            if (plan && plan.action) {
                await this._act(plan);
            }

        } catch (error) {
            console.error('[NEURO] Loop Error:', error);
        }

        const elapsed = Date.now() - startTime;
        const delay = Math.max(100, this.tickRate - elapsed);

        this.loopTimer = setTimeout(() => this._loop(), delay);
    }

    async _observe() {
        const visual = await screenCapture.capture();
        const chat = twitchInterrupts.getRelevantContext(); // NEW: Check Chat

        if (!visual) return { error: 'BLIND', chat };

        return {
            timestamp: visual.timestamp,
            screenshot: visual.image,
            chat // Inject chat into perception
        };
    }

    async _buildState(perception) {
        // Pass chat perception to StateBuilder logic if needed
        return await stateBuilder.build(this.gameId, perception);
    }

    async _decide(state) {
        if (state.visual.hasImage) {
            // If chat alert exists, it might override decision in future
            return await decisionEngine.decide(state);
        }
        return null;
    }

    async _act(plan) {
        if (plan && plan.action) {
            await inputController.execute(plan);
        }
    }
}

export const neuro = new NeuroLoop();
