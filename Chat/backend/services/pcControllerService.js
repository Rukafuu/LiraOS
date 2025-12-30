
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
    }
    
    start() {
        console.log('[PC_CONTROLLER] Service started.');
    }

    async handleInstruction(instruction) {
        if (!instruction || !instruction.trim()) return "Instrução vazia.";
        
        const lower = instruction.toLowerCase().trim();

        // 0. Smart YouTube / Google (High Priority)
        // Handles: "abrir youtube no video X", "pesquisar X no youtube", "tocar X no youtube"
        if (lower.includes('youtube')) {
             const query = lower.replace(/abrir|tocar|ouvir|assistir|pesquisar|procurar|no|no|youtube|o|a|video|música/gi, '').trim();
             if (query.length > 2) {
                 const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                 await this.openWebsite(url);
                 return `Abrindo YouTube com: "${query}"`;
             } else {
                 await this.openWebsite('youtube');
                 return "Abrindo YouTube...";
             }
        }
        
        if (lower.includes('google') && (lower.includes('pesquisar') || lower.includes('procurar') || lower.includes('buscar'))) {
             const query = lower.replace(/pesquisar|procurar|buscar|no|google|sobre|por|o|a/gi, '').trim();
             const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
             await this.openWebsite(url);
             return `Pesquisando no Google: "${query}"`;
        }


        // 1. Media Controls
        if (this.containsKeywords(lower, ['play', 'pause', 'pausar', 'tocar', 'parar música', 'continuar música'])) {
            // Se tiver "tocar X", assume que é busca genérica se não for mídia
            // Mas vamos manter media key simples por enquanto ou tentar abrir spotify?
            // Se for só "tocar" ou "pausar", usa media key.
            if (lower.split(' ').length <= 2) return await this.sendMediaKey('play_pause');
        }
        if (this.containsKeywords(lower, ['next', 'próxima', 'avançar', 'pular'])) return await this.sendMediaKey('next');
        if (this.containsKeywords(lower, ['prev', 'anterior', 'voltar música', 'retroceder'])) return await this.sendMediaKey('prev');
        
        // 2. Volume Controls
        if (this.containsKeywords(lower, ['mudo', 'mute', 'silenciar'])) return await this.sendMediaKey('mute');
        if (this.containsKeywords(lower, ['aumentar', 'subir', 'mais alto', 'aumenta'])) return await this.changeVolume('up');
        if (this.containsKeywords(lower, ['diminuir', 'baixar', 'abaixar', 'mais baixo', 'diminui'])) return await this.changeVolume('down');

        // 3. System Apps & Navigation
        if (this.containsKeywords(lower, ['abrir', 'abre', 'open', 'start', 'iniciar'])) {
            return await this.handleOpen(lower);
        }
        if (this.containsKeywords(lower, ['procurar', 'buscar', 'pesquisar', 'search', 'find'])) {
            return await this.handleSearch(lower);
        }
        if (this.containsKeywords(lower, ['listar', 'lista', 'list', 'ls', 'dir'])) {
            return await this.handleList(lower);
        }

        return "Comando não reconhecido. Tente 'abrir X', 'tocar música' ou 'aumentar volume'.";
    }

    containsKeywords(text, keywords) {
        return keywords.some(k => text.includes(k));
    }

    extractTarget(instruction, keywords) {
        let target = instruction;
        keywords.forEach(k => {
            // Replace keyword case-insensitive
            const regex = new RegExp(k, 'gi');
            target = target.replace(regex, '');
        });
        
        // Remove common prepositions
        const preps = ['de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'sobre', 'the', 'a', 'an', 'o', 'video', 'programa', 'app', 'aplicativo'];
        target = target.split(' ').filter(w => !preps.includes(w)).join(' ');
        
        return target.trim();
    }

    // --- Media & Volume Implementation ---

    async sendMediaKey(action) {
        let key = 0;
        let msg = "";

        switch(action) {
            case 'play_pause': key = 179; msg = "⏯️ Play/Pause"; break;
            case 'next': key = 176; msg = "⏭️ Próxima"; break;
            case 'prev': key = 177; msg = "⏮️ Anterior"; break;
            case 'mute': key = 173; msg = "🔇 Mute Toggled"; break;
        }

        if (key > 0) {
            const cmd = `powershell -c "$ws = New-Object -ComObject WScript.Shell; $ws.SendKeys([char]${key})"`;
            try {
                await execAsync(cmd);
                return msg;
            } catch (e) {
                console.error("Media Key Error:", e);
                return "Falha ao controlar mídia.";
            }
        }
        return "Comando de mídia inválido.";
    }

    async changeVolume(direction) {
        const key = direction === 'up' ? 175 : 174;
        const cmd = `powershell -c "$ws = New-Object -ComObject WScript.Shell; for($i=0;$i-lt 5;$i++){ $ws.SendKeys([char]${key}) }"`;
        
        try {
            await execAsync(cmd);
            return direction === 'up' ? "🔊 Aumentando volume..." : "🔉 Baixando volume...";
        } catch (e) {
            return "Erro ao ajustar volume.";
        }
    }

    // --- System Actions ---

    async handleOpen(instruction) {
        const target = this.extractTarget(instruction, ['abrir', 'abre', 'open', 'start', 'iniciar']);
        if (!target) return "O que você quer abrir?";

        // 1. Check Smart Aliases first
        const programResult = await this.openProgram(target);
        if (programResult) return programResult;

        // 2. Check Paths
        if (this.aliases[target]) {
            return await this.openPath(this.aliases[target]);
        }
        if (fs.existsSync(target)) {
            return await this.openPath(target);
        }

        // 3. Fallback to Website
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
        // Expanded Dictionary
        const common = {
            'calculadora': 'calc',
            'bloco de notas': 'notepad',
            'paint': 'mspaint',
            'explorer': 'explorer',
            'vscode': 'code',
            'visual studio code': 'code',
            'chrome': 'chrome',
            'firefox': 'firefox',
            'edge': 'msedge',
            'discord': 'discord',
            'spotify': 'spotify',
            'obs': 'obs64',
            'obs studio': 'obs64',
            'steam': 'steam',
            'fl studio': 'fl64', // or FL64.exe
            'fl': 'fl64',
            'fruity loops': 'fl64',
            'word': 'winword',
            'excel': 'excel',
            'powerpoint': 'powerpnt',
            'photoshop': 'photoshop',
            'illustrator': 'illustrator',
            'premiere': 'Adobe Premiere Pro.exe', // Tricky without full path, often needs shortcut or registry
            'after effects': 'AfterFX',
            'terminal': 'wt',
            'cmd': 'cmd',
            'powershell': 'powershell'
        };
        
        const key = Object.keys(common).find(k => target.includes(k) || k.includes(target));
        let exe = key ? common[key] : target;
        
        // Special case for complex names that might fail 'run'
        if (exe === 'fl64' && os.platform() === 'win32') exe = 'FL64.exe'; 
        // Need to rely on PATH or App Paths in registry. 
        // For FL64 usually it works if in path, otherwise might fail.
        
        try {
            await open.openApp(exe).catch(() => open(exe)); 
            return `Programa iniciado: ${exe}`;
        } catch {
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
}

export const pcController = new PCControllerService();
