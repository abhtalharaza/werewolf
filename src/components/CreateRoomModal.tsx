import React, { useState } from 'react';
import { X, Shield, Eye, HeartPulse, Crosshair, Sparkles, Sliders, Play } from 'lucide-react';
import { AVATARS } from '../utils/avatars.js';
import { GameSettings } from '../types/game.js';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (name: string, hostName: string, avatar: string, settings: Partial<GameSettings>) => Promise<boolean>;
  loading: boolean;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  loading,
}) => {
  const [roomName, setRoomName] = useState('Whispering Hollow');
  const [hostName, setHostName] = useState('MasterOfWolves');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [discussionTime, setDiscussionTime] = useState(40);
  const [votingTime, setVotingTime] = useState(25);
  const [nightTime, setNightTime] = useState(25);
  const [revealRoleOnDeath, setRevealRoleOnDeath] = useState(true);

  // Special roles toggles
  const [includeSeer, setIncludeSeer] = useState(true);
  const [includeDoctor, setIncludeDoctor] = useState(true);
  const [includeHunter, setIncludeHunter] = useState(true);
  const [includeWitch, setIncludeWitch] = useState(false);
  const [includeBodyguard, setIncludeBodyguard] = useState(false);
  const [autoPopulateBots, setAutoPopulateBots] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const settings: Partial<GameSettings> = {
      roomName: roomName.trim() || 'Whispering Hollow',
      maxPlayers,
      discussionTime,
      votingTime,
      nightTime,
      revealRoleOnDeath,
      autoPopulateBots,
      roleDistribution: {
        WEREWOLF: maxPlayers >= 6 ? 2 : 1,
        VILLAGER: 3,
        SEER: includeSeer ? 1 : 0,
        DOCTOR: includeDoctor ? 1 : 0,
        HUNTER: includeHunter ? 1 : 0,
        WITCH: includeWitch ? 1 : 0,
        BODYGUARD: includeBodyguard ? 1 : 0,
      },
    };

    const success = await onCreateRoom(roomName, hostName, selectedAvatar, settings);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      id="create-room-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="create-room-modal-content"
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl text-zinc-100 my-4 sm:my-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-create-room-modal"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 sm:mb-6 border-b border-zinc-800/80 pb-3 sm:pb-4 pr-10">
          <Sliders className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 shrink-0" />
          <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-zinc-100 tracking-wider">
            Establish Village Sanctum
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Room Name & Host Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Village / Room Name
              </label>
              <input
                id="create-room-name-input"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={24}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:outline-none text-zinc-100 placeholder-zinc-500 text-base sm:text-sm transition min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                Your Host Name
              </label>
              <input
                id="create-host-name-input"
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                maxLength={18}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:outline-none text-zinc-100 placeholder-zinc-500 text-base sm:text-sm transition min-h-[44px]"
              />
            </div>
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
              Select Your Archetype / Avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {AVATARS.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  id={`create-avatar-${av.id}`}
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition min-h-[58px] ${
                    selectedAvatar === av.id
                      ? 'border-purple-500 bg-purple-950/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1"
                    style={{ backgroundColor: av.color + '33', color: av.color }}
                  >
                    {av.name.charAt(0)}
                  </div>
                  <span className="text-[10px] font-medium truncate w-full text-center">{av.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timers & Player Limits */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Phase Timing & Village Capacity
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Max Players: <span className="text-zinc-100 font-bold">{maxPlayers}</span></label>
                <input
                  id="create-max-players-slider"
                  type="range"
                  min="4"
                  max="16"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Night: <span className="text-zinc-100 font-bold">{nightTime}s</span></label>
                <input
                  id="create-night-time-slider"
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={nightTime}
                  onChange={(e) => setNightTime(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Discussion: <span className="text-zinc-100 font-bold">{discussionTime}s</span></label>
                <input
                  id="create-discussion-time-slider"
                  type="range"
                  min="20"
                  max="90"
                  step="5"
                  value={discussionTime}
                  onChange={(e) => setDiscussionTime(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Voting: <span className="text-zinc-100 font-bold">{votingTime}s</span></label>
                <input
                  id="create-voting-time-slider"
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={votingTime}
                  onChange={(e) => setVotingTime(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Special Roles Checklist */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
              Special Roles in Deck
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 text-xs">
                <input
                  type="checkbox"
                  checked={includeSeer}
                  onChange={(e) => setIncludeSeer(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Seer</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 text-xs">
                <input
                  type="checkbox"
                  checked={includeDoctor}
                  onChange={(e) => setIncludeDoctor(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                <span>Doctor</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 text-xs">
                <input
                  type="checkbox"
                  checked={includeHunter}
                  onChange={(e) => setIncludeHunter(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                <span>Hunter</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 text-xs">
                <input
                  type="checkbox"
                  checked={includeWitch}
                  onChange={(e) => setIncludeWitch(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Witch</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 text-xs">
                <input
                  type="checkbox"
                  checked={includeBodyguard}
                  onChange={(e) => setIncludeBodyguard(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Bodyguard</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700 text-xs">
                <input
                  type="checkbox"
                  checked={revealRoleOnDeath}
                  onChange={(e) => setRevealRoleOnDeath(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <span>Reveal on Death</span>
              </label>
            </div>
          </div>

          {/* Quick Start AI Bots Option */}
          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/40 text-purple-200 text-xs cursor-pointer hover:bg-purple-950/50 transition">
            <input
              id="create-auto-populate-bots"
              type="checkbox"
              checked={autoPopulateBots}
              onChange={(e) => setAutoPopulateBots(e.target.checked)}
              className="rounded text-purple-600 focus:ring-0"
            />
            <span className="font-medium">Populate with AI Villagers (Ready to start hunt immediately)</span>
          </label>

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
              id="submit-create-room-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-purple-900/40 font-cinzel cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              {loading ? 'Creating...' : 'Create & Enter Village'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
