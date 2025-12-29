import { useState, useEffect, useRef } from 'react'
import tmi from 'tmi.js'
import './App.css'

import { voiceService } from './services/voiceService';
import { brainService } from './services/brainService';
import { MinecraftEye } from './services/eyes/minecraftEye';

const minecraftEye = new MinecraftEye();

function App() {
  const [channel, setChannel] = useState('lira_os')
  const [messages, setMessages] = useState<{user: string, text: string}[]>([])
  const [isConnected, setIsConnected] = useState(false)
  
  // Game Eyes State
  const [minecraftActive, setMinecraftActive] = useState(false);
  const [visionActive, setVisionActive] = useState(false);

  // ... (useEffects) ...

  const toggleMinecraft = () => {
    if (minecraftActive) {
        minecraftEye.stop();
        if(window.electronAPI) window.electronAPI.stopMinecraftWatch();
        setMinecraftActive(false);
        setMessages(p => [...p, {user: 'SYSTEM', text: 'MINECRAFT EYE DEACTIVATED.'}]);
    } else {
        minecraftEye.start();
        setMinecraftActive(true);
        setMessages(p => [...p, {user: 'SYSTEM', text: 'MINECRAFT EYE ACTIVATED. WATCHING LOGS...'}]);
    }
  }

  const toggleVision = async () => {
    if (!window.electronAPI) return;

    if (visionActive) {
        await window.electronAPI.stopVisionAgent();
        setVisionActive(false);
        setMessages(p => [...p, {user: 'SYSTEM', text: 'VISION CORE DEACTIVATED.'}]);
    } else {
        const res = await window.electronAPI.startVisionAgent();
        if (res.success) {
            setVisionActive(true);
            setMessages(p => [...p, {user: 'SYSTEM', text: 'VISION CORE ONLINE. WATCHING SCREEN...'}]);
        } else {
            setMessages(p => [...p, {user: 'ERROR', text: `VISION INIT FAILED: ${res.message}`}]);
        }
    }
  }
  const clientRef = useRef<tmi.Client | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Registra listener global do olho Minecraft
    minecraftEye.onEvent(async (event) => {
        setMessages(p => [...p, {user: `GAME [${event.game}]`, text: event.description}]);
        const reaction = await brainService.processGameEvent(event.description);
        setMessages(p => [...p, {user: 'LIRA', text: `${reaction.text} (${reaction.source})`}]);
        const spoke = await voiceService.speak(reaction.text);
        if (!spoke) voiceService.speakBrowser(reaction.text);
    });

    // Registra listener do Vision Agent (Python)
    if (window.electronAPI && window.electronAPI.onVisionEvent) {
        window.electronAPI.onVisionEvent(async (event: any) => {
            // Evento visual puro (ex: "High damage detected")
            console.log("Vision Event:", event);
            
            // Só reage se for algo relevante para não falar demais
            setMessages(p => [...p, {user: `VISION [${event.game || 'Unknown'}]`, text: event.description}]);
            
            const reaction = await brainService.processGameEvent(event.description);
            setMessages(p => [...p, {user: 'LIRA', text: `${reaction.text} (${reaction.source})`}]);
            
            const spoke = await voiceService.speak(reaction.text);
            if (!spoke) voiceService.speakBrowser(reaction.text);
        });
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect().catch(() => {})
      }
      minecraftEye.stop();
    }
  }, [])
  
  // ... (Rest of useEffects)



  // ... (handleConnect, launchTest, triggerGameEvent remain the same)


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleConnect = async () => {
    if (isConnected) return;

    setMessages(p => [...p, {user: 'SYSTEM', text: `INITIALIZING CONNECTION TO ${channel.toUpperCase()}...`}]);
    
    try {
        const client = new tmi.Client({
            channels: [channel],
            connection: {
                secure: true,
                reconnect: true
            }
        });

        client.on('message', async (_channel: any, tags: any, message: string, _self: any) => {
             const user = tags['display-name'] || tags.username || 'Anon';
             
             // Update UI
             setMessages(prev => {
                const updated = [...prev, {user, text: message}];
                if (updated.length > 200) return updated.slice(-200);
                return updated;
             });

             // Brain Process
             const response = await brainService.processChatMessage(user, message);
             if (response) {
                 // Lira responds in chat (UI only for now, later via twitch chat write)
                 setMessages(prev => [...prev, {user: 'LIRA', text: response.text}]);
                 
                 // Lira Speakes
                 // Tenta XTTS, se falhar vai de browser
                 const spoke = await voiceService.speak(response.text);
                 if (!spoke) voiceService.speakBrowser(response.text);
             }
        });

        await client.connect();
        clientRef.current = client;
        setIsConnected(true);
        setMessages(p => [...p, {user: 'SYSTEM', text: `CONNECTION ESTABLISHED.`}]);
        
        voiceService.speakBrowser("Connection established. Online.");

    } catch (err) {
        setMessages(p => [...p, {user: 'SYSTEM', text: `CONNECTION FAILED: ${err}`}]);
    }
  }

  const launchTest = async () => {
    if (window.electronAPI) {
      const target = 'notepad.exe'; 
      setMessages(p => [...p, {user: 'SYSTEM', text: `EXECUTING LAUNCH PROTOCOL: ${target}...`}]);
      const res = await window.electronAPI.launchApp(target);
      if (!res.success) {
         setMessages(p => [...p, {user: 'ERROR', text: `LAUNCH FAILED: ${res.error}`}]);
      } else {
         setMessages(p => [...p, {user: 'SYSTEM', text: `PROCESS STARTED SUCCESSFULLY.`}]); 
         voiceService.speakBrowser("Launching target application.");
      }
    } else {
        alert("Electron API not available");
    }
  }

  const triggerGameEvent = async () => {
      setMessages(p => [...p, {user: 'GAME', text: 'EVENT: Player got a double kill!'}]);
      const response = await brainService.processGameEvent('Player got a double kill!');
      
      setMessages(p => [...p, {user: 'LIRA', text: `${response.text} (${response.source})`}]);
      const spoke = await voiceService.speak(response.text);
      if (!spoke) voiceService.speakBrowser(response.text);
  }

  return (
    <div className="app-container">
      <header className="titlebar">
        <span>LIRA GAMER // DESKTOP PROTOCOL</span>
        <div className="window-controls">
           <button onClick={() => window.electronAPI?.minimize()}>_</button>
           <button onClick={() => window.electronAPI?.maximize()}>□</button>
           <button onClick={() => window.electronAPI?.close()}>✕</button>
        </div>
      </header>
      
      <main className="main-content">
        <aside className="sidebar">
          <div className="status-card">
             <div className="status-header">
                <h3>SYSTEM STATUS</h3>
                <div className={`indicator ${isConnected ? 'online' : ''}`}></div>
             </div>
             <span style={{fontSize: '12px', color: 'var(--text-dim)'}}>
                {isConnected ? 'ONLINE & LISTENING' : 'OFFLINE'}
             </span>
          </div>
          
          <div className="control-group">
            <label>TARGET CHANNEL</label>
            <input 
                value={channel} 
                onChange={e => setChannel(e.target.value)} 
                placeholder="Channel Name"
                disabled={isConnected}
            />
            {!isConnected ? (
                <button className="btn-primary" onClick={handleConnect}>INITIALIZE LINK</button>
            ) : (
                <button className="btn-secondary" onClick={() => window.location.reload()}>TERMINATE</button>
            )}
          </div>
          
          <div className="divider"></div>

          <div className="control-group">
             <label>MANUAL OVERRIDE</label>
             <button className="btn-secondary" onClick={launchTest}>
                LAUNCH NOTEPAD
             </button>
             <button className="btn-primary" style={{marginTop: '8px'}} onClick={triggerGameEvent}>
                SIMULATE GAME EVENT
             </button>
          </div>

          <div className="divider"></div>

          <div className="control-group">
             <label>VISION MODULES</label>
             <button 
                className={minecraftActive ? "btn-primary" : "btn-secondary"} 
                onClick={toggleMinecraft}
             >
                {minecraftActive ? 'DEACTIVATE MC EYE' : 'ACTIVATE MC EYE (LOGS)'}
             </button>

             <button 
                className={visionActive ? "btn-primary" : "btn-secondary"} 
                style={{marginTop: '10px', borderColor: visionActive ? 'var(--primary)' : '#ff0055'}}
                onClick={toggleVision}
             >
                {visionActive ? 'VISION CORE ONLINE' : 'ACTIVATE VISION CORE (PYTHON)'}
             </button>
          </div>
        </aside>

        <section className="feed">
           <h2 style={{margin:0, fontSize: '14px', color: 'var(--primary)'}}>// NEURAL FEED</h2>
           <div className="chat-window">
             {messages.length === 0 && (
                <div style={{color: 'var(--text-dim)', textAlign: 'center', marginTop: '50px', fontSize: '12px'}}>
                    WAITING FOR INPUT STREAM...
                </div>
             )}
             {messages.map((m, i) => (
                <div key={i} className="chat-msg">
                  <span className="user" style={{ color: m.user === 'SYSTEM' ? 'var(--primary)' : 'var(--accent)' }}>
                    [{m.user}]
                  </span>
                  <span className="text" style={{ color: m.user === 'SYSTEM' ? 'var(--text-dim)' : 'var(--text-main)' }}>
                    {m.user !== 'SYSTEM' && ': '}{m.text}
                  </span>
                </div>
             ))}
             <div ref={chatEndRef}></div>
           </div>
        </section>
      </main>
    </div>
  )
}

export default App
