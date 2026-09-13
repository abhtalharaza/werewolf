import React from 'react';
import { Moon, Eye, HeartPulse, Crosshair, Sparkles, Shield, Users, Lock, Clock } from 'lucide-react';
import { Role } from '../types/game.js';
import { ROLE_DEFINITIONS } from '../types/roles.js';

interface RoleRevealViewProps {
  role: Role;
  timer: number;
}

export const RoleRevealView: React.FC<RoleRevealViewProps> = ({ role, timer }) => {
  const info = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.VILLAGER;
  const isWerewolf = info.team === 'WEREWOLVES';

  return (
    <div
      id="role-reveal-container"
      className="relative min-h-screen flex flex-col items-center justify-center p-4 z-20"
    >
      <div className="w-full max-w-md mx-auto text-center animate-glow">
        {/* Top Secret Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-[11px] font-mono tracking-widest text-zinc-400 mb-6 uppercase">
          <Lock className="w-3 h-3 text-purple-400" />
          <span>Confidential • Your True Nature</span>
        </div>

        {/* Cinematic Card */}
        <div
          className={`relative rounded-2xl p-5 sm:p-8 border backdrop-blur-xl shadow-2xl transition duration-500 max-h-[85vh] overflow-y-auto ${
            isWerewolf
              ? 'bg-gradient-to-b from-red-950/70 via-zinc-950 to-black border-red-800/60 shadow-[0_0_50px_rgba(220,38,38,0.25)]'
              : 'bg-gradient-to-b from-purple-950/70 via-zinc-950 to-black border-purple-800/60 shadow-[0_0_50px_rgba(168,85,247,0.25)]'
          }`}
        >
          {/* Glowing Icon Emblem */}
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 border shadow-inner">
            <div
              className={`absolute inset-0 rounded-full blur-lg opacity-50 ${
                isWerewolf ? 'bg-red-600' : 'bg-purple-600'
              }`}
            />
            <div
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border ${
                isWerewolf
                  ? 'bg-red-950 border-red-700/80 text-red-400'
                  : 'bg-purple-950 border-purple-700/80 text-purple-300'
              }`}
            >
              {role === 'WEREWOLF' && <Moon className="w-8 h-8 sm:w-10 sm:h-10" />}
              {role === 'VILLAGER' && <Users className="w-8 h-8 sm:w-10 sm:h-10" />}
              {role === 'SEER' && <Eye className="w-8 h-8 sm:w-10 sm:h-10" />}
              {role === 'DOCTOR' && <HeartPulse className="w-8 h-8 sm:w-10 sm:h-10" />}
              {role === 'HUNTER' && <Crosshair className="w-8 h-8 sm:w-10 sm:h-10" />}
              {role === 'WITCH' && <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" />}
              {role === 'BODYGUARD' && <Shield className="w-8 h-8 sm:w-10 sm:h-10" />}
            </div>
          </div>

          {/* Role Name */}
          <h1
            className={`text-2xl sm:text-4xl font-black font-cinzel tracking-widest uppercase mb-2 ${
              isWerewolf ? 'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]' : 'text-zinc-100'
            }`}
          >
            {info.name}
          </h1>

          {/* Team Tag */}
          <div className="mb-6">
            <span
              className={`text-xs px-3 py-1 rounded-full font-mono font-bold tracking-wider uppercase border ${
                isWerewolf
                  ? 'bg-red-950/80 text-red-300 border-red-800/60'
                  : 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60'
              }`}
            >
              Team {info.team}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-300 italic mb-6 leading-relaxed font-serif">
            "{info.description}"
          </p>

          {/* Ability Box */}
          <div className="text-left p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/90 text-xs space-y-1.5">
            <div className="font-semibold text-purple-300 uppercase tracking-wider font-mono text-[10px]">
              Special Nocturnal Power
            </div>
            <p className="text-zinc-300 leading-relaxed">{info.ability}</p>
          </div>

          {/* Countdown Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>Night begins in <strong className="text-white text-sm">{timer}s</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
