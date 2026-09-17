import React from 'react';
import { Trophy, Moon, Users, RotateCcw, Home, Skull, Laugh, Flame } from 'lucide-react';
import { ClientGameState } from '../types/game.js';
import { getAvatar } from '../utils/avatars.js';
import { AudioControls } from './AudioControls.js';

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
        glowColor: 'bg-orange-500',
        emblemStyle: 'bg-orange-950 border-orange-500 text-orange-400',
        titleStyle: 'text-orange-400 drop-shadow-[0_0_25px_rgba(249,115,22,0.5)]',
        icon: <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 drop-shadow" />,
        defaultQuote: 'The entire village was reduced to ashes! The Arsonist reigns supreme alone in victory!',
      };
    }
    if (winnerTeam === 'SERIAL_KILLER') {
      return {
        title: 'Serial Killer Wins!',
        glowColor: 'bg-rose-600',
        emblemStyle: 'bg-rose-950 border-rose-500 text-rose-400',
        titleStyle: 'text-rose-400 drop-shadow-[0_0_25px_rgba(244,63,94,0.5)]',
        icon: <Skull className="w-8 h-8 sm:w-10 sm:h-10 text-rose-400 drop-shadow" />,
        defaultQuote: 'Every last soul in the village was butchered in cold blood! Serial Killer Wins!',
      };
    }
    if (winnerTeam === 'JESTER') {
      return {
        title: 'Jester Wins!',
        glowColor: 'bg-yellow-500',
        emblemStyle: 'bg-yellow-950 border-yellow-500 text-yellow-300',
        titleStyle: 'text-yellow-300 drop-shadow-[0_0_25px_rgba(234,179,8,0.5)]',
        icon: <Laugh className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300 drop-shadow" />,
        defaultQuote: 'The village council fell right into the trickster’s trap! JESTER WINS!',
      };
    }
    if (winnerTeam === 'VILLAGERS') {
      return {
        title: 'Villagers Triumph!',
        glowColor: 'bg-indigo-600',
        emblemStyle: 'bg-indigo-950 border-indigo-500 text-indigo-300',
        titleStyle: 'text-indigo-200 drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]',
        icon: <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 drop-shadow" />,
        defaultQuote: 'The cursed beasts have been cleansed from the village.',
      };
    }
    if (winnerTeam === 'WHITE_WOLF') {
      return {
        title: 'White Werewolf Wins!',
        glowColor: 'bg-slate-300',
        emblemStyle: 'bg-zinc-900 border-slate-400 text-slate-200',
        titleStyle: 'text-slate-100 drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]',
        icon: <Moon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-200 drop-shadow" />,
        defaultQuote: 'The lone white beast outsmarted packmates and villagers alike!',
      };
    }
    // Default WEREWOLVES
    return {
      title: 'Werewolves Devour!',
      glowColor: 'bg-red-600',
      emblemStyle: 'bg-red-950 border-red-500 text-red-400',
      titleStyle: 'text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]',
      icon: <Moon className="w-8 h-8 sm:w-10 sm:h-10 text-red-400 drop-shadow" />,
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
        <div className="font-cinzel text-xs tracking-widest text-zinc-500 uppercase">
          Village Chronicle Closed
        </div>
        <AudioControls />
      </div>

      {/* Center Victory Banner */}
      <div className="my-auto py-6 sm:py-8 text-center w-full max-w-3xl">
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-2xl border">
          <div
            className={`absolute inset-0 rounded-full blur-xl opacity-60 ${outcomeConfig.glowColor}`}
          />
          <div
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border ${outcomeConfig.emblemStyle}`}
          >
            {outcomeConfig.icon}
          </div>
        </div>

        <div className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 mb-1 sm:mb-2">
          Final Outcome
        </div>

        <h1
          className={`text-2xl sm:text-4xl md:text-6xl font-black font-cinzel tracking-wider uppercase mb-3 sm:mb-4 px-2 ${outcomeConfig.titleStyle}`}
        >
          {outcomeConfig.title}
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-zinc-300 max-w-xl mx-auto mb-6 sm:mb-8 font-serif italic leading-relaxed px-2">
          "{gameState.winReason || outcomeConfig.defaultQuote}"
        </p>

        {/* Revealed Roles Roster */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-md mb-6 sm:mb-8 text-left">
          <div className="flex items-center justify-between text-xs text-zinc-400 uppercase tracking-wider mb-3 sm:mb-4 border-b border-zinc-800/60 pb-2">
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
                  className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition ${
                    isArsonistWinner
                      ? 'bg-orange-950/40 border-orange-500/80 ring-1 ring-orange-500/50'
                      : isSKWinner
                      ? 'bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/50'
                      : isJesterWinner
                      ? 'bg-yellow-950/40 border-yellow-500/80 ring-1 ring-yellow-500/50'
                      : p.isAlive
                      ? 'bg-zinc-900/80 border-zinc-700/80'
                      : 'bg-zinc-950/60 border-zinc-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: avatar.color + '33', color: avatar.color }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-zinc-100 flex items-center gap-1">
                        <span className={!p.isAlive && !isSoloWinner ? 'line-through text-zinc-500' : ''}>
                          {p.name}
                        </span>
                        {!p.isAlive && <Skull className="w-3 h-3 text-zinc-500" />}
                      </div>
                      <div
                        className={`text-[10px] font-bold font-cinzel ${
                          isArsonist
                            ? 'text-orange-400'
                            : isSK
                            ? 'text-rose-400'
                            : isWolf
                            ? 'text-red-400'
                            : isJester
                            ? 'text-yellow-400'
                            : 'text-purple-300'
                        }`}
                      >
                        {p.role || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isArsonistWinner
                        ? 'bg-orange-950 text-orange-300 border border-orange-600 font-bold'
                        : isSKWinner
                        ? 'bg-rose-950 text-rose-300 border border-rose-600 font-bold'
                        : isJesterWinner
                        ? 'bg-yellow-950 text-yellow-300 border border-yellow-600 font-bold'
                        : p.isAlive
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                        : 'bg-zinc-800 text-zinc-500'
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 min-h-[48px] rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold font-cinzel text-sm shadow-xl shadow-purple-950/60 transition cursor-pointer active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Return to Lobby / Play Again</span>
            </button>
          )}

          <button
            id="game-over-leave-btn"
            onClick={onLeave}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-cinzel text-sm transition cursor-pointer active:scale-98"
          >
            <Home className="w-4 h-4" />
            <span>Leave Village</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[11px] text-zinc-600 font-cinzel">
        May the fallen rest, until the next moon rises.
      </div>
    </div>
  );
};
