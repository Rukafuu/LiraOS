// Simple Live2D Loader for Companion
// Using PIXI.js v7 and pixi-live2d-display

class LiraLive2D {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.app = null;
        this.model = null;
    }

    async init() {
        try {
            // Import PIXI
            const PIXI = await import('pixi.js');
            window.PIXI = PIXI;

            // Create PIXI Application
            const canvas = document.getElementById(this.canvasId);
            this.app = new PIXI.Application({
                view: canvas,
                width: 300,
                height: 400,
                backgroundAlpha: 0,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });

            console.log('[Live2D] PIXI initialized');
            return true;
        } catch (err) {
            console.error('[Live2D] Init failed:', err);
            return false;
        }
    }

    async loadModel(modelPath) {
        try {
            // Import Live2D
            const { Live2DModel } = await import('pixi-live2d-display-lipsyncpatch');
            
            // Load model
            this.model = await Live2DModel.from(modelPath);
            
            // Scale and position
            this.model.scale.set(0.15);
            this.model.x = 150;
            this.model.y = 50;
            
            // Add to stage
            this.app.stage.addChild(this.model);
            
            console.log('[Live2D] Model loaded successfully!');
            return true;
        } catch (err) {
            console.error('[Live2D] Model load failed:', err);
            return false;
        }
    }

    // Update mouth for speech
    updateMouth(value) {
        if (!this.model) return;
        
        try {
            // Try to set mouth open parameter
            const params = this.model.internalModel.coreModel;
            if (params && params.setParameterValueById) {
                params.setParameterValueById('ParamMouthOpenY', value);
            }
        } catch (err) {
            // Silently fail if parameter doesn't exist
        }
    }

    // Set emotion
    setEmotion(emotion) {
        if (!this.model) return;
        
        const emotionMap = {
            'happy': 0,
            'sad': 1,
            'angry': 2,
            'surprised': 3,
            'neutral': 4
        };
        
        try {
            const expressionIndex = emotionMap[emotion] || 0;
            if (this.model.internalModel.motionManager) {
                this.model.expression(expressionIndex);
            }
        } catch (err) {
            console.warn('[Live2D] Emotion change failed:', err);
        }
    }

    // Tap interaction
    tap(x, y) {
        if (!this.model) return;
        
        try {
            if (this.model.tap) {
                this.model.tap(x, y);
            }
        } catch (err) {
            console.warn('[Live2D] Tap failed:', err);
        }
    }

    destroy() {
        if (this.app) {
            this.app.destroy(true);
        }
    }
}

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LiraLive2D };
}
