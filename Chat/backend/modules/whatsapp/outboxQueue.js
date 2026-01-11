
const QUEUE_INTERVAL = 1000; // Check queue every 1s
const MIN_JITTER = 1000;
const MAX_JITTER = 3000;

class OutboxQueue {
    constructor() {
        this.queues = new Map(); // groupId -> Array<Message>
        this.processing = new Map(); // groupId -> boolean
        
        // Start Global Loop
        setInterval(() => this.processAll(), QUEUE_INTERVAL);
    }

    add(groupId, messagePayload) {
        if (!this.queues.has(groupId)) {
            this.queues.set(groupId, []);
        }
        this.queues.get(groupId).push(messagePayload);
    }

    async processAll() {
        for (const [groupId, queue] of this.queues) {
            if (queue.length === 0) continue;
            if (this.processing.get(groupId)) continue;

            const nextMsg = queue.shift();
            this.processing.set(groupId, true);

            // Jitter Delay
            const delay = Math.floor(Math.random() * (MAX_JITTER - MIN_JITTER + 1) + MIN_JITTER);
            
            setTimeout(async () => {
                try {
                    await this.sendMessage(groupId, nextMsg);
                } catch (e) {
                    console.error('Failed to send message', e);
                } finally {
                    this.processing.set(groupId, false);
                }
            }, delay);
        }
    }

    async sendMessage(to, payload) {
        // console.log(`[Outbox] Sending to ${to}:`, payload);
        try {
            const { default: axios } = await import('axios');
            const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:3001';
            await axios.post(`${gatewayUrl}/api/send`, { 
                to, 
                content: payload 
            });
        } catch (e) {
            console.error('[Outbox] Send Failed:', e.message);
        }
    }
}

export const msgQueue = new OutboxQueue();
