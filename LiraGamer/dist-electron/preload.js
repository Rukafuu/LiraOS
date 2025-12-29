"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    launchApp: (path) => electron_1.ipcRenderer.invoke('launch-app', path),
    startMinecraftWatch: () => electron_1.ipcRenderer.invoke('start-minecraft-watch'),
    stopMinecraftWatch: () => electron_1.ipcRenderer.invoke('stop-minecraft-watch'),
    onMinecraftLog: (callback) => electron_1.ipcRenderer.on('minecraft-log-update', (_event, value) => callback(value)),
    minimize: () => electron_1.ipcRenderer.send('window-minimize'),
    maximize: () => electron_1.ipcRenderer.send('window-maximize'),
    close: () => electron_1.ipcRenderer.send('window-close'),
});
