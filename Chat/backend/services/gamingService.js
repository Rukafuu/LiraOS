import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🎮 GAMING SERVICE - Lira Gaming Copilot
 * 
 * Responsabilidades:
 * - Detectar jogos ativos
 * - Carregar perfis de jogo
 * - Gerenciar frequência de vision
 * - Notificar companion sobre mudanças de estado
 */
class GamingService {
    constructor() {
        this.currentGame = null;
        this.isGaming = false;
        this.gameProfiles = {};
        this._profileProcessCache = new Map(); // gameId -> Set(processNamesLower)
        this.monitorInterval = null;
        this.visionFrequency = 30000; // Default: 30s (idle)
        
        this.loadGameProfiles();
    }

    /**
     * Carrega perfis de jogos suportados
     */
    async loadGameProfiles() {
        const profilesPath = path.join(__dirname, '../config/gameProfiles.json');
        
        try {
            const data = await fs.readFile(profilesPath, 'utf-8');
            this.gameProfiles = JSON.parse(data);
            this._refreshProcessCache();
            console.log('[GAMING] ✅ Loaded game profiles:', Object.keys(this.gameProfiles));
        } catch (err) {
            console.warn('[GAMING] ⚠️ No game profiles found, using defaults');
            this.gameProfiles = this.getDefaultProfiles();
            this._refreshProcessCache();
            // Criar arquivo de perfis padrão
            await this.saveDefaultProfiles(profilesPath);
        }
    }

    /**
     * Atualiza o cache de nomes de processo para busca rápida
     * @private
     */
    _refreshProcessCache() {
        this._profileProcessCache.clear();
        for (const [gameId, profile] of Object.entries(this.gameProfiles)) {
            if (profile.processNames && Array.isArray(profile.processNames)) {
                const lowerNames = new Set(profile.processNames.map(name => name.toLowerCase()));
                this._profileProcessCache.set(gameId, lowerNames);
            }
        }
    }

