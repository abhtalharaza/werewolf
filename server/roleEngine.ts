import { Role, Team, GameSettings } from '../src/types/game.js';
import { ServerPlayer, ServerNightAction } from './types.js';

export function getRoleTeam(role: Role): Team {
  return role === 'WEREWOLF' ? 'WEREWOLVES' : 'VILLAGERS';
}

export function assignRoles(playerCount: number, customDistribution?: Record<Role, number>): Role[] {
  // If custom distribution is specified and matches player count, use it
  if (customDistribution) {
    const list: Role[] = [];
    for (const [roleKey, count] of Object.entries(customDistribution)) {
      for (let i = 0; i < count; i++) {
        list.push(roleKey as Role);
      }
    }
    if (list.length === playerCount) {
      return shuffleArray(list);
    }
  }

  // Default balanced role distribution based on player count
  const roles: Role[] = [];

  // Werewolf count
  let wolfCount = 1;
  if (playerCount >= 6) wolfCount = 2;
  if (playerCount >= 10) wolfCount = 3;
  if (playerCount >= 14) wolfCount = 4;

  for (let i = 0; i < wolfCount; i++) {
    roles.push('WEREWOLF');
  }

  // Special roles based on player count
  if (playerCount >= 4) roles.push('SEER');
  if (playerCount >= 5) roles.push('DOCTOR');
  if (playerCount >= 7) roles.push('HUNTER');
  if (playerCount >= 8) roles.push('WITCH');
  if (playerCount >= 9) roles.push('BODYGUARD');

  // Fill remainder with Villagers
  while (roles.length < playerCount) {
    roles.push('VILLAGER');
  }

  return shuffleArray(roles);
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface NightResolutionResult {
  killedPlayerIds: { id: string; reason: 'WEREWOLF' | 'POISON' }[];
  savedPlayerIds: string[];
  seerReport?: { seerId: string; targetId: string; isWerewolf: boolean; role: Role };
}

export function resolveNightActions(
  actions: ServerNightAction[],
  players: ServerPlayer[]
): NightResolutionResult {
  const protectedTargets = new Set<string>();
  const wolfTargetVotes: Record<string, number> = {};
  let witchHealTarget: string | null = null;
  let witchPoisonTarget: string | null = null;
  let seerReport: { seerId: string; targetId: string; isWerewolf: boolean; role: Role } | undefined;

  // 1. Gather defenses: Doctor and Bodyguard
  for (const action of actions) {
    if (action.type === 'PROTECT' || action.type === 'GUARD') {
      protectedTargets.add(action.targetId);
    }
  }

  // 2. Gather Werewolf votes
  for (const action of actions) {
    if (action.type === 'KILL') {
      wolfTargetVotes[action.targetId] = (wolfTargetVotes[action.targetId] || 0) + 1;
    }
  }

  // Find most-voted Werewolf victim
  let wolfVictimId: string | null = null;
  let maxVotes = 0;
  for (const [targetId, votes] of Object.entries(wolfTargetVotes)) {
    if (votes > maxVotes) {
      maxVotes = votes;
      wolfVictimId = targetId;
    }
  }

  // 3. Witch actions
  for (const action of actions) {
    if (action.type === 'HEAL') {
      witchHealTarget = action.targetId;
    } else if (action.type === 'POISON') {
      witchPoisonTarget = action.targetId;
    }
  }

  // 4. Seer investigation
  for (const action of actions) {
    if (action.type === 'INVESTIGATE') {
      const target = players.find((p) => p.id === action.targetId);
      if (target) {
        seerReport = {
          seerId: action.actorId,
          targetId: target.id,
          isWerewolf: target.role === 'WEREWOLF',
          role: target.role,
        };
      }
    }
  }

  const killedPlayerIds: { id: string; reason: 'WEREWOLF' | 'POISON' }[] = [];
  const savedPlayerIds: string[] = [];

  // Resolve Werewolf attack
  if (wolfVictimId) {
    const isProtected = protectedTargets.has(wolfVictimId);
    const isSavedByWitch = witchHealTarget === wolfVictimId;

    if (isProtected || isSavedByWitch) {
      savedPlayerIds.push(wolfVictimId);
    } else {
      killedPlayerIds.push({ id: wolfVictimId, reason: 'WEREWOLF' });
    }
  }

  // Resolve Witch poison (cannot be saved by doctor or bodyguard)
  if (witchPoisonTarget && !killedPlayerIds.some((k) => k.id === witchPoisonTarget)) {
    killedPlayerIds.push({ id: witchPoisonTarget, reason: 'POISON' });
  }

  return {
    killedPlayerIds,
    savedPlayerIds,
    seerReport,
  };
}

export function checkWinCondition(players: ServerPlayer[]): {
  gameOver: boolean;
  winnerTeam: Team | null;
  reason: string;
} {
  const alivePlayers = players.filter((p) => p.isAlive);
  const aliveWolves = alivePlayers.filter((p) => p.role === 'WEREWOLF');
  const aliveVillagers = alivePlayers.filter((p) => p.role !== 'WEREWOLF');

  if (aliveWolves.length === 0) {
    return {
      gameOver: true,
      winnerTeam: 'VILLAGERS',
      reason: 'All werewolves have been eliminated! The village is safe once more.',
    };
  }

  if (aliveWolves.length >= aliveVillagers.length) {
    return {
      gameOver: true,
      winnerTeam: 'WEREWOLVES',
      reason: 'The werewolves equal or outnumber the remaining villagers. The village falls to darkness!',
    };
  }

  return {
    gameOver: false,
    winnerTeam: null,
    reason: '',
  };
}
