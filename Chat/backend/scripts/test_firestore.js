import { firestoreService } from '../services/firestoreService.js';

async function testConnection() {
    console.log('Testing Firestore Connection...');
    
    // Wait a bit for async init if any (though constructor calls init)
    // We can just try an op.
    
    if (!firestoreService.initialized) {
        console.log('⚠️ Firestore Service not initialized yet. Check logs for errors (missing key?).');
    }

    try {
        const testCol = 'system_health_check';
        const docId = 'test_connection';
        
        await firestoreService.setDoc(testCol, docId, {
            status: 'online',
            timestamp: Date.now(),
            message: 'LiraOS Firestore Integration Working! 🚀'
        });
        
        console.log('✅ Write Successful!');
        
        const doc = await firestoreService.getDoc(testCol, docId);
        console.log('✅ Read Successful:', doc);
        
        // Cleanup
        // await firestoreService.deleteDoc(testCol, docId);
        
        console.log('🎉 Firestore Integration Verified.');
    } catch (e) {
        console.error('❌ Firestore Test Failed:', e.message);
        console.log('\nDICA: Você baixou a chave JSON para backend/data/serviceAccountKey.json?');
    }
}

testConnection();
