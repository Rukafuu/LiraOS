// Test script for broadcasting to companions
// Run this in the backend console to test

// Example: Send a proactive message
global.broadcastToCompanions({
    type: 'proactive',
    content: 'Olá! Teste de mensagem proativa! 💜',
    emotion: 'happy'
});

console.log('✅ Test message sent to all companions!');

// Example: Send voice state
setTimeout(() => {
    global.broadcastToCompanions({
        type: 'voice-state',
        speaking: true
    });
    console.log('🎤 Voice started');
    
    setTimeout(() => {
        global.broadcastToCompanions({
            type: 'voice-state',
            speaking: false
        });
        console.log('🔇 Voice stopped');
    }, 3000);
}, 2000);
