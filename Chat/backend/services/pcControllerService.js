import { spawn } from 'child_process';
import openPkg from 'open'; // Using the 'open' package we saw in package.json

class PCControllerService {
    constructor() {
        console.log('[PC Controller] Service Initialized');
    }

    /**
     * Executes a PowerShell command
     */
    async runPowershell(command) {
        return new Promise((resolve, reject) => {
            const ps = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command]);
            
            let stdout = '';
            let stderr = '';

            ps.stdout.on('data', (data) => stdout += data.toString());
            ps.stderr.on('data', (data) => stderr += data.toString());

            ps.on('close', (code) => {
                if (code === 0) resolve(stdout.trim());
                else reject(new Error(`PowerShell Exited ${code}: ${stderr}`));
            });
        });
    }

    /**
     * Opens an application or URL
     * @param {string} target - App name or URL (e.g., "spotify", "notepad", "google.com")
     */
    async openApp(target) {
        console.log(`[PC Controller] Opening: ${target}`);
        
        // Mapeamento de nomes comuns para executáveis/protocólos
        const appMap = {
            'spotify': 'spotify:',
            'discord': 'com.squirrel.Discord.Discord', // Tenta via protocolo ou nome
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
            // Tenta usar package 'open' primeiro (melhor para URLs e defaults)
            await openPkg(command);
            return { success: true, message: `Opened ${target}` };
        } catch (e) {
            console.warn('[PC Controller] open pkg failed, trying powershell fallback...');
            // Fallback para PowerShell Start-Process
            try {
                await this.runPowershell(`Start-Process "${command}"`);
                return { success: true, message: `Opened ${target} via PS` };
            } catch (err) {
                throw new Error(`Failed to open ${target}`);
            }
        }
    }

    /**
     * Sets System Volume (0-100)
     * Requires a trick script because PS doesn't have native volume cmd easily accessible without dlls.
     * Use VBScript trick or nircmd if available. Let's use the WScript.Shell SendKeys equivalent for relative changes,
     * OR a comprehensive PS audio script.
     * 
     * Simpler approach: Simulate Key Presses for VolUp/VolDown/Mute
     */
    async setVolume(action) {
        // action: 'up', 'down', 'mute', 'max', 'min'
        let keys = '';
        const loops = 5; // how many steps

        switch (action) {
            case 'up': 
                // 0xAF is VK_VOLUME_UP
                keys = `for($i=0;$i -lt ${loops};$i++) { $obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]175) }`; 
                break;
            case 'down':
                // 0xAE is VK_VOLUME_DOWN
                keys = `for($i=0;$i -lt ${loops};$i++) { $obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]174) }`;
                break;
            case 'mute':
                // 0xAD is VK_VOLUME_MUTE
                keys = `$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]173)`;
                break;
             // Specific volume level is hard without external tools like nircmd.
        }

        if (keys) {
             await this.runPowershell(keys);
             return { success: true, message: `Volume ${action}` };
        }
        return { success: false, message: 'Unknown volume action' };
    }

    /**
     * Controls Media (Play/Pause, Next, Prev)
     */
    async mediaControl(action) {
        let key = '';
        switch(action) {
            case 'playpause': key = '179'; break; // VK_MEDIA_PLAY_PAUSE
            case 'next': key = '176'; break;      // VK_MEDIA_NEXT_TRACK
            case 'prev': key = '177'; break;      // VK_MEDIA_PREV_TRACK
            case 'stop': key = '178'; break;      // VK_MEDIA_STOP
        }

        if (key) {
            const script = `$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]${key})`;
            await this.runPowershell(script);
            return { success: true, message: `Media ${action}` };
        }
        return { success: false, message: 'Invalid media action' };
    }

    /**
     * Types text using keyboard simulation
     */
    async typeText(text) {
        // Safe characters escaping for SendKeys
        // SendKeys is tricky with special chars.
        console.log(`[PC Controller] Typing: ${text}`);
        const escaped = text.replace(/[{}+^%~()]/g, "{$&}"); // Escape special SendKeys chars
        const script = `
        $wshell = New-Object -ComObject WScript.Shell;
        $wshell.SendKeys('${escaped}')
        `;
        await this.runPowershell(script);
        return { success: true };
    }
    
    /**
     * Handles a generic instruction from the AI Agent (e.g. "open chrome")
     */
    async handleInstruction(command) {
        console.log(`[PC Controller] Handling instruction: "${command}"`);
        const cmd = command.toLowerCase().trim();

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

        // Fallback: Try to open whatever it is
        console.log('[PC Controller] Unknown command pattern, trying to open as app/url...');
        return await this.openApp(cmd);
    }
    
    start() {
        console.log('[PC Controller] Ready to serve.');
    }
}

export const pcController = new PCControllerService();
