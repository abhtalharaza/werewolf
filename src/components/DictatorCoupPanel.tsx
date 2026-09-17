import React, { useState } from 'react';
import { Crown, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { ClientGameState } from '../types/game.js';
import { getAvatar } from '../utils/avatars.js';

interface DictatorCoupPanelProps {
  gameState: ClientGameState;
  selectedTargetId: string | null;
  onSelectTarget: (id: string | null) => void;
  onDictatorCoup?: (targetId: string) => Promise<{ success: boolean; error?: string }>;
  isCompact?: boolean;
}

export const DictatorCoupPanel: React.FC<DictatorCoupPanelProps> = ({
  gameState,
  selectedTargetId,
  onSelectTarget,
  onDictatorCoup,
  isCompact = false,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const isDictator = me?.role === 'DICTATOR';
  const isAlive = me?.isAlive;

  if (!isDictator || !isAlive || gameState.dictatorCoupUsed) {
    return null;
  }

  const eligibleCandidates = gameState.players.filter(
    (p) => p.isAlive && p.id !== gameState.myPlayerId
  );
  const targetPlayer = gameState.players.find((p) => p.id === selectedTargetId);

  const handleExecuteCoup = async () => {
    if (!targetPlayer || submitting || !onDictatorCoup) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await onDictatorCoup(targetPlayer.id);
      if (!res.success && res.error) {
        setActionError(res.error);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to execute Coup');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="dictator-coup-panel"
      className={`rounded-2xl border border-amber-600/60 bg-gradient-to-br from-amber-950/40 via-zinc-950/90 to-zinc-950 shadow-2xl backdrop-blur-md overflow-hidden ${
        isCompact ? 'p-3.5 space-y-3' : 'p-4 sm:p-5 space-y-3.5 max-w-2xl mx-auto'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-800/40 pb-2.5">
        <div className="flex items-center gap-2 text-amber-400 font-cinzel font-bold text-sm">
          <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
          <span>Dictator's Coup d'État</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          1x Absolute Authority
        </span>
      </div>

      {/* Description & High Stakes */}
      <div className="text-xs text-zinc-300 space-y-1.5">
        <p>
          Override all town deliberations and voting! Unilaterally decree an immediate public execution for any suspect.
        </p>
        <div className="flex items-start gap-1.5 p-2 rounded-xl bg-amber-950/50 border border-amber-700/50 text-[11px] text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Fatal Consequence:</strong> If your victim was NOT a Werewolf, overwhelming remorse will force you to commit suicide in the night!
          </span>
        </div>
      </div>

      {/* Candidate Quick Selector Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-400 font-medium">Select Suspect to Condemn:</span>
          {targetPlayer ? (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3 text-amber-400" />
              Target: {targetPlayer.name}
            </span>
          ) : (
            <span className="text-zinc-500 italic">No suspect selected</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto py-1">
          {eligibleCandidates.map((candidate) => {
            const isSelected = selectedTargetId === candidate.id;
            const avatar = getAvatar(candidate.avatar);
            return (
              <button
                key={candidate.id}
                id={`dictator-select-${candidate.id}`}
                type="button"
                onClick={() => onSelectTarget(isSelected ? null : candidate.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500 text-black border-amber-300 shadow-md shadow-amber-900/40 scale-105 font-bold'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-amber-700/50'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ backgroundColor: avatar.color }}
                >
                  {candidate.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[110px]">{candidate.name}</span>
                {isSelected && <Crown className="w-3 h-3 text-black" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {actionError && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-red-950/60 border border-red-700 text-xs text-red-200">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Action Execution Button */}
      <div className="flex justify-end pt-1">
        <button
          id="stage-dictator-coup-btn"
          type="button"
          onClick={handleExecuteCoup}
          disabled={!targetPlayer || submitting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 text-xs font-black uppercase tracking-wider transition shadow-lg shadow-amber-950/70 min-h-[44px] cursor-pointer"
        >
          <Crown className="w-4 h-4 text-zinc-950" />
          <span>
            {submitting
              ? 'Declaring Coup...'
              : targetPlayer
              ? `Stage Coup & Execute ${targetPlayer.name}`
              : 'Select a Suspect to Condemn'}
          </span>
        </button>
      </div>
    </div>
  );
};
