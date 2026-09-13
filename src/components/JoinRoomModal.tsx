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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="join-room-modal-content"
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl text-zinc-100 my-4 sm:my-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-join-room-modal"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 sm:mb-6 border-b border-zinc-800/80 pb-3 sm:pb-4 pr-10">
          <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 shrink-0" />
          <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-zinc-100 tracking-wider">
            Enter the Village
          </h2>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-900/60 text-red-200 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Room Code */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
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
              className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:outline-none text-zinc-100 placeholder-zinc-600 text-center font-mono font-bold tracking-widest text-lg transition uppercase min-h-[48px]"
            />
          </div>

          {/* Player Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:outline-none text-zinc-100 placeholder-zinc-500 text-base sm:text-sm transition min-h-[44px]"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-sm transition"
            >
              Cancel
            </button>
            <button
              id="submit-join-room-btn"
              type="submit"
              disabled={loading || !roomCode.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-purple-900/40 font-cinzel min-h-[44px]"
            >
              <Users className="w-4 h-4" />
              {loading ? 'Entering...' : 'Join Gathering'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
