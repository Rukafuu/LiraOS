import { spawn } from 'child_process';
import openPkg from 'open'; // Using the 'open' package we saw in package.json

class PCControllerService {
    constructor() {
        console.log('[PC Controller] Service Initialized');
        this.remoteClients = []; // Store connected PCs (SSE Responses)
    }

    /**
     * Connects a local PC (Satellite) or Browser via SSE
     */
    addClient(res, type = 'satellite') {
        res.clientType = type;
        this.remoteClients.push(res);
        console.log(`[PC Controller] New ${type} Connected! Total: ${this.remoteClients.length}`);
        
        // Remove client on close
        res.on('close', () => {
            this.remoteClients = this.remoteClients.filter(c => c !== res);
            console.log(`[PC Controller] ${type} Disconnected. Total: ${this.remoteClients.length}`);
        });

        // Send handshake
        res.write(`data: ${JSON.stringify({ type: 'handshake', message: `Connected as ${type}` })}\n\n`);
    }

    /**
     * Broadcasts a command to connected local PCs or fallback to browser clients.
     */
    broadcast(command, payload) {
        if (this.remoteClients.length === 0) return false;
        
        const satellites = this.remoteClients.filter(c => c.clientType === 'satellite');
        const browsers = this.remoteClients.filter(c => c.clientType === 'browser');

        const msg = JSON.stringify({ type: 'command', command, payload });

        if (satellites.length > 0) {
            satellites.forEach(client => client.write(`data: ${msg}\n\n`));
            return true;
        }

        if (browsers.length > 0) {
             browsers.forEach(client => client.write(`data: ${msg}\n\n`));
             return true;
        }

        return false;
    }

    // --- EXECUTION LOGIC ---

    async openApp(target) {
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
            'explorer': 'explorer.exe',
            'youtube': 'https://youtube.com',
            'google': 'https://google.com',
            'github': 'https://github.com',
            'chatgpt': 'https://chat.openai.com',
            'gemini': 'https://gemini.google.com',
            'whatsapp': 'https://web.whatsapp.com',
            'netflix': 'https://netflix.com',
            'twitch': 'https://twitch.tv',
            'telegram': 'https://web.telegram.org',
            'steam': 'steam://',
            'obs': 'obs64.exe',
            'calculadora': 'calc.exe',
            'gerenciador': 'explorer.exe',
            'configurações': 'start ms-settings:',
            'control': 'control.exe'
        };

        let command = target.toLowerCase().trim();
        if (appMap[command]) {
            command = appMap[command];
        } else if (command.includes('.') && !command.includes(' ') && !command.startsWith('http')) {
            // Likely a domain like youtube.com
            command = `https://${command}`;
        } else if (command.includes('youtube') && !command.startsWith('http')) {
            command = 'https://youtube.com';
        }

        // 1. Try Remote First (Cloud Mode)
        if (this.broadcast('open', command)) {
             return { success: true, message: `Command sent to Local PC: Open ${target}` };
        }

        // 2. If no remote client, try local (Dev Mode/Server Mode)
        if (process.env.NODE_ENV === 'production') {
            return { success: false, error: "Nenhum PC Local conectado à Lira Cloud. Rode o 'Lira Link' no seu computador." };
        }

        console.log(`[PC Controller] Opening Locally: ${command}`);

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

        // 1. App Opening (Fuzzy Match)
        const openRegex = /(?:abrir|abra|iniciar|start|open|lançar)\s+(?:o|a|os|as|the|an?|)\s*([a-z0-9.]+)/i;
        const openMatch = cmd.match(openRegex);
        if (openMatch) {
            return await this.openApp(openMatch[1]);
        }

        // 2. System Commands
        if (cmd.includes('lock') || cmd.includes('bloquear')) {
             return await this.systemControl('lock');
        }
        if (cmd.includes('shutdown') || cmd.includes('desligar') || cmd.includes('apagar pc')) {
             return await this.systemControl('shutdown');
        }
        if (cmd.includes('sleep') || cmd.includes('suspender') || cmd.includes('dormir')) {
             return await this.systemControl('sleep');
        }

