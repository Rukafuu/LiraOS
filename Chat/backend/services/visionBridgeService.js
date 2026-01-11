import fetch from 'node-fetch';

const BRIDGE_URL = 'http://127.0.0.1:5001';

export async function getScreenSnapshot() {
    try {
        const res = await fetch(`${BRIDGE_URL}/snapshot`);
        if (!res.ok) throw new Error('Failed to fetch snapshot from bridge');
        const buffer = await res.arrayBuffer();
        return Buffer.from(buffer);
    } catch (error) {
        console.error('[VISION BRIDGE] Error:', error.message);
        return null; // Bridge might be down
    }
}

export async function checkBridgeHealth() {
    try {
        const res = await fetch(`${BRIDGE_URL}/health`);
        return res.ok;
    } catch {
        return false;
    }
}
