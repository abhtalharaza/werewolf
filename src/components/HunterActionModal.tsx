import React, { useState } from 'react';
import { Crosshair, Skull, Clock, AlertTriangle, Flame } from 'lucide-react';
import { ClientGameState } from '../types/game.js';

interface HunterActionModalProps {
  gameState: ClientGameState;
  onShoot: (targetId: string) => void;
}

export const HunterActionModal: React.FC<HunterActionModalProps> = ({ gameState, onShoot }) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const isMeHunter = gameState.hunterPendingId === gameState.myPlayerId;
  const hunterPlayer = gameState.players.find((p) => p.id === gameState.hunterPendingId);

  const aliveVictims = gameState.players.filter(
    (p) => p.isAlive && p.id !== gameState.hunterPendingId
  );

  const selectedPlayer = aliveVictims.find((p) => p.id === selectedTarget);

  // Determine context reason text
  const reason = gameState.hunterEliminationReason;
  let reasonBadge = 'Eliminated From Game';
  let reasonDescription = 'Slain in battle';

  if (reason === 'WEREWOLF') {
    reasonBadge = '🐺 Raat me Bhediyon ka Hamla (Werewolf Attack)';
    reasonDescription = 'Werewolves hunted the Hunter in the darkness of the night!';
  } else if (reason === 'POISON') {
    reasonBadge = '🧪 Witch ka Zahar (Witch Poison)';
    reasonDescription = 'The Witch consumed the Hunter with fatal poison!';
  } else if (reason === 'VOTE') {
    reasonBadge = '⚖️ Din me Gaonwalon ka Vote (Village Vote)';
    reasonDescription = 'The village mistakenly condemned the Hunter to the gallows!';
  } else if (reason === 'HEARTBREAK') {
    reasonBadge = '💔 Lovers Heartbreak (Toota Hua Dil)';
    reasonDescription = 'The Hunter fell with their departed lover!';
  }

  return (
    <div
      id="hunter-action-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div
        id="hunter-action-modal-content"
        className="relative w-full max-w-lg grass-glass-modal grass-glass border border-white/80 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl text-center overflow-hidden max-h-[92vh] flex flex-col backdrop-blur-2xl text-slate-800 dark:text-slate-100"
      >
        {/* Background atmospheric gradient */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-200/40 dark:bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-semibold uppercase tracking-wider font-mono">
            <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Hunter's Power: Dying Breath</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-white/10 border border-indigo-200 dark:border-white/15 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{gameState.timer}s</span>
          </div>
        </div>

        {/* Reason Alert Banner */}
        <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left">
          <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 font-cinzel flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>{reasonBadge}</span>
          </div>
          <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">
            {reasonDescription}
          </p>
        </div>

        {/* Central Graphic */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-50 dark:bg-white/10 border border-indigo-200 dark:border-white/15 flex items-center justify-center mb-3 shadow-sm">
          <Crosshair className="w-9 h-9 sm:w-11 sm:h-11 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span className="absolute -bottom-2 px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[9px] uppercase tracking-widest border border-rose-500 shadow-xs">
            Final Shot
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black font-cinzel text-slate-900 dark:text-white tracking-wide mb-1">
          {isMeHunter ? 'Bandook Ki Aakhri Goli' : "The Hunter's Final Shot"}
        </h2>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed max-w-md mx-auto font-medium">
          {isMeHunter ? (
            <span>
              Aapko eliminate kar diya gaya hai, par marne se pehle aapko apni <strong className="text-indigo-600 dark:text-indigo-400">bandook se kisi ek player ko goli maarne</strong> ka aakhri mauka milta hai. Target turant aapke sath game se bahar ho jayega!
            </span>
          ) : (
            <span>
              <strong className="text-indigo-600 dark:text-indigo-400">{hunterPlayer?.name || 'The Hunter'}</strong> has been eliminated! Before falling, they cock their rifle to take one player down with them.
            </span>
          )}
        </p>

        {isMeHunter ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-left flex items-center justify-between font-mono">
              <span>Nishana Chunein (Select Target):</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-normal">
                {aliveVictims.length} Living Players
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-48 pr-1 py-1">
              {aliveVictims.map((victim) => {
                const isSelected = selectedTarget === victim.id;
                return (
                  <button
                    key={victim.id}
                    type="button"
                    onClick={() => setSelectedTarget(victim.id)}
                    className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between min-h-[56px] cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/80 border-indigo-400 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-400'
                        : 'bg-white/80 dark:bg-[#15141e] border-indigo-100 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#1a1828]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs truncate max-w-[120px]">
                        {victim.name}
                      </span>
                      {isSelected ? (
                        <Crosshair className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                      ) : (
                        <Skull className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 font-medium">
                      {isSelected ? '🎯 TARGET LOCKED' : 'Click to Target'}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              id="confirm-hunter-shot-btn"
              type="button"
              onClick={() => selectedTarget && onShoot(selectedTarget)}
              disabled={!selectedTarget}
              className="w-full py-3.5 min-h-[48px] rounded-2xl grass-button gradient-brand-btn text-white font-black font-cinzel text-sm uppercase tracking-wider transition shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Crosshair className="w-5 h-5 text-white" />
              <span>
                {selectedPlayer
                  ? `Goli Maarein: ${selectedPlayer.name}`
                  : 'Pehle Kisi Player Ko Chunein'}
              </span>
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#15141e] border border-indigo-100 dark:border-white/10 space-y-3 shadow-xs">
            <div className="flex justify-center">
              <Crosshair className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
              Bhari sabha me sannata chha gaya hai...
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Awaiting <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{hunterPlayer?.name || 'The Hunter'}</span> to pull the trigger on their final bullet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
