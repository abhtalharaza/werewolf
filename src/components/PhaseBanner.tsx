import React from 'react';
import { Moon, Sun, Vote, Skull, Clock, AlertTriangle, Crosshair, FastForward, CheckCircle2 } from 'lucide-react';
import { GamePhase } from '../types/game.js';

interface PhaseBannerProps {
  phase: GamePhase;
  round: number;
  timer: number;
  timerMax: number;
  bearGrowl?: boolean | null;
  silencedPlayerName?: string | null;
  hasAliveWitch?: boolean;
  amnesiacAwakened?: boolean;
  onToggleSkipDiscussion?: () => void;
  skipDiscussionVotes?: string[];
  skipDiscussionTotalRequired?: number;
  myPlayerId?: string;
  isAlive?: boolean;
}

export const PhaseBanner: React.FC<PhaseBannerProps> = ({
  phase,
  round,
  timer,
  timerMax,
  bearGrowl,
  silencedPlayerName,
  hasAliveWitch,
  amnesiacAwakened,
  onToggleSkipDiscussion,
  skipDiscussionVotes = [],
  skipDiscussionTotalRequired = 0,
  myPlayerId,
  isAlive,
}) => {
  const isUrgent = timer <= 5 && timer > 0;
  const progress = timerMax > 0 ? (timer / timerMax) * 100 : 0;
  const hasVotedToSkip = Boolean(myPlayerId && skipDiscussionVotes.includes(myPlayerId));

  const getPhaseMeta = () => {
    switch (phase) {
      case 'NIGHT':
        return {
          title: 'NIGHTFELL',
          subtitle: hasAliveWitch
            ? timer <= 5
              ? "✨ Exclusive Witch Window: Werewolf hunting closed. Witch's decision time!"
              : "Shadows deepen. Werewolves hunt (first 15s) • Witch active (all 20s)."
            : 'Shadows envelop the village. Nocturnal powers take their toll.',
          icon: <Moon className="w-5 h-5 text-indigo-400" />,
          accent: 'border-indigo-500/40 bg-indigo-950/40 text-indigo-200',
          barColor: hasAliveWitch && timer <= 5 ? 'bg-amber-500' : 'bg-indigo-500',
        };
      case 'DAY_ANNOUNCEMENT':
        return {
          title: 'MORNING DAWN',
          subtitle: 'The church bells toll. The village gathers to witness who fell in the night.',
          icon: <Sun className="w-5 h-5 text-amber-400" />,
          accent: 'border-amber-500/40 bg-amber-950/40 text-amber-200',
          barColor: 'bg-amber-500',
        };
      case 'DISCUSSION':
        return {
          title: 'COUNCIL DISCUSSION',
          subtitle: 'Deliberate, question each other, and identify who harbors the curse.',
          icon: <Sun className="w-5 h-5 text-yellow-400" />,
          accent: 'border-yellow-500/40 bg-yellow-950/40 text-yellow-200',
          barColor: 'bg-yellow-500',
        };
      case 'VOTING':
        return {
          title: 'THE TRIAL & VOTE',
          subtitle: 'Cast your ballot to condemn a suspect to the gallows, or choose to abstain.',
          icon: <Vote className="w-5 h-5 text-rose-400" />,
          accent: 'border-rose-500/40 bg-rose-950/40 text-rose-200',
          barColor: 'bg-rose-500',
        };
      case 'VOTE_RESULT':
        return {
          title: 'VERDICT PRONOUNCED',
          subtitle: 'The votes have been tallied. The executioner stands ready.',
          icon: <Skull className="w-5 h-5 text-purple-400" />,
          accent: 'border-purple-500/40 bg-purple-950/40 text-purple-200',
          barColor: 'bg-purple-500',
        };
      case 'HUNTER_ACTION':
        return {
          title: "HUNTER'S PARTING SHOT",
          subtitle: 'The fallen Hunter draws their rifle for their final bullet. One player will fall with them!',
          icon: <Crosshair className="w-5 h-5 text-amber-400 animate-pulse" />,
          accent: 'border-amber-500/60 bg-amber-950/50 text-amber-200',
          barColor: 'bg-amber-500',
        };
      case 'GAME_OVER':
        return {
          title: 'BATTLE RESOLVED',
          subtitle: 'The fate of the village is sealed.',
          icon: <Skull className="w-5 h-5 text-zinc-400" />,
          accent: 'border-zinc-700 bg-zinc-900 text-zinc-300',
          barColor: 'bg-zinc-500',
        };
      default:
        return {
          title: 'PREPARATION',
          subtitle: 'Awaiting the descent of dusk.',
          icon: <Clock className="w-5 h-5 text-zinc-400" />,
          accent: 'border-zinc-800 bg-zinc-900 text-zinc-300',
          barColor: 'bg-purple-500',
        };
    }
  };

  const meta = getPhaseMeta();

  return (
    <div
      id="phase-banner-container"
      className="relative w-full max-w-3xl mx-auto rounded-3xl border border-white/80 dark:border-white/10 glass-card-prominent backdrop-blur-xl shadow-lg overflow-hidden mb-4 transition-colors"
    >
      {/* Top Timer Bar */}
      <div className="w-full bg-purple-100/60 dark:bg-white/5 h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${meta.barColor} ${
            isUrgent ? 'animate-pulse bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' : ''
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        {/* Left Phase Info */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border backdrop-blur-md shadow-sm ${meta.accent}`}>
            {meta.icon}
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-[11px] font-mono tracking-widest text-slate-500 dark:text-slate-400 uppercase font-semibold">
                ROUND {round}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <h2 className="font-cinzel font-black text-base md:text-lg text-slate-900 dark:text-white tracking-wider">
                {meta.title}
              </h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        {/* Right Countdown Clock & Quick Action */}
        <div className="flex items-center gap-2">
          {phase === 'DISCUSSION' && onToggleSkipDiscussion && isAlive && (
            <button
              id="phase-banner-skip-btn"
              type="button"
              onClick={onToggleSkipDiscussion}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border font-mono text-xs font-bold transition shadow-sm cursor-pointer ${
                hasVotedToSkip
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400/40 text-amber-900 dark:text-amber-200'
              }`}
              title={
                hasVotedToSkip
                  ? 'You voted to skip discussion. Click to retract.'
                  : 'Vote to skip discussion time'
              }
            >
              {hasVotedToSkip ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
              ) : (
                <FastForward className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
              )}
              <span>{hasVotedToSkip ? 'Voted' : 'Skip'}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-[10px]">
                {skipDiscussionVotes.length}/{skipDiscussionTotalRequired}
              </span>
            </button>
          )}

          {timer > 0 && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono transition shadow-sm ${
                isUrgent
                  ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 text-rose-700 dark:text-rose-300 shadow-md animate-pulse'
                  : 'glass-card-subtle text-slate-800 dark:text-slate-100 border-indigo-200/80 dark:border-white/15'
              }`}
            >
              <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-500 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span className="text-lg font-bold tracking-widest">
                00:{timer < 10 ? `0${timer}` : timer}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Special Morning / Daytime Announcements */}
      {(phase === 'DAY_ANNOUNCEMENT' || phase === 'DISCUSSION' || phase === 'VOTING') && (
        <>
          {bearGrowl === true && (
            <div className="px-4 py-2 bg-amber-100/90 border-t border-amber-300 text-xs text-amber-900 flex items-center justify-center gap-2 font-mono animate-bounce backdrop-blur-md">
              <span>🐻</span>
              <strong className="font-cinzel tracking-wider text-amber-900 font-bold">BEAR GROWL ALERT:</strong>
              <span>The Bear Tamer's bear growled violently at sunrise! A Werewolf sits directly adjacent!</span>
            </div>
          )}
          {silencedPlayerName && (
            <div className="px-4 py-2 bg-purple-100/90 border-t border-purple-300 text-xs text-purple-900 flex items-center justify-center gap-2 font-mono backdrop-blur-md">
              <span>🤐</span>
              <strong className="font-cinzel tracking-wider text-purple-900 font-bold">SPELLCASTER'S HEX:</strong>
              <span>
                <strong>{silencedPlayerName}</strong> is silenced today! If they speak in chat, they will die instantly!
              </span>
            </div>
          )}
          {amnesiacAwakened && (
            <div className="px-4 py-2 bg-teal-100/90 border-t border-teal-300 text-xs text-teal-900 flex items-center justify-center gap-2 font-mono backdrop-blur-md">
              <span>📢</span>
              <strong className="font-cinzel tracking-wider text-teal-900 font-bold">AMNESIAC AWAKENED:</strong>
              <span>An Amnesiac has remembered their true identity!</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
