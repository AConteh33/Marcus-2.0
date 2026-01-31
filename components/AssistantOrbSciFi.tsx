import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { soundEffects } from '../services/sound/soundEffects';

export type OrbState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'disconnected';

interface AssistantOrbProps {
  state: OrbState;
  onClick: () => void;
  ariaLabel: string;
}

const AssistantOrbSciFi: React.FC<AssistantOrbProps> = ({ state, onClick, ariaLabel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 240, height: 240 });
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

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
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const drawSciFiOrb = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;
    
    // Outer glow effect
    const glowGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.5);
    
    if (state === 'listening') {
      glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
      glowGradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.2)');
      glowGradient.addColorStop(1, 'rgba(255, 160, 0, 0)');
    } else if (state === 'processing') {
      glowGradient.addColorStop(0, 'rgba(255, 160, 0, 0.3)');
      glowGradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.2)');
      glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    } else if (state === 'speaking') {
      glowGradient.addColorStop(0, 'rgba(255, 235, 59, 0.3)');
      glowGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
      glowGradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
    } else if (state === 'connecting') {
      glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      glowGradient.addColorStop(0.5, 'rgba(255, 235, 59, 0.2)');
      glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    } else {
      glowGradient.addColorStop(0, isHovered ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 160, 0, 0.1)');
      glowGradient.addColorStop(0.5, isHovered ? 'rgba(255, 193, 7, 0.1)' : 'rgba(255, 140, 0, 0.05)');
      glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    }
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Main orb with gradient
    const orbGradient = ctx.createRadialGradient(
      centerX - radius * 0.3, centerY - radius * 0.3, 0,
      centerX, centerY, radius
    );
    
    if (state === 'disconnected') {
      orbGradient.addColorStop(0, '#1a1a1a');
      orbGradient.addColorStop(0.7, '#0f0f0f');
      orbGradient.addColorStop(1, '#000000');
    } else {
      orbGradient.addColorStop(0, '#2a2a1a');
      orbGradient.addColorStop(0.5, '#1a1a0a');
      orbGradient.addColorStop(1, '#0a0a00');
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = orbGradient;
    ctx.fill();
    
    // Hexagonal grid pattern
    ctx.strokeStyle = state === 'disconnected' ? 'rgba(255, 160, 0, 0.2)' : 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 1;
    
    const hexSize = radius * 0.15;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = centerX + Math.cos(angle) * radius * 0.6;
      const y = centerY + Math.sin(angle) * radius * 0.6;
      
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const hexAngle = (Math.PI / 3) * j;
        const hx = x + Math.cos(hexAngle) * hexSize;
        const hy = y + Math.sin(hexAngle) * hexSize;
        if (j === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    // Rotating rings
    ctx.save();
    ctx.translate(centerX, centerY);
    
    for (let i = 0; i < 3; i++) {
      ctx.rotate((time * 0.001 * (i + 1)) % (Math.PI * 2));
      ctx.strokeStyle = state === 'disconnected' 
        ? `rgba(255, 160, 0, ${0.1 - i * 0.03})`
        : `rgba(255, 215, 0, ${0.2 - i * 0.05})`;
      ctx.lineWidth = 2 - i * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius * (0.8 + i * 0.1), 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Core center
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.2);
    
    if (state === 'listening') {
      coreGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
      coreGradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.5)');
      coreGradient.addColorStop(1, 'rgba(255, 160, 0, 0.2)');
    } else if (state === 'processing') {
      coreGradient.addColorStop(0, 'rgba(255, 160, 0, 0.8)');
      coreGradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.5)');
      coreGradient.addColorStop(1, 'rgba(255, 100, 0, 0.2)');
    } else if (state === 'speaking') {
      coreGradient.addColorStop(0, 'rgba(255, 235, 59, 0.8)');
      coreGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.5)');
      coreGradient.addColorStop(1, 'rgba(255, 193, 7, 0.2)');
    } else if (state === 'connecting') {
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      coreGradient.addColorStop(0.5, 'rgba(255, 235, 59, 0.5)');
      coreGradient.addColorStop(1, 'rgba(255, 215, 0, 0.2)');
    } else {
      coreGradient.addColorStop(0, isHovered ? 'rgba(255, 215, 0, 0.6)' : 'rgba(255, 160, 0, 0.4)');
      coreGradient.addColorStop(0.5, isHovered ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 140, 0, 0.2)');
      coreGradient.addColorStop(1, 'rgba(255, 100, 0, 0.1)');
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();
    
    // Pulsing effect for active states
    if (state !== 'disconnected' && state !== 'idle') {
      const pulseRadius = radius * (1.2 + Math.sin(time * 0.005) * 0.1);
      const pulseGradient = ctx.createRadialGradient(centerX, centerY, radius, centerX, centerY, pulseRadius);
      pulseGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
      pulseGradient.addColorStop(1, 'rgba(255, 215, 0, 0.1)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = pulseGradient;
      ctx.fill();
    }
  }, [state, isHovered]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    timeRef.current += 16;
    drawSciFiOrb(ctx, dimensions.width, dimensions.height, timeRef.current);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [drawSciFiOrb, dimensions]);

  useEffect(() => {
    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const handleClick = () => {
    soundEffects.playClick();
    onClick();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    soundEffects.playHover();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className={`cursor-pointer transition-transform duration-200 ${isHovered ? 'scale-105' : 'scale-100'}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabel}
      />
      {/* Scanning lines effect */}
      {state !== 'disconnected' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-500/10 to-transparent animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default AssistantOrbSciFi;
