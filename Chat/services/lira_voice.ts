const SYNTHESIS = typeof window !== 'undefined' ? window.speechSynthesis : null;
const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:4000';
import { getAuthHeaders } from './userService';

export interface VoiceOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  voiceName?: string;
  usePremium?: boolean;
  voiceId?: string;
}

export interface SpeakResult {
  ok: boolean;
  usedVoiceId: string;
  fallbackUsed: boolean;
  error?: string;
}

export const PREMIUM_VOICES = [
  { id: 'xtts-local', name: 'XTTS v2 (Local GPU)', description: 'Free Neural Voice', color: 'from-emerald-500 to-teal-500' },
  { id: '2RrzVoV9QVqHnD8bujTu', name: 'Lira', description: 'Voz Padrão', color: 'from-pink-500 to-rose-500' },
  { id: 'WtA85syCrJwasGeHGH2p', name: 'Mira', description: 'Oposto', color: 'from-purple-500 to-indigo-500' },
  { id: 'BpjGufoPiobT79j2vtj4', name: 'Carina', description: 'Extra', color: 'from-blue-500 to-cyan-500' },
  { id: 'oJebhZNaPllxk6W0LSBA', name: 'Spica', description: 'Extra', color: 'from-green-500 to-emerald-500' },
  { id: 'JS6C6yu2x9Byh4i1a8lX', name: 'Alfa', description: 'Extra', color: 'from-yellow-500 to-orange-500' },
  { id: 'lWq4KDY8znfkV0DrK8Vb', name: 'Alcyone', description: 'Extra', color: 'from-red-500 to-pink-500' }
];

class LiraVoice {
  private voice: SpeechSynthesisVoice | null = null;
  private speaking: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private listeners: { onStart?: () => void; onEnd?: () => void }[] = [];
  
  // ♻️ Global Recycled Audio Element (for Autoplay Stability)
  private globalAudio = typeof window !== 'undefined' ? new Audio() : null;
  
  // Audio streaming (for XTTS WAV)
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private nextStartTime = 0;
  private streamVolume = 1.0;

  public getAnalyser(): AnalyserNode | null {
      return this.analyser;
  }
  public getAudioContext(): AudioContext | null {
      return this.audioContext;
  }

