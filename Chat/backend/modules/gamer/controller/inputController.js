import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BRIDGE_URL = 'http://localhost:5000';
const POLICY_PATH = path.join(process.cwd(), 'config', 'gamer_policy.json');
let POLICY;

try {
    POLICY = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf-8'));
} catch (e) {
    POLICY = { inputAllowList: [] }; // Fail safe
}

class InputController {
    constructor() {
        this.isLocked = false;
    }

    /**
     * Executes a planned action safely.
     * @param {Object} plan { action: string, key: string, ... }
     */
    async execute(plan) {
        if (!plan || !plan.action) return;
        if (this.isLocked) {
            console.warn('[INPUT] Locked by Kill Switch');
            return;
        }

        const actionType = plan.action; // e.g., 'pressKey', 'gamepad'

        // 1. Safety Check: Is this action allowed?
        // Mapping abstract actions to policy keys might be needed, 
        // for now assuming direct mapping or broad categories.
        // Simple check:
        // if (!POLICY.inputAllowList.includes(actionType)) ...

        try {
            // Transform to Bridge Protocol
            let payload = null;

            if (actionType === 'pressKey' || actionType === 'key') {
                payload = { type: 'key', key: plan.key, duration: plan.duration || 0.1 };
            } else if (actionType === 'mouseMove') {
                payload = { type: 'mouse', subtype: 'move', x: plan.x, y: plan.y };
            } else if (actionType === 'mouseClick') {
                payload = { type: 'mouse', subtype: 'left_click', duration: 0.1 };
            } else if (actionType === 'gamepad') {
                payload = {
                    type: 'gamepad',
                    subtype: plan.subtype, // button, stick
                    key: plan.key,
                    x: plan.x,
                    y: plan.y,
                    duration: plan.duration
                };
            } else if (actionType === 'wait') {
                return; // Do nothing
            }

            if (payload) {
                // Send to Python Bridge
                await axios.post(`${BRIDGE_URL}/actions/input`, payload);
                // console.log(`[INPUT] Executed: ${actionType}`);
            }

        } catch (error) {
            console.error(`[INPUT] Execution Failed: ${error.message}`);
        }
    }

    emergencyLock() {
        this.isLocked = true;
    }

    unlock() {
        this.isLocked = false;
    }
}

export const inputController = new InputController();
