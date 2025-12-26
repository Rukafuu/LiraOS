export class AudioService {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private dataArray: Uint8Array | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private stream: MediaStream | null = null;
    private isActive: boolean = false;

    /**
     * Initializes the audio context using the microphone stream.
     */
    async startMicrophone(): Promise<void> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.4;
            
            // Create source from the stored stream
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.source.connect(this.analyser);
            
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            this.isActive = true;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            throw err;
        }
    }

    /**
     * Calculates the current volume level (0.0 to 1.0).
     * Used to drive the mouth opening parameter.
     */
    getVolume(): number {
        if (!this.isActive || !this.analyser || !this.dataArray) return 0;

        this.analyser.getByteFrequencyData(this.dataArray as any);

        let sum = 0;
        // Average the frequencies
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        
        const average = sum / this.dataArray.length;
        
        // Normalize roughly 0-255 to 0.0-1.0
        // We multiply by 2.5 to make the mouth more responsive to normal speaking volume
        let volume = (average / 128) * 2.5;
        
        // Clamp between 0 and 1
        return Math.max(0, Math.min(1, volume));
    }

    stop() {
        if (this.source) {
            this.source.disconnect();
        }
        
        // IMPORTANT: Stop all tracks to release the microphone
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
           this.audioContext.close();
        }
        this.isActive = false;
    }

    isListening(): boolean {
        return this.isActive;
    }
}