    /**
     * Perfis padrão de jogos
     */
    getDefaultProfiles() {
        return {
            'league-of-legends': {
                displayName: 'League of Legends',
                processNames: ['League of Legends.exe', 'LeagueClient.exe', 'LeagueClientUx.exe'],
                windowTitles: ['League of Legends'],
                visionInterval: 5000,
                commentaryStyle: 'strategic',
                events: ['kill', 'death', 'dragon', 'baron', 'tower', 'inhibitor'],
                clipDuration: 15,
                priority: 'high',
                tips: {
                    lowHp: 'Cuidado! HP baixo, recua!',
                    kill: 'Boaaa! +1! 🔥',
                    death: 'Eita, acontece! Vamos recuperar!',
                    win: 'VITÓRIA! GG WP! 🏆',
                    lose: 'Próxima a gente pega! 💪'
                }
            },
            'valorant': {
                displayName: 'VALORANT',
                processNames: ['VALORANT.exe', 'VALORANT-Win64-Shipping.exe'],
                windowTitles: ['VALORANT'],
                visionInterval: 3000,
                commentaryStyle: 'tactical',
                events: ['ace', 'clutch', 'plant', 'defuse', 'kill', 'death'],
                clipDuration: 20,
                priority: 'high',
                tips: {
                    ace: 'ACE! VOCÊ É UM DEMÔNIO! 👹🔥',
                    clutch: 'CLUTCH MODE ATIVADO! 💪',
                    kill: 'Eliminou! Continua!',
                    death: 'Morre não! Mas tá tranquilo.',
                    win: 'VITÓRIA! Dominação total! 🏆',
                    lose: 'GG, próxima round!'
                }
            },
            'osu': {
                displayName: 'osu!',
                processNames: ['osu!.exe'],
                windowTitles: ['osu!'],
                visionInterval: 2000,
                commentaryStyle: 'energetic',
                events: ['fc', 'combo-break', 'new-top-play'],
                clipDuration: 10,
                priority: 'medium',
                tips: {
                    fc: 'FULL COMBO! VOCÊ É INSANO! ⭐✨',
                    comboBreak: 'Ish, quebrou! Mas continua!',
                    newTopPlay: 'NOVO TOP PLAY! PARABÉNS! 🎉'
                }
            },
            'minecraft': {
                displayName: 'Minecraft',
                processNames: ['javaw.exe', 'Minecraft.exe'],
                windowTitles: ['Minecraft'],
                visionInterval: 10000,
                commentaryStyle: 'chill',
                events: ['death', 'achievement', 'dragon', 'wither'],
                clipDuration: 15,
                priority: 'low',
                tips: {
                    death: 'Ah não! Respawna e volta ao fight!',
                    achievement: 'Achievement desbloqueado! Nice! 🏆',
                    dragon: 'ENDER DRAGON DERROTADO! LENDÁRIO! 🐉'
                }
            },
            'cs2': {
                displayName: 'Counter-Strike 2',
                processNames: ['cs2.exe'],
                windowTitles: ['Counter-Strike 2'],
                visionInterval: 3000,
                commentaryStyle: 'tactical',
                events: ['ace', 'clutch', 'bomb-plant', 'bomb-defuse'],
                clipDuration: 20,
                priority: 'medium',
                tips: {
                    ace: 'ACE! VOCÊ É O MELHOR! 🔥',
                    clutch: 'CLUTCH INSANO! 1vX!',
                    win: 'VITÓRIA! GG! 🏆'
                }
            },
            'corinthians-watch': {
                displayName: '⚽ Assistindo Corinthians',
                processNames: [
                    'chrome.exe', 'firefox.exe', 'msedge.exe', 'opera.exe',
                    'vlc.exe', 'PotPlayerMini64.exe', 'mpc-hc64.exe'
                ],
                windowTitles: [
                    'Corinthians', 'Timão', 'SCCP', 'Premiere', 
                    'Globo', 'ESPN', 'Star+', 'YouTube'
                ],
                visionInterval: 8000, // A cada 8 segundos (futebol é contínuo)
                commentaryStyle: 'passionate', // Apaixonada, torcedora
                events: [
                    'gol-corinthians', 'gol-adversario', 
                    'defesa', 'chance-perdida', 'falta', 
                    'cartao-amarelo', 'cartao-vermelho',
                    'escanteio', 'impedimento', 'inicio-jogo', 'fim-jogo'
                ],
                clipDuration: 30, // Clipes mais longos para lances
                priority: 'MÁXIMA', // 🔥 PRIORIDADE ABSOLUTA
                tips: {
                    golCorinthians: '⚽🖤🤍 GOOOOOOOOOOL DO TIMÃO! VAI CORINTHIANS! 🎉🎊',
                    golAdversario: 'Ah não... levamos gol. Mas calma, vamos virar! 💪',
                    defesa: 'CÁSSIO! DEFENDEU! QUE MONSTRO! 🧤✨',
                    chancePerdida: 'Eita, passou perto! Quase! ⚡',
                    falta: 'Falta! Juiz marcou. Vamo lá...',
                    cartaoAmarelo: 'Amarelou! Cuidado agora...',
                    cartaoVermelho: 'EXPULSO! Eita, complicou! 🟥',
                    escanteio: 'Escanteio! Bola na área, pode dar gol!',
                    impedimento: 'Impedimento! Ish, árbitro cortou...',
                    inicioJogo: 'COMEÇOU O JOGO! VAMO TIMÃO! 🖤🤍⚽',
                    fimJogo: 'ACABOU! Que jogo! VAI CORINTHIANS! 🏆',
                    vitoria: '🏆🖤🤍 VITÓRIA DO TIMÃO! É CAMPEÃO! VAI CORINTHIANS! 🎉🎊🎆',
                    empate: 'Empatou... mas tá valendo! Ponto é ponto! 💪',
                    derrota: 'Perdemos hoje... mas o Corinthians nunca desiste! Próximo jogo! 🖤🤍'
                }
            }
        };
    }

    /**
     * Salvar perfis padrão
     */
    async saveDefaultProfiles(profilesPath) {
        try {
            const configDir = path.dirname(profilesPath);
            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(profilesPath, JSON.stringify(this.gameProfiles, null, 2));
            console.log('[GAMING] ✅ Saved default game profiles to', profilesPath);
        } catch (err) {
            console.error('[GAMING] ❌ Failed to save default profiles:', err);
        }
    }

    /**
     * Inicia monitoramento de jogos
     */
    start() {
        console.log('[GAMING] 🎮 Starting Gaming Service...');
        
        // Verifica processos a cada 5 segundos
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
        console.log('[GAMING] 🛑 Gaming Service stopped');
    }

