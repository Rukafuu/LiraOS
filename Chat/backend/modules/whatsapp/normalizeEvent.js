import { EventTypes, SourceTypes } from './types.js';

export function normalizeBaileysEvent(msg, botId) {
    if (!msg.message) return null;

    const isGroup = msg.key.remoteJid.endsWith('@g.us');
    // If we only care about groups
    if (!isGroup) return null; 

    // Extract text
    const text = msg.message.conversation || 
                 msg.message.extendedTextMessage?.text || 
                 msg.message.imageMessage?.caption || 
                 msg.message.videoMessage?.caption || 
                 '';

    // Mentions
    const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const hasMention = mentions.includes(botId);

    // Reply to Lira?
    const participant = msg.message.extendedTextMessage?.contextInfo?.participant;
    const replyToLira = participant === botId;

    return {
        source: SourceTypes.BAILEYS,
        groupId: msg.key.remoteJid,
        userId: msg.key.participant,
        timestamp: msg.messageTimestamp, // Baileys gives this as seconds usually? Check docs. Assuming seconds.
        type: EventTypes.MESSAGE,
        message: {
            text,
            hasMention,
            replyToLira,
            media: getMediaInfo(msg.message)
        }
    };
}

function getMediaInfo(message) {
    if (message.imageMessage) return { type: 'image', mime: message.imageMessage.mimetype };
    if (message.videoMessage) return { type: 'video', mime: message.videoMessage.mimetype };
    if (message.stickerMessage) return { type: 'sticker', mime: message.stickerMessage.mimetype };
    return null;
}
