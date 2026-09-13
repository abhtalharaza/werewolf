import React, { useState } from 'react';
import { Moon, Eye, HeartPulse, Shield, Sparkles, Check, Crosshair } from 'lucide-react';
import { ClientGameState, ClientPlayer } from '../types/game.js';
import { ROLE_DEFINITIONS } from '../types/roles.js';

interface NightActionPanelProps {
  gameState: ClientGameState;
  selectedTargetId: string | null;
  onSubmitAction: (
    actionType: 'KILL' | 'INVESTIGATE' | 'PROTECT' | 'GUARD' | 'POISON' | 'HEAL',
    targetId: string
  ) => Promise<boolean>;
}

export const NightActionPanel: React.FC<NightActionPanelProps> = ({
  gameState,
  selectedTargetId,
  onSubmitAction,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [confirmedTargetId, setConfirmedTargetId] = useState<string | null>(null);

  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const role = gameState.myRole;
  const isDead = me && !me.isAlive;

  const targetPlayer = gameState.players.find((p) => p.id === selectedTargetId);

  if (isDead) {
    return (
      <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center text-xs text-zinc-500 italic max-w-xl mx-auto backdrop-blur-md">
        Your spirit observes from beyond the veil. Dead players rest in silent peace.
      </div>
    );
  }

  const handleConfirm = async (
    type: 'KILL' | 'INVESTIGATE' | 'PROTECT' | 'GUARD' | 'POISON' | 'HEAL',
    targetId: string
  ) => {
    if (submitting) return;
    setSubmitting(true);
    const ok = await onSubmitAction(type, targetId);
    setSubmitting(false);
    if (ok) {
      setConfirmedTargetId(targetId);
    }
  };

  return (
    <div
      id="night-action-panel"
      className="w-full max-w-2xl mx-auto p-3.5 sm:p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-2xl backdrop-blur-md"
    >
      {/* 1. WEREWOLF PANEL */}
      {role === 'WEREWOLF' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400 font-bold font-cinzel text-sm">
              <Moon className="w-4 h-4" />
              <span>Werewolf Pack Hunt</span>
            </div>
            {gameState.werewolfTeammates && (
              <div className="text-[11px] text-zinc-400 font-mono">
                Pack: {gameState.werewolfTeammates.map((w) => w.name).join(', ')}
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-300">
            Click any living villager on the board above to mark them for death tonight.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
            <div className="text-xs">
              {targetPlayer ? (
                <span>
                  Marked Prey:{' '}
                  <strong className="text-red-400 font-semibold">{targetPlayer.name}</strong>
                </span>
              ) : (
                <span className="text-zinc-500 italic">No prey selected yet</span>
              )}
            </div>

            <button
              id="confirm-werewolf-kill-btn"
              onClick={() => targetPlayer && handleConfirm('KILL', targetPlayer.id)}
              disabled={!targetPlayer || submitting || confirmedTargetId === targetPlayer?.id}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-red-950/50 min-h-[44px]"
            >
              {confirmedTargetId === targetPlayer?.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Stalked</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Confirm Strike</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. SEER PANEL */}
      {role === 'SEER' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-bold font-cinzel text-sm">
              <Eye className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Seer's Divination</span>
            </div>
            <span className="text-[11px] text-indigo-300/80 font-mono">
              Immediate Insight
            </span>
          </div>

          <p className="text-xs text-zinc-300">
            Select any player on the board to instantly peer into their true nature and uncover their exact secret role.
          </p>

          {/* Immediate Investigation Report Card */}
          {gameState.seerResult && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/70 text-xs shadow-[0_0_20px_rgba(99,102,241,0.25)] animate-fade-in space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-zinc-300">True Nature of:</span>
                  <strong className="text-white font-cinzel text-sm">{gameState.seerResult.targetName}</strong>
                </div>
                <div
                  className={`font-bold font-mono px-2.5 py-0.5 rounded-lg text-xs border ${
                    gameState.seerResult.isWerewolf
                      ? 'bg-red-950 text-red-200 border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                      : 'bg-emerald-950 text-emerald-200 border-emerald-600'
                  }`}
                >
                  {gameState.seerResult.isWerewolf ? '🐺 WEREWOLF (EVIL)' : '🛡️ INNOCENT ALLY'}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-indigo-900/60 text-xs">
                <span className="text-zinc-400 font-mono">Secret Role:</span>
                <span
                  className={`font-bold font-cinzel text-sm ${
                    gameState.seerResult.isWerewolf ? 'text-red-400' : 'text-purple-300'
                  }`}
                >
                  {gameState.seerResult.revealedRole || (gameState.seerResult.isWerewolf ? 'WEREWOLF' : 'VILLAGER')}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                  Revealed to you
                </span>
              </div>
            </div>
          )}

          {/* Divination Archive from earlier nights */}
          {gameState.seerHistory && gameState.seerHistory.length > 0 && (
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
                Divination Archive (Past Checks):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {gameState.seerHistory.map((h) => (
                  <span
                    key={h.targetId}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                      h.isWerewolf
                        ? 'bg-red-950/70 border-red-700 text-red-300'
                        : 'bg-indigo-950/70 border-indigo-700 text-indigo-300'
                    }`}
                  >
                    {h.targetName}: {h.revealedRole || (h.isWerewolf ? 'WEREWOLF' : 'INNOCENT')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
            <div className="text-xs">
              {targetPlayer ? (
                <span>
                  Target:{' '}
                  <strong className="text-indigo-400 font-semibold">{targetPlayer.name}</strong>
                  {targetPlayer.role && (
                    <span className="ml-2 text-zinc-400 font-mono text-[11px]">
                      (Known: {targetPlayer.role})
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-zinc-500 italic">Select a player card on the board to gaze into their soul</span>
              )}
            </div>

            <button
              id="confirm-seer-investigate-btn"
              onClick={() => targetPlayer && handleConfirm('INVESTIGATE', targetPlayer.id)}
              disabled={!targetPlayer || submitting}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/50 min-h-[44px]"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{submitting ? 'Divining...' : 'Reveal Role Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. DOCTOR PANEL */}
      {role === 'DOCTOR' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold font-cinzel text-sm">
            <HeartPulse className="w-4 h-4" />
            <span>Doctor's Protection</span>
          </div>

          <p className="text-xs text-zinc-300">
            Select any player (including yourself) to guard from werewolf bites tonight.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
            <div className="text-xs">
              {targetPlayer ? (
                <span>
                  Protecting:{' '}
                  <strong className="text-emerald-400 font-semibold">{targetPlayer.name}</strong>
                </span>
              ) : (
                <span className="text-zinc-500 italic">Select a patient</span>
              )}
            </div>

            <button
              id="confirm-doctor-protect-btn"
              onClick={() => targetPlayer && handleConfirm('PROTECT', targetPlayer.id)}
              disabled={!targetPlayer || submitting || confirmedTargetId === targetPlayer?.id}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/50 min-h-[44px]"
            >
              {confirmedTargetId === targetPlayer?.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Ward In Place</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Administer Antidote</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. BODYGUARD PANEL */}
      {role === 'BODYGUARD' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold font-cinzel text-sm">
            <Shield className="w-4 h-4" />
            <span>Bodyguard Vigil</span>
          </div>

          <p className="text-xs text-zinc-300">
            Select another player to guard with your shield through the nocturnal fog.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
            <div className="text-xs">
              {targetPlayer ? (
                <span>
                  Guarding:{' '}
                  <strong className="text-cyan-400 font-semibold">{targetPlayer.name}</strong>
                </span>
              ) : (
                <span className="text-zinc-500 italic">Select an ally</span>
              )}
            </div>

            <button
              id="confirm-bodyguard-guard-btn"
              onClick={() => targetPlayer && handleConfirm('GUARD', targetPlayer.id)}
              disabled={!targetPlayer || targetPlayer.id === me?.id || submitting}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white text-xs font-bold transition min-h-[44px]"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Stand Guard</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. WITCH PANEL */}
      {role === 'WITCH' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-pink-400 font-bold font-cinzel text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Witch's Cauldrons</span>
          </div>

          <p className="text-xs text-zinc-300">
            You hold two potent phials: one to resurrect a werewolf's chosen victim, and one of black nightshade to slay a suspect.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-900">
            {/* Healing Potion */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="font-bold text-xs text-emerald-400 mb-1">Elixir of Life (Save)</div>
                <div className="text-[11px] text-zinc-400">
                  {gameState.witchPotions?.nightVictimName ? (
                    <span>
                      Victim tonight: <strong>{gameState.witchPotions.nightVictimName}</strong>
                    </span>
                  ) : (
                    <span>No victim slain yet or already saved</span>
                  )}
                </div>
              </div>
              <button
                id="witch-heal-btn"
                onClick={() =>
                  gameState.witchPotions?.nightVictimId &&
                  handleConfirm('HEAL', gameState.witchPotions.nightVictimId)
                }
                disabled={
                  !gameState.witchPotions?.healAvailable ||
                  !gameState.witchPotions?.nightVictimId ||
                  submitting
                }
                className="mt-2 w-full py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold transition min-h-[44px]"
              >
                {gameState.witchPotions?.healAvailable ? 'Revive Victim' : 'Potion Expended'}
              </button>
            </div>

            {/* Poison Potion */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="font-bold text-xs text-rose-400 mb-1">Vial of Poison (Kill)</div>
                <div className="text-[11px] text-zinc-400">
                  {targetPlayer ? (
                    <span>Target: <strong>{targetPlayer.name}</strong></span>
                  ) : (
                    <span>Select any player on board</span>
                  )}
                </div>
              </div>
              <button
                id="witch-poison-btn"
                onClick={() => targetPlayer && handleConfirm('POISON', targetPlayer.id)}
                disabled={!gameState.witchPotions?.poisonAvailable || !targetPlayer || submitting}
                className="mt-2 w-full py-2.5 rounded-lg bg-rose-900 hover:bg-rose-800 disabled:opacity-40 text-white text-xs font-semibold transition min-h-[44px]"
              >
                {gameState.witchPotions?.poisonAvailable ? 'Poison Selected' : 'Potion Expended'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. VILLAGER OR HUNTER AT NIGHT */}
      {(role === 'VILLAGER' || role === 'HUNTER') && (
        <div className="text-center py-2 space-y-1">
          <div className="font-cinzel text-zinc-300 font-bold text-sm">
            The Village Slumbers
          </div>
          <p className="text-xs text-zinc-400">
            Close your eyes and lock your oak doors. The darkness belongs to beasts and mystic arts.
          </p>
        </div>
      )}
    </div>
  );
};
