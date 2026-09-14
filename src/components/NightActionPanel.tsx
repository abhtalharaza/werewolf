import React, { useState } from 'react';
import {
  Moon,
  Eye,
  HeartPulse,
  Shield,
  Sparkles,
  Check,
  Crosshair,
  Heart,
  UserCheck,
  Zap,
  AlertTriangle,
  Skull,
} from 'lucide-react';
import { ClientGameState, ClientPlayer, Role } from '../types/game.js';
import { ROLE_DEFINITIONS } from '../types/roles.js';

interface NightActionPanelProps {
  gameState: ClientGameState;
  selectedTargetId: string | null;
  cupidLover1Id?: string | null;
  cupidLover2Id?: string | null;
  isCupidBound?: boolean;
  onCupidBound?: () => void;
  onUnselectCupidLover?: (slot: 1 | 2) => void;
  onResetCupidLovers?: () => void;
  onSubmitAction: (
    actionType: any,
    targetId: string,
    secondaryTargetId?: string,
    chosenRole?: Role
  ) => Promise<boolean>;
}

export const NightActionPanel: React.FC<NightActionPanelProps> = ({
  gameState,
  selectedTargetId,
  cupidLover1Id,
  cupidLover2Id,
  isCupidBound = false,
  onCupidBound,
  onUnselectCupidLover,
  onResetCupidLovers,
  onSubmitAction,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [confirmedTargetId, setConfirmedTargetId] = useState<string | null>(null);

  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const role = gameState.myRole;
  const isDead = me && !me.isAlive;

  const targetPlayer = gameState.players.find((p) => p.id === selectedTargetId);
  const cupidLover1 = gameState.players.find((p) => p.id === cupidLover1Id);
  const cupidLover2 = gameState.players.find((p) => p.id === cupidLover2Id);

  const isLoversLocked = Boolean(
    isCupidBound ||
    gameState.cupidLovers ||
    confirmedTargetId === 'CUPID_BOUND'
  );

  const canBindLovers = Boolean(
    !isLoversLocked &&
    cupidLover1 &&
    cupidLover2 &&
    cupidLover1.id !== cupidLover2.id &&
    !submitting
  );

  if (isDead) {
    return (
      <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center text-xs text-zinc-500 italic max-w-xl mx-auto backdrop-blur-md">
        Your spirit observes from beyond the veil. Dead players rest in silent peace.
      </div>
    );
  }

  const handleConfirm = async (
    type: any,
    targetId: string,
    secondaryTargetId?: string,
    chosenRole?: Role
  ) => {
    if (submitting) return;
    setSubmitting(true);
    const ok = await onSubmitAction(type, targetId, secondaryTargetId, chosenRole);
    setSubmitting(false);
    if (ok) {
      if (type === 'CUPID_LOVERS') {
        setConfirmedTargetId('CUPID_BOUND');
        onCupidBound?.();
      } else {
        setConfirmedTargetId(targetId);
      }
    }
  };

  const isWerewolfPackMember =
    role === 'WEREWOLF' ||
    role === 'WOLF_CUB' ||
    role === 'WHITE_WOLF' ||
    (role === 'CURSED' && gameState.myTeam === 'WEREWOLVES');

  return (
    <div
      id="night-action-panel"
      className="w-full max-w-2xl mx-auto p-3.5 sm:p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 shadow-2xl backdrop-blur-md"
    >
      {/* 1. WEREWOLF PANEL */}
      {isWerewolfPackMember && (
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
            Click any living villager on the board above to mark them for death tonight. You have 15 seconds to strike.
          </p>

          {/* Werewolf Pack Voting Coordination (Shared in Real Time Among Werewolves) */}
          {gameState.werewolfVotes && gameState.werewolfVotes.length > 0 && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-red-300 font-cinzel">
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-red-400" />
                  <span>Pack Night Votes (Visible only to Werewolves):</span>
                </div>
                <span className="text-[10px] text-red-400/80 font-mono">
                  {gameState.werewolfVotes.length} {gameState.werewolfVotes.length === 1 ? 'Vote' : 'Votes'} Cast
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {gameState.werewolfVotes.map((wv) => {
                  const isMyVote = wv.werewolfId === gameState.myPlayerId;
                  return (
                    <div
                      key={wv.werewolfId}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] font-mono ${
                        isMyVote
                          ? 'bg-red-900/50 border-red-500 text-red-200 font-bold'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span>🐺 {wv.werewolfName}{isMyVote ? ' (You)' : ''}</span>
                      <span className="text-red-400 font-bold">→ {wv.targetName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              Limit: 1 Player / Night
            </span>
          </div>

          <p className="text-xs text-zinc-300">
            Select one player to uncover their exact secret role. You can only inspect 1 player each night.
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

          {/* If already investigated this night, show complete badge; otherwise show action button */}
          {gameState.seerResult ? (
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-center text-xs text-indigo-200 font-mono">
              ✨ Divination complete for tonight. You can only inspect 1 player per night. Rest your sight until dawn.
            </div>
          ) : (
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
          )}
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

      {/* 5. WITCH PANEL - SPECIAL NIGHT ACTION & WEREWOLF REVEAL */}
      {role === 'WITCH' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-pink-400 font-bold font-cinzel text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Witch's Secret Cauldrons</span>
            </div>
            <div className="text-[10px] text-pink-300/80 font-mono bg-pink-950/60 px-2 py-0.5 rounded-md border border-pink-800/60">
              Each power 1x use in entire game
            </div>
          </div>

          {/* Werewolves Target Notification Alert for Witch */}
          {gameState.witchPotions?.isWitchTargeted ? (
            <div className="p-3.5 rounded-xl bg-red-950/70 border-2 border-red-500/80 text-red-200 animate-pulse space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-red-300 font-cinzel">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>KHATRA: Bhediyon ne AAPKO shikar banaya hai!</span>
              </div>
              <p className="text-[11px] text-red-200 leading-relaxed">
                The werewolves struck at you in the dark! You can drink your <strong>Elixir of Life</strong> right now to save your own life, or risk it and preserve the potion!
              </p>
            </div>
          ) : gameState.witchPotions?.nightVictimName ? (
            <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-600/70 text-amber-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-300 font-cinzel">
                <Skull className="w-4 h-4 text-amber-400" />
                <span>Bhediyon ne hamla kiya: <strong>{gameState.witchPotions.nightVictimName}</strong></span>
              </div>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Werewolves targeted <strong>{gameState.witchPotions.nightVictimName}</strong> tonight. You can use your Elixir of Life to rescue them, or save your medicine for a future night.
              </p>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400">
              Bhediyon ka shikar abhi tay nahi hua hai (ya koi shikar nahi hua).
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Healing Potion (Elixir of Life) */}
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-400 font-cinzel">
                    Elixir of Life (Bachao)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400">
                    {gameState.witchPotions?.healAvailable ? '1 Available' : 'Used (0/1)'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {gameState.witchPotions?.isWitchTargeted
                    ? 'Drink potion to save your own life.'
                    : gameState.witchPotions?.nightVictimName
                    ? `Save ${gameState.witchPotions.nightVictimName} from death.`
                    : 'Awaits werewolf attack victim.'}
                </p>
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
                className="w-full py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 disabled:opacity-30 disabled:hover:bg-emerald-800 text-white text-xs font-bold transition min-h-[44px] cursor-pointer"
              >
                {gameState.witchPotions?.healAvailable
                  ? gameState.witchPotions?.isWitchTargeted
                    ? 'Drink Elixir (Save Yourself)'
                    : gameState.witchPotions?.nightVictimName
                    ? `Administer Elixir (Save ${gameState.witchPotions.nightVictimName})`
                    : 'Elixir Ready'
                  : 'Elixir Expended (Dawai Kharch Ho Chuki)'}
              </button>
            </div>

            {/* Poison Potion (Black Nightshade) */}
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-400 font-cinzel">
                    Vial of Poison (Zahar Do)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-rose-400">
                    {gameState.witchPotions?.poisonAvailable ? '1 Available' : 'Used (0/1)'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {targetPlayer ? (
                    <span>
                      Selected target: <strong className="text-rose-300">{targetPlayer.name}</strong>
                    </span>
                  ) : (
                    <span>Click any player on the board to poison.</span>
                  )}
                </p>
              </div>

              <button
                id="witch-poison-btn"
                onClick={() => targetPlayer && handleConfirm('POISON', targetPlayer.id)}
                disabled={!gameState.witchPotions?.poisonAvailable || !targetPlayer || submitting}
                className="w-full py-2.5 rounded-lg bg-rose-900 hover:bg-rose-800 disabled:opacity-30 disabled:hover:bg-rose-900 text-white text-xs font-bold transition min-h-[44px] cursor-pointer"
              >
                {gameState.witchPotions?.poisonAvailable
                  ? targetPlayer
                    ? `Poison ${targetPlayer.name}`
                    : 'Select Target on Board'
                  : 'Poison Expended (Zahar Kharch Ho Chuka)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CUPID PANEL (Night 1: Bind Lovers) */}
      {role === 'CUPID' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold font-cinzel text-sm">
              <Heart className="w-4 h-4 fill-rose-400" />
              <span>Cupid's Golden Arrow (Prem Dhanush)</span>
            </div>
            <div className="text-[10px] text-rose-300 font-mono bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/60">
              Night 1 Only
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            {gameState.round === 1
              ? isLoversLocked
                ? 'Prem sutra bandh chuka hai! Yeh prem bandhan ab badla ya toda nahi ja sakta.'
                : 'Board par pehle 1st Lover ko select karein, fir 2nd Lover ko select karein. Kisi ko unselect karne ke liye dobara uspar click karein ya Unselect dabayein.'
              : 'Your arrows were spent on the first night. You slumber alongside the village.'}
          </p>

          {gameState.round === 1 && (
            <div className="space-y-3">
              {/* Lovers Selection Cards (Slot 1 & Slot 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Lover 1 Slot */}
                <div
                  className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between min-h-[76px] ${
                    cupidLover1
                      ? isLoversLocked
                        ? 'bg-rose-950/40 border-emerald-600/70 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-rose-950/60 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                      : 'bg-zinc-900/40 border-dashed border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold font-cinzel text-rose-300 uppercase tracking-wider flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                      1st Lover
                    </span>
                    {!isLoversLocked && cupidLover1 && (
                      <button
                        type="button"
                        onClick={() => onUnselectCupidLover?.(1)}
                        className="text-[10px] font-semibold text-rose-200 hover:text-white bg-rose-900/70 hover:bg-rose-800 px-2 py-0.5 rounded border border-rose-600/60 transition cursor-pointer"
                        title="Unselect Lover 1"
                      >
                        ✕ Unselect
                      </button>
                    )}
                  </div>
                  {cupidLover1 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-7 h-7 rounded-full bg-rose-900 border border-rose-400 text-rose-100 text-xs font-bold flex items-center justify-center shrink-0">
                        {cupidLover1.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-sm text-white truncate">{cupidLover1.name}</div>
                        {isLoversLocked ? (
                          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                            <span>Bound in Eternal Love • Locked</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-300/80">Selected • Click again on board to unselect</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400 italic py-1.5 flex items-center gap-1.5">
                      <span>👆 Click 1st player on the board</span>
                    </div>
                  )}
                </div>

                {/* Lover 2 Slot */}
                <div
                  className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between min-h-[76px] ${
                    cupidLover2
                      ? isLoversLocked
                        ? 'bg-rose-950/40 border-emerald-600/70 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-rose-950/60 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                      : 'bg-zinc-900/40 border-dashed border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold font-cinzel text-rose-300 uppercase tracking-wider flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                      2nd Lover
                    </span>
                    {!isLoversLocked && cupidLover2 && (
                      <button
                        type="button"
                        onClick={() => onUnselectCupidLover?.(2)}
                        className="text-[10px] font-semibold text-rose-200 hover:text-white bg-rose-900/70 hover:bg-rose-800 px-2 py-0.5 rounded border border-rose-600/60 transition cursor-pointer"
                        title="Unselect Lover 2"
                      >
                        ✕ Unselect
                      </button>
                    )}
                  </div>
                  {cupidLover2 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-7 h-7 rounded-full bg-rose-900 border border-rose-400 text-rose-100 text-xs font-bold flex items-center justify-center shrink-0">
                        {cupidLover2.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-sm text-white truncate">{cupidLover2.name}</div>
                        {isLoversLocked ? (
                          <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                            <span>Bound in Eternal Love • Locked</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-300/80">Selected • Click again on board to unselect</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400 italic py-1.5 flex items-center gap-1.5">
                      <span>{cupidLover1 ? '👆 Click 2nd player on the board' : 'Awaiting 1st lover selection...'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bind Lovers Action Button: Transforms into disabled confirmation once clicked! */}
              {isLoversLocked ? (
                <button
                  id="cupid-bind-lovers-btn"
                  type="button"
                  disabled={true}
                  className="w-full py-3 px-4 rounded-xl font-bold font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[46px] bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 cursor-not-allowed opacity-90 shadow-lg select-none"
                >
                  <Heart className="w-4 h-4 fill-emerald-400 text-emerald-400 shrink-0" />
                  <span>Cupid's arrow struck true! Lovers have been bound together.</span>
                </button>
              ) : (
                <button
                  id="cupid-bind-lovers-btn"
                  type="button"
                  onClick={() =>
                    cupidLover1 &&
                    cupidLover2 &&
                    handleConfirm('CUPID_LOVERS', cupidLover1.id, cupidLover2.id)
                  }
                  disabled={!canBindLovers}
                  className={`w-full py-3 px-4 rounded-xl font-bold font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[46px] transition-all duration-300 ${
                    canBindLovers
                      ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.45)] cursor-pointer scale-[1.01]'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${canBindLovers ? 'fill-white animate-pulse' : ''}`} />
                  <span>
                    {submitting
                      ? 'Binding Lovers in Eternal Fate...'
                      : canBindLovers
                      ? `Bind as Lovers! (${cupidLover1?.name} ❤️ ${cupidLover2?.name})`
                      : !cupidLover1
                      ? '1. Board par 1st Lover select karein'
                      : !cupidLover2
                      ? '2. Board par 2nd Lover select karein'
                      : 'Bind as Lovers!'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. WHITE WOLF (Even Nights Solo Kill) */}
      {role === 'WHITE_WOLF' && gameState.round % 2 === 0 && (
        <div className="mt-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-700 space-y-2">
          <div className="font-bold text-xs text-zinc-200 font-cinzel flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-zinc-400" />
            <span>White Wolf Solo Hunt (Even Night: Kill a Werewolf)</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Select another werewolf on the board to secretly murder them tonight.
          </p>
          <button
            type="button"
            onClick={() => targetPlayer && handleConfirm('WHITE_WOLF_KILL', targetPlayer.id)}
            disabled={!targetPlayer || targetPlayer.id === me?.id || submitting}
            className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
          >
            {targetPlayer ? `Kill Werewolf ${targetPlayer.name}` : 'Select a Werewolf on board'}
          </button>
        </div>
      )}

      {/* 8. LITTLE GIRL SNEAK PEEK */}
      {role === 'LITTLE_GIRL' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-400 font-bold font-cinzel text-sm">
              <Eye className="w-4 h-4" />
              <span>Little Girl's Peeping Window</span>
            </div>
            {gameState.littleGirlPeekResult && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  gameState.littleGirlPeekResult.caught
                    ? 'bg-red-950/80 text-red-300 border-red-700'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                }`}
              >
                {gameState.littleGirlPeekResult.caught ? '⚠️ CAUGHT!' : '✨ PEEK ACTIVE'}
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Peek through your fingers to secretly discover the Werewolf pack and see whom they are attacking tonight!
            Beware: There is a 30% chance a twig snaps and the wolves catch you spying.
          </p>

          {/* Peek Result Display */}
          {gameState.littleGirlPeekResult ? (
            gameState.littleGirlPeekResult.caught ? (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-700/80 text-red-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Snap! You were caught peeking!</span>
                </div>
                <p className="leading-relaxed text-zinc-300">
                  A dry twig snapped under your boots. The wolves turned their glowing red eyes directly toward your hiding spot in the dark!
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-amber-500/50 text-xs space-y-2.5 shadow-lg">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <Eye className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Successful Peek: Pack Intel Revealed!</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
                    Werewolves Spotted in the Woods:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {gameState.littleGirlPeekResult.werewolfNames &&
                    gameState.littleGirlPeekResult.werewolfNames.length > 0 ? (
                      gameState.littleGirlPeekResult.werewolfNames.map((wName, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-700/70 text-red-200 font-bold flex items-center gap-1 text-xs"
                        >
                          <Moon className="w-3 h-3 text-red-400 fill-red-400" />
                          <span>{wName}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-400 italic">No wolves visible right now.</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
                  <span className="text-zinc-400">Current Wolf Target:</span>
                  {gameState.littleGirlPeekResult.targetName ? (
                    <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-600 text-rose-200 font-bold">
                      🎯 {gameState.littleGirlPeekResult.targetName}
                    </span>
                  ) : (
                    <span className="text-zinc-400 italic">The pack has not agreed on a prey yet...</span>
                  )}
                </div>
                <div className="text-[11px] text-amber-300/80 italic">
                  💡 Note: Wolf markers and prey targets are also marked on the player arena cards!
                </div>
              </div>
            )
          ) : (
            <button
              id="little-girl-peek-btn"
              type="button"
              onClick={() => me && handleConfirm('LITTLE_GIRL_PEEK', me.id)}
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-h-[46px] shadow-[0_0_20px_rgba(245,158,11,0.3)] transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{submitting ? 'Peeking through the mist...' : 'Peek at Werewolves Tonight (30% Risk)'}</span>
            </button>
          )}
        </div>
      )}

      {/* 9. DOPPELGANGER (Night 1: Bind Fate) */}
      {role === 'DOPPELGANGER' && gameState.round === 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-teal-400 font-bold font-cinzel text-sm">
            <UserCheck className="w-4 h-4" />
            <span>Doppelganger Mirror</span>
          </div>
          <p className="text-xs text-zinc-300">
            Select a player on the board. When they die, you will mirror their reflection and inherit their role!
          </p>
          <button
            type="button"
            onClick={() => targetPlayer && handleConfirm('DOPPELGANGER_BIND', targetPlayer.id)}
            disabled={!targetPlayer || targetPlayer.id === me?.id || submitting}
            className="w-full py-2.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold min-h-[44px]"
          >
            {targetPlayer ? `Bind Reflection to ${targetPlayer.name}` : 'Select player on board'}
          </button>
        </div>
      )}

      {/* 10. THIEF (Night 1: Choose Reserve Card) */}
      {role === 'THIEF' && gameState.round === 1 && gameState.thiefReserveRoles && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold font-cinzel text-sm">
            <Zap className="w-4 h-4" />
            <span>Thief's Midnight Heist</span>
          </div>
          <p className="text-xs text-zinc-300">
            Two unassigned role cards lie face down. You may steal one to replace your Thief card, or stay a Thief.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {gameState.thiefReserveRoles.map((reserveRole, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => me && handleConfirm('THIEF_CHOOSE', me.id, undefined, reserveRole)}
                className="p-3 rounded-xl bg-zinc-900 border border-amber-700/60 hover:border-amber-500 text-amber-300 text-xs font-bold font-cinzel text-center cursor-pointer"
              >
                Steal: {reserveRole}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 11. PASSIVE OR SLUMBERING ROLES AT NIGHT */}
      {!isWerewolfPackMember &&
        role !== 'SEER' &&
        role !== 'DOCTOR' &&
        role !== 'BODYGUARD' &&
        role !== 'WITCH' &&
        role !== 'LITTLE_GIRL' &&
        !(role === 'CUPID' && gameState.round === 1) &&
        !(role === 'DOPPELGANGER' && gameState.round === 1) &&
        !(role === 'THIEF' && gameState.round === 1) && (
          <div className="text-center py-3 space-y-1.5">
            <div className="font-cinzel text-zinc-300 font-bold text-sm">
              The Village Slumbers
            </div>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Close your eyes and lock your oak doors. The darkness belongs to prowling beasts and mystic arts.
            </p>
            {gameState.masonAllies && gameState.masonAllies.length > 0 && (
              <div className="mt-2 text-xs text-amber-300/80 font-mono bg-amber-950/40 p-2 rounded-lg border border-amber-800/40 inline-block">
                Mason Brotherhood: You recognized {gameState.masonAllies.map((m) => m.name).join(', ')} in the dark!
              </div>
            )}
            {gameState.loverPartner && (
              <div className="mt-2 text-xs text-rose-300/90 font-mono bg-rose-950/40 p-2 rounded-lg border border-rose-800/40 inline-block">
                Lovers' Bond: Your beloved is {gameState.loverPartner.name}. You share each other's fate!
              </div>
            )}
          </div>
        )}
    </div>
  );
};
