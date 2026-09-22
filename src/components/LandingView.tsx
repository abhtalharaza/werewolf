import React, { useEffect, useState } from 'react';
import { Shield, Users, BookOpen, PlusCircle, LogIn, Flame, Sparkles, Moon } from 'lucide-react';
import { RoomListItem } from '../types/game.js';
import { AudioControls } from './AudioControls.js';
import { NightModeToggle } from './NightModeToggle.js';

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
    // Fetch active rooms & stats with safe fallback if VITE_BACKEND_URL is not set
    const baseUrl = (((import.meta as any).env?.VITE_BACKEND_URL as string) || '').replace(/\/$/, '');
    fetch(`${baseUrl}/api/rooms`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch rooms');
        return res.json();
      })
      .then((data) => {
        if (data && data.rooms) setPublicRooms(data.rooms);
      })
      .catch(() => {});

    fetch(`${baseUrl}/api/stats`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then((data) => {
        if (data && data.stats) setStats(data.stats);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-12 z-10">
      {/* Top Bar with Frosted Glass */}
      <header className="flex items-center justify-between w-full max-w-6xl mx-auto gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 rounded-2xl glass-card-prominent border border-white/80 text-indigo-600 shadow-[0_10px_25px_-5px_rgba(124,58,237,0.15)] backdrop-blur-xl">
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
          </div>
          <span className="font-cinzel font-bold text-xs sm:text-sm tracking-widest text-slate-800 dark:text-zinc-200">
            WEREWOLF SOCIAL
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <NightModeToggle />
          <AudioControls />
          <button
            id="nav-how-to-play-btn"
            onClick={onHowToPlayClick}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-full glass-card text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/10 transition min-h-[44px] cursor-pointer shadow-sm active:scale-98"
          >
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="hidden xs:inline sm:inline font-medium">How to Play</span>
            <span className="xs:hidden sm:hidden font-medium">Rules</span>
          </button>
        </div>
      </header>

      {/* Center Hero */}
      <main className="flex flex-col items-center text-center my-auto py-8 sm:py-12 max-w-3xl mx-auto w-full">
        {/* Glassmorphic Crest with Blue-to-Purple Gradient Accent */}
        <div className="relative mb-5 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl gradient-brand-btn flex items-center justify-center shadow-[0_15px_35px_-5px_rgba(99,102,241,0.4)] backdrop-blur-xl animate-glow">
            <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
        </div>

        <h1
          id="main-title"
          className="text-4xl sm:text-6xl md:text-7xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-900 dark:from-white dark:via-indigo-100 dark:to-purple-200 tracking-[0.08em] sm:tracking-[0.14em] mb-3 sm:mb-4 drop-shadow-sm dark:drop-shadow-[0_4px_24px_rgba(165,180,252,0.35)]"
        >
          WEREWOLF
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-zinc-300 max-w-xl mb-6 sm:mb-8 leading-relaxed font-sans px-2 font-medium">
          A real-time multiplayer social deduction game set in a misty enchanted realm. Deceive your neighbors by twilight, or band together to uncover the beasts lurking behind innocent smiles.
        </p>

        {/* Action Buttons in Reference Styling */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md px-2">
          <button
            id="landing-create-game-btn"
            onClick={onCreateClick}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3 min-h-[48px] h-12 rounded-2xl gradient-brand-btn text-white font-bold font-cinzel text-sm tracking-wider transition transform active:scale-98 cursor-pointer shadow-lg hover:shadow-indigo-500/30 select-none"
          >
            <PlusCircle className="w-4 h-4 text-white shrink-0" />
            <span>Create Game</span>
          </button>

          <button
            id="landing-join-game-btn"
            onClick={() => onJoinClick()}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3 min-h-[48px] h-12 rounded-2xl glass-card-prominent hover:bg-white/90 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold font-cinzel text-sm tracking-wider border border-white/90 dark:border-white/15 hover:border-white transition transform active:scale-98 cursor-pointer shadow-md select-none"
          >
            <LogIn className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Live Active Rooms Drawer in Frosted Glass */}
        {publicRooms.length > 0 && (
          <div className="mt-10 w-full max-w-md glass-card rounded-3xl p-4 text-left shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-zinc-300 mb-2.5">
              <span className="font-semibold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Active Gatherings
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                {publicRooms.length} room{publicRooms.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {publicRooms.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-white/[0.06] border border-white/80 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition shadow-sm gap-2"
                >
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">{r.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono tracking-wider">
                      CODE: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{r.code}</span> • {r.playerCount}/{r.maxPlayers}
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinClick(r.code)}
                    className="flex items-center justify-center min-h-[44px] px-4 py-2 text-xs rounded-xl gradient-brand-btn text-white font-bold font-cinzel tracking-wider transition cursor-pointer shadow-sm active:scale-95 shrink-0"
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
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-zinc-400 border-t border-purple-200/50 dark:border-white/10 pt-4 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-slate-700 dark:text-zinc-300 font-medium">Servers Online (WebSocket Ready)</span>
          </div>
          {stats && (
            <div className="hidden md:flex items-center gap-3 text-slate-500 dark:text-zinc-400">
              <span>•</span>
              <span>{stats.totalGames} Games Played</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{stats.villagerWins} Villager Wins</span>
              <span>•</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">{stats.werewolfWins} Werewolf Wins</span>
            </div>
          )}
        </div>

        <div className="font-cinzel text-slate-500 dark:text-zinc-400 text-[11px] tracking-wider">
          Trust No One Under The Twilight Sky
        </div>
      </footer>
    </div>
  );
};
