import React, { useRef, useEffect, useState, useCallback } from 'react';
import { soundEffects } from '../services/sound/soundEffects';

export type OrbState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'disconnected';

interface AssistantOrbProps {
  state: OrbState;
  onClick: () => void;
  ariaLabel: string;
}

const AssistantOrbVirtual: React.FC<AssistantOrbProps> = ({ state, onClick, ariaLabel }) => {
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

  const drawVirtualOrb = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.35;
    
    // Animated background glow
    const glowIntensity = state === 'disconnected' ? 0.1 : 
                        state === 'idle' ? 0.3 :
                        state === 'connecting' ? 0.5 :
                        state === 'listening' ? 0.7 :
                        state === 'processing' ? 0.6 : 0.8;
    
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 2);
    glowGradient.addColorStop(0, `rgba(255, 215, 0, ${glowIntensity})`);
    glowGradient.addColorStop(0.5, `rgba(255, 193, 7, ${glowIntensity * 0.5})`);
    glowGradient.addColorStop(1, 'rgba(255, 160, 0, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Main orb body with smooth gradient
    const orbGradient = ctx.createRadialGradient(
      centerX - baseRadius * 0.3, centerY - baseRadius * 0.3, 0,
      centerX, centerY, baseRadius
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
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.fillStyle = orbGradient;
    ctx.fill();
    
    // Animated rings
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const ringTime = time * 0.001 * (i + 1);
      const ringRadius = baseRadius * (1.2 + i * 0.15);
      const opacity = 0.3 - i * 0.08;
      
      ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
      ctx.lineWidth = 2 - i * 0.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Moving dots on rings
      const dotCount = 8;
      for (let j = 0; j < dotCount; j++) {
        const angle = (Math.PI * 2 / dotCount) * j + ringTime;
        const dotX = centerX + Math.cos(angle) * ringRadius;
        const dotY = centerY + Math.sin(angle) * ringRadius;
        
        ctx.fillStyle = `rgba(255, 235, 59, ${opacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2 - i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Central core with pulsing animation
    const corePulse = 1 + Math.sin(time * 0.003) * 0.2;
    const coreRadius = baseRadius * 0.25 * corePulse;
    
    // Core glow
    const coreGlowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius * 2);
    
    if (state === 'listening') {
      coreGlowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
      coreGlowGradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.3)');
      coreGlowGradient.addColorStop(1, 'rgba(255, 160, 0, 0)');
    } else if (state === 'processing') {
      coreGlowGradient.addColorStop(0, 'rgba(255, 160, 0, 0.6)');
      coreGlowGradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.3)');
      coreGlowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    } else if (state === 'speaking') {
      coreGlowGradient.addColorStop(0, 'rgba(255, 235, 59, 0.6)');
      coreGlowGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
      coreGlowGradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
    } else if (state === 'connecting') {
      coreGlowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      coreGlowGradient.addColorStop(0.5, 'rgba(255, 235, 59, 0.3)');
      coreGlowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    } else {
      coreGlowGradient.addColorStop(0, isHovered ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 215, 0, 0.2)');
      coreGlowGradient.addColorStop(0.5, isHovered ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.1)');
      coreGlowGradient.addColorStop(1, 'rgba(255, 160, 0, 0)');
    }
    
    ctx.fillStyle = coreGlowGradient;
    ctx.fillRect(centerX - coreRadius * 2, centerY - coreRadius * 2, coreRadius * 4, coreRadius * 4);
    
    // Core center
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
    
    if (state === 'listening') {
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGradient.addColorStop(0.3, 'rgba(255, 235, 59, 0.8)');
      coreGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.7)');
      coreGradient.addColorStop(1, 'rgba(255, 193, 7, 0.5)');
    } else if (state === 'processing') {
      coreGradient.addColorStop(0, 'rgba(255, 200, 0, 0.9)');
      coreGradient.addColorStop(0.3, 'rgba(255, 180, 0, 0.8)');
      coreGradient.addColorStop(0.7, 'rgba(255, 160, 0, 0.7)');
      coreGradient.addColorStop(1, 'rgba(255, 140, 0, 0.5)');
    } else if (state === 'speaking') {
      coreGradient.addColorStop(0, 'rgba(255, 245, 100, 0.9)');
      coreGradient.addColorStop(0.3, 'rgba(255, 235, 59, 0.8)');
      coreGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.7)');
      coreGradient.addColorStop(1, 'rgba(255, 193, 7, 0.5)');
    } else if (state === 'connecting') {
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGradient.addColorStop(0.3, 'rgba(255, 245, 200, 0.8)');
      coreGradient.addColorStop(0.5, 'rgba(255, 235, 59, 0.7)');
      coreGradient.addColorStop(1, 'rgba(255, 215, 0, 0.5)');
    } else {
      coreGradient.addColorStop(0, isHovered ? 'rgba(255, 245, 200, 0.8)' : 'rgba(255, 215, 0, 0.6)');
      coreGradient.addColorStop(0.3, isHovered ? 'rgba(255, 235, 59, 0.7)' : 'rgba(255, 193, 7, 0.5)');
      coreGradient.addColorStop(0.7, isHovered ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 160, 0, 0.3)');
      coreGradient.addColorStop(1, isHovered ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 140, 0, 0.2)');
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();
    
    // Floating particles around orb
    if (state !== 'disconnected' && state !== 'idle') {
      const particleCount = 12;
      for (let i = 0; i < particleCount; i++) {
        const particleTime = time * 0.0005 + (i * Math.PI * 2 / particleCount);
        const particleRadius = baseRadius * (1.4 + Math.sin(particleTime * 2) * 0.2);
        const particleX = centerX + Math.cos(particleTime) * particleRadius;
        const particleY = centerY + Math.sin(particleTime) * particleRadius;
        const particleSize = 1 + Math.sin(particleTime * 3) * 0.5;
        
        ctx.fillStyle = `rgba(255, 235, 59, ${0.6 + Math.sin(particleTime * 2) * 0.3})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Hover ring
    if (isHovered && state === 'disconnected') {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = time * 0.01;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [state, isHovered]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    timeRef.current += 16;
    drawVirtualOrb(ctx, dimensions.width, dimensions.height, timeRef.current);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [drawVirtualOrb, dimensions]);

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
        className={`cursor-pointer transition-transform duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabel}
      />
      {/* Subtle energy field for active states */}
      {state !== 'disconnected' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default AssistantOrbVirtual;
