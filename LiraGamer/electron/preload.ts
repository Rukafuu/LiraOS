import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  launchApp: (path: string) => ipcRenderer.invoke('launch-app', path),
  startMinecraftWatch: () => ipcRenderer.invoke('start-minecraft-watch'),
  stopMinecraftWatch: () => ipcRenderer.invoke('stop-minecraft-watch'),
  startVisionAgent: () => ipcRenderer.invoke('start-vision-agent'),
  stopVisionAgent: () => ipcRenderer.invoke('stop-vision-agent'),
  onMinecraftLog: (callback: (line: string) => void) => ipcRenderer.on('minecraft-log-update', (_event, value) => callback(value)),
  onVisionEvent: (callback: (data: any) => void) => ipcRenderer.on('vision-event', (_event, value) => callback(value)),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
});
