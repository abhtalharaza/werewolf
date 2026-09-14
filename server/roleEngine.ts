import { Role, Team, GameSettings } from '../src/types/game.js';
import { ServerPlayer, ServerNightAction } from './types.js';

export function getRoleTeam(role: Role): Team {
  if (role === 'WEREWOLF' || role === 'WOLF_CUB') return 'WEREWOLVES';
  if (role === 'JESTER') return 'JESTER';
  if (role === 'WHITE_WOLF') return 'WHITE_WOLF';
  return 'VILLAGERS';
}

export function assignRoles(playerCount: number, customDistribution?: Record<Role, number>): Role[] {
  // If custom distribution is specified, faithfully allocate requested roles
  if (customDistribution) {
    const pool: Role[] = [];
    for (const [roleKey, count] of Object.entries(customDistribution)) {
      const role = roleKey as Role;
      for (let i = 0; i < count; i++) {
        pool.push(role);
      }
    }

    if (pool.length > 0) {
      // Guarantee at least 1 Werewolf or Wolf-team is present so the game functions
      const hasWolf = pool.some((r) => r === 'WEREWOLF' || r === 'WOLF_CUB' || r === 'WHITE_WOLF');
      if (!hasWolf) {
        pool.unshift('WEREWOLF');
      }

      // If pool matches player count exactly, distribute directly
      if (pool.length === playerCount) {
        return shuffleArray(pool);
      }

      // If pool is larger than playerCount, prioritize wolves then active specials
      if (pool.length > playerCount) {
        const wolves = pool.filter((r) => r === 'WEREWOLF' || r === 'WOLF_CUB' || r === 'WHITE_WOLF');
        const specials = pool.filter(
          (r) => r !== 'WEREWOLF' && r !== 'WOLF_CUB' && r !== 'WHITE_WOLF' && r !== 'VILLAGER'
        );
        const villagers = pool.filter((r) => r === 'VILLAGER');

        const maxWolves = Math.max(1, Math.min(wolves.length, Math.floor(playerCount / 3)));
        const selected: Role[] = [];

        for (let i = 0; i < maxWolves; i++) {
          selected.push(wolves[i] || 'WEREWOLF');
        }

        // Add special roles chosen by the host
        for (const spec of specials) {
          if (selected.length < playerCount) {
            selected.push(spec);
          }
        }

        // Add villagers if slots remain
        for (const v of villagers) {
          if (selected.length < playerCount) {
            selected.push(v);
          }
        }

        while (selected.length < playerCount) {
          selected.push('VILLAGER');
        }

        return shuffleArray(selected.slice(0, playerCount));
      }

      // If pool is smaller than playerCount, allocate all pool roles and pad with Villagers
      const selected = [...pool];
      if (
        playerCount >= 6 &&
        selected.filter((r) => r === 'WEREWOLF').length < 2 &&
        (customDistribution.WEREWOLF ?? 1) >= 2
      ) {
        selected.push('WEREWOLF');
      }

      while (selected.length < playerCount) {
        selected.push('VILLAGER');
      }

      return shuffleArray(selected.slice(0, playerCount));
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
  if (playerCount >= 6) roles.push('HUNTER');
  if (playerCount >= 7) roles.push('WITCH');
  if (playerCount >= 8) roles.push('BODYGUARD');
  if (playerCount >= 9) roles.push('CUPID');
  if (playerCount >= 10) roles.push('MAYOR');

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
  killedPlayerIds: {
    id: string;
    reason: 'WEREWOLF' | 'POISON' | 'WHITE_WOLF' | 'LITTLE_GIRL_CAUGHT' | 'HEARTBREAK';
  }[];
  savedPlayerIds: string[];
  transformedPlayerIds: { id: string; newRole: Role; newTeam: Team }[];
  seerReport?: { seerId: string; targetId: string; isWerewolf: boolean; role: Role };
}

export function resolveNightActions(
  actions: ServerNightAction[],
  players: ServerPlayer[],
  options?: {
    enragedWolves?: boolean;
    lovers?: [string, string] | null;
    caughtLittleGirlId?: string | null;
  }
): NightResolutionResult {
  const protectedTargets = new Set<string>();
  const wolfTargetVotes: Record<string, number> = {};
  let witchHealTarget: string | null = null;
  let witchPoisonTarget: string | null = null;
  let whiteWolfKillTarget: string | null = null;
  let seerReport: { seerId: string; targetId: string; isWerewolf: boolean; role: Role } | undefined;

  // 1. Defenses: Doctor and Bodyguard
  for (const action of actions) {
    if (action.type === 'PROTECT' || action.type === 'GUARD') {
      protectedTargets.add(action.targetId);
    }
  }

  // 2. Gather Werewolf votes
  for (const action of actions) {
    if (action.type === 'KILL') {
      wolfTargetVotes[action.targetId] = (wolfTargetVotes[action.targetId] || 0) + 1;
    } else if (action.type === 'WHITE_WOLF_KILL') {
      whiteWolfKillTarget = action.targetId;
    }
  }

  // Tally Werewolf victims (sorted by vote count)
  const sortedWolfTargets = Object.entries(wolfTargetVotes)
    .sort((a, b) => b[1] - a[1])
    .map(([targetId]) => targetId);

  // If wolves are enraged (Wolf Cub died by day vote), attack up to 2 victims!
  const killTargetsCount = options?.enragedWolves ? 2 : 1;
  const chosenWolfVictimIds = sortedWolfTargets.slice(0, killTargetsCount);

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
        // LYCAN rule: Appears as Werewolf to Seer even though innocent!
        const appearsAsWolf =
          target.role === 'WEREWOLF' ||
          target.role === 'WOLF_CUB' ||
          target.role === 'WHITE_WOLF' ||
          target.role === 'LYCAN';

        seerReport = {
          seerId: action.actorId,
          targetId: target.id,
          isWerewolf: appearsAsWolf,
          role: target.role === 'LYCAN' ? 'WEREWOLF' : target.role,
        };
      }
    }
  }

  const killedPlayerIds: {
    id: string;
    reason: 'WEREWOLF' | 'POISON' | 'WHITE_WOLF' | 'LITTLE_GIRL_CAUGHT' | 'HEARTBREAK';
  }[] = [];
  const savedPlayerIds: string[] = [];
  const transformedPlayerIds: { id: string; newRole: Role; newTeam: Team }[] = [];

  // Resolve Werewolf attacks
  for (const victimId of chosenWolfVictimIds) {
    const isProtected = protectedTargets.has(victimId);
    const isSavedByWitch = witchHealTarget === victimId;

    if (isProtected || isSavedByWitch) {
      savedPlayerIds.push(victimId);
    } else {
      const targetPlayer = players.find((p) => p.id === victimId);
      // CURSED rule: If attacked by wolves, doesn't die; turns into a Werewolf!
      if (targetPlayer && targetPlayer.role === 'CURSED') {
        transformedPlayerIds.push({
          id: victimId,
          newRole: 'WEREWOLF',
          newTeam: 'WEREWOLVES',
        });
      } else {
        killedPlayerIds.push({ id: victimId, reason: 'WEREWOLF' });
      }
    }
  }

  // Resolve Witch poison (cannot be saved by doctor or bodyguard)
  if (witchPoisonTarget && !killedPlayerIds.some((k) => k.id === witchPoisonTarget)) {
    killedPlayerIds.push({ id: witchPoisonTarget, reason: 'POISON' });
  }

  // Resolve White Wolf alternate kill
  if (whiteWolfKillTarget && !killedPlayerIds.some((k) => k.id === whiteWolfKillTarget)) {
    // Only kills if not protected
    if (!protectedTargets.has(whiteWolfKillTarget) && witchHealTarget !== whiteWolfKillTarget) {
      killedPlayerIds.push({ id: whiteWolfKillTarget, reason: 'WHITE_WOLF' });
    } else {
      savedPlayerIds.push(whiteWolfKillTarget);
    }
  }

  // Resolve Little Girl caught in shadows
  if (options?.caughtLittleGirlId && !killedPlayerIds.some((k) => k.id === options.caughtLittleGirlId)) {
    killedPlayerIds.push({ id: options.caughtLittleGirlId, reason: 'LITTLE_GIRL_CAUGHT' });
  }

  // Resolve Lovers Heartbreak: If one lover is killed, the other perishes of grief
  if (options?.lovers) {
    const [lover1, lover2] = options.lovers;
    const isLover1Dead = killedPlayerIds.some((k) => k.id === lover1);
    const isLover2Dead = killedPlayerIds.some((k) => k.id === lover2);

    if (isLover1Dead && !isLover2Dead) {
      killedPlayerIds.push({ id: lover2, reason: 'HEARTBREAK' });
    } else if (isLover2Dead && !isLover1Dead) {
      killedPlayerIds.push({ id: lover1, reason: 'HEARTBREAK' });
    }
  }

  return {
    killedPlayerIds,
    savedPlayerIds,
    transformedPlayerIds,
    seerReport,
  };
}

