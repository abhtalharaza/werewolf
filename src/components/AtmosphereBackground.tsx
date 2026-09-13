import React, { useMemo } from 'react';
import { GamePhase } from '../types/game.js';

interface AtmosphereBackgroundProps {
  phase?: GamePhase;
}

export const AtmosphereBackground: React.FC<AtmosphereBackgroundProps> = ({ phase }) => {
  const isNight = phase === 'NIGHT' || phase === 'ROLE_REVEAL' || !phase || phase === 'LOBBY';
  const isDawn = phase === 'DAY_ANNOUNCEMENT';
  const isSunset = phase === 'VOTING' || phase === 'VOTE_RESULT';

  // Memoized deterministic stars
  const stars = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: (i * 19.3) % 100,
      y: (i * 13.7) % 65,
      size: (i % 3) + 1,
      opacity: 0.3 + ((i % 5) * 0.15),
      duration: 3 + (i % 4) * 2,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Sky Gradient */}
      <div
        className={`absolute inset-0 transition-colors duration-1000 ${
          isNight
            ? 'bg-gradient-to-b from-[#050508] via-[#0d0a1a] to-[#120e24]'
            : isDawn
            ? 'bg-gradient-to-b from-[#180e29] via-[#381628] to-[#24131b]'
            : isSunset
            ? 'bg-gradient-to-b from-[#140b22] via-[#2d1222] to-[#150a14]'
            : 'bg-gradient-to-b from-[#10192e] via-[#1a233a] to-[#171b26]'
        }`}
      />

      {/* Stars (Visible predominantly at night or dawn) */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          isNight ? 'opacity-90' : isDawn ? 'opacity-40' : 'opacity-20'
        }`}
      >
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-slate-200 animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Moon or Sun Celestial Orb */}
      <div
        className={`absolute transition-all duration-1000 ${
          isNight
            ? 'top-10 right-10 md:right-24 scale-100 opacity-100'
            : isDawn
            ? 'top-20 left-12 scale-110 opacity-90'
            : isSunset
            ? 'top-28 right-16 scale-105 opacity-80'
            : 'top-12 left-20 scale-90 opacity-60'
        }`}
      >
        {isNight ? (
          // Eerie Full Moon with Soft Purple-Silver Haze
          <div className="relative w-28 h-28 md:w-36 md:h-36">
            {/* Outer Glow */}
            <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-2xl animate-glow" />
            <div className="absolute inset-2 rounded-full bg-indigo-200/25 blur-xl" />
            {/* Moon Body */}
            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-slate-300 via-indigo-100 to-slate-200 shadow-[0_0_50px_rgba(192,132,252,0.4)] border border-slate-100/40 overflow-hidden">
              {/* Craters */}
              <div className="absolute top-4 left-6 w-7 h-7 rounded-full bg-slate-400/25 blur-[1px]" />
              <div className="absolute top-12 left-14 w-10 h-10 rounded-full bg-slate-400/20 blur-[1px]" />
              <div className="absolute top-16 left-4 w-6 h-6 rounded-full bg-slate-400/30 blur-[1px]" />
              <div className="absolute top-7 left-20 w-8 h-8 rounded-full bg-slate-400/15 blur-[1px]" />
            </div>
          </div>
        ) : (
          // Sun / Dawn Orb
          <div className="relative w-28 h-28 md:w-36 md:h-36">
            <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-2xl animate-glow" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-amber-400 via-rose-300 to-amber-100 shadow-[0_0_60px_rgba(251,191,36,0.5)] border border-amber-200/50" />
          </div>
        )}
      </div>

      {/* Atmospheric Fog Layers */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

      {/* Drifting Mist */}
      <div className="absolute inset-x-0 bottom-12 h-64 opacity-35 animate-fog">
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="w-full h-full text-indigo-950/40 fill-current">
          <path d="M0,100 C150,150 350,50 500,110 C650,170 900,40 1200,90 L1200,200 L0,200 Z" />
        </svg>
      </div>

      {/* Silhouettes of Forest Pine Trees and Village Rooftops */}
      <div className="absolute inset-x-0 bottom-0 h-44 opacity-80">
        <svg
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          className="w-full h-full text-[#08070d] fill-current"
        >
          {/* Back forest layer */}
          <path d="M0,160 L40,110 L80,160 L130,90 L180,160 L240,120 L300,160 L380,80 L440,160 L500,105 L560,160 L640,70 L720,160 L800,115 L870,160 L940,85 L1010,160 L1080,100 L1150,160 L1220,75 L1290,160 L1370,110 L1440,160 L1440,220 L0,220 Z" opacity="0.6" />
          {/* Front village rooftops & spire layer */}
          <path d="M0,190 L90,190 L120,140 L150,190 L210,190 L240,150 L270,190 L340,190 L380,130 L420,190 L510,190 L530,110 L540,90 L550,110 L570,190 L680,190 L720,145 L760,190 L850,190 L890,135 L930,190 L1020,190 L1050,125 L1080,190 L1180,190 L1210,140 L1240,190 L1340,190 L1370,115 L1400,190 L1440,190 L1440,220 L0,220 Z" />
        </svg>
      </div>
    </div>
  );
};
