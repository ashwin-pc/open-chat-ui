import { useTheme } from '@/app/contexts/theme-context';
import React, { useEffect, useRef } from 'react';

// Add type definitions
interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  velocity: { x: number; y: number };
  radius: number;
  activity: number;
  pulsePhase: number;
  isUserCreated: boolean;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  adjustAlpha: (color: string, alpha: number) => string;
}

interface HTMLCanvasElementWithConnectionPool extends HTMLCanvasElement {
  connectionPool: [Particle, Particle][];
}

const getThemeBaseStyle = (variable: string, alpha: number) => {
  const primaryHue = getComputedStyle(document.documentElement).getPropertyValue(variable).trim().replaceAll(' ', ',');

  return `hsla(${primaryHue}, ${alpha})`;
};

const NeuralFlow = () => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElementWithConnectionPool>(null);
  const scaleRef = useRef(1);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let connections: Connection[] = [];

    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      scaleRef.current = window.devicePixelRatio;
      canvas.width = width * scaleRef.current;
      canvas.height = height * scaleRef.current;
      if (ctx) {
        ctx.scale(scaleRef.current, scaleRef.current);
      }
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      velocity: { x: number; y: number };
      radius: number;
      activity: number;
      pulsePhase: number;
      isUserCreated: boolean;

      constructor(x: number, y: number, isUserCreated = false) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.velocity = {
          x: (Math.random() - 0.5) * 0.3,
          y: (Math.random() - 0.5) * 0.3,
        };
        this.radius = isUserCreated ? 4 : Math.random() * 2 + 1;
        this.activity = Math.random();
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.isUserCreated = isUserCreated;
      }

      update() {
        // Subtle random movement
        this.velocity.x += (Math.random() - 0.5) * 0.01;
        this.velocity.y += (Math.random() - 0.5) * 0.01;

        // Dampen velocity
        this.velocity.x *= 0.95;
        this.velocity.y *= 0.95;

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Return to base position slowly
        const dx = this.baseX - this.x;
        const dy = this.baseY - this.y;
        this.velocity.x += dx * 0.002;
        this.velocity.y += dy * 0.002;

        // Update activity level for pulsing effect
        const time = Date.now() / 2000;
        this.activity = (Math.sin(time + this.pulsePhase) + 1) / 2;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const alpha = 0.4 + this.activity * 0.6;

        // Core particle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // Use theme-aware colors
        if (this.isUserCreated) {
          ctx.fillStyle = getThemeBaseStyle('--primary', alpha);
        } else {
          ctx.fillStyle = getThemeBaseStyle('--muted-foreground', alpha);
        }
        ctx.fill();
      }

      // Helper method to adjust alpha of hsl colors
      adjustAlpha(color: string, alpha: number): string {
        return color.replace(')', ` / ${alpha})`);
      }
    }

    class Connection {
      particleA: Particle;
      particleB: Particle;

      activity: number;
      pulsePhase: number;
      controlPoint: { x: number; y: number };
      controlVelocity: { x: number; y: number };
      lifetime: number;
      birthTime: number;
      fadeInDuration: number;
      fadeOutDuration: number;

      constructor(particleA: Particle, particleB: Particle) {
        this.particleA = particleA;
        this.particleB = particleB;
        this.particleA = particleA;
        this.particleB = particleB;
        this.activity = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.controlPoint = {
          x: (particleA.x + particleB.x) / 2 + (Math.random() - 0.5) * 50,
          y: (particleA.y + particleB.y) / 2 + (Math.random() - 0.5) * 50,
        };
        this.controlVelocity = {
          x: (Math.random() - 0.5) * 0.3,
          y: (Math.random() - 0.5) * 0.3,
        };
        this.lifetime = Math.random() * 4000 + 1000; // 1-5 seconds lifetime
        this.birthTime = Date.now();
        this.fadeInDuration = 1000;
        this.fadeOutDuration = 1000;
      }

      update() {
        const currentTime = Date.now();
        const age = currentTime - this.birthTime;

        // Calculate activity based on lifetime phases
        if (age < this.fadeInDuration) {
          this.activity = age / this.fadeInDuration;
        } else if (age > this.lifetime - this.fadeOutDuration) {
          this.activity = Math.max(0, (this.lifetime - age) / this.fadeOutDuration);
        } else {
          const pulseIntensity = 0.1;
          const baseActivity = 0.9;
          const pulse = Math.sin(currentTime / 1000 + this.pulsePhase) * pulseIntensity;
          this.activity = baseActivity + pulse;
        }

        // Update control point with subtle motion
        this.controlVelocity.x += (Math.random() - 0.5) * 0.05;
        this.controlVelocity.y += (Math.random() - 0.5) * 0.05;
        this.controlVelocity.x *= 0.95;
        this.controlVelocity.y *= 0.95;

        this.controlPoint.x += this.controlVelocity.x;
        this.controlPoint.y += this.controlVelocity.y;

        // Keep control point near middle
        const idealX = (this.particleA.x + this.particleB.x) / 2;
        const idealY = (this.particleA.y + this.particleB.y) / 2;
        this.controlVelocity.x += (idealX - this.controlPoint.x) * 0.002;
        this.controlVelocity.y += (idealY - this.controlPoint.y) * 0.002;
      }

      draw(ctx: CanvasRenderingContext2D) {
        const dx = this.particleB.x - this.particleA.x;
        const dy = this.particleB.y - this.particleA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 300 && this.activity > 0.01) {
          const baseAlpha = (1 - distance / 300) * 0.6;
          const alpha = baseAlpha * this.activity;

          ctx.beginPath();
          ctx.moveTo(this.particleA.x, this.particleA.y);
          ctx.quadraticCurveTo(this.controlPoint.x, this.controlPoint.y, this.particleB.x, this.particleB.y);

          ctx.lineWidth = 1;
          ctx.strokeStyle = getThemeBaseStyle('--primary', alpha);
          ctx.stroke();
        }
      }
    }

    const initParticles = () => {
      particles = [];
      connections = [];
      const centerX = canvas.width / scaleRef.current / 2;
      const centerY = canvas.height / scaleRef.current / 2;
      const radius = Math.min(centerX, centerY) * 0.7;

      // Create initial particles
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        particles.push(new Particle(x, y));
      }

      canvas.connectionPool = [];
      updateConnectionPool();
    };

    const updateConnectionPool = () => {
      canvas.connectionPool = [];
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach((otherParticle) => {
          canvas.connectionPool.push([particle, otherParticle]);
        });
      });
    };

    const addParticle = (x: number, y: number) => {
      const particle = new Particle(x, y, true);
      particles.push(particle);
      updateConnectionPool();

      // Create a few initial connections for the new particle
      const numberOfNewConnections = Math.floor(Math.random() * 2) + 1;
      const otherParticles = particles
        .filter((p) => p !== particle)
        .sort(() => Math.random() - 0.5)
        .slice(0, numberOfNewConnections);

      otherParticles.forEach((otherParticle) => {
        connections.push(new Connection(particle, otherParticle));
      });
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      addParticle(x, y);
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width / scaleRef.current, canvas.height / scaleRef.current);

      // Randomly add new connections
      if (Math.random() < 0.02 && canvas.connectionPool.length > 0) {
        // 2% chance each frame
        const randomIndex = Math.floor(Math.random() * canvas.connectionPool.length);
        const [particleA, particleB] = canvas.connectionPool[randomIndex];
        if (connections.length < 15) {
          // Limit maximum connections
          connections.push(new Connection(particleA, particleB));
        }
      }

      // Clean up expired connections
      connections = connections.filter((conn) => {
        const age = Date.now() - conn.birthTime;
        return age <= conn.lifetime;
      });

      // Update and draw
      connections.forEach((connection) => {
        connection.update();
        connection.draw(ctx);
      });

      particles.forEach((particle) => {
        particle.update();
        particle.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Add event listeners
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('click', handleClick);

    // Initialize
    resizeCanvas();
    initParticles();
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="w-full h-full min-h-[200px] bg-background/50 backdrop-blur-sm">
      <canvas ref={canvasRef} className="w-full h-full cursor-pointer" />
    </div>
  );
};

export default NeuralFlow;