        // 3. Volume & Media
        if (cmd.includes('volume') || cmd.includes('som')) {
            if (cmd.includes('up') || cmd.includes('aumentar') || cmd.includes('+')) return await this.setVolume('up');
            if (cmd.includes('down') || cmd.includes('diminuir') || cmd.includes('-')) return await this.setVolume('down');
            if (cmd.includes('mute') || cmd.includes('mudo')) return await this.setVolume('mute');
        }

        if (cmd.match(/(?:digita|escreve|type)\s+(.+)/i)) {
            const text = cmd.match(/(?:digita|escreve|type)\s+(.+)/i)[1];
            return await this.typeText(text);
        }

        // Search logic
        if (cmd.includes('pesquise ') || cmd.includes('busque ') || cmd.includes('search ') || cmd.includes('procura ')) {
            const query = cmd.replace(/^(pesquise|busque|search|procura|no|na|pelo|por)\s+/g, '').trim();
            if (cmd.includes('youtube')) {
                const searchTerms = query.replace('no youtube', '').replace('youtube', '').trim();
                return await this.openApp(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerms)}`);
            }
            if (cmd.includes('google')) {
                const searchTerms = query.replace('no google', '').replace('google', '').trim();
                return await this.openApp(`https://www.google.com/search?q=${encodeURIComponent(searchTerms)}`);
            }
            // Default search
            return await this.openApp(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
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
            if (this.remoteClients.length > 0) {
                console.log(`[PC Controller] Broadcasting ORGANIZE: ${target}`);
                this.broadcast('organize', target);
                return { success: true, message: `Organizing ${target}...` };
            }
        }

        // System Maintenance
        if (cmd.includes('clean') || cmd.includes('limpar sistema') || cmd.includes('otimizar') || cmd.includes('manutenção')) {
            let action = 'clean_temp';
            if (cmd.includes('recycle') || cmd.includes('lixeira')) action = 'empty_recycle';
            
            if (this.remoteClients.length > 0) {
                 this.broadcast('maintenance', action);
                 return { success: true, message: `Running maintenance: ${action}` };
            }
        }

        // Fallback: Try to open whatever it is
        console.log('[PC Controller] Unknown command pattern, trying to open as app/url...');
        return await this.openApp(cmd);
    }

    async getSystemStats() {
        if (this.remoteClients.length > 0) {
            // In a real scenario, we'd wait for a response from the satellite.
            // For now, if a satellite is connected, we assume we want its data.
            // Since SSE is one-way, we might need a different approach for true "request-response"
            // But let's check if we're running locally too.
            this.broadcast('request_stats', null);
            return { message: "Status request sent to PC. Check the Telemetry widget in a few seconds." };
        }

        if (process.env.NODE_ENV === 'production') {
            return { error: "No local PC connected via Lira Link." };
        }

        // Local execution (Windows)
        try {
            const cpu = await this.runPowershell('(Get-WmiObject -Query "Select LoadPercentage from Win32_Processor").LoadPercentage');
            const ramTotal = await this.runPowershell('[Math]::Round((Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum).Sum / 1GB)');
            const ramFree = await this.runPowershell('[Math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB)');
            const battery = await this.runPowershell('(Get-WmiObject Win32_Battery).EstimatedChargeRemaining');
            const uptime = await this.runPowershell('(New-TimeSpan -Start (Get-CimInstance Win32_OperatingSystem).LastBootUpTime).ToString("dd\\:hh\\:mm\\:ss")');

            return {
                cpu_load: `${cpu || 0}%`,
                ram_usage: `${(ramTotal - ramFree / 1024).toFixed(1)}GB / ${ramTotal}GB`,
                battery: battery ? `${battery}%` : 'AC Power',
                uptime: uptime,
                platform: process.platform
            };
        } catch (e) {
            return { error: "Failed to collect local stats: " + e.message };
        }
    }
    
    start() {
        console.log('[PC Controller] Ready (Cloud Hybrid Mode).');
    }
}

export const pcController = new PCControllerService();
