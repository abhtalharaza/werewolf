import React, { useState } from 'react';
import { Vote, Check, ShieldAlert, SkipForward } from 'lucide-react';
import { ClientGameState } from '../types/game.js';

interface VotingPanelProps {
  gameState: ClientGameState;
  selectedTargetId: string | null;
  onSubmitVote: (targetId: string | null) => Promise<boolean>;
}

export const VotingPanel: React.FC<VotingPanelProps> = ({
  gameState,
  selectedTargetId,
  onSubmitVote,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const isDead = me && !me.isAlive;
  const targetPlayer = gameState.players.find((p) => p.id === selectedTargetId);

  const hasVoted = me?.hasVoted || gameState.votes[gameState.myPlayerId] !== undefined;

  const totalAlive = gameState.players.filter((p) => p.isAlive).length;
  const totalVotesCast = Object.keys(gameState.votes).length;

  if (isDead) {
    return (
      <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center text-xs text-zinc-500 italic max-w-xl mx-auto backdrop-blur-md">
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
      className="w-full max-w-2xl mx-auto p-3.5 sm:p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-2xl backdrop-blur-md space-y-3.5 sm:space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-400 font-bold font-cinzel text-sm">
          <Vote className="w-4 h-4" />
          <span>Village Tribunal</span>
        </div>

        <div className="text-xs font-mono text-zinc-400">
          Votes: <span className="text-purple-300 font-bold">{totalVotesCast}</span> / {totalAlive}
        </div>
      </div>

      {hasVoted ? (
        <div className="p-3.5 sm:p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-xs">
            <Check className="w-4 h-4" />
            <span>Your ballot has been cast into the urn.</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            Waiting for remaining villagers to deliver their verdict...
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-zinc-300">
            Click a suspect on the board to accuse them, or abstain if you believe in their innocence.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-zinc-900">
            <div className="text-xs">
              {targetPlayer ? (
                <span>
                  Accused Suspect:{' '}
                  <strong className="text-rose-400 font-semibold">{targetPlayer.name}</strong>
                </span>
              ) : (
                <span className="text-zinc-500 italic">Select a player from above</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <button
                id="skip-vote-btn"
                onClick={() => handleVote(null)}
                disabled={submitting}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition min-h-[44px]"
                title="Vote to skip execution today"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Abstain / Skip</span>
              </button>

              <button
                id="confirm-vote-btn"
                onClick={() => targetPlayer && handleVote(targetPlayer.id)}
                disabled={!targetPlayer || submitting}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-rose-950/50 min-h-[44px]"
              >
                <Vote className="w-3.5 h-3.5" />
                <span>Cast Vote to Hang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
