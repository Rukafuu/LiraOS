
import axios from 'axios';

async function testBridge() {
    try {
        console.log("Testing connection to Game Bridge...");
        const res = await axios.get('http://127.0.0.1:5000/status');
        console.log("Status:", res.data);
        
        try {
            console.log("Attempting to connect to OSU...");
            const conn = await axios.post('http://127.0.0.1:5000/connect', { id: 'osu' });
            console.log("Connect result:", conn.data);
            
            // Start Bot
            const start = await axios.post('http://127.0.0.1:5000/bot/start');
            console.log("Bot Start:", start.data);
            
        } catch(e) {
            console.log("Connect failed:", e.response ? e.response.data : e.message);
        }
        
    } catch (e) {
        console.error("Bridge Connection Failed:", e.message);
    }
}

testBridge();
