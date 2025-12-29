import { PixiApp, Live2DModelType } from './types';

// ☢️ MODO GIGA-NUCLEAR: MONKEY-PATCH NO INIT (V4)
if (typeof window !== 'undefined') {
    const applyGigaFix = () => {
        // @ts-ignore
        const PIXI = window.PIXI;
        // @ts-ignore
        const live2d = PIXI?.live2d;

        if (PIXI && live2d && live2d.Live2DModel) {
            try {
                const Live2DModel = live2d.Live2DModel as any;
                
                // 1. Garantir Ticker Global
                if (!PIXI.Ticker) PIXI.Ticker = { shared: { add: () => {}, remove: () => {}, elapsedMS: 0 } };
                if (!PIXI.Ticker.shared) PIXI.Ticker.shared = { add: () => {}, remove: () => {}, elapsedMS: 0 };
                
                const safeTicker = PIXI.Ticker.shared;

                // 2. Patch no Prototype para interceptar o 'this.ticker'
                Live2DModel.prototype.ticker = safeTicker;

                // 3. MONKEY-PATCH NO INIT (O CORAÇÃO DO ERRO)
                const originalInit = Live2DModel.prototype.init;
                Live2DModel.prototype.init = function(options: any) {
                    this.ticker = safeTicker; // Força antes de qualquer coisa
                    if (originalInit) {
                        return originalInit.call(this, options);
                    }
                };

                // 4. Bloquear 'autoUpdate' para não tentar remover/adicionar via setter bugado
                Object.defineProperty(Live2DModel.prototype, 'autoUpdate', {
                    get: () => false,
                    set: () => {}, // Ignora tentativas do plugin de se auto-gerenciar
                    configurable: true
                });

                console.log("[LiraCore] Giga-Nuclear Fix applied to Prototype & Init.");
                return true;
            } catch (e) {
                console.warn("[LiraCore] Giga-Nuclear Fix failed:", e);
            }
        }
        return false;
    };

    if (!applyGigaFix()) {
        const itv = setInterval(() => { if (applyGigaFix()) clearInterval(itv); }, 100);
        setTimeout(() => clearInterval(itv), 5000);
    }
}

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
    private resizeTimeout: number | null = null; // Debounce timer

    setDanceMode(enabled: boolean) {
        this.isDancing = enabled;
        // Reset scale immediately if stopping
        if (this.model) {
            if (enabled) {
                // @ts-ignore
                this.model.motion('Dance', undefined, 3); // Priority 3 = Force
            } else {
                this.model.scale.set(this.originalScale);
                // Force back to idle by playing nothing or low prio? 
                // Usually letting it finish is smoother, or triggers Idle group.
            }
        }
    }

    private tickerFn: (() => void) | null = null;

    constructor(containerId: string) {
        this.container = document.getElementById(containerId) as HTMLElement;
        if (!this.container) throw new Error(`Container ${containerId} not found`);

        // Check if PIXI is loaded
        // @ts-ignore
        if (!window.PIXI) {
            console.error('Window.PIXI is undefined');
            throw new Error('PIXI not found on window. Please ensure PixiJS is loaded.');
        }

        // @ts-ignore
        if (typeof window.PIXI.Application !== 'function') {
             console.error('Window.PIXI.Application is not a function:', window.PIXI);
             throw new Error('PIXI.Application is not a constructor. Check PixiJS version.');
        }

        // Create Canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'lira-canvas';
        this.container.appendChild(this.canvas);

        // Initialize Pixi Application (v6 Syntax)
        // @ts-ignore
        this.app = new window.PIXI.Application({
            view: this.canvas,
            autoStart: true,
            backgroundAlpha: 0, // Transparent background
            resizeTo: this.container,
            antialias: true,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1
        });

        // Handle resize
        const resizeObserver = new ResizeObserver(() => this.handleResize());
        resizeObserver.observe(this.container);
        
        setTimeout(() => this.handleResize(), 100);
    }

    /**
     * Initializes the Live2D environment.
     * Must be called before loading a model.
     */
    /**
     * Initializes the Live2D environment.
     * Must be called before loading a model.
     */
    public initLive2D() {
        // @ts-ignore
        const live2d = window.PIXI.live2d;
        if (!live2d) {
            console.warn('PIXI.live2d namespace missing. pixi-live2d-display might not be loaded correctly.');
            return false;
        }

        // @ts-ignore
        const Live2DModel = live2d.Live2DModel;
        if (!Live2DModel) {
             console.warn('Live2DModel class missing from PIXI.live2d.');
             return false;
        }

        // Register ticker explicitly with the shared ticker
        // This fixes the "cannot read properties of undefined (reading 'add')" error
        try {
            // @ts-ignore
            const Live2DModel = window.PIXI.live2d.Live2DModel;
            // @ts-ignore
            const Ticker = window.PIXI.Ticker;

            if (Ticker && Ticker.shared) {
                Live2DModel.registerTicker(Ticker.shared);
            } else {
                 // Fallback to app ticker if shared is somehow missing
                 Live2DModel.registerTicker(this.app.ticker);
            }
        } catch (e) {
            console.warn("Failed to register Ticker for Live2DModel.", e);
        }

        return true;
    }


    /**
     * Loads the Live2D model from the specified path.
     */
    async loadModel(modelPath: string): Promise<void> {
        try {
            if (!this.initLive2D()) {
                throw new Error("Live2D Environment could not be initialized.");
            }

            // @ts-ignore
            const Live2DModel = window.PIXI.live2d.Live2DModel;

            console.log(`[LiraCore] Loading model from: ${modelPath}`);

            // @ts-ignore
            const currentTicker = window.PIXI?.Ticker?.shared || window.PIXI?.Ticker;

            this.model = await Live2DModel.from(modelPath, {
                autoInteract: false,
                autoUpdate: false, 
                ticker: currentTicker, 
                onError: (e: any) => console.error("Model internal load error:", e)
            });

            if (this.model) {
                this.app.stage.addChild(this.model);
                
                // 🎨 Force NORMAL blend mode
                // @ts-ignore
                if (this.model.internalModel) {
                    // @ts-ignore
                    this.model.blendMode = window.PIXI.BLEND_MODES.NORMAL;
                }
                
                // 🚫 Remove Watermark Immediately
                try {
                    this.setParameter('Param', 1);
                } catch (e) {
                    console.warn('[LiraCore] Failed to remove watermark:', e);
                }
                
                // 🎨 Force texture update (fixes black silhouette on some GPUs)
                // @ts-ignore
                if (this.model.internalModel?.coreModel) {
                    try {
                        // @ts-ignore
                        this.model.internalModel.coreModel.update();
                    } catch (e) {}
                }
                
                // 3. Register Motion Groups manually if needed (or rely on .model3.json definitions)
                // For now, let's try to inject the dance motion programmatically if it's not in the main json
                // @ts-ignore
                if (this.model.internalModel && this.model.internalModel.motionManager) {
                   // @ts-ignore
                   this.model.internalModel.motionManager.definitions['Dance'] = [{ file: 'motions/dance_viber.motion3.json' }];
                }

                // Define the ticker function
                this.tickerFn = () => {
                    // 🚑 VACINA ANTI-ZUMBI
                    if (!this.app || !this.app.renderer || !this.model) return;

                    try {
                        const deltaMS = this.app.ticker.elapsedMS;
                        this.model.update(deltaMS);
                        
                        this.timePassed += deltaMS / 1000;
                        this.idleTimer += deltaMS;

                        const centerX = this.app.screen.width / 2;
                        const centerY = this.originalY || (this.app.screen.height / 2);

                        // If not dancing, apply simple float
                        if (!this.isDancing) {
                            this.model.y = centerY + Math.sin(this.timePassed * 2) * 5; 

                            if (this.idleTimer > 10000) { 
                                this.idleTimer = 0;
                                if (Math.random() > 0.5) {
                                    this.isZoomingIn = !this.isZoomingIn;
                                }
                            }

                            const targetScale = this.isZoomingIn ? this.originalScale * 1.3 : this.originalScale;
                            this.model.scale.x += (targetScale - this.model.scale.x) * 0.05;
                            this.model.scale.y = this.model.scale.x;
                        } else {
                            // In dance mode, we let the motion control parameters, 
                            // but we can still add a visual "bounce" to the whole container y
                            const beat = this.timePassed * 12;
                            this.model.y = centerY + Math.abs(Math.sin(beat)) * 10;
                        }

                    } catch (err) {
                        // Suppress update errors during destruction
                    }
                };

                // Add to ticker
                this.app.ticker.add(this.tickerFn);

                // Center and scale the model
                this.handleResize();

                // Setup interaction
                try {
                    // @ts-ignore
                    this.model.interactive = true; 
                    this.model.on('hit', (hitAreas) => {
                        if (hitAreas.includes('Body')) {
                            this.model?.motion('TapBody');
                        }
                    });
                } catch (e) {}
            }
        } catch (error) {
            console.error(`[LiraCore] Fatal Load Error for ${modelPath}:`, error);
            throw error;
        }
    }

    /**
     * Resizes and centers the model on the screen.
     */
    /**
     * Resizes and centers the model to fit 80% of the screen.
     * Debounced to prevent rapid successive calls.
     */
    handleResize() {
        // Clear existing timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        // Debounce resize (wait 100ms)
        this.resizeTimeout = window.setTimeout(() => {
            if (!this.model) return;

            const screenW = this.app.screen.width;
            const screenH = this.app.screen.height;

            // @ts-ignore
            const bounds = this.model.getBounds();
            const modelW = bounds.width;
            const modelH = bounds.height;

            if (modelW === 0 || modelH === 0) return;

            const targetW = screenW * 0.8;
            const targetH = screenH * 0.8;

            const scaleBasedOnWidth = targetW / modelW;
            const scaleBasedOnHeight = targetH / modelH;

            let finalScale = Math.min(scaleBasedOnWidth, scaleBasedOnHeight);

            this.model.scale.set(finalScale);
            this.model.x = screenW / 2;
            this.model.y = screenH / 2;
            this.model.anchor.set(0.5, 0.5);

            this.originalScale = finalScale;
            this.originalY = this.model.y;

            console.log(`✅ Lira redimensionada (Debounced). Scale: ${finalScale.toFixed(4)}`);
        }, 100);
    }

    /**
     * Updates the mouth opening based on audio volume (Lip Sync).
     * @param volume 0.0 to 1.0
     */
    updateMouth(volume: number) {
        if (this.model && this.model.internalModel && this.model.internalModel.coreModel) {
            const core = this.model.internalModel.coreModel;
            
            // Try all possible mouth parameters
            try {
                core.setParameterValueById('ParamMouthOpenY', volume);
            } catch (e) {}
            
            try {
                core.setParameterValueById('ParamMouthOpen', volume);
            } catch (e) {}
            
            try {
                // From model3.json LipSync group
                core.setParameterValueById('ParamMouthForm', volume);
            } catch (e) {}
        }
    }

    /**
     * Makes the model look at the specific coordinates.
     */
    lookAt(x: number, y: number) {
        if (this.model && this.model.internalModel && this.model.internalModel.focusController) {
            // Live2D focus coordinates are typically -1 to 1 relative to center
            const targetX = (x / this.app.screen.width) * 2 - 1;
            const targetY = (y / this.app.screen.height) * 2 - 1;
            
            this.model.internalModel.focusController.focus(targetX, -targetY); // Invert Y for Live2D
        }
    }

    /**
     * Sets a specific expression.
     */
    setExpression(expressionName: string) {
        if (this.model) {
            this.model.expression(expressionName);
        }
    }


    /**
     * Set a specific model parameter (e.g. ParamMouthOpenY, Param, etc)
     */
    setParameter(paramId: string, value: number) {
        if (this.model && this.model.internalModel && this.model.internalModel.coreModel) {
            try {
                this.model.internalModel.coreModel.setParameterValueById(paramId, value);
            } catch (e) {
                console.warn(`[LiraCore] Failed to set parameter ${paramId}:`, e);
            }
        }
    }

    /**
     * Captures a snapshot of the current canvas state.
     * Tips: Call this immediately after an update if possible or ensure autoRender is active.
     */
    takeSnapshot(format: string = 'image/png', quality: number = 0.9): string | null {
        if (!this.app || !this.app.renderer) return null;
        
        try {
            // Force a render if not auto-updating to ensure the frame is fresh
            // @ts-ignore
            this.app.renderer.render(this.app.stage); 
            return this.canvas.toDataURL(format, quality);
        } catch (e) {
            console.error("[LiraCore] Snapshot failed:", e);
            return null;
        }
    }


    destroy() {
        console.log("[LiraCore] Destroying instance...");
        
        // 0. STOP APP IMMEDIATELY to prevent any new render frames
        if (this.app) {
            try {
                // @ts-ignore
                this.app.stop();
            } catch (e) {}
        }

        // 1. Remove Ticker FIRST to stop update loop
        if (this.app && this.tickerFn) {
            this.app.ticker.remove(this.tickerFn);
            this.tickerFn = null;
        }

        // 2. Destroy Model
        if (this.model) {
            try {
                // @ts-ignore
                this.model.destroy({ children: true, baseTexture: true, texture: true });
            } catch (e) {}
            this.model = null;
        }

        // 3. Destroy App
        if (this.app) {
            try {
                this.app.destroy(true, { children: true, texture: true, baseTexture: true });
            } catch (e) {}
            // @ts-ignore
            this.app = null;
        }

        if (this.canvas) {
          this.canvas.remove();
        }
    }
}
