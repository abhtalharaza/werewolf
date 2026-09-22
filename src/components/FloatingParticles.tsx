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
    const count = 38;

    for (let i = 0; i < count; i++) {
      const pColor = palette[i % palette.length];
      const isFirefly = i % 3 === 0;
      const isSpore = i % 3 === 1;

      // Deterministic spread
      const initialX = ((i * 17.3 + 23) % 96) + 2;
      const initialY = ((i * 29.1 + 15) % 92) + 4;
      const size = isFirefly ? 3.5 + (i % 3) * 0.8 : isSpore ? 5 + (i % 3) * 1.5 : 2 + (i % 2);

      // Horizontal sway and vertical drift
      const sway = (i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 12);
      const verticalRise = -(40 + (i % 5) * 18);

      list.push({
        id: i,
        initialX,
        initialY,
        size,
        type: isFirefly ? 'firefly' : isSpore ? 'spore' : 'mote',
        color: pColor.color,
        glowColor: pColor.glow,
        driftX: [0, sway * 0.5, -sway * 0.8, sway * 0.4, 0],
        driftY: [0, verticalRise * 0.3, verticalRise * 0.7, verticalRise, verticalRise * 1.2],
        opacityKeyframes: isFirefly
          ? [0.15, 0.95, 0.25, 0.85, 0.15]
          : [0.1, 0.55, 0.8, 0.4, 0.1],
        scaleKeyframes: isFirefly
          ? [0.8, 1.35, 0.9, 1.2, 0.8]
          : [0.9, 1.1, 1.25, 1.0, 0.9],
        duration: 9 + (i % 6) * 2.5,
        delay: (i % 8) * 1.2,
      });
    }

    return list;
  }, []);

  return (
    <div
      id="floating-particles-system"
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden z-1"
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
              filter:
                p.type === 'spore'
                  ? `blur(1px) drop-shadow(0 0 6px ${p.glowColor})`
                  : `drop-shadow(0 0 4px ${p.glowColor}) drop-shadow(0 0 8px ${p.glowColor})`,
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
