import type { GameEye, GameEvent } from './types';

// O Electron não consegue ler arquivos fora da sandbox facilmente no renderer sem configuração.
// Por segurança e arquitetura, a leitura de arquivos (logs do Minecraft) deve ser feita no MAIN process (Node.js)
// e enviada para o Renderer via IPC. 
// ESTE SERVIÇO AQUI é apenas o receptor no Front-end.

export class MinecraftEye implements GameEye {
    gameName = "Minecraft";
    isActive = false;
    private listeners: ((event: GameEvent) => void)[] = [];

    start() {
        this.isActive = true;
        console.log("Minecraft Eye Activated (Listening to IPC channel 'minecraft-log')");
        
        // Escuta eventos vindos do Processo Principal (Node.js)
        if (window.electronAPI) {
            window.electronAPI.startMinecraftWatch(); // Auto-start watching when eye is enabled
            window.electronAPI.onMinecraftLog((logLine: string) => {
                this.processLogLine(logLine);
            });
        }
    }

    stop() {
        this.isActive = false;
        // Remove listener logic if needed
    }

    onEvent(callback: (event: GameEvent) => void) {
        this.listeners.push(callback);
    }

    private emit(event: GameEvent) {
        if (!this.isActive) return;
        this.listeners.forEach(l => l(event));
    }

    private processLogLine(line: string) {
        // Lógica simples de regex para interpretar o log
        if (line.includes(" joined the game")) {
             this.emit({
                 game: 'Minecraft',
                 type: 'status',
                 data: { raw: line },
                 description: `Player joined the server.`
             });
        }
        else if (line.includes("slain by") || line.includes("shot by") || line.includes("blew up")) {
            this.emit({
                game: 'Minecraft',
                type: 'death',
                data: { raw: line },
                description: `Death detected in Minecraft: ${line.split(']: ')[1] || 'Someone died'}`
            });
        }
        else if (line.includes("[CHAT]")) {
            const chatMsg = line.split("[CHAT]")[1].trim();
            this.emit({
                 game: 'Minecraft',
                 type: 'chat',
                 data: { text: chatMsg },
                 description: `Minecraft Chat: ${chatMsg}`
            });
        }
    }
}
