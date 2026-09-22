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
  isWitchHealedByMe?: boolean;
  isWitchPoisonedByMe?: boolean;
  isWolfVictimForWitch?: boolean;
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
  isWitchHealedByMe,
  isWitchPoisonedByMe,
  isWolfVictimForWitch,
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
      className={`relative group flex flex-col items-center p-2 sm:p-3 rounded-2xl border transition-all duration-300 select-none w-full max-w-[150px] min-h-[115px] sm:min-h-[125px] justify-between backdrop-blur-md ${
        isDead
          ? 'bg-slate-200/40 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 opacity-40 grayscale pointer-events-none'
          : cupidLoverOrder
          ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-400 dark:border-rose-500 shadow-[0_8px_20px_rgba(244,63,94,0.3)] ring-2 ring-rose-400 scale-102 sm:scale-105'
          : isWitchHealedByMe
          ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-500 shadow-[0_8px_20px_rgba(99,102,241,0.3)] ring-2 ring-indigo-400 scale-102 sm:scale-105'
          : isWitchPoisonedByMe
          ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-400 dark:border-rose-500 shadow-[0_8px_20px_rgba(244,63,94,0.3)] ring-2 ring-rose-400 scale-102 sm:scale-105'
          : isSelectedTarget
          ? 'bg-white/95 dark:bg-[#1a172c] border-indigo-500 dark:border-indigo-400 shadow-[0_12px_25px_-5px_rgba(99,102,241,0.4)] scale-102 sm:scale-105 ring-2 ring-indigo-400'
          : isGuardedByMe
          ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-400 dark:border-teal-500 shadow-[0_8px_20px_rgba(20,184,166,0.3)] ring-1 ring-teal-400/70'
          : isWerewolfTeammate
          ? 'bg-rose-50/80 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 shadow-md'
          : isSeerDivined
          ? player.role === 'WEREWOLF'
            ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-500 shadow-[0_8px_20px_rgba(244,63,94,0.3)]'
            : 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-400 shadow-[0_8px_20px_rgba(99,102,241,0.25)]'
          : isMe
          ? 'bg-white/80 dark:bg-[#161424] border-indigo-300 dark:border-indigo-500/50 shadow-md ring-1 ring-indigo-300/60 dark:ring-indigo-500/30'
          : isWolfVictimForWitch
          ? 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-400 shadow-[0_8px_20px_rgba(245,158,11,0.25)]'
          : 'glass-card-subtle dark:bg-[#111019] dark:border-white/10 hover:border-indigo-400/80 hover:bg-white/80 dark:hover:bg-[#181724] shadow-sm'
      } ${canTarget && !isDead ? 'cursor-pointer hover:scale-102 active:scale-95 hover:border-indigo-400' : ''}`}
    >
      {/* Cupid Lover Target Indicator */}
      {cupidLoverOrder && (
        <div className="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full bg-rose-500 border border-rose-300 text-white text-[10px] font-bold flex items-center gap-1 shadow-md z-20 animate-pulse">
          <Heart className="w-3 h-3 fill-white" />
          <span>{cupidLoverOrder === 1 ? '1st Lover' : '2nd Lover'}</span>
        </div>
      )}

      {/* Witch Healed Indicator */}
      {isWitchHealedByMe && !isDead && (
        <div
          className="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full bg-indigo-600 border border-indigo-300 text-white text-[10px] font-bold flex items-center gap-1 shadow-md z-20 animate-pulse"
          title="Protected by your Elixir of Life tonight!"
        >
          <span>✨ Elixir Saved</span>
        </div>
      )}

      {/* Witch Poisoned Indicator */}
      {isWitchPoisonedByMe && !isDead && (
        <div
          className="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full bg-rose-600 border border-rose-300 text-white text-[10px] font-bold flex items-center gap-1 shadow-md z-20 animate-pulse"
          title="Targeted with your Vial of Poison tonight!"
        >
          <Skull className="w-3 h-3 text-white" />
          <span>Poisoned</span>
        </div>
      )}

      {/* Wolf Victim indicator for Witch */}
      {isWolfVictimForWitch && !isDead && !isWitchHealedByMe && (
        <div
          className="absolute -top-2.5 -left-2.5 px-2 py-0.5 rounded-full bg-amber-500 border border-amber-300 text-white text-[10px] font-bold flex items-center gap-1 shadow-md z-20 animate-bounce"
          title="The werewolves attacked this player tonight! You can save them with the Elixir of Life."
        >
          <Crosshair className="w-3 h-3 text-white" />
          <span>Wolf Prey</span>
        </div>
      )}

      {/* Target Marker Overlay (for standard selections) */}
      {!cupidLoverOrder && !isWitchHealedByMe && !isWitchPoisonedByMe && isSelectedTarget && (
        <div className="absolute -top-2 -right-2 p-1 rounded-full gradient-brand-btn text-white shadow-lg animate-bounce z-20">
          <Crosshair className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Seer Divination Badge */}
      {isSeerDivined && !isDead && (
        <div
          className={`absolute -top-2 -right-2 p-1 rounded-full border text-white shadow-md z-20 ${
            player.role === 'WEREWOLF'
              ? 'bg-rose-600 border-rose-300 text-white'
              : 'bg-indigo-600 border-indigo-300 text-white'
          }`}
          title={`Divined Role: ${player.role}`}
        >
          <Eye className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Werewolf Pack Marker */}
      {isWerewolfTeammate && !isDead && (
        <div
          className="absolute -top-2 -left-2 p-1 rounded-full bg-rose-600 border border-rose-300 text-white shadow-md z-20"
          title="Pack Teammate"
        >
          <Moon className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Little Girl Spotted Werewolf Badge */}
      {isLittleGirlSpottedWolf && !isDead && (
        <div
          className="absolute -top-2.5 -left-2.5 px-2 py-0.5 rounded-full bg-rose-600 border border-rose-300 text-white text-[10px] font-bold flex items-center gap-1 shadow-md z-20 animate-pulse"
          title="Little Girl spotted this player as a Werewolf!"
        >
          <Moon className="w-3 h-3 text-white fill-white" />
          <span>Wolf</span>
        </div>
      )}

      {/* Little Girl Spotted Wolf Target Badge */}
      {isLittleGirlSpottedTarget && !isDead && (
        <div
          className="absolute -bottom-2 -left-2 px-2 py-0.5 rounded-full bg-amber-500 border border-amber-300 text-white text-[10px] font-bold flex items-center gap-1 shadow-md z-20 animate-bounce"
          title="Little Girl sees the wolves hunting this player!"
        >
          <Crosshair className="w-3 h-3 text-white" />
          <span>Wolf Prey</span>
        </div>
      )}

      {/* Werewolf Night Pack Target Indicator (Visible only to Werewolves) */}
      {wolfVotesTargetingThisPlayer > 0 && !isDead && (
        <div
          className="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full bg-rose-600 border border-rose-300 text-white text-[10px] font-mono font-bold flex items-center gap-1 shadow-md z-20 animate-pulse"
          title={`${wolfVotesTargetingThisPlayer} werewolf vote(s) targeting this player tonight`}
        >
          <Moon className="w-3 h-3 text-white fill-white" />
          <span>{wolfVotesTargetingThisPlayer} 🐺</span>
        </div>
      )}

      {/* Bodyguard Active Guarded Ally Badge (Visible only to Bodyguard) */}
      {isGuardedByMe && !isDead && (
        <div
          className="absolute -top-2.5 -left-2.5 px-2 py-0.5 rounded-full bg-teal-600 border border-teal-300 text-white text-[10px] font-bold flex items-center gap-1 shadow-md z-20 animate-pulse"
          title="Guarded by your shield tonight!"
        >
          <Shield className="w-3 h-3 text-white fill-white/40" />
          <span>Guarded</span>
        </div>
      )}

      {/* Doppelganger Bound Reflection Badge (Visible only to Doppelganger) */}
      {isDoppelgangerBound && !isDead && (
        <div
          className="absolute -top-2.5 -left-2.5 px-2 py-0.5 rounded-full bg-indigo-600 border border-indigo-300 text-white text-[10px] font-bold flex items-center gap-1 shadow-md z-20 animate-pulse"
          title="Your soul reflection! You will inherit their role when they perish."
        >
          <UserCheck className="w-3 h-3 text-white" />
          <span>Reflection</span>
        </div>
      )}

      {/* Seer Divination Alignment Badge (Visible to Seer) */}
      {isSeerDivined && !isMe && !isDead && (
        <div
          className={`absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono shadow-md z-20 flex items-center gap-1 animate-fade-in ${
            player.role === 'WEREWOLF'
              ? 'bg-rose-600 border-rose-300 text-white'
              : 'bg-indigo-600 border-indigo-300 text-white'
          }`}
          title={player.role === 'WEREWOLF' ? 'Divined: Werewolf' : 'Divined: Good Team'}
        >
          <Eye className="w-3 h-3" />
          <span>{player.role === 'WEREWOLF' ? 'Werewolf' : 'Good Team'}</span>
        </div>
      )}

      {/* Avatar Orb */}
      <div className="relative mb-1 sm:mb-2">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-base sm:text-lg shadow-md border-2 transition ${
            isDead
              ? 'border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              : isSelectedTarget
              ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
              : 'border-white/90 dark:border-white/20'
          }`}
          style={{
            backgroundColor: isDead ? undefined : avatar.color + '26',
            color: isDead ? undefined : avatar.color,
          }}
        >
          {isDead ? (
            <Skull className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400 dark:text-slate-500" />
          ) : (
            player.name.charAt(0).toUpperCase()
          )}
        </div>

        {/* Host Crown */}
        {player.isHost && (
          <div className="absolute -bottom-1 -right-1 p-0.5 sm:p-1 rounded-full bg-white dark:bg-slate-900 border border-amber-400 shadow-sm">
            <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 fill-amber-500" />
          </div>
        )}

        {/* Voting Done Checkmark */}
        {isVoting && player.hasVoted && !isDead && (
          <div className="absolute -bottom-1 -left-1 p-0.5 rounded-full bg-indigo-600 border border-white dark:border-slate-900 text-white shadow-sm">
            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </div>
        )}
      </div>

      {/* Player Name */}
      <div className="flex items-center gap-1 text-center w-full justify-center">
        <span
          className={`font-semibold text-xs md:text-sm truncate max-w-[75px] sm:max-w-[95px] md:max-w-[110px] ${
            isDead ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {player.name}
        </span>
        {isMe && (
          <span className="text-[8px] sm:text-[9px] px-1 rounded-md bg-indigo-600 text-white font-mono font-medium">
            YOU
          </span>
        )}
      </div>

      {/* Persona Title / Revealed Role */}
      <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[90px] sm:max-w-[120px] text-center font-medium">
        {player.role ? (
          <span
            className={`font-bold font-cinzel inline-flex items-center gap-0.5 sm:gap-1 ${
              player.role === 'WEREWOLF'
                ? 'text-rose-600'
                : isSeerDivined && !isMe
                ? 'text-indigo-600'
                : 'text-indigo-700'
            }`}
          >
            {isSeerDivined && <Eye className="w-2.5 h-2.5 text-indigo-600" />}
            <span>
              {isSeerDivined && !isMe
                ? player.role === 'WEREWOLF'
                  ? 'Werewolf'
                  : 'Good Team'
                : player.role}
            </span>
          </span>
        ) : isDead ? (
          <span className="text-slate-400 italic">Slain</span>
        ) : (
          <span>{avatar.title}</span>
        )}
      </div>

      {/* Live Votes Received Badge */}
      {isVoting && (player.votesReceived || 0) > 0 && (
        <div className="mt-1 sm:mt-2 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[9px] sm:text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
          <span>{player.votesReceived} vote{(player.votesReceived || 0) > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};
