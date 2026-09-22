import React, { useState } from 'react';
import { X, LogIn, Users } from 'lucide-react';

const DEFAULT_AVATARS = ['blacksmith', 'elder', 'herbalist', 'hunter', 'innkeeper', 'knight', 'apprentice', 'gravedigger'];

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomCode: string, playerName: string, avatar: string) => Promise<boolean>;
  loading: boolean;
  initialRoomCode?: string;
  errorMessage?: string | null;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onJoinRoom,
  loading,
  initialRoomCode = '',
  errorMessage,
}) => {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [playerName, setPlayerName] = useState('Villager');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !playerName.trim()) return;

    // Deterministically pick avatar based on name
    const charCodeSum = playerName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const assignedAvatar = DEFAULT_AVATARS[charCodeSum % DEFAULT_AVATARS.length];

    const success = await onJoinRoom(roomCode.trim(), playerName.trim(), assignedAvatar);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      id="join-room-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="join-room-modal-content"
        className="relative w-full max-w-md grass-glass-modal grass-glass rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl text-slate-800 dark:text-slate-100 my-4 sm:my-8 max-h-[92vh] overflow-y-auto border border-white/80 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-join-room-modal"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 sm:mb-6 border-b border-indigo-100 dark:border-white/10 pb-3 sm:pb-4 pr-10">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-white/10 border border-indigo-200 dark:border-white/15 text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            <LogIn className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-slate-900 dark:text-white tracking-wide">
            Enter the Village
          </h2>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Room Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
              Village Access Code
            </label>
            <input
              id="join-room-code-input"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. WOLF01"
              maxLength={8}
              required
              className="w-full px-4 py-3 rounded-2xl bg-white/90 dark:bg-[#0c0b12] border border-indigo-200/80 dark:border-white/15 focus:border-indigo-400 focus:outline-none text-indigo-700 dark:text-indigo-300 placeholder-slate-400 dark:placeholder-slate-500 text-center font-mono font-bold tracking-widest text-lg transition uppercase min-h-[48px] focus:ring-1 focus:ring-indigo-400/50 shadow-xs"
            />
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
              Your Villager Name
            </label>
            <input
              id="join-player-name-input"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Garrick"
              maxLength={16}
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-[#0c0b12] border border-indigo-200/80 dark:border-white/15 focus:border-indigo-400 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base sm:text-sm transition min-h-[44px] focus:ring-1 focus:ring-indigo-400/50 shadow-xs"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-indigo-100 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[44px] rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition cursor-pointer flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              id="submit-join-room-btn"
              type="submit"
              disabled={loading || !roomCode.trim()}
              className="flex items-center justify-center gap-2.5 px-6 py-3 min-h-[48px] h-12 rounded-2xl grass-button gradient-brand-btn disabled:opacity-50 text-white font-bold text-sm tracking-wider font-cinzel transition shadow-md cursor-pointer select-none active:scale-98"
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>{loading ? 'Entering...' : 'Join Gathering'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
