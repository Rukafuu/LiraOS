
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import open from 'open';
import axios from 'axios';

// Utility to promisify exec
const execAsync = (cmd) => new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve(stdout ? stdout.trim() : '');
    });
});

class PCControllerService {
    constructor() {
        this.system = os.platform(); // 'win32' for Windows
        this.forbiddenDirs = ['windows', 'system32', 'program files', 'programdata', 'recycle.bin'];
        this.allowedExtensions = ['.txt', '.md', '.py', '.json', '.csv', '.html', '.xml', '.exe', '.lnk', '.url'];
        
        this.aliases = {
            'documentos': path.join(os.homedir(), 'Documents'),
            'docs': path.join(os.homedir(), 'Documents'),
            'desktop': path.join(os.homedir(), 'Desktop'),
            'downloads': path.join(os.homedir(), 'Downloads'),
            'pictures': path.join(os.homedir(), 'Pictures'),
            'imagens': path.join(os.homedir(), 'Pictures'),
            'music': path.join(os.homedir(), 'Music'),
            'musica': path.join(os.homedir(), 'Music'),
            'videos': path.join(os.homedir(), 'Videos'),
            'home': os.homedir(),
            'lira': process.cwd(),
        };

        this.safeExecutables = [
            'calc.exe', 'notepad.exe', 'mspaint.exe', 'write.exe', 'explorer.exe',
            'chrome.exe', 'firefox.exe', 'msedge.exe', 'opera.exe', 'safari.exe',
            'code.exe', 'devenv.exe', 'python.exe', 'pythonw.exe',
            'winword.exe', 'excel.exe', 'powerpnt.exe', 'outlook.exe',
            'vlc.exe', 'mpc-hc.exe', 'potplayer.exe', 'wmplayer.exe',
            'fl64.exe', 'steam.exe', 'discord.exe', 'spotify.exe',
            'photoshop.exe', 'illustrator.exe', 'blender.exe', 'unity.exe',
            'gimp-2.10.exe', 'audacity.exe', 'obs64.exe', 'streamlabs obs.exe'
        ];
    }

    async handleInstruction(instruction) {
        if (!instruction || !instruction.trim()) return "Instrução vazia.";
        
        const lower = instruction.toLowerCase().trim();

        if (this.containsKeywords(lower, ['abrir', 'abre', 'open', 'start'])) {
            return await this.handleOpen(lower);
        }
        if (this.containsKeywords(lower, ['procurar', 'buscar', 'pesquisar', 'search', 'find'])) {
            return await this.handleSearch(lower);
        }
        if (this.containsKeywords(lower, ['listar', 'lista', 'list', 'ls', 'dir'])) {
            return await this.handleList(lower);
        }
        if (this.containsKeywords(lower, ['info', 'informações', 'details'])) {
            return await this.handleInfo(lower);
        }

        return "Comando não reconhecido. Tente 'abrir X', 'listar Y' ou 'procurar Z'.";
    }

    containsKeywords(text, keywords) {
        return keywords.some(k => text.includes(k));
    }

