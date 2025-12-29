import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import http from 'http';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// --- LOCAL EVENT SERVER (Receives data from Python Vision Agent) ---
const SERVER_PORT = 3001;
const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/game-event') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const eventData = JSON.parse(body);
                console.log("Received Game Event:", eventData);
                // Send to Renderer (UI)
                mainWindow?.webContents.send('vision-event', eventData);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                console.error("Invalid JSON from vision agent", e);
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(SERVER_PORT, () => {
    console.log(`LIRA VISION SERVER LISTENING ON PORT ${SERVER_PORT}`);
});

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
};

app.on('ready', createWindow);

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

// --- IPC Handlers ---
import fs from 'fs';

let logWatcher: any = null;

// Start Watching Minecraft Logs
ipcMain.handle('start-minecraft-watch', (event) => {
    const logPath = path.join(process.env.APPDATA || '', '.minecraft', 'logs', 'latest.log');
    console.log("Watching Minecraft Log at:", logPath);

    if (!fs.existsSync(logPath)) {
        return { success: false, error: "Log file not found at " + logPath };
    }

    // Simple polling implementation since 'tail' on windows can be tricky without external libs
    // In production, use 'tail' library. For now, simple file watch.
    let lastSize = fs.statSync(logPath).size;

    if (logWatcher) clearInterval(logWatcher);

    logWatcher = setInterval(() => {
        const stats = fs.statSync(logPath);
        if (stats.size > lastSize) {
            const stream = fs.createReadStream(logPath, {
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

ipcMain.handle('stop-minecraft-watch', () => {
    if (logWatcher) {
        clearInterval(logWatcher);
        logWatcher = null;
    }
    return { success: true };
});

// --- VISION AGENT CONTROL ---
let visionProcess: any = null;

ipcMain.handle('start-vision-agent', (event) => {
    if (visionProcess) {
        return { success: true, message: "Vision Agent already running." };
    }

    // Assumindo estrutura: PROJECT_ROOT/LiraGamer/vision/vision_agent.py
    // Em dev: electron/main.ts -> ../vision/vision_agent.py
    // Em prod: resources/app/vision/vision_agent.py (precisa cuidar no build)
    const scriptPath = path.join(__dirname, '../vision/vision_agent.py'); 
    
    console.log("Starting Vision Agent from:", scriptPath);

    // Spawn python process
    visionProcess = spawn('python', [scriptPath], {
        // Importante: CWD deve ser a raiz onde processa os templates
        cwd: path.join(__dirname, '..'), 
        shell: true
    });

    visionProcess.stdout.on('data', (data: any) => {
        console.log(`[VISION OUT]: ${data}`);
    });

    visionProcess.stderr.on('data', (data: any) => {
        console.error(`[VISION ERR]: ${data}`);
    });

    visionProcess.on('close', (code: any) => {
        console.log(`Vision Agent exited with code ${code}`);
        visionProcess = null;
    });

    return { success: true, message: "Vision Agent started." };
});

ipcMain.handle('stop-vision-agent', (event) => {
    if (visionProcess) {
        // No Windows 'kill' nem sempre mata a árvore de processos subprocessos do shell
        // spawn('taskkill /F /PID ' + visionProcess.pid)
        visionProcess.kill();
        visionProcess = null;
        return { success: true, message: "Vision Agent stopped." };
    }
    return { success: false, message: "Vision Agent not running." };
});

// Lauch Game / App
ipcMain.handle('launch-app', async (event, appPath: string) => {
    console.log(`Launching: ${appPath}`);
    try {
        const subprocess = spawn(appPath, [], { detached: true, stdio: 'ignore' });
        subprocess.unref();
        return { success: true };
    } catch (error) {
        console.error('Launch failed:', error);
        return { success: false, error: String(error) };
    }
});

// Window Controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});
ipcMain.on('window-close', () => mainWindow?.close());
