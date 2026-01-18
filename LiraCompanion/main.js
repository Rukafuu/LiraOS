const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const rpaService = require('./rpaService');
const visionService = require('./visionService');
const config = require('./config');
const gameDetection = require('./gameDetection');



// 🛠️ FIX: Desabilitar aceleração de hardware corrige fundo preto (transparência) no Windows
app.disableHardwareAcceleration();

let mainWindow;
let tray;
let ws;

// Backend WebSocket URL (configurável via config.js)
const BACKEND_URL = `${config.BACKEND_WS_URL}/companion`;

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    mainWindow = new BrowserWindow({
        width: 300,
        height: 400,
        x: width - 320,
        y: height - 420,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000', // HEX transparente para Windows
        hasShadow: false, // Pode causar bordas brancas se true
        alwaysOnTop: true,
        skipTaskbar: false,
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            additionalArguments: [
                `--backend-url=${config.BACKEND_HTTP_URL}`,
                `--backend-ws-url=${config.BACKEND_WS_URL}`
            ]
        }
    });

    // Click-through for transparent areas
    mainWindow.setIgnoreMouseEvents(true, { forward: true });

    mainWindow.loadFile('index.html');

    // Expose config to renderer
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
            window.BACKEND_HTTP_URL = '${config.BACKEND_HTTP_URL}';
            window.BACKEND_WS_URL = '${config.BACKEND_WS_URL}';
            console.log('[CONFIG] Backend HTTP:', window.BACKEND_HTTP_URL);
            console.log('[CONFIG] Backend WS:', window.BACKEND_WS_URL);
        `);
    });

    // DevTools for debugging
    mainWindow.webContents.openDevTools({ mode: 'detach' });

    // Disable click-through by default to allow dragging
    mainWindow.setIgnoreMouseEvents(false);

    // System Tray
    createTray();

    // Connect to backend
    connectToBackend();
}

function createTray() {
    // Use a default icon or create one
    tray = new Tray(path.join(__dirname, 'icon.png'));
    
    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Show Lira', 
            click: () => {
                mainWindow.show();
            }
        },
        { 
            label: 'Hide Lira', 
            click: () => {
                mainWindow.hide();
            }
        },
        { type: 'separator' },
        { 
            label: 'Open Chat', 
            click: () => {
                require('electron').shell.openExternal(config.BACKEND_HTTP_URL);
            }
        },
        { type: 'separator' },
        { 
            label: 'Quit', 
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Lira Desktop Companion');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

function connectToBackend() {
    console.log('Connecting to backend:', BACKEND_URL);
    
    ws = new WebSocket(BACKEND_URL);

    ws.on('open', () => {
        console.log('✅ Connected to Lira Backend!');
        mainWindow.webContents.send('backend-status', 'connected');
        
        // 🎮 Iniciar detecção automática de jogos
        console.log('[COMPANION] Starting automatic game detection...');
        gameDetection.start(
            // Quando jogo é detectado
            (gameId, gameName) => {
                console.log(`[COMPANION] 🎮 Requesting profile for: ${gameName}`);
                
                // Solicitar perfil do backend
                ws.send(JSON.stringify({
                    type: 'request-game-profile',
                    gameId: gameId,
                    gameName: gameName
                }));
            },
            // Quando jogo é fechado
            (gameId) => {
                console.log(`[COMPANION] 🛑 Game closed: ${gameId}`);
                mainWindow.webContents.send('backend-message', {
                    type: 'game-closed'
                });
            }
        );
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('📨 Message from backend:', message);
            
            // Forward to renderer
            mainWindow.webContents.send('backend-message', message);
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    });

    ws.on('close', () => {
        console.log('❌ Disconnected from backend. Reconnecting in 5s...');
        mainWindow.webContents.send('backend-status', 'disconnected');
        
        setTimeout(connectToBackend, 5000);
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err.message);
    });
}

// IPC Handlers
ipcMain.on('send-to-backend', (event, data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }
});

ipcMain.on('set-click-through', (event, enabled) => {
    // We store the user preference globally/locally in the window
    mainWindow.isClickThroughActive = enabled;
    mainWindow.setIgnoreMouseEvents(enabled, { forward: true });
});

// Allow the renderer to temporarily disable ignore-mouse-events when hovering UI
ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
    // Only apply if the user actually has click-through ENABLED
    if (mainWindow.isClickThroughActive) {
        mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
    }
});

ipcMain.on('minimize-to-tray', () => {
    mainWindow.hide();
});

// System Monitoring Handlers
ipcMain.on('system-stats', (event, stats) => {
    // Forward stats to renderer for display
    mainWindow.webContents.send('system-stats-update', stats);
    
    // Optionally send to backend
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'system-stats',
            stats
        }));
    }
});

// 🏃‍♂️ Window Movement for Walking
ipcMain.handle('get-screen-size', () => {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    return primaryDisplay.workAreaSize;
});

ipcMain.on('move-window-relative', (event, { dx, dy }) => {
    if (mainWindow) {
        const pos = mainWindow.getPosition();
        mainWindow.setPosition(Math.round(pos[0] + dx), Math.round(pos[1] + dy), false);
    }
});

// 🧹 RPA Handlers
ipcMain.handle('rpa-scan-desktop', async () => {
    return await rpaService.scanDesktop();
});

ipcMain.handle('rpa-perform-cleaning', async () => {
    return await rpaService.performCleaning();
});

ipcMain.on('rpa-open-folder', () => {
    rpaService.openOrganizedFolder();
});

ipcMain.handle('rpa-kill-process', async (event, pid) => {
    try {
        process.kill(pid);
        return true;
    } catch (err) {
        console.error(`[RPA] Failed to kill process ${pid}:`, err);
        return false;
    }
});

ipcMain.handle('rpa-capture-screen', async () => {
    return await visionService.captureScreen();
});

ipcMain.on('system-alert', (event, alert) => {
    console.log('[System Alert]', alert.content);
    
    // Show in renderer
    mainWindow.webContents.send('system-alert-display', alert);
    
    // Send to backend for AI processing
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'system-alert',
            alert
        }));
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Prevent app from quitting when window is closed
app.on('before-quit', () => {
    if (ws) {
        ws.close();
    }
});
