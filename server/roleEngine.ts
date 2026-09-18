import { Role, Team, GameSettings } from '../src/types/game.js';
import { ServerPlayer, ServerNightAction } from './types.js';

export function getRoleTeam(role: Role): Team {
  if (role === 'WEREWOLF' || role === 'WOLF_CUB' || role === 'MINION') return 'WEREWOLVES';
  if (role === 'JESTER') return 'JESTER';
  if (role === 'WHITE_WOLF') return 'WHITE_WOLF';
  if (role === 'SERIAL_KILLER') return 'SERIAL_KILLER';
  if (role === 'ARSONIST') return 'ARSONIST';
  if (role === 'AMNESIAC') return 'NEUTRAL';
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
    reason:
      | 'WEREWOLF'
      | 'POISON'
      | 'WHITE_WOLF'
      | 'LITTLE_GIRL_CAUGHT'
      | 'HEARTBREAK'
      | 'SERIAL_KILLER'
      | 'ARSONIST'
      | 'VETERAN_SHOT'
      | 'TOUGH_GUY_WOUND'
      | 'DICTATOR_SUICIDE';
  }[];
  savedPlayerIds: string[];
  transformedPlayerIds: { id: string; newRole: Role; newTeam: Team }[];
  seerReport?: { seerId: string; targetId: string; isWerewolf: boolean; role: Role };
  protections: {
    role: 'DOCTOR' | 'BODYGUARD' | 'WITCH' | 'ARSONIST_IMMUNITY';
    protectorId: string;
    targetId: string;
    targetName: string;
    wasAttackedAndSaved: boolean;
  }[];
  silencedPlayerId?: string | null;
  toughGuyWoundedId?: string | null;
  newDousedPlayerId?: string | null;
}

