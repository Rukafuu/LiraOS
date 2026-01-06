import { spawn } from 'child_process';
import openPkg from 'open'; // Using the 'open' package we saw in package.json

class PCControllerService {
    constructor() {
        console.log('[PC Controller] Service Initialized');
        this.remoteClients = []; // Store connected PCs (SSE Responses)
    }

    /**
     * Connects a local PC (Satellite) via SSE
     */
    addClient(res) {
        this.remoteClients.push(res);
        console.log(`[PC Controller] New Satellite Connected! Total: ${this.remoteClients.length}`);
        
        // Remove client on close
        res.on('close', () => {
            this.remoteClients = this.remoteClients.filter(c => c !== res);
            console.log(`[PC Controller] Satellite Disconnected. Total: ${this.remoteClients.length}`);
        });

        // Send handshake
        res.write(`data: ${JSON.stringify({ type: 'handshake', message: 'Connected to LiraOS Cloud' })}\n\n`);
    }

    /**
     * Broadcasts a command to connected local PCs
     */
    broadcast(command, payload) {
        if (this.remoteClients.length === 0) return false;
        
        const msg = JSON.stringify({ type: 'command', command, payload });
        this.remoteClients.forEach(client => {
            client.write(`data: ${msg}\n\n`);
        });
        return true;
    }

    // --- EXECUTION LOGIC ---

    async openApp(target) {
        // 1. Try Remote First (Cloud Mode)
        if (this.broadcast('open', target)) {
             return { success: true, message: `Command sent to Local PC: Open ${target}` };
        }

        // 2. If no remote client, try local (Dev Mode/Server Mode)
        // If we are on Railway (Production) and no client connected, this will likely fail or do nothing useful.
        if (process.env.NODE_ENV === 'production') {
            return { success: false, error: "Nenhum PC Local conectado à Lira Cloud. Rode o 'Lira Link' no seu computador." };
        }

        console.log(`[PC Controller] Opening Locally: ${target}`);
        // ... (Existing Local Logic) ...
        const appMap = {
            'spotify': 'spotify:',
            'discord': 'com.squirrel.Discord.Discord', 
            'notepad': 'notepad.exe',
            'calc': 'calc.exe',
            'calculator': 'calc.exe',
            'chrome': 'chrome',
            'browser': 'chrome',
            'code': 'code',
            'vscode': 'code',
            'terminal': 'wt.exe',
            'cmd': 'cmd.exe',
            'explorer': 'explorer.exe'
        };

        let command = target.toLowerCase();
        if (appMap[command]) {
            command = appMap[command];
        }

        try {
            await openPkg(command);
            return { success: true, message: `Opened ${target}` };
        } catch (e) {
            try {
                await this.runPowershell(`Start-Process "${command}"`);
                return { success: true, message: `Opened ${target} via PS` };
            } catch (err) {
                throw new Error(`Failed to open ${target}`);
            }
        }
    }

    async setVolume(action) {
        // 1. Remote
        if (this.broadcast('volume', action)) {
            return { success: true, message: `Sent Volume ${action} to PC` };
        }
        if (process.env.NODE_ENV === 'production') return { success: false, error: "No PC Link" };

        return await this._localSetVolume(action);
    }

    async mediaControl(action) {
        if (this.broadcast('media', action)) {
            return { success: true, message: `Sent Media ${action} to PC` };
        }
        if (process.env.NODE_ENV === 'production') return { success: false, error: "No PC Link" };
        
        return await this._localMediaControl(action);
    }

    async typeText(text) {
        if (this.broadcast('type', text)) {
            return { success: true, message: `Sent Type command to PC` };
        }
        if (process.env.NODE_ENV === 'production') return { success: false, error: "No PC Link" };

        return await this._localTypeText(text);
    }
    
    async systemControl(action) {
        // action: 'lock', 'shutdown', 'sleep'
        if (this.broadcast('system', action)) {
            return { success: true, message: `Sent System Command: ${action}` };
        }
        if (process.env.NODE_ENV === 'production') return { success: false, error: "No PC Link" };

        // Local Fallback (running on user PC)
        switch (action) {
            case 'lock': await this.runPowershell('Rundll32.exe user32.dll,LockWorkStation'); break;
            case 'shutdown': await this.runPowershell('Stop-Computer -Force'); break; // Careful!
            case 'sleep': await this.runPowershell('Rundll32.exe powrprof.dll,SetSuspendState 0,1,0'); break;
        }
        return { success: true, message: `Executed System Command: ${action}` };
    }

