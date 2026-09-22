import React from 'react';
import { Trophy, Moon, Users, RotateCcw, Home, Skull, Laugh, Flame } from 'lucide-react';
import { ClientGameState } from '../types/game.js';
import { getAvatar } from '../utils/avatars.js';
import { AudioControls } from './AudioControls.js';
import { NightModeToggle } from './NightModeToggle.js';

interface GameOverViewProps {
  gameState: ClientGameState;
  onRestart: () => void;
  onLeave: () => void;
}

export const GameOverView: React.FC<GameOverViewProps> = ({
  gameState,
  onRestart,
  onLeave,
}) => {
  const winnerTeam = gameState.winnerTeam;
  const isHost = gameState.isHost;

  const outcomeConfig = React.useMemo(() => {
    if (winnerTeam === 'ARSONIST') {
      return {
        title: 'Arsonist Wins!',
        glowColor: 'bg-orange-300/40',
        emblemStyle: 'bg-orange-50 border-orange-200 text-orange-600',
        titleStyle: 'text-orange-700',
        icon: <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />,
        defaultQuote: 'The entire village was reduced to ashes! The Arsonist reigns supreme alone in victory!',
      };
    }
    if (winnerTeam === 'SERIAL_KILLER') {
      return {
        title: 'Serial Killer Wins!',
        glowColor: 'bg-rose-300/40',
        emblemStyle: 'bg-rose-50 border-rose-200 text-rose-600',
        titleStyle: 'text-rose-700',
        icon: <Skull className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500" />,
        defaultQuote: 'Every last soul in the village was butchered in cold blood! Serial Killer Wins!',
      };
    }
    if (winnerTeam === 'JESTER') {
      return {
        title: 'Jester Wins!',
        glowColor: 'bg-amber-300/40',
        emblemStyle: 'bg-amber-50 border-amber-200 text-amber-600',
        titleStyle: 'text-amber-700',
        icon: <Laugh className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />,
        defaultQuote: 'The village council fell right into the trickster’s trap! JESTER WINS!',
      };
    }
    if (winnerTeam === 'VILLAGERS') {
      return {
        title: 'Villagers Triumph!',
        glowColor: 'bg-indigo-300/40',
        emblemStyle: 'bg-indigo-50 border-indigo-200 text-indigo-600',
        titleStyle: 'text-indigo-900',
        icon: <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />,
        defaultQuote: 'The cursed beasts have been cleansed from the village.',
      };
    }
    if (winnerTeam === 'WHITE_WOLF') {
      return {
        title: 'White Werewolf Wins!',
        glowColor: 'bg-slate-300/40',
        emblemStyle: 'bg-slate-100 border-slate-300 text-slate-700',
        titleStyle: 'text-slate-800',
        icon: <Moon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600" />,
        defaultQuote: 'The lone white beast outsmarted packmates and villagers alike!',
      };
    }
    // Default WEREWOLVES
    return {
      title: 'Werewolves Devour!',
      glowColor: 'bg-rose-300/40',
      emblemStyle: 'bg-rose-50 border-rose-200 text-rose-600',
      titleStyle: 'text-rose-700',
      icon: <Moon className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500" />,
      defaultQuote: 'The darkness has swallowed the last breath of the hamlet.',
    };
  }, [winnerTeam]);

  return (
    <div
      id="game-over-screen"
      className="relative min-h-screen flex flex-col items-center justify-between p-3 sm:p-4 md:p-10 z-20 max-w-5xl mx-auto w-full"
    >
      {/* Top Header */}
      <div className="w-full flex items-center justify-between">
        <div className="font-cinzel text-xs tracking-widest text-slate-500 uppercase font-semibold">
          Village Chronicle Closed
        </div>
        <div className="flex items-center gap-2">
          <NightModeToggle />
          <AudioControls />
        </div>
      </div>

      {/* Center Victory Banner */}
      <div className="my-auto py-6 sm:py-8 text-center w-full max-w-3xl animate-in fade-in zoom-in-95 duration-300">
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-md border border-white/80">
          <div
            className={`absolute inset-0 rounded-full blur-xl opacity-60 ${outcomeConfig.glowColor}`}
          />
          <div
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border shadow-xs ${outcomeConfig.emblemStyle}`}
          >
            {outcomeConfig.icon}
          </div>
        </div>

        <div className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 mb-1 sm:mb-2">
          Final Outcome
        </div>

        <h1
          className={`text-2xl sm:text-4xl md:text-6xl font-black font-cinzel tracking-wider uppercase mb-3 sm:mb-4 px-2 ${outcomeConfig.titleStyle}`}
        >
          {outcomeConfig.title}
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-xl mx-auto mb-6 sm:mb-8 font-serif italic leading-relaxed px-2">
          "{gameState.winReason || outcomeConfig.defaultQuote}"
        </p>

        {/* Revealed Roles Roster */}
        <div className="glass-card-prominent border border-white/80 dark:border-white/10 rounded-3xl p-4 sm:p-6 backdrop-blur-2xl mb-6 sm:mb-8 text-left shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 sm:mb-4 border-b border-indigo-100 dark:border-white/10 pb-2 font-mono">
            <span>True Allegiances & Final Fates</span>
            <span>Survived {gameState.round} Rounds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {gameState.players.map((p) => {
              const avatar = getAvatar(p.avatar);
              const isWolf = p.role === 'WEREWOLF' || p.role === 'WHITE_WOLF' || p.role === 'WOLF_CUB';
              const isJester = p.role === 'JESTER';
              const isJesterWinner = isJester && winnerTeam === 'JESTER';
              const isArsonist = p.role === 'ARSONIST';
              const isArsonistWinner = isArsonist && winnerTeam === 'ARSONIST';
              const isSK = p.role === 'SERIAL_KILLER';
              const isSKWinner = isSK && winnerTeam === 'SERIAL_KILLER';
              const isSoloWinner = isJesterWinner || isArsonistWinner || isSKWinner;

              return (
                <div
                  key={p.id}
                  className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between transition backdrop-blur-md shadow-xs ${
                    isArsonistWinner
                      ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-300 ring-1 ring-orange-300'
                      : isSKWinner
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 ring-1 ring-rose-300'
                      : isJesterWinner
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 ring-1 ring-amber-300'
                      : p.isAlive
                      ? 'bg-white/80 dark:bg-[#15141e] border-indigo-100 dark:border-white/10'
                      : 'bg-slate-100/70 dark:bg-[#100f17] border-slate-200 dark:border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs"
                      style={{ backgroundColor: avatar.color + '22', color: avatar.color }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                        <span className={!p.isAlive && !isSoloWinner ? 'line-through text-slate-400' : ''}>
                          {p.name}
                        </span>
                        {!p.isAlive && <Skull className="w-3 h-3 text-slate-400" />}
                      </div>
                      <div
                        className={`text-[10px] font-bold font-cinzel ${
                          isArsonist
                            ? 'text-orange-600'
                            : isSK
                            ? 'text-rose-600'
                            : isWolf
                            ? 'text-rose-600'
                            : isJester
                            ? 'text-amber-600'
                            : 'text-indigo-600'
                        }`}
                      >
                        {p.role || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      isArsonistWinner
                        ? 'bg-orange-100 text-orange-800 border border-orange-200 font-bold'
                        : isSKWinner
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 font-bold'
                        : isJesterWinner
                        ? 'bg-amber-100 text-amber-800 border border-amber-200 font-bold'
                        : p.isAlive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {isArsonistWinner
                      ? 'Victor 🔥'
                      : isSKWinner
                      ? 'Victor 🔪'
                      : isJesterWinner
                      ? 'Victor 🎭'
                      : p.isAlive
                      ? 'Alive'
                      : 'Dead'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
          {isHost && (
            <button
              id="game-over-restart-btn"
              onClick={onRestart}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 min-h-[48px] rounded-2xl gradient-brand-btn text-white font-bold font-cinzel text-sm shadow-md transition cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Return to Lobby / Play Again</span>
            </button>
          )}

          <button
            id="game-over-leave-btn"
            onClick={onLeave}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-2xl bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-indigo-200 dark:border-white/15 text-slate-700 dark:text-slate-200 font-cinzel text-sm transition cursor-pointer active:scale-98 shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Leave Village</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[11px] text-slate-400 font-cinzel">
        May the fallen rest, until the next moon rises.
      </div>
    </div>
  );
};
