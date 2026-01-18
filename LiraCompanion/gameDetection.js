// 🎮 Game Detection Service - LOCAL (Companion Side)
// Detects running games on the user's Windows machine

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class LocalGameDetection {
    constructor() {
        this.currentGame = null;
        this.monitorInterval = null;
        this.isMonitoring = false;
        
        // Game profiles (process names to detect)
        this.gameProfiles = {
            'league-of-legends': {
                processNames: ['League of Legends.exe', 'LeagueClient.exe', 'LeagueClientUx.exe'],
                displayName: 'League of Legends'
            },
            'valorant': {
                processNames: ['VALORANT.exe', 'VALORANT-Win64-Shipping.exe'],
                displayName: 'VALORANT'
            },
            'osu': {
                processNames: ['osu!.exe'],
                displayName: 'osu!'
            },
            'minecraft': {
                processNames: ['javaw.exe', 'Minecraft.exe'],
                displayName: 'Minecraft'
            },
            'cs2': {
                processNames: ['cs2.exe'],
                displayName: 'Counter-Strike 2'
            },
            'corinthians-watch': {
                processNames: [
                    'chrome.exe', 'firefox.exe', 'msedge.exe', 'opera.exe',
                    'vlc.exe', 'PotPlayerMini64.exe', 'mpc-hc64.exe'
                ],
                displayName: '⚽ Assistindo Futebol',
                requiresWindowCheck: true // Precisa verificar título da janela
            }
        };
    }

    /**
     * Inicia monitoramento automático
     */
    start(onGameDetected, onGameClosed) {
        if (this.isMonitoring) return;
        
        console.log('[LOCAL DETECTION] 🎮 Starting automatic game detection...');
        this.isMonitoring = true;
        this.onGameDetected = onGameDetected;
        this.onGameClosed = onGameClosed;
        
        // Verifica a cada 5 segundos
        this.monitorInterval = setInterval(() => {
            this.detectActiveGame();
        }, 5000);
        
        // Verificação inicial
        this.detectActiveGame();
    }

    /**
     * Para monitoramento
     */
    stop() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        this.isMonitoring = false;
        console.log('[LOCAL DETECTION] 🛑 Game detection stopped');
    }

    /**
     * Detecta jogo ativo
     */
    async detectActiveGame() {
        try {
            // Windows: usar tasklist para obter processos
            const { stdout } = await execAsync('tasklist /FO CSV /NH');
            const processes = stdout.split('\n').map(line => {
                const match = line.match(/"([^"]+)"/);
                return match ? match[1] : '';
            });

            // Verificar cada perfil de jogo
            for (const [gameId, profile] of Object.entries(this.gameProfiles)) {
                for (const processName of profile.processNames) {
                    if (processes.some(p => p.toLowerCase() === processName.toLowerCase())) {
                        // Se é corinthians-watch, precisa verificar janela
                        if (profile.requiresWindowCheck) {
                            const isFootball = await this.checkForFootballWindow();
                            if (isFootball) {
                                await this.handleGameDetected(gameId, profile);
                                return;
                            }
                        } else {
                            await this.handleGameDetected(gameId, profile);
                            return;
                        }
                    }
                }
            }

            // Nenhum jogo detectado
            if (this.currentGame) {
                await this.handleGameClosed();
            }

        } catch (err) {
            console.error('[LOCAL DETECTION] Error:', err.message);
        }
    }

    /**
     * Verifica se há janela de futebol aberta
     */
    async checkForFootballWindow() {
        try {
            // PowerShell para listar títulos de janela
            const cmd = `powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object -ExpandProperty MainWindowTitle"`;
            const { stdout } = await execAsync(cmd);
            
            const keywords = ['corinthians', 'timão', 'futebol', 'football', 'premiere', 'globo', 'espn', 'star+'];
            const windowTitles = stdout.toLowerCase();
            
            return keywords.some(keyword => windowTitles.includes(keyword));
        } catch (err) {
            return false;
        }
    }

    /**
     * Handler quando jogo é detectado
     */
    async handleGameDetected(gameId, profile) {
        if (this.currentGame === gameId) return; // Já detectado

        console.log(`[LOCAL DETECTION] 🎮 Game detected: ${profile.displayName}`);
        this.currentGame = gameId;

        // Callback
        if (this.onGameDetected) {
            this.onGameDetected(gameId, profile.displayName);
        }
    }

    /**
     * Handler quando jogo é fechado
     */
    async handleGameClosed() {
        if (!this.currentGame) return;

        const gameId = this.currentGame;
        console.log(`[LOCAL DETECTION] 🛑 Game closed: ${gameId}`);
        
        this.currentGame = null;

        // Callback
        if (this.onGameClosed) {
            this.onGameClosed(gameId);
        }
    }
}

module.exports = new LocalGameDetection();
