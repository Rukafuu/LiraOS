/**
 * Global Context Store (Volatile Memory)
 * Stores real-time visual context and other sensor data
 */

export const globalContext = {
    vision: {
        lastSeenTimestamp: 0,
        description: null,
        rawImage: null // Optional: keep last frame? Careful with memory.
    },
    
    updateVision(description, timestamp = Date.now()) {
        this.vision.description = description;
        this.vision.lastSeenTimestamp = timestamp;
        console.log(`[CONTEXT] 👁️ Vision Updated: "${description.substring(0, 50)}..."`);
    },

    getVisionContext() {
        const now = Date.now();
        // Vision memory fades after 60 seconds?
        if (now - this.vision.lastSeenTimestamp > 60000) {
            return null;
        }
        return this.vision.description;
    }
};
