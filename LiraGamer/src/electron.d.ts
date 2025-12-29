export {};

declare global {
  interface Window {
    electronAPI: {
      launchApp: (path: string) => Promise<{ success: boolean; error?: string }>;
      startMinecraftWatch: () => Promise<{ success: boolean; error?: string }>;
      stopMinecraftWatch: () => Promise<{ success: boolean; error?: string }>;
      startVisionAgent: () => Promise<{ success: boolean; message: string }>;
      stopVisionAgent: () => Promise<{ success: boolean; message: string }>;
      onMinecraftLog: (callback: (line: string) => void) => void;
      onVisionEvent: (callback: (data: any) => void) => void;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  }
}
