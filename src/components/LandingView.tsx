import React, { useEffect, useState } from 'react';
import { Shield, Users, BookOpen, PlusCircle, LogIn, Flame, Sparkles, Moon } from 'lucide-react';
import { RoomListItem } from '../types/game.js';
import { AudioControls } from './AudioControls.js';
import { NightModeToggle } from './NightModeToggle.js';

interface LandingViewProps {
  onCreateClick: () => void;
  onJoinClick: (code?: string, roomName?: string) => void;
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
    // Fetch active rooms & stats with interval polling so active gatherings stay fresh
    const fetchRoomsAndStats = () => {
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
    };

    fetchRoomsAndStats();
    const interval = setInterval(fetchRoomsAndStats, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-12 z-10">
      {/* Top Bar with Frosted Glass */}
      <header className="flex items-center justify-between w-full max-w-6xl mx-auto gap-2">
        <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/15 shadow-lg">
          <div className="p-1.5 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/30 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            <Moon className="w-4 h-4 text-indigo-300" />
          </div>
          <span className="font-cinzel font-bold text-xs sm:text-sm tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            WEREWOLF SOCIAL
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 bg-black/40 backdrop-blur-xl px-2.5 py-1.5 rounded-full border border-white/15 shadow-lg">
          <NightModeToggle />
          <AudioControls />
          <button
            id="nav-how-to-play-btn"
            onClick={onHowToPlayClick}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs text-white border border-white/20 transition min-h-[38px] cursor-pointer shadow-sm active:scale-98"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="hidden xs:inline sm:inline font-medium">How to Play</span>
            <span className="xs:hidden sm:hidden font-medium">Rules</span>
          </button>
        </div>
      </header>

      {/* Center Hero */}
      <main className="flex flex-col items-center text-center my-auto py-8 sm:py-12 max-w-3xl mx-auto w-full">
        {/* Glassmorphic Crest with Blue-to-Purple Gradient Accent */}
        <div className="relative mb-5 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl gradient-brand-btn flex items-center justify-center shadow-[0_15px_35px_-5px_rgba(99,102,241,0.5)] backdrop-blur-xl animate-glow border border-white/30">
            <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
        </div>

        <h1
          id="main-title"
          className="text-4xl sm:text-6xl md:text-7xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-purple-200 tracking-[0.08em] sm:tracking-[0.14em] mb-3 sm:mb-4 drop-shadow-[0_4px_30px_rgba(165,180,252,0.5)]"
        >
          WEREWOLF
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-200 max-w-xl mb-6 sm:mb-8 leading-relaxed font-sans px-3 font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          A real-time multiplayer social deduction game set in a misty enchanted realm. Deceive your neighbors by twilight, or band together to uncover the beasts lurking behind innocent smiles.
        </p>

        {/* Action Buttons in Reference Styling */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md px-2">
          <button
            id="landing-create-game-btn"
            onClick={onCreateClick}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3 min-h-[48px] h-12 rounded-2xl gradient-brand-btn text-white font-bold font-cinzel text-sm tracking-wider transition transform active:scale-98 cursor-pointer shadow-xl hover:shadow-indigo-500/40 select-none border border-white/20"
          >
            <PlusCircle className="w-4 h-4 text-white shrink-0" />
            <span>Create Game</span>
          </button>

          <button
            id="landing-join-game-btn"
            onClick={() => onJoinClick()}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3 min-h-[48px] h-12 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 text-white font-bold font-cinzel text-sm tracking-wider border border-white/25 hover:border-white/50 transition transform active:scale-98 cursor-pointer shadow-xl backdrop-blur-md select-none"
          >
            <LogIn className="w-4 h-4 text-indigo-300 shrink-0" />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Live Active Rooms Drawer in Frosted Glass */}
        {publicRooms.length > 0 && (
          <div className="mt-10 w-full max-w-md bg-slate-950/60 backdrop-blur-xl rounded-3xl p-4 text-left shadow-2xl border border-white/15">
            <div className="flex items-center justify-between text-xs text-slate-200 mb-2.5">
              <span className="font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Active Gatherings
              </span>
              <span className="font-mono text-[11px] text-slate-300 font-medium">
                {publicRooms.length} room{publicRooms.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {publicRooms.map((r) => {
                const isFull = r.playerCount >= r.maxPlayers;
                const isStarted = !!r.phase && r.phase !== 'LOBBY';

                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition shadow-sm gap-2 backdrop-blur-md"
                  >
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-semibold text-xs text-white truncate">{r.name}</div>
                      <div className="text-[10px] text-slate-300 font-mono tracking-wider flex items-center gap-1 flex-wrap">
                        <span>CODE: <span className="text-indigo-300 font-bold">{r.code}</span></span>
                        <span>•</span>
                        <span>{r.playerCount}/{r.maxPlayers}</span>
                        {isStarted && (
                          <span className="text-amber-300 font-bold ml-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                            IN PROGRESS
                          </span>
                        )}
                        {isFull && !isStarted && (
                          <span className="text-rose-300 font-bold ml-1 text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                            FULL
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      id={`join-room-btn-${r.code}`}
                      onClick={() => onJoinClick(r.code, r.name)}
                      disabled={isFull || isStarted}
                      className={`flex items-center justify-center min-h-[44px] px-4 py-2 text-xs rounded-xl font-bold font-cinzel tracking-wider transition cursor-pointer shadow-sm active:scale-95 shrink-0 ${
                        isFull || isStarted
                          ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                          : 'gradient-brand-btn text-white border border-white/20'
                      }`}
                    >
                      {isStarted ? (
                        <span>Playing</span>
                      ) : isFull ? (
                        <span>Full</span>
                      ) : (
                        <span>Join</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer statistics & status */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 border-t border-white/10 pt-4 gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-2xl">
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-white font-medium">Servers Online (WebSocket Ready)</span>
          </div>
          {stats && (
            <div className="hidden md:flex items-center gap-3 text-slate-300">
              <span>•</span>
              <span>{stats.totalGames} Games Played</span>
              <span>•</span>
              <span className="text-indigo-300 font-semibold">{stats.villagerWins} Villager Wins</span>
              <span>•</span>
              <span className="text-rose-300 font-semibold">{stats.werewolfWins} Werewolf Wins</span>
            </div>
          )}
        </div>

        <div className="font-cinzel text-slate-300 text-[11px] tracking-wider">
          Trust No One Under The Twilight Sky
        </div>
      </footer>
    </div>
  );
};
