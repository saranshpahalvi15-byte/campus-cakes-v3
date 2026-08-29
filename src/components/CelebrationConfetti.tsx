import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  angle: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
}

interface FloatEmoji {
  id: number;
  emoji: string;
  x: number;
  scale: number;
  duration: number;
  delay: number;
}

export default function CelebrationConfetti() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [emojis, setEmojis] = useState<FloatEmoji[]>([]);

  useEffect(() => {
    // Generate Confetti Particles
    const colors = [
      '#EC4899', '#F43F5E', '#14B8A6', '#F59E0B', '#10B981', 
      '#8B5CF6', '#3B82F6', '#D946EF', '#FF007F', '#FFD700'
    ];
    const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
    
    const count = 65;
    const generatedParticles: Particle[] = Array.from({ length: count }).map((_, i) => {
      // Launch half from bottom left, half from bottom right
      const side = i % 2 === 0 ? 'left' : 'right';
      const x = side === 'left' ? 10 + Math.random() * 20 : 70 + Math.random() * 20; // in %
      const y = 100; // start at the bottom

      // Speeds for initial firework/burst effect
      const angleRad = side === 'left' 
        ? (30 + Math.random() * 45) * (Math.PI / 180) // burst upward right
        : (105 + Math.random() * 45) * (Math.PI / 180); // burst upward left

      const force = 4 + Math.random() * 8;
      const speedX = Math.cos(angleRad) * force;
      const speedY = -Math.sin(angleRad) * force - (3 + Math.random() * 4); // strong upward force

      return {
        id: i,
        x,
        y,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        angle: Math.random() * 360,
        speedX,
        speedY,
        rotationSpeed: (Math.random() - 0.5) * 10
      };
    });

    setParticles(generatedParticles);

    // Generate Floating Birthday Emojis
    const emojiList = ['🎈', '🎉', '🎁', '🎂', '✨', '🍰', '🎈', '🎉'];
    const generatedEmojis: FloatEmoji[] = Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      emoji: emojiList[i % emojiList.length],
      x: 5 + Math.random() * 90, // distributed across x-axis
      scale: 0.8 + Math.random() * 0.8,
      duration: 6 + Math.random() * 6, // 6 to 12s float up time
      delay: Math.random() * 2
    }));

    setEmojis(generatedEmojis);

    // Update Particles Frame Loop (Gravity & Wind effect)
    let animationFrameId: number;
    let particleList = [...generatedParticles];

    const updateParticles = () => {
      particleList = particleList.map(p => {
        // Apply gravity
        const nextSpeedY = p.speedY + 0.15; // downward gravity acceleration
        const nextSpeedX = p.speedX * 0.98; // horizontal air resistance
        
        const nextX = p.x + nextSpeedX * 0.12; // convert velocity to positioning
        const nextY = p.y + nextSpeedY * 0.4;
        const nextAngle = p.angle + p.rotationSpeed;

        return {
          ...p,
          x: nextX,
          y: nextY,
          speedX: nextSpeedX,
          speedY: nextSpeedY,
          angle: nextAngle
        };
      }).filter(p => p.y < 120 && p.x > -10 && p.x < 110); // filter out particles that fell well offscreen

      setParticles(particleList);

      if (particleList.length > 0) {
        animationFrameId = requestAnimationFrame(updateParticles);
      }
    };

    animationFrameId = requestAnimationFrame(updateParticles);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* 🎈 Floating Emojis */}
      {emojis.map((em) => (
        <motion.div
          key={`emoji-${em.id}`}
          initial={{ y: '105vh', x: `${em.x}vw`, opacity: 0, scale: 0 }}
          animate={{ 
            y: '-15vh', 
            opacity: [0, 1, 1, 0],
            scale: em.scale,
            rotate: [0, (em.id % 2 === 0 ? 15 : -15), (em.id % 2 === 0 ? -15 : 15), 0]
          }}
          transition={{
            duration: em.duration,
            delay: em.delay,
            ease: 'easeOut',
            repeat: Infinity,
            repeatDelay: Math.random() * 4
          }}
          className="absolute text-2xl select-none filter drop-shadow-md"
        >
          {em.emoji}
        </motion.div>
      ))}

      {/* 🎯 Physics Confetti Particles */}
      {particles.map((p) => {
        const style: React.CSSProperties = {
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          backgroundColor: p.color,
          transform: `rotate(${p.angle}deg)`,
        };

        if (p.shape === 'circle') {
          style.borderRadius = '50%';
        } else if (p.shape === 'triangle') {
          style.backgroundColor = 'transparent';
          style.width = '0';
          style.height = '0';
          style.borderLeft = `${p.size / 2}px solid transparent`;
          style.borderRight = `${p.size / 2}px solid transparent`;
          style.borderBottom = `${p.size}px solid ${p.color}`;
        }

        return (
          <div
            key={`particle-${p.id}`}
            style={style}
            className="absolute shadow-xs"
          />
        );
      })}
    </div>
  );
}
