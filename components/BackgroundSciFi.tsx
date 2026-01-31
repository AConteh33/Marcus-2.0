import React, { useRef, useEffect, useMemo, useCallback } from 'react';

const BackgroundSciFi: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  
  const particles = useMemo(() => {
    const particleCount = 150;
    return Array.from({ length: particleCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.1 + 0.02, // Slowed down from 0.5 + 0.1
      angle: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? 'gold' : 'yellow',
      pulseSpeed: Math.random() * 0.005 + 0.002 // Slowed down from 0.02 + 0.01
    }));
  }, []);

  const gridLines = useMemo(() => {
    const lines = [];
    const spacing = 50;
    const cols = Math.ceil(window.innerWidth / spacing) + 1;
    const rows = Math.ceil(window.innerHeight / spacing) + 1;
    
    for (let i = 0; i < cols; i++) {
      lines.push({
        type: 'vertical',
        x: i * spacing,
        opacity: Math.random() * 0.1 + 0.05
      });
    }
    
    for (let i = 0; i < rows; i++) {
      lines.push({
        type: 'horizontal',
        y: i * spacing,
        opacity: Math.random() * 0.1 + 0.05
      });
    }
    
    return lines;
  }, []);

  const drawSciFiBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Clear canvas with dark gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(0.5, '#0a0a0a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
    ctx.lineWidth = 0.5;
    
    gridLines.forEach(line => {
      const opacity = line.opacity * (0.5 + Math.sin(time * 0.001) * 0.5);
      ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
      
      ctx.beginPath();
      if (line.type === 'vertical') {
        ctx.moveTo(line.x, 0);
        ctx.lineTo(line.x, height);
      } else {
        ctx.moveTo(0, line.y);
        ctx.lineTo(width, line.y);
      }
      ctx.stroke();
    });

    // Draw particles
    particles.forEach(particle => {
      // Update particle position
      particle.x += Math.cos(particle.angle) * particle.speed;
      particle.y += Math.sin(particle.angle) * particle.speed;
      
      // Wrap around screen
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
      
      // Pulsing opacity
      const pulseOpacity = particle.opacity * (0.5 + Math.sin(time * particle.pulseSpeed) * 0.5);
      
      // Draw particle with glow
      const particleGradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 3
      );
      
      if (particle.color === 'gold') {
        particleGradient.addColorStop(0, `rgba(255, 215, 0, ${pulseOpacity})`);
        particleGradient.addColorStop(0.5, `rgba(255, 193, 7, ${pulseOpacity * 0.5})`);
        particleGradient.addColorStop(1, 'rgba(255, 160, 0, 0)');
      } else {
        particleGradient.addColorStop(0, `rgba(255, 235, 59, ${pulseOpacity})`);
        particleGradient.addColorStop(0.5, `rgba(255, 215, 0, ${pulseOpacity * 0.5})`);
        particleGradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
      }
      
      ctx.fillStyle = particleGradient;
      ctx.fillRect(particle.x - particle.size * 3, particle.y - particle.size * 3, particle.size * 6, particle.size * 6);
      
      // Draw core
      ctx.fillStyle = particle.color === 'gold' ? 
        `rgba(255, 215, 0, ${pulseOpacity})` : 
        `rgba(255, 235, 59, ${pulseOpacity})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw scanning lines
    const scanLineY = (time * 0.01) % height; // Slowed from 0.05
    const scanLineGradient = ctx.createLinearGradient(0, scanLineY - 20, 0, scanLineY + 20);
    scanLineGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
    scanLineGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
    scanLineGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.fillStyle = scanLineGradient;
    ctx.fillRect(0, scanLineY - 20, width, 40);
    
    // Draw hexagonal patterns in corners
    const drawHexagonPattern = (x: number, y: number, size: number, opacity: number) => {
      ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
      ctx.lineWidth = 1;
      
      for (let ring = 0; ring < 3; ring++) {
        const ringSize = size + ring * size * 0.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = x + Math.cos(angle) * ringSize;
          const hy = y + Math.sin(angle) * ringSize;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    };
    
    // Corner hexagons with pulsing opacity
    const hexOpacity = 0.1 + Math.sin(time * 0.002) * 0.05;
    drawHexagonPattern(50, 50, 20, hexOpacity);
    drawHexagonPattern(width - 50, 50, 20, hexOpacity);
    drawHexagonPattern(50, height - 50, 20, hexOpacity);
    drawHexagonPattern(width - 50, height - 50, 20, hexOpacity);
    
    // Draw data stream effects
    const dataStreamCount = 5;
    for (let i = 0; i < dataStreamCount; i++) {
      const streamX = (width / dataStreamCount) * i + (time * 0.02) % width; // Slowed from 0.1
      const streamY = Math.sin(time * 0.0002 + i) * 100 + height / 2; // Slowed from 0.001
      
      const streamGradient = ctx.createLinearGradient(streamX, streamY - 50, streamX, streamY + 50);
      streamGradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
      streamGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
      streamGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.strokeStyle = streamGradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(streamX, streamY - 50);
      ctx.lineTo(streamX, streamY + 50);
      ctx.stroke();
    }
  }, [particles, gridLines]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    timeRef.current += 16;
    drawSciFiBackground(ctx, canvas.width, canvas.height, timeRef.current);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [drawSciFiBackground]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    animate();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default BackgroundSciFi;
