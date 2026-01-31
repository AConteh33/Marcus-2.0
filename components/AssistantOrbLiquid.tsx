import React, { useRef, useEffect, useState, useCallback } from 'react';
import { soundEffects } from '../services/sound/soundEffects';

export type OrbState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'disconnected';

interface AssistantOrbProps {
  state: OrbState;
  onClick: () => void;
  ariaLabel: string;
}

const AssistantOrbLiquid: React.FC<AssistantOrbProps> = ({ state, onClick, ariaLabel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 240, height: 240 });
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const liquidPointsRef = useRef<Array<{x: number, y: number, vx: number, vy: number, radius: number}>>([]);

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

  // Initialize liquid points
  useEffect(() => {
    const pointCount = 12;
    liquidPointsRef.current = Array.from({ length: pointCount }, (_, i) => {
      const angle = (Math.PI * 2 / pointCount) * i;
      return {
        x: Math.cos(angle),
        y: Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: 1
      };
    });
  }, []);

  const drawLiquidOrb = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.35;
    
    // Update liquid points
    const liquidIntensity = state === 'disconnected' ? 0.1 : 
                         state === 'idle' ? 0.3 :
                         state === 'connecting' ? 0.6 :
                         state === 'listening' ? 0.9 :
                         state === 'processing' ? 0.8 : 1.0;
    
    liquidPointsRef.current.forEach((point, i) => {
      // Spring physics for liquid movement
      const targetAngle = (Math.PI * 2 / liquidPointsRef.current.length) * i;
      const targetX = Math.cos(targetAngle);
      const targetY = Math.sin(targetAngle);
      
      // Add wave motion
      const waveOffset = Math.sin(time * 0.002 + i * 0.5) * 0.2 * liquidIntensity;
      const waveX = Math.cos(targetAngle + waveOffset);
      const waveY = Math.sin(targetAngle + waveOffset);
      
      // Spring forces
      point.vx += (waveX - point.x) * 0.1;
      point.vy += (waveY - point.y) * 0.1;
      
      // Damping
      point.vx *= 0.85;
      point.vy *= 0.85;
      
      // Update position
      point.x += point.vx;
      point.y += point.vy;
      
      // Pulsing radius
      point.radius = 1 + Math.sin(time * 0.003 + i * 0.8) * 0.3 * liquidIntensity;
    });
    
    // Draw liquid orb using bezier curves
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Create liquid shape
    ctx.beginPath();
    liquidPointsRef.current.forEach((point, i) => {
      const nextPoint = liquidPointsRef.current[(i + 1) % liquidPointsRef.current.length];
      const controlPoint1X = point.x * baseRadius * point.radius;
      const controlPoint1Y = point.y * baseRadius * point.radius;
      const controlPoint2X = nextPoint.x * baseRadius * nextPoint.radius;
      const controlPoint2Y = nextPoint.y * baseRadius * nextPoint.radius;
      
      if (i === 0) {
        ctx.moveTo(controlPoint1X, controlPoint1Y);
      }
      
      const midX = (controlPoint1X + controlPoint2X) / 2;
      const midY = (controlPoint1Y + controlPoint2Y) / 2;
      
      ctx.quadraticCurveTo(controlPoint1X, controlPoint1Y, midX, midY);
    });
    
    ctx.closePath();
    
    // Liquid gradient fill
    const liquidGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius);
    
    if (state === 'disconnected') {
      liquidGradient.addColorStop(0, '#1a1a1a');
      liquidGradient.addColorStop(0.5, '#0f0f0f');
      liquidGradient.addColorStop(1, '#000000');
    } else {
      liquidGradient.addColorStop(0, '#2a2a1a');
      liquidGradient.addColorStop(0.3, '#1a1a0a');
      liquidGradient.addColorStop(0.7, '#0a0a00');
      liquidGradient.addColorStop(1, '#000000');
    }
    
    ctx.fillStyle = liquidGradient;
    ctx.fill();
    
    // Liquid surface highlights
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.2 * liquidIntensity})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Inner liquid layers
    for (let layer = 0; layer < 3; layer++) {
      const layerScale = 1 - layer * 0.15;
      const layerIntensity = liquidIntensity * (1 - layer * 0.3);
      
      ctx.beginPath();
      liquidPointsRef.current.forEach((point, i) => {
        const nextPoint = liquidPointsRef.current[(i + 1) % liquidPointsRef.current.length];
        const layerPoint = {
          x: point.x * layerScale + Math.sin(time * 0.001 + layer) * 0.05 * layerIntensity,
          y: point.y * layerScale + Math.cos(time * 0.001 + layer) * 0.05 * layerIntensity
        };
        
        const layerNextPoint = {
          x: nextPoint.x * layerScale + Math.sin(time * 0.001 + layer) * 0.05 * layerIntensity,
          y: nextPoint.y * layerScale + Math.cos(time * 0.001 + layer) * 0.05 * layerIntensity
        };
        
        const controlX = layerPoint.x * baseRadius * point.radius * layerScale;
        const controlY = layerPoint.y * baseRadius * point.radius * layerScale;
        const nextControlX = layerNextPoint.x * baseRadius * nextPoint.radius * layerScale;
        const nextControlY = layerNextPoint.y * baseRadius * nextPoint.radius * layerScale;
        
        if (i === 0) {
          ctx.moveTo(controlX, controlY);
        }
        
        const midX = (controlX + nextControlX) / 2;
        const midY = (controlY + nextControlY) / 2;
        
        ctx.quadraticCurveTo(controlX, controlY, midX, midY);
      });
      
      ctx.closePath();
      
      const layerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * layerScale);
      layerGradient.addColorStop(0, `rgba(255, 215, 0, ${0.1 * layerIntensity})`);
      layerGradient.addColorStop(0.5, `rgba(255, 193, 7, ${0.05 * layerIntensity})`);
      layerGradient.addColorStop(1, 'rgba(255, 160, 0, 0)');
      
      ctx.fillStyle = layerGradient;
      ctx.fill();
    }
    
    ctx.restore();
    
    // Liquid core with bubbling effect
    const corePulse = 1 + Math.sin(time * 0.004) * 0.15;
    const coreRadius = baseRadius * 0.2 * corePulse;
    
    // Liquid core with bubbles
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
    
    if (state === 'listening') {
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGradient.addColorStop(0.2, 'rgba(255, 235, 59, 0.8)');
      coreGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.7)');
      coreGradient.addColorStop(0.8, 'rgba(255, 193, 7, 0.5)');
      coreGradient.addColorStop(1, 'rgba(255, 160, 0, 0.3)');
    } else if (state === 'processing') {
      coreGradient.addColorStop(0, 'rgba(255, 200, 0, 0.9)');
      coreGradient.addColorStop(0.2, 'rgba(255, 180, 0, 0.8)');
      coreGradient.addColorStop(0.5, 'rgba(255, 160, 0, 0.7)');
      coreGradient.addColorStop(0.8, 'rgba(255, 140, 0, 0.5)');
      coreGradient.addColorStop(1, 'rgba(255, 100, 0, 0.3)');
    } else if (state === 'speaking') {
      coreGradient.addColorStop(0, 'rgba(255, 245, 100, 0.9)');
      coreGradient.addColorStop(0.2, 'rgba(255, 235, 59, 0.8)');
      coreGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.7)');
      coreGradient.addColorStop(0.8, 'rgba(255, 193, 7, 0.5)');
      coreGradient.addColorStop(1, 'rgba(255, 160, 0, 0.3)');
    } else if (state === 'connecting') {
      coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      coreGradient.addColorStop(0.2, 'rgba(255, 245, 200, 0.8)');
      coreGradient.addColorStop(0.5, 'rgba(255, 235, 59, 0.7)');
      coreGradient.addColorStop(0.8, 'rgba(255, 215, 0, 0.5)');
      coreGradient.addColorStop(1, 'rgba(255, 160, 0, 0.3)');
    } else {
      coreGradient.addColorStop(0, isHovered ? 'rgba(255, 245, 200, 0.8)' : 'rgba(255, 215, 0, 0.6)');
      coreGradient.addColorStop(0.2, isHovered ? 'rgba(255, 235, 59, 0.7)' : 'rgba(255, 193, 7, 0.5)');
      coreGradient.addColorStop(0.5, isHovered ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 160, 0, 0.3)');
      coreGradient.addColorStop(0.8, isHovered ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 140, 0, 0.2)');
      coreGradient.addColorStop(1, isHovered ? 'rgba(255, 160, 0, 0.1)' : 'rgba(255, 100, 0, 0.05)');
    }
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreGradient;
    ctx.fill();
    
    // Bubbles rising in liquid
    if (state !== 'disconnected' && state !== 'idle') {
      const bubbleCount = 5;
      for (let i = 0; i < bubbleCount; i++) {
        const bubbleTime = time * 0.0003 + i * 0.8; // Slowed down from 0.001
        const bubbleX = centerX + Math.sin(bubbleTime + i) * coreRadius * 0.6;
        const bubbleY = centerY + Math.cos(bubbleTime * 0.3) * coreRadius * 0.6 - (bubbleTime % 1) * coreRadius * 0.5; // Slowed rise speed
        const bubbleSize = 2 + Math.sin(bubbleTime * 0.5) * 1; // Slowed size change
        const bubbleOpacity = 0.6 - (bubbleTime % 1) * 0.6;
        
        ctx.fillStyle = `rgba(255, 235, 59, ${bubbleOpacity})`;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Hover effect - liquid ripples
    if (isHovered && state === 'disconnected') {
      const rippleTime = time * 0.002;
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 3; i++) {
        const rippleRadius = baseRadius * (1.1 + i * 0.1) + Math.sin(rippleTime + i) * 5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [state, isHovered]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    timeRef.current += 16;
    drawLiquidOrb(ctx, dimensions.width, dimensions.height, timeRef.current);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [drawLiquidOrb, dimensions]);

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
      {/* Liquid surface reflection */}
      {state !== 'disconnected' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-yellow-500/10 to-transparent animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default AssistantOrbLiquid;