export function checkWinCondition(players: ServerPlayer[]): {
  gameOver: boolean;
  winnerTeam: Team | null;
  reason: string;
} {
  const alivePlayers = players.filter((p) => p.isAlive);
  const aliveWolves = alivePlayers.filter(
    (p) => p.team === 'WEREWOLVES' || p.role === 'WEREWOLF' || p.role === 'WOLF_CUB'
  );
  const aliveWhiteWolf = alivePlayers.filter((p) => p.role === 'WHITE_WOLF');
  const aliveVillagers = alivePlayers.filter(
    (p) => p.team === 'VILLAGERS' && p.role !== 'WHITE_WOLF'
  );

  // White Wolf solo win condition: White wolf is alive and is the only player alive, or sole wolf remaining with no villagers
  if (aliveWhiteWolf.length > 0 && alivePlayers.length === 1) {
    return {
      gameOver: true,
      winnerTeam: 'WHITE_WOLF',
      reason: 'The White Wolf is the sole predator standing! White Wolf wins alone!',
    };
  }

  const allEvilWolves = aliveWolves.length + aliveWhiteWolf.length;

  // Villagers win if all wolves (including White Wolf and Wolf Cub) are vanquished
  if (allEvilWolves === 0) {
    return {
      gameOver: true,
      winnerTeam: 'VILLAGERS',
      reason: 'All werewolves have been vanquished! The village is safe once more.',
    };
  }

  // Werewolves win if wolves equal or outnumber the remaining villagers
  if (allEvilWolves >= aliveVillagers.length) {
    // If only white wolf remains among wolves
    if (aliveWolves.length === 0 && aliveWhiteWolf.length > 0 && aliveVillagers.length <= 1) {
      return {
        gameOver: true,
        winnerTeam: 'WHITE_WOLF',
        reason: 'The White Wolf outlasted the pack and devoured the last villager! White Wolf victory!',
      };
    }

    return {
      gameOver: true,
      winnerTeam: 'WEREWOLVES',
      reason: 'The werewolves equal or outnumber the villagers. The village has been devoured!',
    };
  }

  return {
    gameOver: false,
    winnerTeam: null,
    reason: '',
  };
}
