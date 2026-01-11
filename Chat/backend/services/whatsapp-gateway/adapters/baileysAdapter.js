
import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    downloadMediaMessage
} from '@whiskeysockets/baileys';
import fs from 'fs';
import pino from 'pino';
import path from 'path';
import { normalizeBaileysEvent } from '../utils/normalize.js';
import axios from 'axios';
import qrcode from 'qrcode-terminal';

const logger = pino({ level: 'info' });

let sock;

export async function startBaileys(config) {
    const sessionPath = config.session_path || './whatsapp_sessions';
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    logger.info(`Starting Baileys v${version.join('.')} (Latest: ${isLatest})`);

    sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false, // Deprecated, we handle it manually
        auth: state,
        browser: ['LiraOS', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            logger.info('QR Code received. Please scan to login.');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            logger.warn({ lastDisconnect }, 'Connection closed. Reconnecting: ' + shouldReconnect);
            
            if (shouldReconnect) {
                startBaileys(config);
            } else {
                logger.error('Connection closed. You are logged out.');
            }
        } else if (connection === 'open') {
            logger.info('WhatsApp connection opened!');
            
            // Notify Owner
            const ownerNum = config.owner_number;
            if (ownerNum) {
                const jid = ownerNum + '@s.whatsapp.net';
                sock.sendMessage(jid, { text: `⚡ *Sistema Online*` }).catch(() => {});
            }

            // AUTO-BROADCAST TO GROUPS (Safeguarded)
            const BCAST_FILE = path.resolve('last_broadcast.tmp');
            let lastTime = 0;
            try { 
                if (fs.existsSync(BCAST_FILE)) lastTime = parseInt(fs.readFileSync(BCAST_FILE, 'utf8'));
            } catch {}

            const NOW = Date.now();
            // Only broadcast if > 30 minutes since last time
            if (NOW - lastTime > 30 * 60 * 1000) {
                logger.info('Broadcasting Online Status to Groups...');
                try {
                    // Load Groups
                    const groupsPath = path.resolve('../../config/whatsapp_groups.json');
                    if (fs.existsSync(groupsPath)) {
                        const gData = JSON.parse(fs.readFileSync(groupsPath, 'utf8'));
                        const gIds = Object.keys(gData).filter(k => k.endsWith('@g.us'));
                        
                        let count = 0;
                        for (const gid of gIds) {
                            // Small delay to prevent rate limit (500ms per msg)
                            await new Promise(r => setTimeout(r, 500)); 
                            await sock.sendMessage(gid, { text: "⚡ *Lira Online!*\nDigite */menu* para ver as novidades." });
                            count++;
                        }
                        logger.info(`Broadcasted to ${count} groups.`);
                        fs.writeFileSync(BCAST_FILE, NOW.toString());
                    }
                } catch (e) {
                    logger.error('Broadcast failed', e);
                }
            } else {
                logger.info('Skipping Group Broadcast (Recently sent).');
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            for (const msg of messages) {
                if (!msg.message) continue;
                
                // Basic logging for MVP
                const isGroup = msg.key.remoteJid.endsWith('@g.us');
                const sender = msg.key.participant || msg.key.remoteJid;
                
                // Normalize Event
                // sock.user might be undefined early on, use creds
                const rawId = sock.user?.id || sock.authState.creds.me?.id;
                const botId = rawId ? rawId.split(':')[0] + '@s.whatsapp.net' : '';
                
                // Debug Mentions
                if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(botId)) {
                    logger.info('Bot was mentioned (Adapter Check)');
                }

                const event = normalizeBaileysEvent(msg, botId);

                if (event) {
                    // Check for Media and Download
                    if (event.message.media) {
                        try {
                            const buffer = await downloadMediaMessage(
                                msg,
                                'buffer',
                                { logger }
                            );
                            // Ensure temp dir exists relative to this service OR absolute
                            // Using absolute path based on known project structure
                            const tempDir = path.resolve('../../temp');
                            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                            const ext = event.message.media.mime.split('/')[1].split(';')[0] || 'bin';
                            const fileName = `${msg.key.id}.${ext}`;
                            const filePath = path.join(tempDir, fileName);
                            
                            await fs.promises.writeFile(filePath, buffer);
                            event.message.media.localPath = filePath;
                            logger.info({ filePath }, 'Media downloaded');
                        } catch (e) {
                            logger.error({ err: e.message }, 'Failed to download media');
                        }
                    }

                    logger.info({ event }, 'Normalized Event');
                    
                    // Forward to Core
                    const coreUrl = process.env.CORE_API_URL || 'http://localhost:4000';
                    try {
                        await axios.post(`${coreUrl}/api/webhook/whatsapp`, event);
                    } catch (err) {
                        logger.error({ err: err.message }, 'Failed to forward event to Core');
                    }
                }
            }
        }
    });
    
    return {
        sock,
        sendMessage: async (to, content, options) => {
            await sock.sendMessage(to, content, options);
        },
        groupParticipantsUpdate: async (groupId, participants, action) => {
            // action: 'add' | 'remove' | 'promote' | 'demote'
            await sock.groupParticipantsUpdate(groupId, participants, action);
        },
        groupUpdateSubject: async (groupId, subject) => {
            await sock.groupUpdateSubject(groupId, subject);
        },
        groupSettingUpdate: async (groupId, setting) => {
             // setting: 'announcement' | 'not_announcement' | 'locked' | 'unlocked'
             await sock.groupSettingUpdate(groupId, setting);
        },
        getProfilePicture: async (userId) => {
            try {
                return await sock.profilePictureUrl(userId, 'image');
            } catch {
                return null;
            }
        }
    };
}

export async function sendMessage(to, content, options = {}) {
    if (!sock) throw new Error('WhatsApp socket not initialized');
    await sock.sendMessage(to, content, options);
}