  private async ensureAudioContext() {
     if (!this.audioContext) {
        // @ts-ignore
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256; // Smaller for faster response
        this.analyser.smoothingTimeConstant = 0.5;
     }
     
     if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
     }
     return this.audioContext;
  }

  public async resumeAudioContext() {
      await this.ensureAudioContext();
  }

  constructor() {
    if (SYNTHESIS) {
      if (SYNTHESIS.onvoiceschanged !== undefined) {
        SYNTHESIS.onvoiceschanged = () => this.loadVoice();
      }
      this.loadVoice();
    }
  }

  private loadVoice() {
    if (!SYNTHESIS) return;
    const voices = SYNTHESIS.getVoices();
    this.voice = voices.find(v => v.lang === 'pt-BR' && (v.name.includes('Google') || v.name.includes('Francisca'))) 
              || voices.find(v => v.lang === 'pt-BR') 
              || voices[0];
  }

  getLocalVoices(): SpeechSynthesisVoice[] {
    if (!SYNTHESIS) return [];
    return SYNTHESIS.getVoices().filter(v => v.lang.includes('pt') || v.lang.includes('PT'));
  }

  setLocalVoice(name: string) {
    if (!SYNTHESIS) return;
    const voices = SYNTHESIS.getVoices();
    const found = voices.find(v => v.name === name);
    if (found) this.voice = found;
  }

  subscribe(listener: { onStart?: () => void; onEnd?: () => void }) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyStart() {
    this.listeners.forEach(l => l.onStart?.());
  }

  private notifyEnd() {
    this.listeners.forEach(l => l.onEnd?.());
  }

  // 🔓 Audio Unlocker (Call on user interaction)
  public async unlock() {
    console.log("[LiraVoice] 🔓 Unlock requested...");
    try {
        await this.ensureAudioContext();
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log("[LiraVoice] 🔓 AudioContext Resumed by user gesture.");
        } else {
            console.log("[LiraVoice] 🔓 AudioContext already running or missing.");
        }
    } catch (e) {
        console.warn("[LiraVoice] Unlock Error:", e);
    }
  }

  // ✅ Health check for XTTS server
  async checkXTTSAvailability(timeoutMs = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      
      const res = await fetch('http://localhost:5002/health', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      return res.ok;
    } catch (e) {
      console.warn("[LiraVoice] XTTS Health Check failed:", e);
      return false;
    }
  }

  private audioSourceNode: MediaElementAudioSourceNode | null = null;

  private async connectGlobalAudio() {
      await this.ensureAudioContext();
      if (!this.globalAudio || !this.audioContext || !this.analyser) return;

      // Create MediaElementSource ONLY ONCE
      if (!this.audioSourceNode) {
          try {
             this.audioSourceNode = this.audioContext.createMediaElementSource(this.globalAudio);
             this.audioSourceNode.connect(this.analyser);
             this.analyser.connect(this.audioContext.destination);
          } catch (e) {
             console.warn("Audio Routing Error:", e);
          }
      }
  }

  // 🎵 Play a Song/Audio URL through the avatar system
  async playSong(url: string): Promise<boolean> {
      console.log("[LiraVoice] 🎵 Playing Song:", url);
      this.stop(); // Stop any current speech
      
      if (!this.globalAudio) this.globalAudio = new Audio();
      await this.connectGlobalAudio();
      
      this.globalAudio.crossOrigin = "anonymous";
      this.globalAudio.src = url;
      this.globalAudio.volume = 1.0;
      
      try {
          await this.globalAudio.play();
          this.speaking = true;
          this.notifyStart();
          
          this.globalAudio.onended = () => {
              this.speaking = false;
              this.notifyEnd();
          };
          return true;
      } catch (e) {
          console.error("Song Playback Failed:", e);
          return false;
      }
  }

  // ✅ Main speak method with failover
  async speak(text: string, options: VoiceOptions = {}): Promise<SpeakResult> {
    console.log("[LiraVoice] 📢 Speak called for:", text.substring(0, 15));
    this.stop();
    
    // 🧹 Deep Cleanup: Remove Emojis, Markdown, and odd symbols to save TTS
    const cleanText = text
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '') // Remove Emojis
        .replace(/[*#`_~\[\]()]/g, '') // Remove Markdown
        .replace(/\s+/g, ' ')
        .trim();

    console.log(`[LiraVoice] Speaking: "${cleanText}" (Original: "${text.substring(0, 20)}...")`);
    
    this.notifyStart();

    let requestedVoice = options.voiceId || (options.usePremium ? 'xtts-local' : '');
    let usedVoiceId = requestedVoice;
    let fallbackUsed = false;

    // 🎤 Premium Voice Path
    if (options.usePremium && requestedVoice) {
      // Check XTTS availability for local voices
      if (requestedVoice === 'xtts-local') {
        const xttsOk = true; 
        
        if (!xttsOk) {
          console.warn('⚠️ XTTS offline/timeout, falling back to Google TTS');
          usedVoiceId = 'google-pt-BR'; // Signal to use standard voice
          fallbackUsed = true;
          requestedVoice = ''; // Clear to skip premium attempt
        }
      }

      // Try premium voice if not failed health check
      if (requestedVoice) {
        try {
          let textToSend = cleanText;
          
          // ✂️ XTTS SAFETY CUT: Limit to ~1000 chars to avoid "400 tokens" error and crash
          if (requestedVoice === 'xtts-local' && textToSend.length > 950) {
              const safeCut = textToSend.lastIndexOf('.', 950);
              if (safeCut > 100) {
                  textToSend = textToSend.substring(0, safeCut + 1);
              } else {
                  // If no good punctuation, just hard cut
                  textToSend = textToSend.substring(0, 950) + "...";
              }
              console.log(`[LiraVoice] ✂️ Truncated huge text for XTTS Safety (${cleanText.length} -> ${textToSend.length} chars)`);
          }

          const res = await fetch(`${API_BASE_URL}/api/voice/tts`, {
            method: 'POST',
            credentials: 'include',
            headers: { 
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({ text: textToSend, voiceId: requestedVoice })
          });


          if (res.ok) {
            const contentType = res.headers.get('content-type');
            
            // XTTS WAV & ElevenLabs MP3
            if (contentType?.includes('audio/wav') || contentType?.includes('audio/mpeg')) {
              console.log(`[LiraVoice] Fetching Audio Blob (${(await res.clone().blob()).size} bytes)...`);
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              
              console.log("[LiraVoice] Playing via Global HTML5 Audio Element...");
              
              if (!this.globalAudio) this.globalAudio = new Audio();
              
              // Reset and Load
              this.globalAudio.pause();
              this.globalAudio.currentTime = 0;
              this.globalAudio.src = url;
              this.globalAudio.volume = options.volume || 1.0;
              
              try {
                  // Connect Visualizer if possible
                  await this.connectGlobalAudio();

                  // 🔫 FIRE
                  await this.globalAudio.play();
                  console.log("✅ Play success.");

              } catch (playErr) {
                  console.error("❌ Play Blocked/Failed:", playErr);
                  console.warn("⚠️ FALLBACK TO GOOGLE TTS IMMEDIATELY");
                  return this.speak(cleanText, { ...options, usePremium: false, voiceId: 'google-pt-BR' });
              }
              
              this.speaking = true;
              this.globalAudio.onended = () => { 
                this.speaking = false; 
                this.notifyEnd();
              };
              return { ok: true, usedVoiceId: requestedVoice, fallbackUsed: false };
            }
          }
        } catch (e) {
          console.warn('Premium voice failed:', e);
          fallbackUsed = true;
        }
      }
    }

    // 🤖 Fallback: Standard Browser Voice
    if (SYNTHESIS) {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.voice) utterance.voice = this.voice;
      utterance.pitch = options.pitch || 1.0;
      utterance.rate = options.rate || 1.1;
      utterance.volume = options.volume || 1.0;

      utterance.onstart = () => { this.speaking = true; };
      utterance.onend = () => { 
        this.speaking = false; 
        this.notifyEnd();
      };
      utterance.onerror = () => { 
        this.speaking = false; 
        this.notifyEnd();
      };

      SYNTHESIS.speak(utterance);
      return { ok: true, usedVoiceId: fallbackUsed ? 'google-pt-BR' : 'browser', fallbackUsed };
    }

    return { ok: false, usedVoiceId: 'none', fallbackUsed, error: 'No TTS available' };
  }

  // 🎵 Play Audio Buffer (Web Audio API)
  private async playAudioBuffer(arrayBuffer: ArrayBuffer, volume: number = 1.0) {
      await this.ensureAudioContext();
      if (!this.audioContext) throw new Error("No Audio Context");

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      
      if (this.analyser) {
          gainNode.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
      } else {
          gainNode.connect(this.audioContext.destination);
      }

      this.speaking = true;
      source.start(0);
      
      source.onended = () => {
          this.speaking = false;
          this.notifyEnd();
      };
  }

  // 🎵 Streaming audio playback (XTTS WAV)
  private async playStreamingAudio(response: Response, volume: number = 1.0) {
    await this.ensureAudioContext();
    this.streamVolume = volume;

    this.audioQueue = [];
    this.isPlaying = false;
    this.nextStartTime = this.audioContext.currentTime + 0.5;

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No body stream');

    const processChunk = async () => {
      const { done, value } = await reader.read();
      if (done) {
        this.speaking = false;
        this.notifyEnd();
        return;
      }

      this.audioQueue.push(value.buffer);
      this.playNextChunk();
      processChunk();
    };

    this.speaking = true;
    processChunk();
  }

  private playNextChunk() {
    if (this.isPlaying || this.audioQueue.length === 0 || !this.audioContext) return;
    
    this.isPlaying = true;
    const chunk = this.audioQueue.shift()!;

    this.audioContext.decodeAudioData(
      chunk,
      (audioBuffer) => {
        if (!this.audioContext) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.streamVolume;
        
        source.buffer = audioBuffer;
        source.connect(gainNode);

        // Connect Graph based on Analyser presence
        if (this.analyser) {
            gainNode.connect(this.analyser);
            // Ensure destination connection only if not already connected (implicit, but safer to just reconnect)
            // Ideally, we connect analyser to destination ONCE in ensureAudioContext, not every chunk.
            // But doing it here is safe in WebAudio (idempotent).
            this.analyser.connect(this.audioContext.destination);
        } else {
            gainNode.connect(this.audioContext.destination);
        }
        
        const now = this.audioContext.currentTime;
        const startTime = Math.max(now, this.nextStartTime);
        
        source.start(startTime);
        this.nextStartTime = startTime + audioBuffer.duration;
        
        source.onended = () => {
          this.isPlaying = false;
          this.playNextChunk();
        };
      },
      (err) => {
        // ⚠️ DECODE ERROR: Likely a partial chunk or invalid header. 
        // We must skip this chunk and continue, otherwise the queue hangs.
        // console.warn("LiraVoice: Chunk decode failed (skipping)", err); 
        this.isPlaying = false;
        this.playNextChunk(); 
      }
    );
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    // 🛑 Stop Global XTTS Audio
    if (this.globalAudio) {
      this.globalAudio.pause();
      this.globalAudio.currentTime = 0; // Reset position
    }
    if (this.audioContext) {
        try {
            this.audioContext.suspend().catch(() => {});
        } catch {}
    }
    if (SYNTHESIS) {
      SYNTHESIS.cancel();
    }
    this.speaking = false;
    this.audioQueue = [];
    this.isPlaying = false;
  }

  isSpeaking(): boolean {
    return this.speaking;
  }
}

export const liraVoice = new LiraVoice();
