export const EventTypes = {
  MESSAGE: 'message',
  JOIN: 'join',
  LEAVE: 'leave'
};

export const SourceTypes = {
  BAILEYS: 'baileys',
  CLOUD: 'cloud'
};

/**
 * @typedef {Object} WhatsAppEvent
 * @property {string} source - 'baileys' or 'cloud'
 * @property {string} groupId - WhatsApp Group ID (JID)
 * @property {string} userId - Sender ID (JID)
 * @property {number} timestamp - Unix timestamp
 * @property {string} type - 'message' | 'join' | 'leave'
 * @property {Object} message - Message details
 * @property {string} message.text - Text content
 * @property {boolean} message.hasMention - If bot is mentioned
 * @property {boolean} message.replyToLira - If replying to bot
 * @property {Object} [message.media] - Media details if any
 */
