import React from 'react';
import { X, Moon, Sun, Users, Eye, HeartPulse, Crosshair, Sparkles, Shield, BookOpen } from 'lucide-react';
import { ROLE_DEFINITIONS } from '../types/roles.js';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="how-to-play-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="how-to-play-modal-content"
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl text-zinc-200 my-4 sm:my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="close-how-to-play-modal"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6 border-b border-zinc-800/80 pb-3 sm:pb-4 pr-10">
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 shrink-0" />
          <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-zinc-100 tracking-wider">
            Chronicles & Rules of Werewolf
          </h2>
        </div>

        {/* Core premise */}
        <div className="space-y-6 text-sm leading-relaxed text-zinc-300">
          <section className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-4">
            <h3 className="text-base font-semibold text-purple-300 mb-2 font-cinzel">The Eternal Conflict</h3>
            <p>
              In a secluded forest hamlet, ravenous werewolves dwell in human disguise. Each night, they prowl in secret to claim an innocent life. Each day, the remaining villagers must debate, deduce, and vote to execute the suspected monsters before the village is devoured.
            </p>
          </section>

          {/* Phases */}
          <section>
            <h3 className="text-base font-semibold text-zinc-100 mb-3 flex items-center gap-2 font-cinzel">
              <Moon className="w-4 h-4 text-indigo-400" /> The Cycle of Night & Day
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-1">
                  <Moon className="w-4 h-4" /> 1. Night Phase
                </div>
                <p className="text-xs text-zinc-400">
                  The village sleeps. Werewolves coordinate in secret to choose a victim. Special roles (Seer, Doctor, Witch, Bodyguard) perform their nocturnal duties.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1">
                  <Sun className="w-4 h-4" /> 2. Day Discussion
                </div>
                <p className="text-xs text-zinc-400">
                  Dawn breaks and nighttime casualties are revealed. Survivors discuss suspicious behavior, inconsistencies, and formulate accusations in real-time chat.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <div className="flex items-center gap-2 text-rose-300 font-semibold mb-1">
                  <Crosshair className="w-4 h-4" /> 3. The Vote
                </div>
                <p className="text-xs text-zinc-400">
                  Living players vote to condemn a player to the gallows, or choose to skip. The suspect with the strict majority of votes is eliminated.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold mb-1">
                  <Shield className="w-4 h-4" /> 4. Win Conditions
                </div>
                <p className="text-xs text-zinc-400">
                  <strong>Villagers Win:</strong> All werewolves are eliminated.<br />
                  <strong>Werewolves Win:</strong> Werewolves equal or outnumber living villagers.
                </p>
              </div>
            </div>
          </section>

          {/* Roles Breakdown */}
          <section>
            <h3 className="text-base font-semibold text-zinc-100 mb-3 font-cinzel">The Roles & Powers</h3>
            <div className="space-y-3">
              {Object.values(ROLE_DEFINITIONS).map((r) => (
                <div key={r.role} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                  <div className="p-2 rounded-lg bg-zinc-800/90 text-purple-400 mt-0.5">
                    {r.role === 'WEREWOLF' && <Moon className="w-4 h-4 text-red-400" />}
                    {r.role === 'VILLAGER' && <Users className="w-4 h-4 text-blue-400" />}
                    {r.role === 'SEER' && <Eye className="w-4 h-4 text-indigo-400" />}
                    {r.role === 'DOCTOR' && <HeartPulse className="w-4 h-4 text-emerald-400" />}
                    {r.role === 'HUNTER' && <Crosshair className="w-4 h-4 text-amber-400" />}
                    {r.role === 'WITCH' && <Sparkles className="w-4 h-4 text-pink-400" />}
                    {r.role === 'BODYGUARD' && <Shield className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-100 font-cinzel">{r.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          r.team === 'WEREWOLVES' ? 'bg-red-950/80 text-red-300 border border-red-800/50' : 'bg-blue-950/80 text-blue-300 border border-blue-800/50'
                        }`}
                      >
                        {r.team}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{r.ability}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            id="dismiss-how-to-play"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition shadow-lg shadow-purple-900/30 font-cinzel"
          >
            I Understand the Stakes
          </button>
        </div>
      </div>
    </div>
  );
};
