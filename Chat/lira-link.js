/**
 * LIRA LINK - Local Agent for LiraOS (JARVIS Mode)
 * Connects your PC to Lira Cloud so she can control apps, volume, media, AND see your screen.
 * 
 * INSTALLATION:
 * 1. Initialize project: npm init -y
 * 2. Install deps: npm install eventsource open screenshot-desktop node-fetch
 * 3. Run: node lira-link.js
 */

import EventSource from 'eventsource'; 
import { spawn } from 'child_process';
import openPkg from 'open';
import screenshot from 'screenshot-desktop';

// CONFIGURATION ============================================================
// 👇 TCHANGE THIS TO YOUR REAL RAILWAY URL (No trailing slash)
const LIRA_CLOUD_URL = 'https://liraos-production.up.railway.app'; 
// =========================================================================

const CONNECT_ENDPOINT = `${LIRA_CLOUD_URL}/api/system/connect`;
const TICK_ENDPOINT = `${LIRA_CLOUD_URL}/api/vision/tick`;
const VISION_INTERVAL_MS = 10000; // 10 seconds

console.log('🔗 Connecting to Lira Cloud...');
console.log(`📡 URL: ${LIRA_CLOUD_URL}`);

// --- VISUAL CORTEX LOOP ---
console.log('👁️ Visual Cortex: Initializing...');
setInterval(async () => {
    try {
        // Capture JPG for speed/size
        const imgBuffer = await screenshot({ format: 'jpg' }); 
        const base64 = imgBuffer.toString('base64');
        
        // Send Tick
        const res = await fetch(TICK_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                // Add 'Authorization': 'Bearer YOUR_TOKEN' if you implement security later
            },
            body: JSON.stringify({ screenshot: base64 })
        });
        
        if (!res.ok) {
            // console.warn('Vision Tick Failed:', res.status);
        }
    } catch (e) {
        // Silent fail provided we don't spam logs
        // console.error('Vision Tick Error:', e.message);
    }
}, VISION_INTERVAL_MS);


// --- COMMAND RECEIVER ---
const es = new EventSource(CONNECT_ENDPOINT);

es.onopen = () => {
    console.log('✅ Connected! Lira is now linked to this PC.');
};

es.onerror = (err) => {
    console.error('❌ Connection Error. Retrying...');
};

es.onmessage = (event) => {
    try {
        if (!event.data.startsWith('{')) return; // Ignore heartbeat
        const data = JSON.parse(event.data);
        handleMessage(data);
    } catch (e) {
        // Ignore heartbeat or invalid json
    }
};

async function handleMessage(msg) {
    if (msg.type === 'handshake') {
        console.log(`👋 ${msg.message}`);
        return;
    }

    if (msg.type === 'command') {
        console.log(`🤖 Command Received: ${msg.command} -> ${msg.payload}`);
        executeCommand(msg.command, msg.payload);
    }
}

async function executeCommand(cmd, payload) {
    try {
        switch (cmd) {
            case 'open': await openApp(payload); break;
            case 'volume': await setVolume(payload); break;
            case 'media': await mediaControl(payload); break;
            case 'type': await typeText(payload); break;
            case 'system': await runSystemCommand(payload); break;
            default: console.warn('Unknown command:', cmd);
        }
    } catch (err) {
        console.error('Execution Failed:', err.message);
    }
}

// --- LOCAL EXECUTION LOGIC ---

async function runPowershell(command) {
    return new Promise((resolve, reject) => {
        const ps = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command]);
        ps.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Exit Code ${code}`));
        });
    });
}

async function runSystemCommand(action) {
    console.log(`🔒 System Action: ${action}`);
    switch (action) {
        case 'lock': await runPowershell('Rundll32.exe user32.dll,LockWorkStation'); break;
        case 'shutdown': 
            console.log('⚠️ SHUTDOWN REQUESTED! Executing in 3s...');
            await new Promise(r => setTimeout(r, 3000));
            await runPowershell('Stop-Computer -Force'); 
            break;
        case 'sleep': await runPowershell('Rundll32.exe powrprof.dll,SetSuspendState 0,1,0'); break;
    }
}

async function openApp(target) {
    try {
        await openPkg(target);
        console.log('✅ Opened via package');
    } catch {
        console.log('⚠️ Package open failed, trying PS...');
        await runPowershell(`Start-Process "${target}"`);
        console.log('✅ Opened via PS');
    }
}

async function setVolume(action) {
    let keys = '';
    const loops = 5;
    if (action === 'up') keys = `for($i=0;$i -lt ${loops};$i++) { $obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]175) }`;
    if (action === 'down') keys = `for($i=0;$i -lt ${loops};$i++) { $obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]174) }`;
    if (action === 'mute') keys = `$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]173)`;
    
    if (keys) await runPowershell(keys);
}

async function mediaControl(action) {
    let key = '';
    if (action === 'playpause') key = '179';
    if (action === 'next') key = '176';
    if (action === 'prev') key = '177';
    if (action === 'stop') key = '178';
    
    if (key) await runPowershell(`$obj = New-Object -ComObject WScript.Shell; $obj.SendKeys([char]${key})`);
}

async function typeText(text) {
    const escaped = text.replace(/[{}+^%~()]/g, "{$&}");
    await runPowershell(`$wshell = New-Object -ComObject WScript.Shell; $wshell.SendKeys('${escaped}')`);
}