    /**
     * Detecta jogo ativo
     */
    async detectActiveGame() {
        // No Railway/Linux, não podemos detectar jogos via processos locais com tasklist.
        // A detecção é feita pelo Companion (client-side) que envia eventos.
        if (process.platform !== 'win32') return;

        try {
            // Windows: usar tasklist para obter processos
            const { stdout } = await execAsync('tasklist /FO CSV /NH');

            // Criar Set de processos rodando (lowercase) para busca O(1)
            const runningProcesses = new Set(
                stdout.split('\n')
                    .map(line => {
                        const match = line.match(/"([^"]+)"/);
                        return match ? match[1].toLowerCase() : '';
                    })
                    .filter(name => name !== '')
            );

            // Verificar cada perfil de jogo (mantendo a ordem de prioridade dos perfis)
            for (const [gameId, profile] of Object.entries(this.gameProfiles)) {
                const lowerNames = this._profileProcessCache.get(gameId);
                if (!lowerNames) continue;

                let hasGameRunning = false;
                for (const name of lowerNames) {
                    if (runningProcesses.has(name)) {
                        hasGameRunning = true;
                        break;
                    }
                }

                if (hasGameRunning) {
                    await this.onGameDetected(gameId, profile);
                    return;
                }
            }

            // Nenhum jogo detectado
            if (this.currentGame) {
                await this.onGameClosed();
            }

        } catch (err) {
            console.error('[GAMING] Error detecting game:', err.message);
        }
    }

    /**
     * Callback quando jogo é detectado
     */
    async onGameDetected(gameId, profile) {
        if (this.currentGame === gameId) return; // Já detectado

        console.log(`[GAMING] 🎮 Game detected: ${profile.displayName}`);
        this.currentGame = gameId;
        this.isGaming = true;
        this.visionFrequency = profile.visionInterval;

        // Notificar companion
        if (global.broadcastToCompanions) {
            global.broadcastToCompanions({
                type: 'game-detected',
                game: gameId,
                profile: profile,
                visionInterval: profile.visionInterval
            });
        }

        // Lira fala!
        const greetings = [
            `Detectei ${profile.displayName}! Vamos jogar? 🎮`,
            `Opa! ${profile.displayName} aberto! Bora dominar! 💪`,
            `${profile.displayName}? Eu vou ser sua copiloto! Let's go! 🚀`
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        if (global.broadcastToCompanions) {
            global.broadcastToCompanions({
                type: 'proactive',
                content: greeting,
                emotion: 'happy'
            });
        }
    }

    /**
     * Callback quando jogo é fechado
     */
    async onGameClosed() {
        if (!this.currentGame) return;

        const profile = this.gameProfiles[this.currentGame];
        console.log(`[GAMING] 🛑 Game closed: ${profile.displayName}`);
        
        this.currentGame = null;
        this.isGaming = false;
        this.visionFrequency = 30000; // Volta para idle

        // Notificar companion
        if (global.broadcastToCompanions) {
            global.broadcastToCompanions({
                type: 'game-closed',
                visionInterval: 30000
            });
        }

        // Lira despede
        const goodbyes = [
            'GG! Foi divertido! 🎮💜',
            'Sessão encerrada! Descanse! 😊',
            'Até a próxima partida! 👋'
        ];
        const goodbye = goodbyes[Math.floor(Math.random() * goodbyes.length)];
        
        if (global.broadcastToCompanions) {
            global.broadcastToCompanions({
                type: 'proactive',
                content: goodbye,
                emotion: 'happy'
            });
        }
    }

    /**
     * Pega perfil do jogo atual
     */
    getCurrentGameProfile() {
        if (!this.currentGame) return null;
        return this.gameProfiles[this.currentGame];
    }

    /**
     * Pega frequência atual de vision
     */
    getVisionFrequency() {
        return this.visionFrequency;
    }

    /**
     * Verifica se está jogando
     */
    isCurrentlyGaming() {
        return this.isGaming;
    }

    /**
     * Adiciona novo perfil de jogo
     */
    async addGameProfile(gameId, profile) {
        this.gameProfiles[gameId] = profile;
        this._refreshProcessCache();
        
        const profilesPath = path.join(__dirname, '../config/gameProfiles.json');
        await fs.writeFile(profilesPath, JSON.stringify(this.gameProfiles, null, 2));
        
        console.log(`[GAMING] ✅ Added new game profile: ${profile.displayName}`);
    }
}

// Singleton
const gamingService = new GamingService();
export { gamingService };
export default gamingService;
