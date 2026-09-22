import React, { useState } from 'react';
import { FastForward, CheckCircle2, Clock, Users, ArrowRight } from 'lucide-react';
import { ClientGameState } from '../types/game.js';
import { getAvatar } from '../utils/avatars.js';

interface SkipDiscussionCardProps {
  gameState: ClientGameState;
  onToggleSkipDiscussion?: () => Promise<{ success: boolean; skipped?: boolean; error?: string }>;
}

export const SkipDiscussionCard: React.FC<SkipDiscussionCardProps> = ({
  gameState,
  onToggleSkipDiscussion,
}) => {
  const [loading, setLoading] = useState(false);

  const myPlayerId = gameState.myPlayerId;
  const me = gameState.players.find((p) => p.id === myPlayerId);
  const livingPlayers = gameState.players.filter((p) => p.isAlive);
  const skipVotes = gameState.skipDiscussionVotes || [];
  const totalRequired = gameState.skipDiscussionTotalRequired || livingPlayers.length;
  const hasVoted = skipVotes.includes(myPlayerId);
  const canVote = Boolean(me?.isAlive && gameState.phase === 'DISCUSSION');
  const percent = totalRequired > 0 ? Math.min(100, Math.round((skipVotes.length / totalRequired) * 100)) : 0;
  const remaining = Math.max(0, totalRequired - skipVotes.length);

  const handleClick = async () => {
    if (!canVote || !onToggleSkipDiscussion || loading) return;
    setLoading(true);
    try {
      await onToggleSkipDiscussion();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="skip-discussion-card"
      className="p-4 sm:p-5 rounded-3xl glass-card-prominent backdrop-blur-xl border border-amber-200/60 dark:border-amber-500/20 shadow-lg space-y-3.5 transition-all"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-400/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FastForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="font-cinzel font-bold text-sm sm:text-base text-slate-900 dark:text-amber-100 flex items-center gap-1.5">
              <span>Skip Discussion Time</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
              When all living players agree, discussion will end and voting starts immediately.
            </p>
          </div>
        </div>

        {/* Vote Count Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/5 dark:bg-white/10 border border-slate-900/10 dark:border-white/15 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 self-end sm:self-center">
          <Users className="w-3.5 h-3.5 text-amber-500" />
          <span>
            {skipVotes.length} / {totalRequired} Voted
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-200/80 dark:bg-white/10 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-300/40 dark:border-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-500 shadow-sm"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
          <span>{percent}% consensus</span>
          <span>
            {remaining === 0
              ? 'All votes gathered! Transitioning...'
              : `${remaining} more vote${remaining > 1 ? 's' : ''} needed`}
          </span>
        </div>
      </div>

      {/* Living Player Vote Indicators */}
      <div className="pt-1 border-t border-slate-200/50 dark:border-white/10">
        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Living Council Members Status:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {livingPlayers.map((player) => {
            const playerVoted = skipVotes.includes(player.id);
            const isMe = player.id === myPlayerId;
            return (
              <span
                key={player.id}
                id={`skip-status-${player.id}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-colors ${
                  playerVoted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-200'
                    : 'bg-slate-100/70 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: getAvatar(player.avatar).color }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </span>
                <span className="truncate max-w-[100px]">{isMe ? `${player.name} (You)` : player.name}</span>
                {playerVoted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0 animate-pulse" />
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Action Button */}
      <div className="pt-1">
        {canVote ? (
          <button
            id="vote-skip-discussion-btn"
            onClick={handleClick}
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-2xl font-cinzel font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer ${
              hasVoted
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 border border-emerald-500'
                : 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/25 border border-amber-400/40 hover:shadow-lg'
            }`}
          >
            {hasVoted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-100 animate-pulse" />
                <span>You Voted to Skip Discussion (Click to Retract)</span>
              </>
            ) : (
              <>
                <FastForward className="w-4 h-4 text-amber-100" />
                <span>Vote to Skip Discussion Time</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70" />
              </>
            )}
          </button>
        ) : (
          <div className="py-2 px-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
            {me?.isAlive ? (
              <span>Discussion active.</span>
            ) : (
              <span>Spectating — Waiting for living players to deliberate or vote to skip.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