export function resolveNightActions(
  actions: ServerNightAction[],
  players: ServerPlayer[],
  options?: {
    enragedWolves?: boolean;
    lovers?: [string, string] | null;
    caughtLittleGirlId?: string | null;
    dousedPlayerIds?: string[];
  }
): NightResolutionResult {
  const protectedTargets = new Set<string>();
  const wolfTargetVotes: Record<string, number> = {};
  let witchHealTarget: string | null = null;
  let witchPoisonTarget: string | null = null;
  let whiteWolfKillTarget: string | null = null;
  let serialKillerKillTarget: string | null = null;
  let silencedPlayerId: string | null = null;
  let newDousedPlayerId: string | null = null;
  let arsonistIgnite = false;
  let toughGuyWoundedId: string | null = null;
  let seerReport: { seerId: string; targetId: string; isWerewolf: boolean; role: Role } | undefined;

  const killedPlayerIds: {
    id: string;
    reason:
      | 'WEREWOLF'
      | 'POISON'
      | 'WHITE_WOLF'
      | 'LITTLE_GIRL_CAUGHT'
      | 'HEARTBREAK'
      | 'SERIAL_KILLER'
      | 'ARSONIST'
      | 'VETERAN_SHOT'
      | 'TOUGH_GUY_WOUND'
      | 'DICTATOR_SUICIDE';
  }[] = [];
  const savedPlayerIds: string[] = [];
  const transformedPlayerIds: { id: string; newRole: Role; newTeam: Team }[] = [];
  const protections: {
    role: 'DOCTOR' | 'BODYGUARD' | 'WITCH' | 'ARSONIST_IMMUNITY';
    protectorId: string;
    targetId: string;
    targetName: string;
    wasAttackedAndSaved: boolean;
  }[] = [];

  // Identify Veterans on Alert
  const veteransOnAlert = new Set<string>();
  for (const action of actions) {
    if (action.type === 'VETERAN_ALERT') {
      veteransOnAlert.add(action.actorId);
    }
  }

  // 1. Defenses: Doctor and Bodyguard
  for (const action of actions) {
    if (action.type === 'PROTECT' || action.type === 'GUARD') {
      protectedTargets.add(action.targetId);
    }
  }

  // 2. Veteran retaliation: Anyone targeting a Veteran on alert gets shot!
  for (const action of actions) {
    if (action.actorId && action.targetId && action.actorId !== action.targetId) {
      if (veteransOnAlert.has(action.targetId)) {
        if (!killedPlayerIds.some((k) => k.id === action.actorId)) {
          killedPlayerIds.push({ id: action.actorId, reason: 'VETERAN_SHOT' });
        }
      }
    }
    if (action.secondaryTargetId && veteransOnAlert.has(action.secondaryTargetId)) {
      if (!killedPlayerIds.some((k) => k.id === action.actorId)) {
        killedPlayerIds.push({ id: action.actorId, reason: 'VETERAN_SHOT' });
      }
    }
  }

  // 3. Gather Werewolf votes and other killers
  for (const action of actions) {
    if (action.type === 'KILL') {
      wolfTargetVotes[action.targetId] = (wolfTargetVotes[action.targetId] || 0) + 1;
    } else if (action.type === 'WHITE_WOLF_KILL') {
      whiteWolfKillTarget = action.targetId;
    } else if (action.type === 'SERIAL_KILLER_KILL') {
      serialKillerKillTarget = action.targetId;
    } else if (action.type === 'SILENCE') {
      silencedPlayerId = action.targetId;
    } else if (action.type === 'ARSONIST_DOUSE') {
      newDousedPlayerId = action.targetId;
    } else if (action.type === 'ARSONIST_IGNITE') {
      arsonistIgnite = true;
    }
  }

  // Tally Werewolf victims (sorted by vote count)
  const sortedWolfTargets = Object.entries(wolfTargetVotes)
    .sort((a, b) => b[1] - a[1])
    .map(([targetId]) => targetId);

  const killTargetsCount = options?.enragedWolves ? 2 : 1;
  const chosenWolfVictimIds = sortedWolfTargets.slice(0, killTargetsCount);

  // 4. Witch actions
  for (const action of actions) {
    if (action.type === 'HEAL') {
      witchHealTarget = action.targetId;
    } else if (action.type === 'POISON') {
      witchPoisonTarget = action.targetId;
    }
  }

  // 5. Seer / Apprentice Seer investigation
  for (const action of actions) {
    if (action.type === 'INVESTIGATE') {
      const target = players.find((p) => p.id === action.targetId);
      if (target) {
        // Appears as Werewolf to Seer: Werewolf, Wolf Cub, White Wolf, or Lycan.
        // Minion and Arsonist appear as Good Team / not wolf!
        const appearsAsWolf =
          target.role === 'WEREWOLF' ||
          target.role === 'WOLF_CUB' ||
          target.role === 'WHITE_WOLF' ||
          target.role === 'LYCAN';

        seerReport = {
          seerId: action.actorId,
          targetId: target.id,
          isWerewolf: appearsAsWolf,
          role: appearsAsWolf ? ('WEREWOLF' as Role) : ('GOOD_TEAM' as Role),
        };
      }
    }
  }

  // Resolve Werewolf attacks
  for (const victimId of chosenWolfVictimIds) {
    const victimPlayer = players.find((p) => p.id === victimId);
    const isProtected = protectedTargets.has(victimId);
    const isSavedByWitch = witchHealTarget === victimId;
    const isVeteranAlert = veteransOnAlert.has(victimId);

    // Arsonist possesses permanent Night Immunity against Werewolves!
    if (victimPlayer && victimPlayer.role === 'ARSONIST') {
      savedPlayerIds.push(victimId);
      protections.push({
        role: 'ARSONIST_IMMUNITY',
        protectorId: victimId,
        targetId: victimId,
        targetName: victimPlayer.name,
        wasAttackedAndSaved: true,
      });
      continue;
    }

    if (isVeteranAlert) {
      savedPlayerIds.push(victimId);
      continue;
    }

    if (isProtected || isSavedByWitch) {
      savedPlayerIds.push(victimId);
    } else {
      // CURSED rule: If attacked by wolves, doesn't die; turns into a Werewolf!
      if (victimPlayer && victimPlayer.role === 'CURSED') {
        transformedPlayerIds.push({
          id: victimId,
          newRole: 'WEREWOLF',
          newTeam: 'WEREWOLVES',
        });
      } else if (victimPlayer && victimPlayer.role === 'TOUGH_GUY') {
        // Tough Guy survives the night! Suffers delayed wound.
        savedPlayerIds.push(victimId);
        toughGuyWoundedId = victimId;
      } else {
        killedPlayerIds.push({ id: victimId, reason: 'WEREWOLF' });
      }
    }
  }

  // Resolve Serial Killer
  if (serialKillerKillTarget && !killedPlayerIds.some((k) => k.id === serialKillerKillTarget)) {
    const skTargetPlayer = players.find((p) => p.id === serialKillerKillTarget);
    const isProtected = protectedTargets.has(serialKillerKillTarget);
    const isSavedByWitch = witchHealTarget === serialKillerKillTarget;
    const isVeteranAlert = veteransOnAlert.has(serialKillerKillTarget);
    const isArsonistImmune = skTargetPlayer && skTargetPlayer.role === 'ARSONIST';

    if (isVeteranAlert || isArsonistImmune) {
      savedPlayerIds.push(serialKillerKillTarget);
      if (isArsonistImmune && skTargetPlayer) {
        protections.push({
          role: 'ARSONIST_IMMUNITY',
          protectorId: serialKillerKillTarget,
          targetId: serialKillerKillTarget,
          targetName: skTargetPlayer.name,
          wasAttackedAndSaved: true,
        });
      }
    } else if (isProtected || isSavedByWitch) {
      savedPlayerIds.push(serialKillerKillTarget);
    } else {
      killedPlayerIds.push({ id: serialKillerKillTarget, reason: 'SERIAL_KILLER' });
    }
  }

  // Resolve Arsonist Ignition
  if (arsonistIgnite && options?.dousedPlayerIds) {
    for (const dousedId of options.dousedPlayerIds) {
      const dousedPlayer = players.find((p) => p.id === dousedId);
      if (dousedPlayer && dousedPlayer.isAlive && !killedPlayerIds.some((k) => k.id === dousedId)) {
        killedPlayerIds.push({ id: dousedId, reason: 'ARSONIST' });
      }
    }
  }

  // Resolve Witch poison (cannot be saved by doctor or bodyguard)
  if (witchPoisonTarget && !killedPlayerIds.some((k) => k.id === witchPoisonTarget)) {
    killedPlayerIds.push({ id: witchPoisonTarget, reason: 'POISON' });
  }

  // Resolve White Wolf alternate kill
  if (whiteWolfKillTarget && !killedPlayerIds.some((k) => k.id === whiteWolfKillTarget)) {
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

  // Resolve Lovers Heartbreak
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

  // Gather protections from Doctor, Bodyguard, and Witch
  for (const action of actions) {
    if (action.type === 'PROTECT') {
      const target = players.find((p) => p.id === action.targetId);
      if (target) {
        protections.push({
          role: 'DOCTOR',
          protectorId: action.actorId,
          targetId: target.id,
          targetName: target.name,
          wasAttackedAndSaved:
            chosenWolfVictimIds.includes(target.id) ||
            whiteWolfKillTarget === target.id ||
            serialKillerKillTarget === target.id,
        });
      }
    } else if (action.type === 'GUARD') {
      const target = players.find((p) => p.id === action.targetId);
      if (target) {
        protections.push({
          role: 'BODYGUARD',
          protectorId: action.actorId,
          targetId: target.id,
          targetName: target.name,
          wasAttackedAndSaved:
            chosenWolfVictimIds.includes(target.id) ||
            whiteWolfKillTarget === target.id ||
            serialKillerKillTarget === target.id,
        });
      }
    } else if (action.type === 'HEAL') {
      const target = players.find((p) => p.id === action.targetId);
      if (target) {
        protections.push({
          role: 'WITCH',
          protectorId: action.actorId,
          targetId: target.id,
          targetName: target.name,
          wasAttackedAndSaved:
            chosenWolfVictimIds.includes(target.id) ||
            whiteWolfKillTarget === target.id ||
            serialKillerKillTarget === target.id,
        });
      }
    }
  }

  return {
    killedPlayerIds,
    savedPlayerIds,
    transformedPlayerIds,
    seerReport,
    protections,
    silencedPlayerId,
    toughGuyWoundedId,
    newDousedPlayerId,
  };
}

export function checkWinCondition(players: ServerPlayer[]): {
  gameOver: boolean;
  winnerTeam: Team | null;
  reason: string;
} {
  const alivePlayers = players.filter((p) => p.isAlive);
  const aliveRegularWolves = alivePlayers.filter(
    (p) =>
      p.role === 'WEREWOLF' ||
      p.role === 'WOLF_CUB' ||
      (p.role === 'CURSED' && p.team === 'WEREWOLVES')
  );
  const aliveWhiteWolf = alivePlayers.filter((p) => p.role === 'WHITE_WOLF');
  const aliveSerialKiller = alivePlayers.filter((p) => p.role === 'SERIAL_KILLER');
  const aliveArsonist = alivePlayers.filter((p) => p.role === 'ARSONIST');
  const aliveVillagers = alivePlayers.filter(
    (p) =>
      p.team === 'VILLAGERS' &&
      p.role !== 'WHITE_WOLF' &&
      p.role !== 'SERIAL_KILLER' &&
      p.role !== 'ARSONIST'
  );
  const aliveNeutral = alivePlayers.filter((p) => p.team === 'NEUTRAL' || p.role === 'AMNESIAC');

  // 1. Arsonist Solo Win:
  if (aliveArsonist.length > 0) {
    if (alivePlayers.length === 1) {
      return {
        gameOver: true,
        winnerTeam: 'ARSONIST',
        reason: 'The Arsonist burned the entire village to ashes and stands alone in victory! Arsonist Wins!',
      };
    }
    // Arsonist has Night Immunity against Werewolves & Serial Killer.
    // In a 1v1 showdown (<= 2 players), day votes result in a tie and night attacks cannot kill the Arsonist.
    if (alivePlayers.length <= 2) {
      return {
        gameOver: true,
        winnerTeam: 'ARSONIST',
        reason: 'With unyielding Night Immunity, the Arsonist engulfed the remaining villagers in flames! Arsonist Wins!',
      };
    }
    if (
      aliveRegularWolves.length === 0 &&
      aliveWhiteWolf.length === 0 &&
      aliveSerialKiller.length === 0 &&
      aliveVillagers.length <= aliveArsonist.length
    ) {
      return {
        gameOver: true,
        winnerTeam: 'ARSONIST',
        reason: 'With unyielding Night Immunity, the Arsonist engulfed the remaining villagers in flames! Arsonist Wins!',
      };
    }
  }

  // 2. Serial Killer Solo Win:
  if (aliveSerialKiller.length > 0) {
    if (alivePlayers.length === 1) {
      return {
        gameOver: true,
        winnerTeam: 'SERIAL_KILLER',
        reason: 'The Serial Killer executed everyone in the village! The Serial Killer stands victorious alone!',
      };
    }
    if (
      aliveRegularWolves.length === 0 &&
      aliveWhiteWolf.length === 0 &&
      aliveArsonist.length === 0 &&
      alivePlayers.length <= 2
    ) {
      return {
        gameOver: true,
        winnerTeam: 'SERIAL_KILLER',
        reason: 'The Serial Killer cornered the final survivor and finished them off! Serial Killer Wins!',
      };
    }
  }

  // 3. White Wolf Solo Win:
  if (aliveWhiteWolf.length > 0) {
    if (alivePlayers.length === 1) {
      return {
        gameOver: true,
        winnerTeam: 'WHITE_WOLF',
        reason: 'The White Wolf is the sole survivor standing! All villagers and werewolves have fallen.',
      };
    }
    if (
      aliveRegularWolves.length === 0 &&
      aliveVillagers.length <= 1 &&
      aliveSerialKiller.length === 0 &&
      aliveArsonist.length === 0 &&
      alivePlayers.length <= 2
    ) {
      return {
        gameOver: true,
        winnerTeam: 'WHITE_WOLF',
        reason: 'The White Wolf outlasted the pack and eliminated all rivals! The White Wolf stands alone in victory!',
      };
    }
  }

  // 4. Villagers win if all predators, killers, and arsonists are vanquished:
  if (
    aliveRegularWolves.length === 0 &&
    aliveWhiteWolf.length === 0 &&
    aliveSerialKiller.length === 0 &&
    aliveArsonist.length === 0 &&
    aliveVillagers.length > 0
  ) {
    return {
      gameOver: true,
      winnerTeam: 'VILLAGERS',
      reason: 'All werewolves, killers, and nocturnal beasts have been vanquished! The village is saved.',
    };
  }

  // 5. If White Wolf, Serial Killer, or Arsonist is still lurking among living werewolves:
  if (
    (aliveWhiteWolf.length > 0 || aliveSerialKiller.length > 0 || aliveArsonist.length > 0) &&
    aliveRegularWolves.length > 0
  ) {
    return {
      gameOver: false,
      winnerTeam: null,
      reason: '',
    };
  }

  // 6. Regular Werewolves win:
  if (
    aliveWhiteWolf.length === 0 &&
    aliveSerialKiller.length === 0 &&
    aliveArsonist.length === 0 &&
    aliveRegularWolves.length > 0
  ) {
    if (
      (aliveVillagers.length === 0 && aliveNeutral.length === 0) ||
      aliveRegularWolves.length >= aliveVillagers.length + aliveNeutral.length
    ) {
      return {
        gameOver: true,
        winnerTeam: 'WEREWOLVES',
        reason: 'The werewolf pack has overpowered the remaining villagers. The village has fallen!',
      };
    }
  }

  return {
    gameOver: false,
    winnerTeam: null,
    reason: '',
  };
}
