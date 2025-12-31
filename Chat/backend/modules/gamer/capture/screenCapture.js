import axios from 'axios';

const BRIDGE_URL = 'http://localhost:5000';

class ScreenCaptureService {
    constructor() {
        this.lastSnapshot = null;
        this.lastTimestamp = 0;
    }

    /**
     * Gets a fresh visual snapshot from the Game Bridge.
     * @returns {Promise<{image: string, timestamp: number} | null>} Base64 image or null if failed
     */
    async capture() {
        try {
            const res = await axios.get(`${BRIDGE_URL}/actions/snapshot`, { timeout: 2000 });

            if (res.data && res.data.success) {
                this.lastSnapshot = res.data.image;
                this.lastTimestamp = Date.now();
                return {
                    image: res.data.image,
                    timestamp: this.lastTimestamp
                };
            }
            return null;
        } catch (error) {
            // Be silent on frequent poll errors to avoid log spam, simply return null
            return null;
        }
    }

    getLastSnapshot() {
        return this.lastSnapshot;
    }
}

export const screenCapture = new ScreenCaptureService();
