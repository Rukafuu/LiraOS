// Global type definitions for libraries loaded via CDN
// This ensures TypeScript knows about the window-attached libraries

export interface Live2DModelType {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: { x: number, y: number, set: (x: number, y?: number) => void };
    anchor: { set: (x: number, y?: number) => void };
    on: (event: string, callback: (hitAreas: string[]) => void) => void;
    motion: (group: string, index?: number, priority?: number) => void;
    expression: (name: string) => void;
    internalModel: {
        coreModel: {
            setParameterValueById: (id: string, value: number) => void;
            addParameterValueById: (id: string, value: number) => void;
        };
        motionManager: {
            expressionManager: {
                setExpression: (name: string) => void;
            }
        };
        focusController: {
            focus: (x: number, y: number) => void;
        };
        originalWidth: number;
        originalHeight: number;
    };
    update: (deltaTime: number) => void;
    destroy: () => void;
}

// Minimal Pixi Application interface we use
export interface PixiApp {
    view: HTMLCanvasElement;
    stage: {
        addChild: (child: any) => void;
    };
    screen: {
        width: number;
        height: number;
    };
    ticker: {
        add: (fn: (delta: number) => void) => void;
        remove: (fn: (delta: number) => void) => void;
        elapsedMS: number;
    };
    destroy: (removeView?: boolean, stageOptions?: any) => void;
    renderer: {
        plugins: {
            interaction: {
                on: (event: string, fn: (e: any) => void) => void;
                off: (event: string, fn: (e: any) => void) => void;
            }
        }
    }
}

declare global {
    interface Window {
        PIXI: {
            Application: new (options: any) => PixiApp;
            live2d: {
                Live2DModel: {
                    from: (url: string, options?: any) => Promise<Live2DModelType>;
                    registerTicker: (ticker: any) => void;
                };
            };
            Ticker: {
                shared: any;
            };
        };
    }
}
