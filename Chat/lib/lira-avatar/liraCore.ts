import { PixiApp, Live2DModelType } from './types';

// SINGLETON STATE: The Holy Grail of Stability
// We hold the WebGL context eternal to avoid "Context Mismatch" errors.
let globalApp: PixiApp | null = null;
let globalModel: any = null;
let globalCanvas: HTMLCanvasElement | null = null;
let globalTickerFn: (() => void) | null = null;

export class LiraCore {
    private app: PixiApp;
    public model: Live2DModelType | null = null;
    private canvas: HTMLCanvasElement;
    private container: HTMLElement;
    
    // Idle Brain State
    private timePassed: number = 0;
    private idleTimer: number = 0;
    private isZoomingIn: boolean = false;
    public isDancing: boolean = false;
    private originalScale: number = 1;
    private originalY: number = 0;
    private resizeTimeout: number | null = null;

    setDanceMode(enabled: boolean) {
        this.isDancing = enabled;
        if (this.model) {
            if (enabled) {
                // @ts-ignore
                this.model.motion('Dance', undefined, 3);
            } else {
                this.model.scale.set(this.originalScale);
            }
        }
    }

    constructor(containerId: string) {
        this.container = document.getElementById(containerId) as HTMLElement;
        if (!this.container) throw new Error(`Container ${containerId} not found`);

        // @ts-ignore
        if (!window.PIXI) throw new Error('PIXI not found');

        // SINGLETON INIT LOGIC
        if (!globalApp || !globalCanvas) {
            console.log("[LiraCore] Creating NEW Global Singleton Context (Genesis v3.1 Zoom Fix)");
            
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'lira-canvas';
            
            // @ts-ignore
            globalApp = new window.PIXI.Application({
                view: this.canvas,
                autoStart: true,
                sharedTicker: true, // Back to shared, easier for singleton
                backgroundAlpha: 0,
                resizeTo: this.container, // Initial resize target
                antialias: true,
                autoDensity: true,
                resolution: window.devicePixelRatio || 1
            });

            globalCanvas = this.canvas;
            this.app = globalApp;
            globalApp.ticker.stop(); // Wait for model
        } else {
            console.log("[LiraCore] Reusing Global Singleton Context (Resurrection)");
            this.app = globalApp;
            this.canvas = globalCanvas;
            this.model = globalModel;
            
            // Re-bind resize target manually since app.resizeTo might be stale
            this.app.resizeTo = this.container;
        }

        // Physically move the canvas to the new container
        this.container.appendChild(this.canvas);
        
        // Wake up!
        this.app.start();

        // Attach resize observer
        const resizeObserver = new ResizeObserver(() => this.handleResize());
        resizeObserver.observe(this.container);
        setTimeout(() => this.handleResize(), 100);
    }

    public initLive2D() {
        // Init logic only needs to run once globally, but checking doesn't hurt
        // @ts-ignore
        const live2d = window.PIXI.live2d;
        if (!live2d) return false;
        
        // Ensure shared ticker exists (Polyfill)
        // @ts-ignore
        if (!window.PIXI.Ticker.shared) {
             // @ts-ignore
             window.PIXI.Ticker.shared = this.app.ticker;
        }
        return true;
    }

    async loadModel(modelPath: string): Promise<void> {
        this.initLive2D();

        // REUSE GLOBAL MODEL IF PRELOADED
        if (globalModel) {
            console.log("[LiraCore] Model reused from cache.");
            this.model = globalModel;
            this.model.visible = true;
            this.setupTicker();
            return;
        }

        try {
            console.log(`[LiraCore] Loading Fresh Model: ${modelPath}`);
            // @ts-ignore
            const Live2DModel = window.PIXI.live2d.Live2DModel;

            // MONKEY PATCH (Keep it, it's safe)
            try {
                Object.defineProperty(Live2DModel.prototype, 'autoUpdate', {
                    get: function() { return false; },
                    set: function(val) { },
                    configurable: true
                });
            } catch (e) {}

            // Load
            this.model = await Live2DModel.from(modelPath);

            if (this.model) {
                // @ts-ignore
                this.model.autoUpdate = false; 
                this.app.stage.addChild(this.model);
                
                // Save to global
                globalModel = this.model;

                // Simple Setup
                // @ts-ignore
                this.model.blendMode = window.PIXI.BLEND_MODES.NORMAL;
                
                // 🚫 Remove Watermark (Restored)
                try {
                    // Try generic parameter set
                    this.setParameter('Param', 1);
                    // Try direct core model set (Nuclear option)
                    // @ts-ignore
                    if (this.model.internalModel?.coreModel) {
                        // @ts-ignore
                         this.model.internalModel.coreModel.setParameterValueById('Param', 1);
                    }
                } catch (e) {
                    console.warn('[LiraCore] Failed to remove watermark:', e);
                }
                
                // Setup Interaction
                // @ts-ignore
                this.model.interactive = true; 
                this.model.on('hit', (hitAreas: any) => {
                    if (hitAreas.includes('Body')) this.model?.motion('TapBody');
                });

                this.setupTicker();
                this.handleResize();
            }
        } catch (error) {
            console.error(`[LiraCore] Fatal Load Error:`, error);
            throw error;
        }
    }

