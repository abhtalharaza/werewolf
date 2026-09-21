import React, { useEffect, useState } from 'react';
import { Shield, Users, BookOpen, PlusCircle, LogIn, Flame, Sparkles, Moon } from 'lucide-react';
import { RoomListItem } from '../types/game.js';
import { AudioControls } from './AudioControls.js';

interface LandingViewProps {
  onCreateClick: () => void;
  onJoinClick: (code?: string) => void;
  onHowToPlayClick: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onCreateClick,
  onJoinClick,
  onHowToPlayClick,
}) => {
  const [publicRooms, setPublicRooms] = useState<RoomListItem[]>([]);
  const [stats, setStats] = useState<{ totalGames: number; villagerWins: number; werewolfWins: number } | null>(null);

  useEffect(() => {
    // Fetch active rooms & stats
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rooms`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rooms) setPublicRooms(data.rooms);
      })
      .catch(() => {});

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stats) setStats(data.stats);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-12 z-10">
      {/* Top Bar */}
      <header className="flex items-center justify-between w-full max-w-6xl mx-auto gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-400">
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="font-cinzel font-bold text-xs sm:text-sm tracking-widest text-zinc-300">
            DARK FOREST
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <AudioControls />
          <button
            id="nav-how-to-play-btn"
            onClick={onHowToPlayClick}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 hover:text-purple-300 hover:border-purple-800/60 transition backdrop-blur-md min-h-[38px]"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden xs:inline sm:inline">How to Play</span>
            <span className="xs:hidden sm:hidden">Rules</span>
          </button>
        </div>
      </header>

      {/* Center Hero */}
      <main className="flex flex-col items-center text-center my-auto py-8 sm:py-12 max-w-3xl mx-auto w-full">
        {/* Mysterious crest */}
        <div className="relative mb-5 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-purple-600/20 via-indigo-900/30 to-black border border-purple-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.25)] animate-glow">
            <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse" />
        </div>

        <h1
          id="main-title"
          className="text-4xl sm:text-6xl md:text-7xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-500 tracking-[0.08em] sm:tracking-[0.15em] mb-3 sm:mb-4 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
        >
          WEREWOLF
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-zinc-400 max-w-xl mb-6 sm:mb-8 leading-relaxed font-sans px-2">
          A real-time multiplayer social deduction game. Deceive your neighbors by moonlight, or band together to uncover the beasts lurking behind innocent smiles.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full justify-center max-w-md px-2">
          <button
            id="landing-create-game-btn"
            onClick={onCreateClick}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 min-h-[48px] rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold font-cinzel text-sm tracking-wider shadow-xl shadow-purple-950/60 border border-purple-500/30 transition transform active:scale-98 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Game</span>
          </button>

          <button
            id="landing-join-game-btn"
            onClick={() => onJoinClick()}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 min-h-[48px] rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-100 font-semibold font-cinzel text-sm tracking-wider border border-zinc-700/80 transition transform active:scale-98 backdrop-blur-sm cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-purple-400" />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Live Active Rooms Drawer if any exist */}
        {publicRooms.length > 0 && (
          <div className="mt-10 w-full max-w-md bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2.5">
              <span className="font-semibold uppercase tracking-wider text-purple-300">
                Active Village Gatherings
              </span>
              <span>{publicRooms.length} room{publicRooms.length > 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2">
              {publicRooms.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-purple-700/50 transition"
                >
                  <div className="text-left">
                    <div className="font-semibold text-xs text-zinc-200">{r.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono tracking-wider">
                      CODE: <span className="text-purple-400 font-bold">{r.code}</span> • {r.playerCount}/{r.maxPlayers}
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinClick(r.code)}
                    className="px-3 py-1 text-xs rounded-md bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/40 transition"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer statistics & status */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 border-t border-zinc-900 pt-4 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400 font-medium">Servers Online (WebSocket Ready)</span>
          </div>
          {stats && (
            <div className="hidden md:flex items-center gap-3 text-zinc-500">
              <span>•</span>
              <span>{stats.totalGames} Games Played</span>
              <span>•</span>
              <span className="text-emerald-400">{stats.villagerWins} Villager Wins</span>
              <span>•</span>
              <span className="text-red-400">{stats.werewolfWins} Werewolf Wins</span>
            </div>
          )}
        </div>

        <div className="font-cinzel text-zinc-600">
          Trust No One Under The Full Moon
        </div>
      </footer>
    </div>
  );
};
