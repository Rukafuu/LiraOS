
export const SourceTypes = {
  BAILEYS: 'baileys',
  CLOUD: 'cloud'
};

export const EventTypes = {
  MESSAGE: 'message',
  JOIN: 'join',
  LEAVE: 'leave'
};

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

    // Mentions (JID or Text Fallback)
    const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const botNumber = botId ? botId.split('@')[0] : '';
    
    // Check if text has @BotNumber OR @BotNumberWithoutCountryCode
    // Example: Bot is 55119999, User types @119999 or @55119999
    const shortBotNumber = botNumber.substring(2); // remove '55' (Brazil specific, but MVP)
    
    const textHasBotNumber = botNumber && (text.includes('@' + botNumber) || text.includes('@' + shortBotNumber));
    
    // DEBUG MENTION
    if (text.includes('@')) {
        console.log(`[NORMALIZE] Checking mention: BotNum='${botNumber}' Text='${text}' Match=${textHasBotNumber}`);
    }

    const hasMention = mentions.includes(botId) || textHasBotNumber;

    // Reply to Lira?
    const participant = msg.message.extendedTextMessage?.contextInfo?.participant;
    const replyToLira = participant === botId;

    return {
        source: SourceTypes.BAILEYS,
        groupId: msg.key.remoteJid,
        userId: msg.key.participant || msg.key.remoteJid, // Ensure userId is captured
        timestamp: typeof msg.messageTimestamp === 'number' ? msg.messageTimestamp :  (msg.messageTimestamp.low || Date.now()/1000), 
        type: EventTypes.MESSAGE,
        message: {
            text,
            hasMention,
            mentions, // Pass the array of JIDs
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
