import React from 'react';
import { Moon, Eye, HeartPulse, Crosshair, Sparkles, Shield, Users, Lock, Clock } from 'lucide-react';
import { Role } from '../types/game.js';
import { ROLE_DEFINITIONS } from '../types/roles.js';
import { NightModeToggle } from './NightModeToggle.js';
import { AudioControls } from './AudioControls.js';


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
      <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
        <NightModeToggle compact={true} />
        <AudioControls />
      </div>

      <div className="w-full max-w-md mx-auto text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Top Secret Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-white/10 border border-indigo-200 dark:border-white/15 text-[11px] font-mono tracking-widest text-indigo-700 dark:text-indigo-300 mb-6 uppercase shadow-xs">
          <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          <span>Confidential • Your True Nature</span>
        </div>

        {/* Cinematic Card */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 border border-white/80 dark:border-white/10 backdrop-blur-2xl shadow-2xl transition duration-500 max-h-[85vh] overflow-y-auto glass-card-modal ${
            isWerewolf
              ? 'shadow-[0_20px_50px_rgba(244,63,94,0.15)]'
              : 'shadow-[0_20px_50px_rgba(99,102,241,0.15)]'
          }`}
        >
          {/* Glowing Icon Emblem */}
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 border border-white/90 dark:border-white/10 shadow-sm">
            <div
              className={`absolute inset-0 rounded-full blur-xl opacity-40 ${
                isWerewolf ? 'bg-rose-400' : 'bg-indigo-400'
              }`}
            />
            <div
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border shadow-md ${
                isWerewolf
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400'
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
            className={`text-2xl sm:text-4xl font-black font-cinzel tracking-wider uppercase mb-2 ${
              isWerewolf ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}
          >
            {info.name}
          </h1>

          {/* Team Tag */}
          <div className="mb-6">
            <span
              className={`text-xs px-3 py-1 rounded-full font-mono font-bold tracking-wider uppercase border shadow-xs ${
                isWerewolf
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
              }`}
            >
              Team {info.team}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 italic mb-6 leading-relaxed font-serif">
            "{info.description}"
          </p>

          {/* Ability Box */}
          <div className="text-left p-4 rounded-2xl bg-white/80 dark:bg-[#15141e] border border-indigo-100 dark:border-white/10 text-xs space-y-1.5 shadow-xs">
            <div className="font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider font-mono text-[10px]">
              Special Nocturnal Power
            </div>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{info.ability}</p>
          </div>

          {/* Countdown Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span>Night begins in <strong className="text-indigo-700 dark:text-indigo-400 text-sm font-bold">{timer}s</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
