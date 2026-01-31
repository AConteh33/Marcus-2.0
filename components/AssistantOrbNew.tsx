import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { soundEffects } from '../services/sound/soundEffects';

export type OrbState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'disconnected';

interface AssistantOrbProps {
  state: OrbState;
  onClick: () => void;
  ariaLabel: string;
}

const AssistantOrbNew: React.FC<AssistantOrbProps> = ({ state, onClick, ariaLabel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 240, height: 240 });
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
  }>>([]);

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

  const drawNewOrb = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.3;
    
    // Create new particles for active states
    if (state !== 'disconnected' && state !== 'idle') {
      if (Math.random() < 0.3) {
        particlesRef.current.push({
          x: centerX + (Math.random() - 0.5) * baseRadius * 2,
          y: centerY + (Math.random() - 0.5) * baseRadius * 2,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1,
          life: 1,
          maxLife: 1
        });
      }
    }
    
    // Update and draw particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.02;
      
      if (particle.life <= 0) return false;
      
      const opacity = particle.life;
      ctx.fillStyle = `rgba(255, 215, 0, ${opacity * 0.6})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      return true;
    });
    
    // Draw outer rotating rings with new pattern
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Ring 1: Solid rotating ring
    ctx.rotate((time * 0.001) % (Math.PI * 2));
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 1.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Ring 2: Counter-rotating ring
    ctx.rotate((-time * 0.0015) % (Math.PI * 2));
    ctx.strokeStyle = 'rgba(255, 193, 7, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 10]);
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 1.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Ring 3: Inner pulsing ring
    const pulseScale = 1 + Math.sin(time * 0.003) * 0.1;
    ctx.rotate((time * 0.002) % (Math.PI * 2));
    ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 0.9 * pulseScale, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
    
    // Draw main orb with crystalline structure
    const orbGradient = ctx.createRadialGradient(
      centerX - baseRadius * 0.3, centerY - baseRadius * 0.3, 0,
      centerX, centerY, baseRadius
    );
    
    if (state === 'disconnected') {
      orbGradient.addColorStop(0, '#1a1a1a');
      orbGradient.addColorStop(0.5, '#0f0f0f');
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
    
    // Draw crystalline facets
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((time * 0.0005) % (Math.PI * 2));
    
    const facetCount = 8;
    for (let i = 0; i < facetCount; i++) {
      const angle = (Math.PI * 2 / facetCount) * i;
      const nextAngle = (Math.PI * 2 / facetCount) * (i + 1);
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * baseRadius, Math.sin(angle) * baseRadius);
      ctx.lineTo(Math.cos(nextAngle) * baseRadius, Math.sin(nextAngle) * baseRadius);
      ctx.closePath();
      
      const facetGradient = ctx.createLinearGradient(
        Math.cos(angle) * baseRadius * 0.5, Math.sin(angle) * baseRadius * 0.5,
        Math.cos(nextAngle) * baseRadius * 0.5, Math.sin(nextAngle) * baseRadius * 0.5
      );
      
      if (state === 'disconnected') {
        facetGradient.addColorStop(0, 'rgba(255, 215, 0, 0.05)');
        facetGradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.1)');
        facetGradient.addColorStop(1, 'rgba(255, 215, 0, 0.05)');
      } else {
        facetGradient.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
        facetGradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.3)');
        facetGradient.addColorStop(1, 'rgba(255, 215, 0, 0.15)');
      }
      
      ctx.fillStyle = facetGradient;
      ctx.fill();
      
      ctx.strokeStyle = state === 'disconnected' ? 
        'rgba(255, 215, 0, 0.1)' : 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Draw central core with new design
    const coreSize = baseRadius * 0.3;
    const corePulse = 1 + Math.sin(time * 0.005) * 0.2;
    
    // Outer core glow
    const coreGlowGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, coreSize * corePulse * 2
    );
    
    if (state === 'listening') {
      coreGlowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      coreGlowGradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.2)');
      coreGlowGradient.addColorStop(1, 'rgba(255, 160, 0, 0)');
    } else if (state === 'processing') {
      coreGlowGradient.addColorStop(0, 'rgba(255, 160, 0, 0.4)');
      coreGlowGradient.addColorStop(0.5, 'rgba(255, 140, 0, 0.2)');
      coreGlowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    } else if (state === 'speaking') {
      coreGlowGradient.addColorStop(0, 'rgba(255, 235, 59, 0.4)');
      coreGlowGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
      coreGlowGradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
    } else if (state === 'connecting') {
      coreGlowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      coreGlowGradient.addColorStop(0.5, 'rgba(255, 235, 59, 0.2)');
      coreGlowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    } else {
      coreGlowGradient.addColorStop(0, isHovered ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.1)');
      coreGlowGradient.addColorStop(0.5, isHovered ? 'rgba(255, 193, 7, 0.15)' : 'rgba(255, 193, 7, 0.05)');
      coreGlowGradient.addColorStop(1, 'rgba(255, 160, 0, 0)');
    }
    
    ctx.fillStyle = coreGlowGradient;
    ctx.fillRect(centerX - coreSize * 2, centerY - coreSize * 2, coreSize * 4, coreSize * 4);
    
    // Inner core
    const innerCoreGradient = ctx.createRadialGradient(
      centerX - coreSize * 0.2, centerY - coreSize * 0.2, 0,
      centerX, centerY, coreSize * corePulse
    );
    
    if (state === 'listening') {
      innerCoreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      innerCoreGradient.addColorStop(0.3, 'rgba(255, 235, 59, 0.8)');
      innerCoreGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.6)');
      innerCoreGradient.addColorStop(1, 'rgba(255, 193, 7, 0.4)');
    } else if (state === 'processing') {
      innerCoreGradient.addColorStop(0, 'rgba(255, 200, 0, 0.9)');
      innerCoreGradient.addColorStop(0.3, 'rgba(255, 180, 0, 0.8)');
      innerCoreGradient.addColorStop(0.7, 'rgba(255, 160, 0, 0.6)');
      innerCoreGradient.addColorStop(1, 'rgba(255, 140, 0, 0.4)');
    } else if (state === 'speaking') {
      innerCoreGradient.addColorStop(0, 'rgba(255, 245, 100, 0.9)');
      innerCoreGradient.addColorStop(0.3, 'rgba(255, 235, 59, 0.8)');
      innerCoreGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.6)');
      innerCoreGradient.addColorStop(1, 'rgba(255, 193, 7, 0.4)');
    } else if (state === 'connecting') {
      innerCoreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      innerCoreGradient.addColorStop(0.3, 'rgba(255, 245, 200, 0.8)');
      innerCoreGradient.addColorStop(0.7, 'rgba(255, 235, 59, 0.6)');
      innerCoreGradient.addColorStop(1, 'rgba(255, 215, 0, 0.4)');
    } else {
      innerCoreGradient.addColorStop(0, isHovered ? 'rgba(255, 245, 200, 0.8)' : 'rgba(255, 215, 0, 0.6)');
      innerCoreGradient.addColorStop(0.3, isHovered ? 'rgba(255, 235, 59, 0.7)' : 'rgba(255, 193, 7, 0.5)');
      innerCoreGradient.addColorStop(0.7, isHovered ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 160, 0, 0.3)');
      innerCoreGradient.addColorStop(1, isHovered ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 140, 0, 0.2)');
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreSize * corePulse, 0, Math.PI * 2);
    ctx.fillStyle = innerCoreGradient;
    ctx.fill();
    
    // Add energy arcs for active states
    if (state !== 'disconnected' && state !== 'idle') {
      ctx.save();
      ctx.translate(centerX, centerY);
      
      for (let i = 0; i < 3; i++) {
        ctx.rotate((time * 0.002 + i * Math.PI * 2 / 3) % (Math.PI * 2));
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 - i * 0.1})`;
        ctx.lineWidth = 2 - i * 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * (1.5 + i * 0.2), 0, Math.PI / 3);
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    // Hover effect
    if (isHovered && state === 'disconnected') {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
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
    drawNewOrb(ctx, dimensions.width, dimensions.height, timeRef.current);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [drawNewOrb, dimensions]);

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
        className={`cursor-pointer transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabel}
      />
      {/* Energy field effect */}
      {state !== 'disconnected' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent animate-spin" style={{ animationDuration: '4s' }} />
        </div>
      )}
    </div>
  );
};

export default AssistantOrbNew;