    // --- REFACTORED LOCAL METHODS (Moved from original methods to keep code clean) ---
    async _localSetVolume(action) {
        let keys = '';
        const loops = 5; 
        switch (action) {
            case 'up': keys = `for($i=0;$i -lt ${loops};$i++) { $obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]175) }`; break;
            case 'down': keys = `for($i=0;$i -lt ${loops};$i++) { $obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]174) }`; break;
            case 'mute': keys = `$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]173)`; break;
        }
        if (keys) { await this.runPowershell(keys); return { success: true }; }
        return { success: false };
    }

    async _localMediaControl(action) {
        let key = '';
        switch(action) {
            case 'playpause': key = '179'; break;
            case 'next': key = '176'; break;
            case 'prev': key = '177'; break;
            case 'stop': key = '178'; break;
        }
        if (key) {
             await this.runPowershell(`$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]${key})`);
             return { success: true };
        }
        return { success: false };
    }

    async _localTypeText(text) {
        const escaped = text.replace(/[{}+^%~()]/g, "{$&}");
        await this.runPowershell(`$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${escaped}')`);
        return { success: true };
    }

    /**
     * Executes a PowerShell command (Internal Helper)
     */
    async runPowershell(command) {
        return new Promise((resolve, reject) => {
            const ps = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command]);
            let stdout = ''; let stderr = '';
            ps.stdout.on('data', (d) => stdout += d.toString());
            ps.stderr.on('data', (d) => stderr += d.toString());
            ps.on('close', (code) => {
                if (code === 0) resolve(stdout.trim());
                else reject(new Error(`PowerShell exit ${code}: ${stderr}`));
            });
            ps.on('error', (err) => reject(err)); // Handle spawn errors (like missing powershell on Linux)
        });
    }

    /**
     * Handles a generic instruction from the AI Agent (e.g. "open chrome")
     */
    async handleInstruction(command) {
        console.log(`[PC Controller] Handling instruction: "${command}"`);
        const cmd = command.toLowerCase().trim();

        // Security / Safety Confirmation could be handled by AI layer, but let's be direct here.

        if (cmd.includes('lock') || cmd.includes('bloquear')) {
             return await this.systemControl('lock');
        }
        if (cmd.includes('shutdown') || cmd.includes('desligar') || cmd.includes('apagar pc')) {
             return await this.systemControl('shutdown');
        }
        if (cmd.includes('sleep') || cmd.includes('suspender') || cmd.includes('dormir')) {
             return await this.systemControl('sleep');
        }

        if (cmd.startsWith('open ') || cmd.startsWith('start ') || cmd.startsWith('abrir ')) {
            const target = cmd.replace(/^(open|start|abrir)\s+/, '').trim();
            return await this.openApp(target);
        }

        if (cmd.includes('volume') || cmd.includes('som')) {
            if (cmd.includes('up') || cmd.includes('aumentar') || cmd.includes('+')) return await this.setVolume('up');
            if (cmd.includes('down') || cmd.includes('diminuir') || cmd.includes('-')) return await this.setVolume('down');
            if (cmd.includes('mute') || cmd.includes('udo')) return await this.setVolume('mute');
        }

        if (cmd.startsWith('type ') || cmd.startsWith('digita ') || cmd.startsWith('escreve ')) {
            const text = cmd.replace(/^(type|digita|escreve)\s+/, '');
            return await this.typeText(text);
        }
        
        // Media controls
        if (cmd.includes('play') || cmd.includes('pause')) return await this.mediaControl('playpause');
        if (cmd.includes('next') || cmd.includes('proxima')) return await this.mediaControl('next');
        if (cmd.includes('prev') || cmd.includes('anterior')) return await this.mediaControl('prev');

        // File Organization
        if (cmd.includes('organize') || cmd.includes('organizar') || cmd.includes('limpar pasta') || cmd.includes('arrumar')) {
            let target = 'Downloads'; // Default
            if (cmd.includes('desktop') || cmd.includes('área de trabalho')) target = 'Desktop';
            if (cmd.includes('documents') || cmd.includes('documentos')) target = 'Documents';
            
            // Broadcast to local clients if connected
            if (this.clients.size > 0) {
                console.log(`[PC Controller] Broadcasting ORGANIZE: ${target}`);
                this.broadcast({ type: 'organize', payload: target });
                return { success: true, message: `Organizing ${target}...` };
            }
        }

        // Fallback: Try to open whatever it is
        console.log('[PC Controller] Unknown command pattern, trying to open as app/url...');
        return await this.openApp(cmd);
    }
    
    start() {
        console.log('[PC Controller] Ready (Cloud Hybrid Mode).');
    }
}

export const pcController = new PCControllerService();
