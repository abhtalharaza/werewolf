import React, { useState } from 'react';
import { Vote, Check, ShieldAlert, SkipForward } from 'lucide-react';
import { ClientGameState } from '../types/game.js';
import { DictatorCoupPanel } from './DictatorCoupPanel.js';

interface VotingPanelProps {
  gameState: ClientGameState;
  selectedTargetId: string | null;
  onSelectTarget?: (id: string | null) => void;
  onSubmitVote: (targetId: string | null) => Promise<boolean>;
  onDictatorCoup?: (targetId: string) => Promise<{ success: boolean; error?: string }>;
}

export const VotingPanel: React.FC<VotingPanelProps> = ({
  gameState,
  selectedTargetId,
  onSelectTarget,
  onSubmitVote,
  onDictatorCoup,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const isDead = me && !me.isAlive;
  const targetPlayer = gameState.players.find((p) => p.id === selectedTargetId);
  const isDictator = me?.role === 'DICTATOR';

  const hasVoted = me?.hasVoted || gameState.votes[gameState.myPlayerId] !== undefined;

  const totalAlive = gameState.players.filter((p) => p.isAlive).length;
  const totalVotesCast = Object.keys(gameState.votes).length;

  if (isDead) {
    return (
      <div className="p-4 rounded-2xl grass-glass-subtle border border-emerald-500/30 text-center text-xs text-emerald-400/60 italic max-w-xl mx-auto backdrop-blur-md">
        The deceased cast no shadow upon the village council.
      </div>
    );
  }

  const handleVote = async (targetId: string | null) => {
    if (submitting || hasVoted) return;
    setSubmitting(true);
    await onSubmitVote(targetId);
    setSubmitting(false);
  };

  return (
    <div
      id="voting-panel"
      className="w-full max-w-2xl mx-auto p-4 sm:p-5 rounded-3xl grass-glass border border-emerald-500/30 shadow-2xl backdrop-blur-2xl space-y-3.5 sm:space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-300 font-bold font-cinzel text-sm">
          <Vote className="w-4 h-4 text-rose-400" />
          <span>Village Tribunal</span>
        </div>

        <div className="text-xs font-mono text-emerald-300/80">
          Votes: <span className="text-emerald-300 font-bold">{totalVotesCast}</span> / {totalAlive}
          <span className="text-[10px] text-emerald-400/60 ml-1.5 hidden sm:inline">(Ends early if all vote)</span>
        </div>
      </div>

      {hasVoted ? (
        <div className="p-3.5 sm:p-4 rounded-2xl grass-glass-subtle border border-emerald-500/40 text-center space-y-1 backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 text-emerald-300 font-semibold text-xs">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Your ballot has been cast into the urn.</span>
          </div>
          <p className="text-[11px] text-emerald-200/70">
            Waiting for remaining villagers to deliver their verdict...
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-emerald-100/80">
            Click a suspect on the board to accuse them, or abstain if you believe in their innocence.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-emerald-500/20">
            <div className="text-xs">
              {targetPlayer ? (
                <span className="text-emerald-100">
                  Accused Suspect:{' '}
                  <strong className="text-rose-300 font-semibold">{targetPlayer.name}</strong>
                </span>
              ) : (
                <span className="text-emerald-400/60 italic">Select a player from above</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <button
                id="skip-vote-btn"
                onClick={() => handleVote(null)}
                disabled={submitting}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl grass-glass-subtle hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-200 text-xs font-medium transition min-h-[44px] cursor-pointer"
                title="Vote to skip execution today"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Abstain / Skip</span>
              </button>

              <button
                id="confirm-vote-btn"
                onClick={() => targetPlayer && handleVote(targetPlayer.id)}
                disabled={!targetPlayer || submitting}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-rose-950/50 min-h-[44px] border border-rose-500/50 cursor-pointer"
              >
                <Vote className="w-3.5 h-3.5" />
                <span>Cast Vote to Hang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dictator Coup Section */}
      {isDictator && !gameState.dictatorCoupUsed && (
        <div className="pt-2 border-t border-amber-500/30">
          <DictatorCoupPanel
            gameState={gameState}
            selectedTargetId={selectedTargetId}
            onSelectTarget={onSelectTarget || (() => {})}
            onDictatorCoup={onDictatorCoup}
            isCompact={true}
          />
        </div>
      )}
    </div>
  );
};
