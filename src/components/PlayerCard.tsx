import React from 'react';
import { Skull, Crown, Check, Crosshair, Shield, Eye, Moon, Heart, UserCheck } from 'lucide-react';
import { ClientPlayer, Role, GamePhase } from '../types/game.js';
import { getAvatar } from '../utils/avatars.js';

interface PlayerCardProps {
  player: ClientPlayer;
  isMe: boolean;
  phase: GamePhase;
  myRole?: Role;
  isSelectedTarget: boolean;
  cupidLoverOrder?: 1 | 2;
  isWerewolfTeammate: boolean;
  isLittleGirlSpottedWolf?: boolean;
  isLittleGirlSpottedTarget?: boolean;
  isGuardedByMe?: boolean;
  isDoppelgangerBound?: boolean;
  wolfVotesTargetingThisPlayer?: number;
  onSelect: (playerId: string) => void;
  canTarget: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isMe,
  phase,
  myRole,
  isSelectedTarget,
  cupidLoverOrder,
  isWerewolfTeammate,
  isLittleGirlSpottedWolf,
  isLittleGirlSpottedTarget,
  isGuardedByMe,
  isDoppelgangerBound,
  wolfVotesTargetingThisPlayer = 0,
  onSelect,
  canTarget,
}) => {
  const avatar = getAvatar(player.avatar);
  const isDead = !player.isAlive;
  const isVoting = phase === 'VOTING' || phase === 'VOTE_RESULT';
  const isSeerDivined = myRole === 'SEER' && !isMe && Boolean(player.role);

  const handleClick = () => {
    if (canTarget && !isDead) {
      onSelect(player.id);
    }
  };

  return (
    <div
      id={`player-card-${player.id}`}
      onClick={handleClick}
      className={`relative group flex flex-col items-center p-2 sm:p-3 rounded-2xl border transition-all duration-300 select-none w-full max-w-[150px] min-h-[115px] sm:min-h-[125px] justify-between ${
        isDead
          ? 'bg-zinc-950/40 border-zinc-900 opacity-40 grayscale pointer-events-none'
          : cupidLoverOrder
          ? 'bg-rose-950/60 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.45)] ring-2 ring-rose-400 scale-102 sm:scale-105'
          : isSelectedTarget
          ? 'bg-purple-950/50 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-102 sm:scale-105 ring-2 ring-purple-400'
          : isGuardedByMe
          ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/60'
          : isWerewolfTeammate
          ? 'bg-red-950/30 border-red-800/60 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
          : isSeerDivined
          ? player.role === 'WEREWOLF'
            ? 'bg-red-950/40 border-red-600/80 shadow-[0_0_16px_rgba(239,68,68,0.3)]'
            : 'bg-indigo-950/40 border-indigo-500/80 shadow-[0_0_16px_rgba(99,102,241,0.3)]'
          : isMe
          ? 'bg-zinc-900/80 border-purple-800/50'
          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
      } ${canTarget && !isDead ? 'cursor-pointer hover:scale-102 active:scale-95 hover:border-purple-500/80' : ''}`}
    >
      {/* Cupid Lover Target Indicator */}
      {cupidLoverOrder && (
        <div className="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full bg-rose-600 border border-rose-300 text-white text-[10px] font-bold flex items-center gap-1 shadow-lg z-20 animate-pulse">
          <Heart className="w-3 h-3 fill-white" />
          <span>{cupidLoverOrder === 1 ? '1st Lover' : '2nd Lover'}</span>
        </div>
      )}

      {/* Target Marker Overlay (for non-cupid selections) */}
      {!cupidLoverOrder && isSelectedTarget && (
        <div className="absolute -top-2 -right-2 p-1 rounded-full bg-purple-600 text-white shadow-lg animate-bounce z-20">
          <Crosshair className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Seer Divination Badge */}
      {isSeerDivined && !isDead && (
        <div
          className={`absolute -top-2 -right-2 p-1 rounded-full border text-white shadow-lg z-20 ${
            player.role === 'WEREWOLF'
              ? 'bg-red-900 border-red-500 text-red-200'
              : 'bg-indigo-900 border-indigo-400 text-indigo-200'
          }`}
          title={`Divined Role: ${player.role}`}
        >
          <Eye className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Werewolf Pack Marker */}
      {isWerewolfTeammate && !isDead && (
        <div
          className="absolute -top-2 -left-2 p-1 rounded-full bg-red-900 border border-red-600 text-red-300 shadow-lg z-20"
          title="Pack Teammate"
        >
          <Moon className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Little Girl Spotted Werewolf Badge */}
      {isLittleGirlSpottedWolf && !isDead && (
        <div
          className="absolute -top-2.5 -left-2.5 px-2 py-0.5 rounded-full bg-red-950 border border-red-500 text-red-200 text-[10px] font-bold flex items-center gap-1 shadow-xl z-20 animate-pulse"
          title="Little Girl spotted this player as a Werewolf!"
        >
          <Moon className="w-3 h-3 text-red-400 fill-red-400" />
          <span>Wolf</span>
        </div>
      )}

      {/* Little Girl Spotted Wolf Target Badge */}
      {isLittleGirlSpottedTarget && !isDead && (
        <div
          className="absolute -bottom-2 -left-2 px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500 text-amber-200 text-[10px] font-bold flex items-center gap-1 shadow-xl z-20 animate-bounce"
          title="Little Girl sees the wolves hunting this player!"
        >
          <Crosshair className="w-3 h-3 text-amber-400" />
          <span>Wolf Prey</span>
        </div>
      )}

      {/* Werewolf Night Pack Target Indicator (Visible only to Werewolves) */}
      {wolfVotesTargetingThisPlayer > 0 && !isDead && (
        <div
          className="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full bg-red-900 border border-red-500 text-red-100 text-[10px] font-mono font-bold flex items-center gap-1 shadow-xl z-20 animate-pulse"
          title={`${wolfVotesTargetingThisPlayer} werewolf vote(s) targeting this player tonight`}
        >
          <Moon className="w-3 h-3 text-red-400 fill-red-400" />
          <span>{wolfVotesTargetingThisPlayer} 🐺</span>
        </div>
      )}

      {/* Bodyguard Active Guarded Ally Badge (Visible only to Bodyguard) */}
      {isGuardedByMe && !isDead && (
        <div
          className="absolute -top-2.5 -left-2.5 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-200 text-[10px] font-bold flex items-center gap-1 shadow-xl z-20 animate-pulse"
          title="Guarded by your shield tonight!"
        >
          <Shield className="w-3 h-3 text-cyan-400 fill-cyan-400/40" />
          <span>Guarded</span>
        </div>
      )}

      {/* Doppelganger Bound Reflection Badge (Visible only to Doppelganger) */}
      {isDoppelgangerBound && !isDead && (
        <div
          className="absolute -top-2.5 -left-2.5 px-2 py-0.5 rounded-full bg-teal-950 border border-teal-400 text-teal-200 text-[10px] font-bold flex items-center gap-1 shadow-xl z-20 animate-pulse"
          title="Your soul reflection! You will inherit their role when they perish."
        >
          <UserCheck className="w-3 h-3 text-teal-300" />
          <span>Reflection</span>
        </div>
      )}

      {/* Avatar Orb */}
      <div className="relative mb-1 sm:mb-2">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-base sm:text-lg shadow-lg border-2 transition ${
            isDead
              ? 'border-zinc-800 bg-zinc-900 text-zinc-600'
              : isSelectedTarget
              ? 'border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
              : 'border-zinc-700'
          }`}
          style={{
            backgroundColor: isDead ? '#18181b' : avatar.color + '26',
            color: isDead ? '#71717a' : avatar.color,
          }}
        >
          {isDead ? (
            <Skull className="w-6 h-6 sm:w-7 sm:h-7 text-zinc-600" />
          ) : (
            player.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Host Crown */}
        {player.isHost && (
          <div className="absolute -bottom-1 -right-1 p-0.5 sm:p-1 rounded-full bg-zinc-900 border border-amber-600/60 shadow">
            <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-amber-400" />
          </div>
        )}

        {/* Voting Done Checkmark */}
        {isVoting && player.hasVoted && !isDead && (
          <div className="absolute -bottom-1 -left-1 p-0.5 rounded-full bg-emerald-900 border border-emerald-500 text-emerald-300 shadow">
            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </div>
        )}
      </div>

      {/* Player Name */}
      <div className="flex items-center gap-1 text-center w-full justify-center">
        <span
          className={`font-semibold text-xs md:text-sm truncate max-w-[75px] sm:max-w-[95px] md:max-w-[110px] ${
            isDead ? 'line-through text-zinc-600' : 'text-zinc-100'
          }`}
        >
          {player.name}
        </span>
        {isMe && (
          <span className="text-[8px] sm:text-[9px] px-1 rounded bg-purple-900/80 text-purple-200 font-mono">
            YOU
          </span>
        )}
      </div>

      {/* Persona Title / Revealed Role */}
      <div className="text-[9px] sm:text-[10px] text-zinc-400 mt-0.5 truncate max-w-[90px] sm:max-w-[120px] text-center">
        {player.role ? (
          <span
            className={`font-bold font-cinzel inline-flex items-center gap-0.5 sm:gap-1 ${
              player.role === 'WEREWOLF' ? 'text-red-400' : 'text-purple-300'
            }`}
          >
            {isSeerDivined && <Eye className="w-2.5 h-2.5 text-indigo-400" />}
            <span>{player.role}</span>
          </span>
        ) : isDead ? (
          <span className="text-zinc-600 italic">Slain</span>
        ) : (
          <span>{avatar.title}</span>
        )}
      </div>

      {/* Live Votes Received Badge */}
      {isVoting && (player.votesReceived || 0) > 0 && (
        <div className="mt-1 sm:mt-2 px-2 py-0.5 rounded-full bg-red-950/80 border border-red-800/80 text-red-300 text-[9px] sm:text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
          <span>{player.votesReceived} vote{(player.votesReceived || 0) > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};
