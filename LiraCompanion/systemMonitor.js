const { ipcRenderer } = require('electron');
const os = require('os');
const si = require('systeminformation');

class SystemMonitor {
    constructor() {
        this.lastCPU = null;
        this.alerts = {
            highCPU: false,
            highRAM: false,
            duplicates: false
        };
        this.knownBackends = ['server.js', 'companion-server.js', 'index.js'];
    }

    async getStats() {
        try {
            const cpu = await si.currentLoad();
            const mem = await si.mem();
            const processes = await si.processes();
            
            // 🔎 DETECT DUPLICATE BACKENDS
            const nodeProcesses = processes.list.filter(p => p.name.toLowerCase().includes('node'));
            const processCounts = {};
            const duplicates = [];

            nodeProcesses.forEach(p => {
                // Try to find the script name in command line
                const cmd = p.command.toLowerCase();
                this.knownBackends.forEach(backend => {
                    if (cmd.includes(backend)) {
                        processCounts[backend] = (processCounts[backend] || 0) + 1;
                        if (processCounts[backend] > 1) {
                            duplicates.push({ name: backend, pid: p.pid });
                        }
                    }
                });
            });

            return {
                cpu: { usage: Math.round(cpu.currentLoad * 10) / 10 },
                ram: { usage: Math.round(((mem.active / mem.total) * 100) * 10) / 10 },
                duplicates
            };
        } catch (e) {
            console.error('[Monitor] Error getting stats:', e);
            return null;
        }
    }

    // Start monitoring
    start(interval = 5000) {
        console.log('[Monitor] Starting Advanced Ghost Detection...');

        setInterval(async () => {
            const stats = await this.getStats();
            if (!stats) return;

            // Send to main process for UI
            ipcRenderer.send('system-stats', stats);

            // 👻 GHOST ALERT
            if (stats.duplicates.length > 0 && !this.alerts.duplicates) {
                this.alerts.duplicates = true;
                ipcRenderer.send('system-alert', {
                    type: 'ghost-detected',
                    content: `🚨 GHOST ALERT! Detectei ${stats.duplicates.length} processo(s) duplicado(s) (${stats.duplicates[0].name}). Isso pode estar gastando seus tokens!`,
                    emotion: 'surprised',
                    data: stats.duplicates
                });
            } else if (stats.duplicates.length === 0) {
                this.alerts.duplicates = false;
            }

            // High Usage Alerts
            if (stats.cpu.usage > 85 && !this.alerts.highCPU) {
                this.alerts.highCPU = true;
                ipcRenderer.send('system-alert', {
                    type: 'warning',
                    content: '⚠️ CPU em nível crítico! Seus processos estão fritando.',
                    emotion: 'worried'
                });
            } else if (stats.cpu.usage < 60) this.alerts.highCPU = false;

        }, interval);
    }
}

const monitor = new SystemMonitor();
module.exports = monitor;
