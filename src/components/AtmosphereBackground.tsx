import React, { useMemo } from 'react';
import { GamePhase } from '../types/game.js';
import { FloatingParticles } from './FloatingParticles';
import { useNightMode } from '../context/ThemeContext.js';

interface AtmosphereBackgroundProps {
  phase?: GamePhase;
}

export const AtmosphereBackground: React.FC<AtmosphereBackgroundProps> = ({ phase }) => {
  const { isNightMode } = useNightMode();

  const isNightPhase = phase === 'NIGHT' || phase === 'ROLE_REVEAL';
  const isNight = isNightMode || isNightPhase;
  const isDawn = phase === 'DAY_ANNOUNCEMENT';
  const isSunset = phase === 'VOTING' || phase === 'VOTE_RESULT';

  // Memoized subtle ambient stars/sparkles for night
  const sparkles = useMemo(() => {
    const count = 16;
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: (i * 23.7) % 96 + 2,
      y: (i * 17.9) % 70 + 3,
      size: (i % 2) + 1.5,
      opacity: isNightMode ? 0.6 : 0.4,
      duration: 3 + (i % 3) * 2,
    }));
  }, [isNightMode]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 1. Base Sky Gradient: Completely Dark Gothic Midnight in Night Mode, Warm Peach to Pastel Lilac in Day Mode */}
      <div
        className={`absolute inset-0 transition-all duration-1000 ${
          isNightMode
            ? 'bg-gradient-to-b from-[#020204] via-[#060608] to-[#040405]'
            : isNight
            ? 'bg-gradient-to-br from-[#f8d7c8] via-[#e8d2f7] to-[#cfadfa]'
            : isDawn
            ? 'bg-gradient-to-br from-[#ffdfcb] via-[#fde4dc] to-[#e4ccf7]'
            : isSunset
            ? 'bg-gradient-to-br from-[#fed2be] via-[#f3cbf5] to-[#c697f2]'
            : 'bg-gradient-to-br from-[#fce1d4] via-[#eeddfa] to-[#d8bdf4]'
        }`}
      />

      {/* 2. Ambient Glowing Auroras behind cards (hidden in night mode for completely dark background) */}
      {!isNightMode && (
        <>
          <div
            className="absolute top-1/4 left-1/3 -translate-x-1/2 w-[650px] h-[450px] rounded-full blur-[130px] animate-glow pointer-events-none transition-colors duration-1000 bg-purple-400/20"
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[350px] rounded-full blur-[110px] pointer-events-none transition-colors duration-1000 bg-sky-400/20"
          />
          <div
            className="absolute top-10 left-10 w-[400px] h-[300px] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 bg-rose-300/25"
          />
        </>
      )}

      {/* 3. The 3D Floating Lilac Spheres (Subtle dark stealth spheres in Night Mode, pastel in Day Mode) */}
      {/* Sphere 1: Large Sphere on Top Right */}
      <div
        className={`absolute -top-10 -right-10 md:top-8 md:right-16 w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 rounded-full pastel-3d-sphere animate-float-gentle pointer-events-none transition-all duration-700 ${
          isNightMode ? 'opacity-15 blur-[1px]' : 'opacity-95'
        }`}
        style={{ animationDelay: '0s' }}
      />

      {/* Sphere 2: Medium Sphere on Bottom Right */}
      <div
        className={`absolute bottom-16 right-4 sm:bottom-24 sm:right-20 md:right-28 w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full pastel-3d-sphere animate-float-delayed pointer-events-none transition-all duration-700 ${
          isNightMode ? 'opacity-15 blur-[1px]' : 'opacity-90'
        }`}
        style={{ animationDelay: '1.5s' }}
      />

      {/* Sphere 3: Large Sphere on Left */}
      <div
        className={`absolute top-1/3 -left-12 sm:left-4 md:left-12 w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full pastel-3d-sphere animate-float-slow pointer-events-none transition-all duration-700 ${
          isNightMode ? 'opacity-15 blur-[1px]' : 'opacity-90'
        }`}
        style={{ animationDelay: '3s' }}
      />

      {/* Sphere 4: Distant Soft Sphere near top-center */}
      <div
        className={`absolute top-6 left-1/2 -translate-x-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full pastel-3d-sphere animate-float-gentle pointer-events-none blur-[0.5px] transition-all duration-700 ${
          isNightMode ? 'opacity-10' : 'opacity-75'
        }`}
        style={{ animationDelay: '4.5s' }}
      />

      {/* Sphere 5: Subtle Lower-Left Sphere */}
      <div
        className={`absolute -bottom-8 left-16 sm:left-32 w-28 h-28 sm:w-36 sm:h-36 rounded-full pastel-3d-sphere animate-float-delayed pointer-events-none transition-all duration-700 ${
          isNightMode ? 'opacity-15 blur-[1px]' : 'opacity-80'
        }`}
        style={{ animationDelay: '2.5s' }}
      />

      {/* 4. Subtle Celestial Glow (Sun/Moon in frosted pastel or midnight silver) */}
      <div
        className={`absolute transition-all duration-1000 ${
          isNight
            ? 'top-8 right-12 md:right-32 scale-100 opacity-90'
            : isDawn
            ? 'top-14 left-16 scale-105 opacity-95'
            : isSunset
            ? 'top-16 right-20 scale-100 opacity-90'
            : 'top-10 left-20 scale-95 opacity-80'
        }`}
      >
        {isNight ? (
          // Ethereal Frosted Moon
          <div className="relative w-24 h-24 sm:w-32 sm:h-32">
            <div
              className={`absolute inset-0 rounded-full blur-2xl animate-glow ${
                isNightMode ? 'bg-white/10' : 'bg-purple-300/30'
              }`}
            />
            <div
              className={`relative w-full h-full rounded-full border shadow-[0_0_35px_rgba(168,85,247,0.3)] overflow-hidden ${
                isNightMode
                  ? 'bg-gradient-to-tr from-slate-300 via-slate-100 to-white border-white/70 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                  : 'bg-gradient-to-tr from-purple-100 via-white to-pink-50 border-white/80'
              }`}
            >
              <div className="absolute top-3 left-5 w-6 h-6 rounded-full bg-slate-400/30 blur-[2px]" />
              <div className="absolute top-10 left-12 w-8 h-8 rounded-full bg-slate-400/25 blur-[2px]" />
              <div className="absolute top-14 left-4 w-5 h-5 rounded-full bg-slate-400/30 blur-[2px]" />
            </div>
          </div>
        ) : (
          // Radiant Sun in warm peach/coral
          <div className="relative w-24 h-24 sm:w-32 sm:h-32">
            <div className="absolute inset-0 rounded-full bg-amber-400/35 blur-2xl animate-glow" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-amber-200 via-rose-100 to-white shadow-[0_0_40px_rgba(251,191,36,0.4)] border border-white/90" />
          </div>
        )}
      </div>

      {/* 5. Delicate Twilight Sparkles */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          isNight ? (isNightMode ? 'opacity-90' : 'opacity-70') : 'opacity-25'
        }`}
      >
        {sparkles.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDuration: `${star.duration}s`,
              boxShadow: isNightMode
                ? '0 0 6px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.4)'
                : '0 0 4px rgba(255,255,255,0.8)',
            }}
          />
        ))}
      </div>

      {/* 6. Soft Frosted Ground Mist Silhouette */}
      <div
        className={`absolute inset-x-0 bottom-0 h-44 sm:h-56 transition-opacity duration-1000 ${
          isNightMode ? 'opacity-90' : 'opacity-50'
        }`}
      >
        <svg
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          className={`w-full h-full fill-current transition-colors duration-1000 ${
            isNightMode ? 'text-[#020203]/90' : 'text-[#c9a6ec]/40'
          }`}
        >
          <path d="M0,130 C200,90 400,160 650,110 C900,60 1150,140 1440,100 L1440,220 L0,220 Z" opacity="0.6" />
          <path d="M0,150 C300,120 600,180 900,130 C1200,80 1350,160 1440,140 L1440,220 L0,220 Z" opacity="0.9" />
        </svg>
      </div>

      {/* 7. Subtle Floating Particle System (Framer Motion) */}
      <FloatingParticles phase={phase} />
    </div>
  );
};

