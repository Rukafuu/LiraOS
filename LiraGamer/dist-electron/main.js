"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    electron_1.app.quit();
}
let mainWindow = null;
const createWindow = () => {
    // Create the browser window.
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            allowRunningInsecureContent: true,
        },
        frame: false, // Custom titlebar UI
        backgroundColor: '#0f0f13', // Dark background
        show: false, // Don't show until ready-to-show
    });
    // Load the index.html of the app.
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
};
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// --- IPC Handlers ---
const fs_1 = __importDefault(require("fs"));
let logWatcher = null;
// Start Watching Minecraft Logs
electron_1.ipcMain.handle('start-minecraft-watch', (event) => {
    const logPath = path_1.default.join(process.env.APPDATA || '', '.minecraft', 'logs', 'latest.log');
    console.log("Watching Minecraft Log at:", logPath);
    if (!fs_1.default.existsSync(logPath)) {
        return { success: false, error: "Log file not found at " + logPath };
    }
    // Simple polling implementation since 'tail' on windows can be tricky without external libs
    // In production, use 'tail' library. For now, simple file watch.
    let lastSize = fs_1.default.statSync(logPath).size;
    if (logWatcher)
        clearInterval(logWatcher);
    logWatcher = setInterval(() => {
        const stats = fs_1.default.statSync(logPath);
        if (stats.size > lastSize) {
            const stream = fs_1.default.createReadStream(logPath, {
                start: lastSize,
                end: stats.size
            });
            stream.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        mainWindow?.webContents.send('minecraft-log-update', line.trim());
                    }
                });
            });
            lastSize = stats.size;
        }
    }, 1000); // Check every second
    return { success: true };
});
electron_1.ipcMain.handle('stop-minecraft-watch', () => {
    if (logWatcher) {
        clearInterval(logWatcher);
        logWatcher = null;
    }
    return { success: true };
});
// Lauch Game / App
electron_1.ipcMain.handle('launch-app', async (event, appPath) => {
    console.log(`Launching: ${appPath}`);
    try {
        const subprocess = (0, child_process_1.spawn)(appPath, [], { detached: true, stdio: 'ignore' });
        subprocess.unref();
        return { success: true };
    }
    catch (error) {
        console.error('Launch failed:', error);
        return { success: false, error: String(error) };
    }
});
// Window Controls
electron_1.ipcMain.on('window-minimize', () => mainWindow?.minimize());
electron_1.ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    }
    else {
        mainWindow?.maximize();
    }
});
electron_1.ipcMain.on('window-close', () => mainWindow?.close());
