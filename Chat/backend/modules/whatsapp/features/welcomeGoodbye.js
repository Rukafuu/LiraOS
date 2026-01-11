import { groupStore } from '../data/groupStore.js';

export async function handleJoin(event, sendMessageFn) {
    const { isNew, group } = await groupStore.initGroup(event.groupId);
    
    if (group.welcomeParams?.enabled) {
        const userId = event.userId.split('@')[0];
        let text = `Olá @${userId}! Bem-vindo(a) ao grupo! 🤖✨\nEu sou a Lira. Fale meu nome ou use /menu para interagir.`;
        
        if (isNew) {
            text += `\n\n🎉 *Período de Teste Iniciado!*\nEste grupo tem 24 horas de uso gratuito da Lira Turbo.\nAproveitem!`;
        }
        
        sendMessageFn(event.groupId, { text, mentions: [event.userId] });
    }
}

export function handleLeave(event, sendMessageFn) {
    // Silent leave by default to reduce spam
}
