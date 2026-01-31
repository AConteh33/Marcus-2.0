import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';

export type OrbState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'disconnected';

interface AssistantOrbProps {
  state: OrbState;
  onClick: () => void;
  ariaLabel: string;
}

const AssistantOrb: React.FC<AssistantOrbProps> = ({ state, onClick, ariaLabel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 240, height: 240 });

  useEffect(() => {
    const updateSize = () => {
      const isMobile = window.innerWidth < 768;
      setDimensions({
        width: isMobile ? 160 : 240,
        height: isMobile ? 160 : 240
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const drawAurora = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height);
    
    let baseGradient;
    if (state === 'listening') {
        baseGradient = ctx.createLinearGradient(0, 0, width, height);
        baseGradient.addColorStop(0, 'rgba(217, 119, 6, 0.15)'); // amber-500
        baseGradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.1)'); // amber-400
        baseGradient.addColorStop(1, 'rgba(251, 191, 36, 0.08)'); // amber-300
    } else if (state === 'processing') {
        baseGradient = ctx.createLinearGradient(0, 0, width, height);
        baseGradient.addColorStop(0, 'rgba(245, 158, 11, 0.1)'); // amber-400
        baseGradient.addColorStop(0.5, 'rgba(217, 119, 6, 0.1)'); // amber-500
        baseGradient.addColorStop(1, 'rgba(180, 83, 9, 0.15)'); // amber-700
    } else if (state === 'speaking') {
        baseGradient = ctx.createLinearGradient(0, 0, width, height);
        baseGradient.addColorStop(0, 'rgba(252, 211, 77, 0.1)'); // amber-200
        baseGradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.08)'); // amber-300
        baseGradient.addColorStop(1, 'rgba(245, 158, 11, 0.12)'); // amber-400
    } else if (state === 'disconnected') {
        baseGradient = ctx.createLinearGradient(0, 0, width, height);
        baseGradient.addColorStop(0, 'rgba(239, 68, 68, 0.1)'); // red-500
        baseGradient.addColorStop(0.5, 'rgba(248, 113, 113, 0.1)'); // red-400
        baseGradient.addColorStop(1, 'rgba(220, 38, 38, 0.1)'); // red-600
    } else if (state === 'connecting') {
        baseGradient = ctx.createLinearGradient(0, 0, width, height);
        baseGradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)'); // blue-500
        baseGradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.1)'); // blue-400
        baseGradient.addColorStop(1, 'rgba(37, 99, 235, 0.1)'); // blue-600
    } else { // idle
        baseGradient = ctx.createLinearGradient(0, 0, width, height);
        baseGradient.addColorStop(0, 'rgba(180, 83, 9, 0.05)'); 
        baseGradient.addColorStop(0.5, 'rgba(217, 119, 6, 0.08)'); 
        baseGradient.addColorStop(1, 'rgba(245, 158, 11, 0.05)');
    }
    
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    const numWaves = 3;
    for (let wave = 0; wave < numWaves; wave++) {
      const waveOffset = wave * (Math.PI / numWaves);
      
      ctx.beginPath();
      ctx.moveTo(-width * 0.1, height / 2);
      
      for (let x = -width * 0.1; x <= width * 1.1; x += 1) {
        const progress = (x + width * 0.1) / (width * 1.2);
        const amplitude = height * 0.15;
        
        let speedMod = 1.0;
        if (state === 'listening') speedMod = 1.5;
        if (state === 'connecting') speedMod = 1.8;
        if (state === 'processing') speedMod = 2.5;
        if (state === 'speaking') speedMod = 2.0;
        if (state === 'idle') speedMod = 0.5;
        
        const y = height / 2 + 
          Math.sin(progress * 4 + time * speedMod + waveOffset) * amplitude * 0.5 +
          Math.sin(progress * 7 + time * 0.5 * speedMod) * amplitude * 0.3 +
          Math.sin(progress * 2 - time * 0.7 * speedMod) * amplitude * 0.2;
        
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(width, height * 1.1);
      ctx.lineTo(0, height * 1.1);
      ctx.closePath();
      
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      const alpha = 0.18 - wave * 0.04;
      
      let baseHue = wave === 0 ? 45 : wave === 1 ? 50 : 55; // Gold/Amber range
      if (state === 'disconnected') {
        baseHue = wave === 0 ? 0 : wave === 1 ? 5 : 10; // Red range
      } else if (state === 'connecting') {
        baseHue = wave === 0 ? 210 : wave === 1 ? 215 : 220; // Blue range
      }
      
      const hueShift = Math.sin(time * 0.5 + wave) * 5;
      gradient.addColorStop(0, `hsla(${baseHue + hueShift}, 90%, 80%, 0)`);
      gradient.addColorStop(0.4, `hsla(${baseHue + hueShift}, 95%, 85%, ${alpha * 1.6})`);
      gradient.addColorStop(0.8, `hsla(${baseHue + hueShift}, 90%, 80%, ${alpha})`);
      gradient.addColorStop(1, `hsla(${baseHue + hueShift}, 90%, 80%, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.filter = 'blur(15px)';
      ctx.fill();
      ctx.filter = 'none';
      
      ctx.strokeStyle = `hsla(${baseHue + hueShift}, 95%, 85%, ${alpha * 0.7})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.beginPath();
    const glow = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width * 0.7
    );
    
    if (state === 'listening') {
      const pulseIntensity = 0.2 + Math.sin(time * 3) * 0.1;
      glow.addColorStop(0, `rgba(217, 119, 6, ${pulseIntensity})`);
      glow.addColorStop(0.5, `rgba(217, 119, 6, ${pulseIntensity * 0.4})`);
      glow.addColorStop(1, 'rgba(217, 119, 6, 0)');
    } else if (state === 'processing') {
      glow.addColorStop(0, 'rgba(217, 119, 6, 0.15)');
      glow.addColorStop(0.5, 'rgba(217, 119, 6, 0.05)');
      glow.addColorStop(1, 'rgba(217, 119, 6, 0)');
    } else if (state === 'speaking') {
      const ripple = Math.sin(time * 5) * 0.1;
      glow.addColorStop(0, `rgba(251, 191, 36, 0.2)`);
      glow.addColorStop(0.4 + ripple, `rgba(251, 191, 36, 0.1)`);
      glow.addColorStop(0.7 + ripple, `rgba(251, 191, 36, 0.05)`);
      glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    } else if (state === 'disconnected') {
      const pulseIntensity = 0.1 + Math.sin(time) * 0.05;
      glow.addColorStop(0, `rgba(239, 68, 68, ${pulseIntensity})`);
      glow.addColorStop(0.5, `rgba(239, 68, 68, ${pulseIntensity * 0.5})`);
      glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
    } else if (state === 'connecting') {
        const pulseIntensity = 0.15 + Math.sin(time * 2) * 0.08;
        glow.addColorStop(0, `rgba(96, 165, 250, ${pulseIntensity})`);
        glow.addColorStop(0.5, `rgba(96, 165, 250, ${pulseIntensity * 0.5})`);
        glow.addColorStop(1, 'rgba(96, 165, 250, 0)');
    } else { // idle
      const pulseIntensity = 0.1 + Math.sin(time * 0.5) * 0.03;
      glow.addColorStop(0, `rgba(217, 119, 6, ${pulseIntensity})`);
      glow.addColorStop(0.5, `rgba(217, 119, 6, ${pulseIntensity * 0.5})`);
      glow.addColorStop(1, 'rgba(217, 119, 6, 0)');
    }
    
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let startTime = Date.now();

    const animate = () => {
      const time = (Date.now() - startTime) * 0.001;
      drawAurora(ctx, canvas.width, canvas.height, time);
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [drawAurora]);

  const orbContainerClasses = useMemo(() => {
    const baseClasses = `absolute inset-0 rounded-full backdrop-blur-md overflow-hidden border ring-1 pointer-events-none`;
    if (state === 'disconnected') {
      return `${baseClasses} shadow-[0_0_60px_-8px_rgba(239,68,68,0.4)] bg-gradient-to-b from-red-400/10 via-red-500/5 to-red-600/10 border-red-500/30 ring-red-500/20`;
    }
    if (state === 'connecting') {
        return `${baseClasses} shadow-[0_0_60px_-8px_rgba(96,165,250,0.4)] bg-gradient-to-b from-blue-400/10 via-blue-500/5 to-blue-600/10 border-blue-500/30 ring-blue-500/20`;
    }
    return `${baseClasses} shadow-[0_0_60px_-8px_rgba(217,119,6,0.4)] bg-gradient-to-b from-amber-300/10 via-amber-400/5 to-amber-500/10 border-amber-400/30 ring-amber-400/20`;
  }, [state]);

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        relative transition-all duration-500 rounded-full
        focus:outline-none focus:ring-4 focus:ring-amber-400/50
        active:scale-95
        ${state === 'listening' ? 'scale-110' : ''}
        ${state === 'connecting' ? 'scale-105' : ''}
        ${state === 'processing' ? 'scale-105' : ''}
        ${state === 'speaking' ? 'scale-110 pulse-slow' : ''}
      `}
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`
      }}
    >
      <div className={orbContainerClasses}>
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="absolute inset-0 w-full h-full opacity-100 mix-blend-plus-lighter"
        />
      </div>
    </button>
  );
};

export default AssistantOrb;