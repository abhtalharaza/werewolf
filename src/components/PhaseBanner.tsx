import React from 'react';
import { Moon, Sun, Vote, Skull, Clock, AlertTriangle, Crosshair } from 'lucide-react';
import { GamePhase } from '../types/game.js';

interface PhaseBannerProps {
  phase: GamePhase;
  round: number;
  timer: number;
  timerMax: number;
  bearGrowl?: boolean | null;
  silencedPlayerName?: string | null;
}

export const PhaseBanner: React.FC<PhaseBannerProps> = ({
  phase,
  round,
  timer,
  timerMax,
  bearGrowl,
  silencedPlayerName,
}) => {
  const isUrgent = timer <= 5 && timer > 0;
  const progress = timerMax > 0 ? (timer / timerMax) * 100 : 0;

  const getPhaseMeta = () => {
    switch (phase) {
      case 'NIGHT':
        return {
          title: 'NIGHTFELL',
          subtitle: 'Shadows envelop the village. Nocturnal powers take their toll.',
          icon: <Moon className="w-5 h-5 text-indigo-400" />,
          accent: 'border-indigo-500/40 bg-indigo-950/40 text-indigo-200',
          barColor: 'bg-indigo-500',
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
      className="relative w-full max-w-3xl mx-auto rounded-2xl border bg-zinc-950/80 backdrop-blur-md shadow-2xl overflow-hidden mb-4 transition-colors"
    >
      {/* Top Timer Bar */}
      <div className="w-full bg-zinc-900 h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${meta.barColor} ${
            isUrgent ? 'animate-pulse bg-red-500' : ''
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        {/* Left Phase Info */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${meta.accent}`}>
            {meta.icon}
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
                ROUND {round}
              </span>
              <span className="text-zinc-600">•</span>
              <h2 className="font-cinzel font-black text-base md:text-lg text-zinc-100 tracking-wider">
                {meta.title}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{meta.subtitle}</p>
          </div>
        </div>

        {/* Right Countdown Clock */}
        {timer > 0 && (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono transition ${
              isUrgent
                ? 'bg-red-950/80 border-red-600/80 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-zinc-200'
            }`}
          >
            <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-400' : 'text-purple-400'}`} />
            <span className="text-lg font-bold tracking-widest">
              00:{timer < 10 ? `0${timer}` : timer}
            </span>
          </div>
        )}
      </div>

      {/* Special Morning / Daytime Announcements */}
      {(phase === 'DAY_ANNOUNCEMENT' || phase === 'DISCUSSION' || phase === 'VOTING') && (
        <>
          {bearGrowl === true && (
            <div className="px-4 py-2 bg-amber-950/80 border-t border-amber-600/50 text-xs text-amber-200 flex items-center justify-center gap-2 font-mono animate-bounce">
              <span>🐻</span>
              <strong className="font-cinzel tracking-wider text-amber-300">BEAR GROWL ALERT:</strong>
              <span>The Bear Tamer's bear growled violently at sunrise! A Werewolf sits directly adjacent!</span>
            </div>
          )}
          {silencedPlayerName && (
            <div className="px-4 py-2 bg-purple-950/80 border-t border-purple-500/50 text-xs text-purple-200 flex items-center justify-center gap-2 font-mono">
              <span>🤐</span>
              <strong className="font-cinzel tracking-wider text-purple-300">SPELLCASTER'S HEX:</strong>
              <span>
                <strong>{silencedPlayerName}</strong> is silenced today! If they speak in chat, they will die instantly!
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
