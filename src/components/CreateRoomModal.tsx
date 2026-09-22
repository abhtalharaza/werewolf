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
      id="create-room-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="create-room-modal-content"
        className="relative w-full max-w-2xl grass-glass-modal grass-glass rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl text-slate-800 dark:text-slate-100 my-2 sm:my-8 max-h-[94vh] overflow-y-auto border border-white/80 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="close-create-room-modal"
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 sm:mb-6 border-b border-indigo-100 dark:border-white/10 pb-3 sm:pb-4 pr-10">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-white/10 border border-indigo-200 dark:border-white/15 text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            <Sliders className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-slate-900 dark:text-white tracking-wide">
              Establish Village Sanctum
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Configure room parameters and select secret roles assigned to players.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Room Name & Host Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                Village / Room Name
              </label>
              <input
                id="create-room-name-input"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={24}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-[#0c0b12] border border-indigo-200/80 dark:border-white/15 focus:border-indigo-400 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base sm:text-sm transition min-h-[44px] focus:ring-1 focus:ring-indigo-400/50 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                Your Host Name
              </label>
              <input
                id="create-host-name-input"
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                maxLength={18}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-[#0c0b12] border border-indigo-200/80 dark:border-white/15 focus:border-indigo-400 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-base sm:text-sm transition min-h-[44px] focus:ring-1 focus:ring-indigo-400/50 shadow-xs"
              />
            </div>
          </div>

          {/* Player Capacity & Timers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-3xl bg-white/60 dark:bg-[#12111a] border border-indigo-100 dark:border-white/10 shadow-xs">
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider font-mono">Max Village Capacity</span>
                <span className="text-indigo-700 dark:text-indigo-400 font-bold text-sm font-mono">{maxPlayers} Players</span>
              </div>
              <input
                id="create-max-players-slider"
                type="range"
                min="4"
                max="16"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                <span>4 Min</span>
                <span>16 Max</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider font-mono">Discussion Phase</span>
                <span className="text-indigo-700 dark:text-indigo-400 font-bold text-sm font-mono">{discussionTime}s</span>
              </div>
              <input
                id="create-discussion-time-slider"
                type="range"
                min="20"
                max="90"
                step="5"
                value={discussionTime}
                onChange={(e) => setDiscussionTime(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                <span>20s Rapid</span>
                <span>90s Extended</span>
              </div>
            </div>
          </div>

          {/* ROLES SELECTION HEADER & PRESETS */}
          <div className="border border-indigo-100 dark:border-white/10 bg-white/60 dark:bg-[#12111a] rounded-3xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-indigo-100 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold font-cinzel text-slate-900 dark:text-white uppercase tracking-wider">
                    Game Roles & Player Assignment
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Choose which roles will be dealt out to players.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-white/15 font-mono font-bold shadow-xs">
                  {totalDeckCount} Roles Selected
                </span>
              </div>
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
                    className={`p-2.5 sm:p-3 rounded-2xl border transition backdrop-blur-md ${
                      isIncluded
                        ? 'bg-white/90 dark:bg-[#161424] border-indigo-200 dark:border-white/10 shadow-xs'
                        : 'bg-white/40 dark:bg-[#100f17]/40 border-slate-200 dark:border-white/5 text-slate-400 opacity-60'
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
                          className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center border transition ${
                            isIncluded
                              ? 'gradient-brand-btn text-white border-transparent'
                              : 'border-slate-300 dark:border-white/20 bg-white dark:bg-black text-transparent'
                          } ${r.role === 'WEREWOLF' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                          title={isIncluded ? 'Disable role' : 'Enable role'}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        {/* Role Icon */}
                        <div className={`p-1.5 sm:p-2 rounded-xl bg-indigo-50 dark:bg-white/10 border border-indigo-200 dark:border-white/15 ${r.color} shrink-0`}>
                          <IconComponent className="w-4 h-4" />
                        </div>

                        {/* Title & Team Badge */}
                        <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-cinzel truncate">
                            {r.name}
                          </span>
                          <span
                            className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-mono border self-start sm:self-auto whitespace-nowrap leading-none mt-0.5 sm:mt-0 ${r.badgeClass}`}
                          >
                            {r.team}
                          </span>
                        </div>
                      </div>

                      {/* Right: Quantity Selector */}
                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 bg-slate-50 dark:bg-[#0c0b12] p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-inner">
                        <button
                          type="button"
                          onClick={() => updateRoleCount(r.role, -1)}
                          disabled={count <= (r.role === 'WEREWOLF' ? 1 : 0)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-[#1a1828] hover:bg-indigo-50 dark:hover:bg-white/10 active:bg-indigo-100 disabled:opacity-20 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shadow-xs"
                          title="Decrease count"
                          aria-label={`Decrease ${r.name} count`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span
                          className={`w-5 sm:w-6 text-center text-xs sm:text-sm font-mono font-bold select-none ${
                            count > 0 ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'
                          }`}
                        >
                          {count}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateRoleCount(r.role, 1)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-[#1a1828] hover:bg-indigo-50 dark:hover:bg-white/10 active:bg-indigo-100 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shadow-xs"
                          title="Increase count"
                          aria-label={`Increase ${r.name} count`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Full-width Description Row */}
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-2 pl-7 sm:pl-9 leading-relaxed font-medium">
                      {r.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Game Rules & Bot Auto Populate Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/70 dark:bg-[#141220] border border-indigo-100 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs cursor-pointer hover:bg-white dark:hover:bg-[#181626] transition shadow-xs">
              <input
                id="create-auto-populate-bots"
                type="checkbox"
                checked={autoPopulateBots}
                onChange={(e) => setAutoPopulateBots(e.target.checked)}
                className="rounded accent-indigo-600 focus:ring-0"
              />
              <span className="font-medium">Populate with AI Villagers if short on players (Instant Solo/Group Play)</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-[#12111a] border border-indigo-100 dark:border-white/10 text-slate-600 dark:text-slate-400 text-xs cursor-pointer hover:bg-white dark:hover:bg-[#181626] transition shadow-xs">
              <input
                id="create-reveal-role-on-death"
                type="checkbox"
                checked={revealRoleOnDeath}
                onChange={(e) => setRevealRoleOnDeath(e.target.checked)}
                className="rounded accent-indigo-600 focus:ring-0"
              />
              <span className="font-medium">Reveal True Role in Announcement When a Player is Slain</span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-indigo-100 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[44px] rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition cursor-pointer flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              id="submit-create-room-btn"
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2.5 px-6 py-3 min-h-[48px] h-12 rounded-2xl grass-button gradient-brand-btn disabled:opacity-50 text-white font-bold text-sm tracking-wider font-cinzel transition shadow-md cursor-pointer select-none active:scale-98"
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>{loading ? 'Creating...' : 'Create & Enter Village'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
