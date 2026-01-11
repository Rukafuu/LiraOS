import axios from 'axios';

const GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || 'http://localhost:3001';

async function getGroupMetadata(groupId) {
    try {
        const { data } = await axios.get(`${GATEWAY_URL}/api/groups/${groupId}`);
        return data;
    } catch (e) {
        console.error('Failed to get group metadata', e.message);
        return null;
    }
}

export async function isGroupAdmin(groupId, userId) {
    // Determine admin status
    const meta = await getGroupMetadata(groupId);
    if (!meta) return false;
    
    // Normalize IDs (remove device part :0 if present)
    const normalizedUser = userId.split(':')[0].split('@')[0];
    
    return meta.participants.some(p => {
        const pId = p.id.split(':')[0].split('@')[0];
        return pId === normalizedUser && (p.admin === 'admin' || p.admin === 'superadmin');
    });
}

export async function performGroupAction(groupId, participants, action) {
    try {
        await axios.post(`${GATEWAY_URL}/api/groups/participants`, {
            groupId,
            participants,
            action 
        });
        return true;
    } catch (e) {
        console.error('Group action failed', e.message);
        return false;
    }
}