    private setupTicker() {
        // Reuse global ticker function or create new one?
        // Since we are singleton, we can just ensure it's added once.
        if (globalTickerFn && this.app.ticker) {
            // Remove old just in case
            this.app.ticker.remove(globalTickerFn);
        }

        globalTickerFn = () => {
            if (!this.model || !this.app) return;
            try {
                const deltaMS = this.app.ticker.elapsedMS;
                this.model.update(deltaMS);
                
                // Logic (Idle/Dance)
                this.timePassed += deltaMS / 1000;
                this.idleTimer += deltaMS;

                const centerX = this.app.screen.width / 2;
                const centerY = this.originalY || (this.app.screen.height / 2);

                if (!this.isDancing) {
                    this.model.y = centerY + Math.sin(this.timePassed * 2) * 5; 
                    if (this.idleTimer > 10000) { 
                        this.idleTimer = 0;
                        if (Math.random() > 0.5) this.isZoomingIn = !this.isZoomingIn;
                    }
                    const targetScale = this.isZoomingIn ? this.originalScale * 1.3 : this.originalScale;
                    this.model.scale.x += (targetScale - this.model.scale.x) * 0.05;
                    this.model.scale.y = this.model.scale.x;
                } else {
                    const beat = this.timePassed * 12;
                    this.model.y = centerY + Math.abs(Math.sin(beat)) * 10;
                }
            } catch (e) {}
        };

        this.app.ticker.add(globalTickerFn);
    }

    handleResize() {
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.resizeTimeout = window.setTimeout(() => {
            if (!this.model || !this.app || !this.app.renderer) return;

            // 1. Force App/Renderer Resize (Fixes Black Square / Clipping Masks)
            // The renderer needs to know the exact pixel size of the canvas to calculate masks correctly.
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            this.app.renderer.resize(w, h); // CRITICAL FIX 

            // 2. Calculate Model Scale
            const screenW = this.app.screen.width;
            const screenH = this.app.screen.height;

            // @ts-ignore
            const bounds = this.model.getBounds();
            
            // Standard scaling logic
            const targetW = screenW * 0.8;
            const targetH = screenH * 0.8;
            const scale = Math.min(targetW / bounds.width, targetH / bounds.height);
            
            // Simple center fallback if bounds are weird (happens on init)
            if (!isFinite(scale) || scale === 0) {
                 this.model.scale.set(0.2); 
            } else {
                 if (this.originalScale === 1 || !this.originalScale) {
                    this.model.scale.set(scale);
                    this.originalScale = scale; // Set baseline only once or if reset
                 } else {
                    // Respect current zoom level if it deviates significantly? 
                    // No, handleResize usually implies window change, so we adapt?
                    // Let's stick to keeping the user's zoom if set?
                    // For now, reset to fit window to ensure visibility.
                    this.model.scale.set(scale); 
                    this.originalScale = scale;
                 }
            }
            
            this.model.x = screenW / 2;
            // ANCHOR FIX: Pivot around the upper chest/neck (0.2) instead of waist (0.5).
            // This ensures that when zooming in, the FACE stays in the viewport.
            this.model.anchor.set(0.5, 0.2);
            this.model.y = screenH * 0.5; // Place that pivot (neck) at the center of the screen
            
            this.originalY = this.model.y;
        }, 100);
    }

    updateMouth(volume: number) {
        if (!this.model) return;
        try {
            // @ts-ignore
            const core = this.model.internalModel.coreModel;
            core.setParameterValueById('ParamMouthOpenY', volume);
        } catch (e) {}
    }

    lookAt(x: number, y: number) { /* Keep simple or empty if not used frequently */ }
    setExpression(name: string) { if (this.model) this.model.expression(name); }
    takeSnapshot() { return null; } // Snapshot might fail with preserved buffers

    /**
     * Set a specific model parameter (e.g. ParamMouthOpenY, Param, etc)
     */
    setParameter(paramId: string, value: number) {
        if (this.model && this.model.internalModel && this.model.internalModel.coreModel) {
            try {
                // @ts-ignore
                this.model.internalModel.coreModel.setParameterValueById(paramId, value);
            } catch (e) {
                console.warn(`[LiraCore] Failed to set parameter ${paramId}:`, e);
            }
        }
    }

    /**
     * Applies a zoom info relative to current scale
     * @param delta +0.1 for zoom in, -0.1 for zoom out
     */
    zoom(delta: number) {
        if (!this.model) return;
        const newScale = Math.max(0.05, Math.min(2.0, this.model.scale.x + delta));
        this.model.scale.set(newScale);
        
        // Update originalScale so animations/idle use the new baseline
        this.originalScale = newScale;
        
        // Disable automatic zoom while manual override is active?
        // Or just let it float.
        // Reset zoom state to prevent fight
        this.isZoomingIn = false;
    }

    destroy() {
        console.log("[LiraCore] Sleeping (Singleton Preserved)...");
        
        // DO NOT DESTROY APP OR TEXTURES.
        // MEMORY LEAK? NO, because we reuse them next time.
        // It's a Single Page App feature, not a bug.
        
        if (this.app) {
            this.app.stop(); // Stop rendering to save battery
            
            // Remove from DOM but keep Alive in memory
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    }
}
