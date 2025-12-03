import React, { useRef, useEffect, useState } from 'react';

interface NeuronBackgroundProps {
  isDarkMode: boolean;
}

const NeuronBackground: React.FC<NeuronBackgroundProps> = ({ isDarkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Boot sequence: Fade in canvas
    const timer = setTimeout(() => setOpacity(1), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Mouse tracking
    const mouse = { x: -1000, y: -1000 };

    // Configuration
    const particleCount = Math.floor((width * height) / 12000); 
    const connectionDistance = 140;
    const mouseDistance = 250;
    const baseSpeed = 0.4;

    // "Clannad" Vibe Colors
    const getColors = () => ({
      particle: isDarkMode ? 'rgba(251, 113, 133, 0.8)' : 'rgba(255, 179, 198, 0.9)', // Rose-400 / Soft Pink
      glow: isDarkMode ? '#fb7185' : '#ffb3c6', // The glow color
      line: isDarkMode ? 'rgba(251, 113, 133, 0.15)' : 'rgba(255, 179, 198, 0.4)',
    });

    let colors = getColors();

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseSize: number;
      blinkSpeed: number;
      blinkOffset: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * baseSpeed;
        this.vy = (Math.random() - 0.5) * baseSpeed;
        this.baseSize = Math.random() * 2.5 + 1;
        this.size = this.baseSize;
        this.blinkSpeed = 0.02 + Math.random() * 0.03;
        this.blinkOffset = Math.random() * Math.PI * 2;
      }

      update() {
        // Standard movement
        this.x += this.vx;
        this.y += this.vy;

        // Mouse Interaction (The "Noticing" Effect)
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseDistance) {
          // Gently attract to mouse and move faster
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouseDistance - distance) / mouseDistance;
          
          this.vx += forceDirectionX * force * 0.05;
          this.vy += forceDirectionY * force * 0.05;
          
          // Slight expansion
          if (this.size < this.baseSize * 1.5) {
             this.size += 0.1;
          }
        } else {
           // Return to normal speed logic (friction)
           const maxSpeed = baseSpeed * 2;
           if (Math.abs(this.vx) > maxSpeed) this.vx *= 0.98;
           if (Math.abs(this.vy) > maxSpeed) this.vy *= 0.98;

           // Return to normal size
           if (this.size > this.baseSize) {
             this.size -= 0.05;
           }
        }

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        
        // Blinking calculation
        const blink = Math.abs(Math.sin(Date.now() * 0.002 + this.blinkOffset));
        const alpha = 0.3 + blink * 0.7; // Minimum opacity 0.3
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        ctx.fillStyle = colors.particle;
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Clannad Glow Effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.glow;
        ctx.fill();
        
        // Reset context
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach((p, index) => {
        p.update();
        p.draw();

        // Draw Connections
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            const opacity = 1 - distance / connectionDistance;
            ctx.strokeStyle = colors.line;
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = opacity;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e: MouseEvent) => {
       mouse.x = e.clientX;
       mouse.y = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
       if(e.touches.length > 0) {
         mouse.x = e.touches[0].clientX;
         mouse.y = e.touches[0].clientY;
       }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationId);
    };
  }, [isDarkMode]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ opacity: opacity }}
      className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-[2000ms] ease-out"
    />
  );
};

export default NeuronBackground;