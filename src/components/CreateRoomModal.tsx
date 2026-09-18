import React, { useState } from 'react';
import {
  X,
  Sliders,
  Play,
  Plus,
  Minus,
  Check,
  Flame,
} from 'lucide-react';
import { Role, Team, GameSettings } from '../types/game.js';
import { ALL_ROLES_META, RoleConfigMeta } from '../types/roleMeta.js';

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
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [discussionTime, setDiscussionTime] = useState(40);
  const [votingTime, setVotingTime] = useState(15);
  const [nightTime, setNightTime] = useState(15);
  const [revealRoleOnDeath, setRevealRoleOnDeath] = useState(true);
  const [autoPopulateBots, setAutoPopulateBots] = useState(true);

  // Dedicated role configuration for all roles
  const [roleCounts, setRoleCounts] = useState<Record<Role, number>>({
    WEREWOLF: 2,
    VILLAGER: 2,
    SEER: 1,
    DOCTOR: 1,
    HUNTER: 1,
    WITCH: 1,
    BODYGUARD: 1,
    CUPID: 0,
    LITTLE_GIRL: 0,
    JESTER: 0,
    MAYOR: 0,
    THIEF: 0,
    WOLF_CUB: 0,
    CURSED: 0,
    MASON: 0,
    LYCAN: 0,
    DOPPELGANGER: 0,
    WHITE_WOLF: 0,
    SERIAL_KILLER: 0,
    SPELLCASTER: 0,
    APPRENTICE_SEER: 0,
    BEAR_TAMER: 0,
    TOUGH_GUY: 0,
    ARSONIST: 0,
    MINION: 0,
    WILD_CHILD: 0,
    DICTATOR: 0,
    VETERAN: 0,
    AMNESIAC: 0,
  });

  if (!isOpen) return null;

  const totalDeckCount = Object.values(roleCounts).reduce((sum, c) => sum + c, 0);

  const updateRoleCount = (role: Role, delta: number) => {
    setRoleCounts((prev) => {
      const current = prev[role] || 0;
      const next = Math.max(0, current + delta);
      // Werewolf minimum 1 for functioning game
      if (role === 'WEREWOLF' && next < 1) {
        return { ...prev, WEREWOLF: 1 };
      }
      return { ...prev, [role]: next };
    });
  };

  const toggleRoleInclusion = (role: Role) => {
    setRoleCounts((prev) => {
      const current = prev[role] || 0;
      if (current > 0) {
        if (role === 'WEREWOLF') return prev; // Cannot disable werewolves
        return { ...prev, [role]: 0 };
      } else {
        return { ...prev, [role]: 1 };
      }
    });
  };

  // Preset handlers
  const applyPreset = (preset: 'ALL_ROLES' | 'BALANCED' | 'MYSTIC') => {
    const baseCounts: Record<Role, number> = {
      WEREWOLF: 0,
      VILLAGER: 0,
      SEER: 0,
      DOCTOR: 0,
      HUNTER: 0,
      WITCH: 0,
      BODYGUARD: 0,
      CUPID: 0,
      LITTLE_GIRL: 0,
      JESTER: 0,
      MAYOR: 0,
      THIEF: 0,
      WOLF_CUB: 0,
      CURSED: 0,
      MASON: 0,
      LYCAN: 0,
      DOPPELGANGER: 0,
      WHITE_WOLF: 0,
      SERIAL_KILLER: 0,
      SPELLCASTER: 0,
      APPRENTICE_SEER: 0,
      BEAR_TAMER: 0,
      TOUGH_GUY: 0,
      ARSONIST: 0,
      MINION: 0,
      WILD_CHILD: 0,
      DICTATOR: 0,
      VETERAN: 0,
      AMNESIAC: 0,
    };

    if (preset === 'ALL_ROLES') {
      setRoleCounts({
        ...baseCounts,
        WEREWOLF: 1,
        VILLAGER: 1,
        SEER: 1,
        DOCTOR: 1,
        HUNTER: 1,
        WITCH: 1,
        BODYGUARD: 1,
      });
      setMaxPlayers(7);
    } else if (preset === 'BALANCED') {
      setRoleCounts({
        ...baseCounts,
        WEREWOLF: 2,
        VILLAGER: 3,
        SEER: 1,
        DOCTOR: 1,
        HUNTER: 1,
      });
      setMaxPlayers(8);
    } else if (preset === 'MYSTIC') {
      setRoleCounts({
        ...baseCounts,
        WEREWOLF: 2,
        VILLAGER: 2,
        SEER: 1,
        DOCTOR: 1,
        HUNTER: 1,
        WITCH: 1,
        BODYGUARD: 1,
      });
      setMaxPlayers(9);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure at least 1 werewolf is in the deck
    const safeCounts = {
      ...roleCounts,
      WEREWOLF: Math.max(1, roleCounts.WEREWOLF || 1),
    };

    const settings: Partial<GameSettings> = {
      roomName: roomName.trim() || 'Whispering Hollow',
      maxPlayers,
      discussionTime,
      votingTime,
      nightTime,
      revealRoleOnDeath,
      autoPopulateBots,
      roleDistribution: safeCounts,
    };

    const success = await onCreateRoom(roomName, hostName, 'elder', settings);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      id="create-room-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="create-room-modal-content"
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-3 sm:p-6 md:p-8 shadow-2xl text-zinc-100 my-2 sm:my-8 max-h-[94vh] overflow-y-auto"
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
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-zinc-100 tracking-wider">
              Establish Village Sanctum
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Configure room parameters and select secret roles assigned to players.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* Player Capacity & Timers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-zinc-400 font-semibold uppercase tracking-wider">Max Village Capacity</span>
                <span className="text-purple-300 font-bold text-sm">{maxPlayers} Players</span>
              </div>
              <input
                id="create-max-players-slider"
                type="range"
                min="4"
                max="16"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>4 Min</span>
                <span>16 Max</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-zinc-400 font-semibold uppercase tracking-wider">Discussion Phase</span>
                <span className="text-amber-300 font-bold text-sm">{discussionTime}s</span>
              </div>
              <input
                id="create-discussion-time-slider"
                type="range"
                min="20"
                max="90"
                step="5"
                value={discussionTime}
                onChange={(e) => setDiscussionTime(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>20s Rapid</span>
                <span>90s Extended</span>
              </div>
            </div>
          </div>

          {/* ROLES SELECTION HEADER & PRESETS */}
          <div className="border border-purple-900/40 bg-purple-950/15 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-purple-900/30">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold font-cinzel text-zinc-100 uppercase tracking-wider">
                    Game Roles & Player Assignment
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Choose which roles will be dealt out to players.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-900/50 text-purple-200 border border-purple-700/50 font-mono font-bold">
                  {totalDeckCount} Roles Selected
                </span>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => applyPreset('ALL_ROLES')}
                className="px-2.5 py-1 rounded-lg text-xs bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/40 text-purple-200 transition cursor-pointer"
              >
                ✨ All 7 Roles (Every Role Assigned)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('MYSTIC')}
                className="px-2.5 py-1 rounded-lg text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition cursor-pointer"
              >
                🔮 Arcane Council (All Specials)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('BALANCED')}
                className="px-2.5 py-1 rounded-lg text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition cursor-pointer"
              >
                ⚖️ Classic Pack
              </button>
            </div>

            {/* LIST OF ALL ROLES */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {ALL_ROLES_META.map((r) => {
                const IconComponent = r.icon;
                const count = roleCounts[r.role] || 0;
                const isIncluded = count > 0;

                return (
                  <div
                    key={r.role}
                    id={`role-config-${r.role}`}
                    className={`p-2.5 sm:p-3 rounded-xl border transition ${
                      isIncluded
                        ? 'bg-zinc-900/90 border-zinc-700/80 shadow-sm'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-500 opacity-60'
                    }`}
                  >
                    {/* Header Row: Checkbox, Icon, Name, Badge + Quantity Controls */}
                    <div className="flex items-center justify-between gap-2 w-full">
                      {/* Left info */}
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
                        {/* Checkbox toggle */}
                        <button
                          type="button"
                          onClick={() => toggleRoleInclusion(r.role)}
                          disabled={r.role === 'WEREWOLF'} // Wolves are mandatory
                          className={`w-5 h-5 rounded shrink-0 flex items-center justify-center border transition ${
                            isIncluded
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'border-zinc-700 bg-zinc-900 text-transparent'
                          } ${r.role === 'WEREWOLF' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                          title={isIncluded ? 'Disable role' : 'Enable role'}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        {/* Role Icon */}
                        <div className={`p-1.5 sm:p-2 rounded-lg bg-zinc-800/80 ${r.color} shrink-0`}>
                          <IconComponent className="w-4 h-4" />
                        </div>

                        {/* Title & Team Badge */}
                        <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-zinc-100 font-cinzel truncate">
                            {r.name}
                          </span>
                          <span
                            className={`text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full font-mono border self-start sm:self-auto whitespace-nowrap leading-none mt-0.5 sm:mt-0 ${r.badgeClass}`}
                          >
                            {r.team}
                          </span>
                        </div>
                      </div>

                      {/* Right: Quantity Selector - Always fully visible and touch-friendly on mobile */}
                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 bg-zinc-950 p-1 rounded-lg border border-zinc-800 shadow-inner">
                        <button
                          type="button"
                          onClick={() => updateRoleCount(r.role, -1)}
                          disabled={count <= (r.role === 'WEREWOLF' ? 1 : 0)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 disabled:opacity-20 text-zinc-200 flex items-center justify-center transition cursor-pointer"
                          title="Decrease count"
                          aria-label={`Decrease ${r.name} count`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span
                          className={`w-5 sm:w-6 text-center text-xs sm:text-sm font-mono font-bold select-none ${
                            count > 0 ? 'text-purple-300' : 'text-zinc-600'
                          }`}
                        >
                          {count}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateRoleCount(r.role, 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-200 flex items-center justify-center transition cursor-pointer"
                          title="Increase count"
                          aria-label={`Increase ${r.name} count`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Full-width Description Row */}
                    <p className="text-[11px] sm:text-xs text-zinc-400 mt-2 pl-7 sm:pl-9 leading-relaxed">
                      {r.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Game Rules & Bot Auto Populate Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/40 text-purple-200 text-xs cursor-pointer hover:bg-purple-950/50 transition">
              <input
                id="create-auto-populate-bots"
                type="checkbox"
                checked={autoPopulateBots}
                onChange={(e) => setAutoPopulateBots(e.target.checked)}
                className="rounded text-purple-600 focus:ring-0"
              />
              <span className="font-medium">Populate with AI Villagers if short on players (Instant Solo/Group Play)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs cursor-pointer hover:border-zinc-700 transition">
              <input
                id="create-reveal-role-on-death"
                type="checkbox"
                checked={revealRoleOnDeath}
                onChange={(e) => setRevealRoleOnDeath(e.target.checked)}
                className="rounded text-purple-600 focus:ring-0"
              />
              <span>Reveal True Role in Announcement When a Player is Slain</span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-sm transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-create-room-btn"
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-purple-900/40 font-cinzel cursor-pointer min-h-[44px]"
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
