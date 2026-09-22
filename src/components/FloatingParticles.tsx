import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { GamePhase } from '../types/game.js';

interface FloatingParticlesProps {
  phase?: GamePhase;
}

interface Particle {
  id: number;
  initialX: number; // Percentage 0 - 100
  initialY: number; // Percentage 0 - 100
  size: number; // in pixels
  type: 'firefly' | 'spore' | 'mote';
  color: string;
  glowColor: string;
  driftX: number[];
  driftY: number[];
  opacityKeyframes: number[];
  scaleKeyframes: number[];
  duration: number;
  delay: number;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({ phase }) => {
  const isNight = phase === 'NIGHT' || phase === 'ROLE_REVEAL' || !phase || phase === 'LOBBY';

  // Seeded particles with deterministic organic paths
  const particles = useMemo<Particle[]>(() => {
    const palette = [
      { color: 'bg-amber-200', glow: 'rgba(253, 230, 138, 0.7)' }, // Golden firefly
      { color: 'bg-purple-200', glow: 'rgba(233, 213, 255, 0.7)' }, // Lavender wisp
      { color: 'bg-indigo-200', glow: 'rgba(199, 210, 254, 0.65)' }, // Celestial blue
      { color: 'bg-cyan-200', glow: 'rgba(165, 243, 252, 0.65)' }, // Moonlit cyan
      { color: 'bg-rose-200', glow: 'rgba(254, 205, 211, 0.6)' }, // Blossom dust
      { color: 'bg-white', glow: 'rgba(255, 255, 255, 0.8)' }, // Pure starlight
    ];

    const list: Particle[] = [];
    const count = 12; // Optimized from 38 down to 12 for smooth 60fps performance on all devices

    for (let i = 0; i < count; i++) {
      const pColor = palette[i % palette.length];
      const isFirefly = i % 2 === 0;

      // Deterministic spread
      const initialX = ((i * 23.3 + 15) % 94) + 3;
      const initialY = ((i * 37.1 + 19) % 90) + 5;
      const size = isFirefly ? 3 : 2;

      // Gentle horizontal sway and vertical drift
      const sway = (i % 2 === 0 ? 1 : -1) * (14 + (i % 3) * 8);
      const verticalRise = -(30 + (i % 4) * 12);

      list.push({
        id: i,
        initialX,
        initialY,
        size,
        type: isFirefly ? 'firefly' : 'mote',
        color: pColor.color,
        glowColor: pColor.glow,
        driftX: [0, sway, 0],
        driftY: [0, verticalRise * 0.5, verticalRise],
        opacityKeyframes: isFirefly
          ? [0.2, 0.75, 0.2]
          : [0.15, 0.5, 0.15],
        scaleKeyframes: [1, 1.2, 1],
        duration: 8 + (i % 4) * 3,
        delay: (i % 5) * 1.5,
      });
    }

    return list;
  }, []);

  return (
    <div
      id="floating-particles-system"
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden z-1"
      style={{ willChange: 'contents' }}
    >
      {particles.map((p) => {
        const nightMultiplier = isNight ? 1 : 0.65;

        return (
          <motion.div
            key={p.id}
            className={`absolute rounded-full ${p.color}`}
            style={{
              left: `${p.initialX}%`,
              top: `${p.initialY}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              boxShadow: `0 0 6px ${p.glowColor}`,
              willChange: 'transform, opacity',
            }}
            animate={{
              x: p.driftX,
              y: p.driftY,
              opacity: p.opacityKeyframes.map((val) => val * nightMultiplier),
              scale: p.scaleKeyframes,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
};
