/**
 * State Builder
 * Responsible for converting raw perception (screenshot, logs) into a structured World State.
 */
export class StateBuilder {
    constructor() {
        this.history = [];
    }

    /**
     * Builds the current state from perception data.
     * @param {string} gameId 
     * @param {Object} perception Result from NeuroLoop.observe()
     */
    async build(gameId, perception) {
        if (!perception || perception.error) {
            return { error: 'BLIND' };
        }

        // Basic State Structure
        const state = {
            gameId: gameId,
            timestamp: perception.timestamp,
            visual: {
                hasImage: !!perception.screenshot,
                screenshot: perception.screenshot || null, // Pass raw base64 for the Brain
                // In future phases: OCR result, Object detection list
                summary: "Raw Visual Input"
            },
            player: {
                // In future: Health, Ammo, etc extracted from UI
                status: "Unknown"
            },
            context: {
                // Recent game logs or events
                lastThought: this.history.length > 0 ? this.history[0].thought : null
            }
        };

        return state;
    }

    updateHistory(thought) {
        this.history.unshift({ thought, timestamp: Date.now() });
        if (this.history.length > 20) this.history.pop();
    }
}

export const stateBuilder = new StateBuilder();
