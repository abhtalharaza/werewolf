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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
    >
      <div
        id="hunter-action-modal-content"
        className="relative w-full max-w-lg bg-zinc-950 border-2 border-amber-600/80 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(217,119,6,0.35)] text-center overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Background atmospheric gradient */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/60 text-amber-300 text-[11px] font-semibold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Hunter's Power: Dying Breath</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{gameState.timer}s</span>
          </div>
        </div>

        {/* Reason Alert Banner */}
        <div className="mb-4 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-950/40 via-red-950/50 to-amber-950/40 border border-amber-700/50 text-left">
          <div className="text-[11px] font-bold text-amber-300 font-cinzel flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>{reasonBadge}</span>
          </div>
          <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
            {reasonDescription}
          </p>
        </div>

        {/* Central Graphic */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-amber-900/60 to-zinc-950 border-2 border-amber-500/80 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
          <Crosshair className="w-9 h-9 sm:w-11 sm:h-11 text-amber-400 animate-pulse" />
          <span className="absolute -bottom-2 px-2 py-0.5 rounded bg-red-700 text-white font-black text-[9px] uppercase tracking-widest">
            Aakhri Goli
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black font-cinzel text-amber-300 tracking-wide mb-1">
          {isMeHunter ? 'Bandook Ki Aakhri Goli' : "The Hunter's Final Shot"}
        </h2>

        <p className="text-xs text-zinc-300 mb-4 leading-relaxed max-w-md mx-auto">
          {isMeHunter ? (
            <span>
              Aapko eliminate kar diya gaya hai, par marne se pehle aapko apni <strong className="text-amber-300">bandook se kisi ek player ko goli maarne</strong> ka aakhri mauka milta hai. Target turant aapke sath game se bahar ho jayega!
            </span>
          ) : (
            <span>
              <strong className="text-amber-300">{hunterPlayer?.name || 'The Hunter'}</strong> has been eliminated! Before falling, they cock their rifle to take one player down with them.
            </span>
          )}
        </p>

        {isMeHunter ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="text-xs text-amber-200 font-bold uppercase tracking-wider text-left flex items-center justify-between">
              <span>Nishana Chunein (Select Target):</span>
              <span className="text-[11px] text-zinc-400 font-mono font-normal">
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
                    className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between min-h-[56px] ${
                      isSelected
                        ? 'bg-amber-950/90 border-amber-400 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.5)] ring-1 ring-amber-400'
                        : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-amber-700/60 hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs truncate max-w-[120px]">
                        {victim.name}
                      </span>
                      {isSelected ? (
                        <Crosshair className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <Skull className="w-3.5 h-3.5 text-zinc-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono mt-1">
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
              className="w-full py-3.5 min-h-[48px] rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-black font-black font-cinzel text-sm uppercase tracking-wider transition shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <Crosshair className="w-5 h-5 text-black" />
              <span>
                {selectedPlayer
                  ? `Goli Maarein: ${selectedPlayer.name}`
                  : 'Pehle Kisi Player Ko Chunein'}
              </span>
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <div className="flex justify-center">
              <Crosshair className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
            <p className="text-xs text-zinc-300 font-medium">
              Bhari sabha me sannata chha gaya hai...
            </p>
            <p className="text-xs text-zinc-400 italic">
              Awaiting <span className="text-amber-300 font-semibold">{hunterPlayer?.name || 'The Hunter'}</span> to pull the trigger on their final bullet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
