import React, { useState } from 'react';
import { Crosshair, AlertCircle } from 'lucide-react';
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

  return (
    <div
      id="hunter-action-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
    >
      <div
        id="hunter-action-modal-content"
        className="relative w-full max-w-md bg-zinc-950 border border-amber-800/80 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl text-center overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-950/50 border border-amber-600/70 flex items-center justify-center mb-3 sm:mb-4 text-amber-400">
          <Crosshair className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-amber-300 tracking-wider mb-1">
          The Hunter's Final Shot
        </h2>
        <p className="text-xs text-zinc-400 mb-4 sm:mb-5">
          {hunterPlayer?.name || 'The Hunter'} has been slain! With their dying breath, they draw their bowstring...
        </p>

        {isMeHunter ? (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-xs text-amber-200 font-semibold uppercase tracking-wider">
              Choose Who Will Fall With You:
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {aliveVictims.map((victim) => (
                <button
                  key={victim.id}
                  onClick={() => setSelectedTarget(victim.id)}
                  className={`p-2.5 sm:p-3 rounded-xl border text-xs font-semibold transition min-h-[44px] ${
                    selectedTarget === victim.id
                      ? 'bg-amber-950 border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  {victim.name}
                </button>
              ))}
            </div>

            <button
              id="confirm-hunter-shot-btn"
              onClick={() => selectedTarget && onShoot(selectedTarget)}
              disabled={!selectedTarget}
              className="w-full py-3 min-h-[44px] rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-black font-bold font-cinzel text-xs uppercase tracking-wider transition shadow-lg shadow-amber-950/50 active:scale-98"
            >
              Release Vengeful Arrow
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 italic">
            Holding breath... awaiting {hunterPlayer?.name || 'the Hunter'}'s shot.
          </div>
        )}
      </div>
    </div>
  );
};
