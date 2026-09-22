import React from 'react';
import {
  X,
  Moon,
  Sun,
  Users,
  Eye,
  HeartPulse,
  Crosshair,
  Sparkles,
  Shield,
  BookOpen,
  Skull,
  VolumeX,
  Compass,
  PawPrint,
  ShieldAlert,
  Flame,
  UserCheck,
  Baby,
  Crown,
  AlertTriangle,
  Brain,
} from 'lucide-react';
import { ROLE_DEFINITIONS } from '../types/roles.js';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'WEREWOLF':
        return <Moon className="w-4 h-4 text-red-400" />;
      case 'VILLAGER':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'SEER':
        return <Eye className="w-4 h-4 text-indigo-400" />;
      case 'DOCTOR':
        return <HeartPulse className="w-4 h-4 text-indigo-500" />;
      case 'HUNTER':
        return <Crosshair className="w-4 h-4 text-amber-400" />;
      case 'WITCH':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'BODYGUARD':
        return <Shield className="w-4 h-4 text-cyan-400" />;
      case 'SERIAL_KILLER':
        return <Skull className="w-4 h-4 text-red-500" />;
      case 'SPELLCASTER':
        return <VolumeX className="w-4 h-4 text-purple-400" />;
      case 'APPRENTICE_SEER':
        return <Compass className="w-4 h-4 text-teal-400" />;
      case 'BEAR_TAMER':
        return <PawPrint className="w-4 h-4 text-amber-500" />;
      case 'TOUGH_GUY':
        return <ShieldAlert className="w-4 h-4 text-lime-400" />;
      case 'ARSONIST':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'MINION':
        return <UserCheck className="w-4 h-4 text-rose-400" />;
      case 'WILD_CHILD':
        return <Baby className="w-4 h-4 text-yellow-400" />;
      case 'DICTATOR':
        return <Crown className="w-4 h-4 text-amber-300" />;
      case 'VETERAN':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'AMNESIAC':
        return <Brain className="w-4 h-4 text-teal-400" />;
      default:
        return <Users className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div
      id="how-to-play-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="how-to-play-modal-content"
        className="relative w-full max-w-2xl grass-glass-modal grass-glass border border-white/80 dark:border-white/10 rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl text-slate-800 dark:text-slate-100 my-4 sm:my-8 max-h-[90vh] overflow-y-auto backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="close-how-to-play-modal"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6 border-b border-indigo-100 dark:border-white/10 pb-3 sm:pb-4 pr-10">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-white/10 border border-indigo-200 dark:border-white/15 text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-slate-900 dark:text-white tracking-wide">
            Chronicles & Rules of Werewolf
          </h2>
        </div>

        {/* Core premise */}
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
          <section className="bg-white/70 dark:bg-[#15141e] border border-indigo-100/80 dark:border-white/10 rounded-3xl p-4 sm:p-5 shadow-xs">
            <h3 className="text-base font-semibold text-indigo-900 dark:text-indigo-300 mb-2 font-cinzel">The Eternal Conflict</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
              In a secluded mountain hamlet, ravenous werewolves dwell in human disguise. Each night, they prowl in secret to claim an innocent life. Each day, the remaining villagers must debate, deduce, and vote to execute the suspected monsters before the village is devoured.
            </p>
          </section>

          {/* Phases */}
          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 font-cinzel">
              <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> The Cycle of Night & Day
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#15141e] border border-indigo-100 dark:border-white/10 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold mb-1 text-xs sm:text-sm">
                  <Moon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> 1. Night Phase
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  The village sleeps. Werewolves coordinate in secret to choose a victim. Special roles (Seer, Doctor, Witch, Bodyguard) perform their nocturnal duties.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#15141e] border border-indigo-100 dark:border-white/10 shadow-xs">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold mb-1 text-xs sm:text-sm">
                  <Sun className="w-4 h-4 text-amber-500 dark:text-amber-400" /> 2. Day Discussion
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dawn breaks and nighttime casualties are revealed. Survivors discuss suspicious behavior, inconsistencies, and formulate accusations in real-time chat.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#15141e] border border-indigo-100 dark:border-white/10 shadow-xs">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold mb-1 text-xs sm:text-sm">
                  <Crosshair className="w-4 h-4 text-rose-500 dark:text-rose-400" /> 3. The Vote
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Living players vote to condemn a player to the gallows, or choose to skip. The suspect with the strict majority of votes is eliminated.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#15141e] border border-indigo-100 dark:border-white/10 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold mb-1 text-xs sm:text-sm">
                  <Shield className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> 4. Win Conditions
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-800 dark:text-white">Villagers Win:</strong> All werewolves are eliminated.<br />
                  <strong className="text-slate-800 dark:text-white">Werewolves Win:</strong> Werewolves equal or outnumber living villagers.
                </p>
              </div>
            </div>
          </section>

          {/* Roles Breakdown */}
          <section>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3 font-cinzel">The Roles & Powers</h3>
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {Object.values(ROLE_DEFINITIONS).map((r) => (
                <div key={r.role} className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 dark:bg-[#15141e] border border-indigo-100 dark:border-white/10 shadow-xs">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-white/15 mt-0.5 shrink-0 shadow-xs">
                    {getRoleIcon(r.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white font-cinzel text-xs sm:text-sm">{r.name}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-medium ${
                          r.team === 'WEREWOLVES'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                            : r.team === 'VILLAGERS'
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {r.team}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{r.ability}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-indigo-100 dark:border-white/10 flex justify-end">
          <button
            id="dismiss-how-to-play"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl grass-button gradient-brand-btn text-white font-bold text-sm transition shadow-md font-cinzel cursor-pointer active:scale-98"
          >
            I Understand the Stakes
          </button>
        </div>
      </div>
    </div>
  );
};