    extractTarget(instruction, keywords) {
        let target = instruction;
        keywords.forEach(k => {
            target = target.replace(k, '');
        });
        
        // Remove common prepositions
        const preps = ['de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'sobre', 'the', 'a', 'an'];
        target = target.split(' ').filter(w => !preps.includes(w)).join(' ');
        
        return target.trim();
    }

    async handleOpen(instruction) {
        const target = this.extractTarget(instruction, ['abrir', 'abre', 'open', 'start']);
        if (!target) return "O que você quer abrir?";

        // 1. Try Alias
        if (this.aliases[target]) {
            return await this.openPath(this.aliases[target]);
        }

        // 2. Try Exact Path
        if (fs.existsSync(target)) {
            return await this.openPath(target);
        }

        // 3. Try Program/Exe Search
        const programResult = await this.openProgram(target);
        if (programResult) return programResult;

        // 4. Try Website
        const siteResult = await this.openWebsite(target);
        if (siteResult) return siteResult;

        return `Não consegui encontrar ou abrir '${target}'.`;
    }

    async openPath(targetPath) {
        try {
            await open(targetPath);
            return `Aberto: ${path.basename(targetPath)}`;
        } catch (e) {
            return `Erro ao abrir: ${e.message}`;
        }
    }

    async openProgram(target) {
        // Simple mapping first
        const common = {
            'calculadora': 'calc',
            'bloco de notas': 'notepad',
            'paint': 'mspaint',
            'explorer': 'explorer',
            'vscode': 'code',
            'chrome': 'chrome',
            'firefox': 'firefox',
            'discord': 'discord',
            'spotify': 'spotify'
        };
        
        let exe = common[target] || target;
        
        try {
            // open() handles apps well too
            await open.openApp(exe).catch(() => open(exe)); 
            return `Programa iniciado: ${exe}`;
        } catch {
             // Fallback to exec for windows commands simply
             try {
                await execAsync(`start "" "${exe}"`);
                return `Programa iniciado (fallback): ${exe}`;
             } catch(e) {
                return null;
             }
        }
    }

    async openWebsite(target) {
        let url = target;
        if (!url.includes('.') && !url.includes(':')) {
           // Basic guesses
           if (['google', 'youtube', 'github'].includes(target)) url = `https://${target}.com`;
           else return null;
        }
        if (!url.startsWith('http')) url = 'https://' + url;

        try {
            await open(url);
            return `Site aberto: ${url}`;
        } catch (e) {
            return `Erro ao abrir site: ${e.message}`;
        }
    }

    async handleSearch(instruction) {
        const target = this.extractTarget(instruction, ['procurar', 'buscar', 'pesquisar', 'search', 'find']);
        if (instruction.includes('youtube')) {
            const query = target.replace('youtube', '').trim();
            const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
            await this.openWebsite(url);
            return `Pesquisando '${query}' no YouTube...`;
        }
        // Basic Google Search
        const url = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
        await this.openWebsite(url);
        return `Pesquisando '${target}' no Google...`;
    }

    async handleList(instruction) {
        const target = this.extractTarget(instruction, ['listar', 'lista', 'list', 'ls', 'dir']) || '.';
        let dirToRead = this.aliases[target] || target;
        
        if (dirToRead === '.') dirToRead = process.cwd();

        try {
            const files = await fs.promises.readdir(dirToRead);
            const preview = files.slice(0, 15).join(', ');
            return `Conteúdo de ${path.basename(dirToRead)}: ${preview} ${files.length > 15 ? '...' : ''}`;
        } catch (e) {
            return `Erro ao listar: ${e.message}`;
        }
    }

    async handleInfo(instruction) {
        // Simplified
        return "Info command not fully implemented in node port yet.";
    }

    async activateOsuBot() {
        const BRIDGE_URL = 'http://127.0.0.1:5000';
        try {
            // 1. Check Status
            try {
                await axios.get(`${BRIDGE_URL}/status`);
            } catch {
                return "❌ O 'Game Bridge' (Python) não está rodando. Inicie o `start_bridge.bat`.";
            }

            // 2. Connect
            try {
                await axios.post(`${BRIDGE_URL}/connect`, { id: 'osu' });
            } catch (e) {
                return "⚠️ Não encontrei o osu! aberto. Abra o jogo primeiro!";
            }

            // 3. Start Bot
            const res = await axios.post(`${BRIDGE_URL}/bot/start`);
            return "🎮 **Modo Gamer Ativado!** Estou controlando o osu! agora. (Boa sorte!)";
        } catch (e) {
            return `❌ Erro: ${e.message}`;
        }
    }

    async stopOsuBot() {
        try {
            await axios.post('http://127.0.0.1:5000/bot/stop');
            return "🛑 Bot de osu! desativado.";
        } catch {
            return "Erro ao contatar Game Bridge.";
        }
    }
}


export const pcController = new PCControllerService();
