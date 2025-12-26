import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream?: MediaStream; // For user microphone
  analyser?: AnalyserNode; // For Lira voice (if using WebAudio)
  isActive: boolean; // Is someone speaking?
  color?: string;
  mirrored?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  stream, 
  analyser: externalAnalyser, 
  isActive, 
  color = '#EC4899',
  mirrored = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number>();

  // Init Analyzer for Stream (Microphone)
  useEffect(() => {
    if (stream && !externalAnalyser) {
      if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;
    }
    
    return () => {
       // Cleanup stream nodes but keep context if shared? 
       // For this component, simpler to just close/disconnect.
       sourceRef.current?.disconnect();
       // audioContextRef.current?.close(); // Avoid closing if we want reuse, but here we invoke fresh
    };
  }, [stream, externalAnalyser]);

  // Main Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = externalAnalyser || analyserRef.current;

    const draw = () => {
      // Handle High DPI
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Default Circle State (Idle)
      if (!isActive || !analyser) {
         ctx.beginPath();
         ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
         ctx.strokeStyle = color + '40'; // Low opacity
         ctx.lineWidth = 2;
         ctx.stroke();
         
         // Inner Pulse
         const time = Date.now() / 1000;
         const pulse = Math.sin(time * 2) * 5;
         ctx.beginPath();
         ctx.arc(centerX, centerY, 30 + pulse, 0, Math.PI * 2);
         ctx.fillStyle = color + '10';
         ctx.fill();
         
         rafRef.current = requestAnimationFrame(draw);
         return;
      }

      // Active Visualization
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Calculate Volume / Energy
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Draw Circular Waveform
      const radius = 50 + (average / 255) * 20; // Base radius expands with volume
      const bars = 60;
      const step = (Math.PI * 2) / bars;

      ctx.beginPath();
      for (let i = 0; i < bars; i++) {
         // Map bar index to frequency index roughly
         const freqIndex = Math.floor((i / bars) * (bufferLength / 2)); 
         const value = dataArray[freqIndex] || 0;
         const barHeight = (value / 255) * 50 * (isActive ? 1.5 : 0.2);
         
         const angle = i * step;
         
         // Start point (on circle)
         const x1 = centerX + Math.cos(angle) * radius;
         const y1 = centerY + Math.sin(angle) * radius;

         // End point (outwards)
         const x2 = centerX + Math.cos(angle) * (radius + barHeight);
         const y2 = centerY + Math.sin(angle) * (radius + barHeight);

         ctx.moveTo(x1, y1);
         ctx.lineTo(x2, y2);
      }
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Inner Core Glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
      ctx.fillStyle = color + '20';
      ctx.fill();
      ctx.strokeStyle = color + '80';
      ctx.lineWidth = 1;
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, color, externalAnalyser]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full ${mirrored ? 'scale-x-[-1]' : ''}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
