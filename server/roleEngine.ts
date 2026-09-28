import crypto from 'crypto';
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

/**
 * Cryptographically secure Fisher-Yates array shuffle.
 * Uses Node's crypto.randomInt to avoid PRNG bias and clustering.
 */
export function cryptoShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds the initial raw role pool of exact size playerCount
 * adhering faithfully to host preferences or default village balance.
 */
export function buildRolePool(playerCount: number, customDistribution?: Record<Role, number>): Role[] {
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

      // If pool matches player count exactly
      if (pool.length === playerCount) {
        return pool;
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

        return selected.slice(0, playerCount);
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

      return selected.slice(0, playerCount);
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

  return roles;
}

/**
 * Solves derangement with randomized backtracking to strictly ensure
 * no player gets their previous role, while exploring search space in random order.
 */
function solveDerangementWithBacktracking(
  pool: Role[],
  previousRoles: (Role | undefined)[]
): Role[] | null {
  const n = pool.length;
  const shuffledPool = cryptoShuffle(pool);
  const used = new Array(n).fill(false);
  const result: Role[] = new Array(n);
  const playerOrder = cryptoShuffle(Array.from({ length: n }, (_, i) => i));

  function search(orderIdx: number): boolean {
    if (orderIdx === n) return true;
    const pIdx = playerOrder[orderIdx];
    const prev = previousRoles[pIdx];

    const roleIndices = cryptoShuffle(Array.from({ length: n }, (_, i) => i));
    for (const rIdx of roleIndices) {
      if (!used[rIdx]) {
        const role = shuffledPool[rIdx];
        if (!prev || role !== prev) {
          used[rIdx] = true;
          result[pIdx] = role;
          if (search(orderIdx + 1)) return true;
          used[rIdx] = false;
        }
      }
    }
    return false;
  }

  return search(0) ? result : null;
}

/**
 * Assigns roles strictly randomized so that NO player repeatedly receives the same role.
 * - Guaranteed non-repeating (derangement): assignedRole !== previousRole for all players.
 * - Uniformly randomized across all valid derangements with Node's crypto.randomInt.
 * - Maximizes role variety over consecutive games using recentHistories.
 */
export function assignStrictRandomRoles(
  playerCount: number,
  customDistribution?: Record<Role, number>,
  previousRoles?: (Role | undefined)[],
  recentHistories?: Role[][]
): Role[] {
  const rawPool = buildRolePool(playerCount, customDistribution);

  // If first game or no previous role history available, pure crypto shuffle!
  if (!previousRoles || previousRoles.length !== playerCount || previousRoles.every((r) => !r)) {
    return cryptoShuffle(rawPool);
  }

  let bestCandidate: Role[] = [];
  let minRepeats = Infinity;
  let minRecentRepeats = Infinity;

  // 1. Monte Carlo attempts with cryptographically secure random shuffling
  for (let attempt = 0; attempt < 500; attempt++) {
    const candidate = cryptoShuffle(rawPool);
    let directRepeats = 0;
    let recentRepeats = 0;

    for (let i = 0; i < playerCount; i++) {
      const prev = previousRoles[i];
      if (prev && candidate[i] === prev) {
        directRepeats++;
      }
      if (recentHistories && recentHistories[i]) {
        const hist = recentHistories[i];
        if (hist.length >= 2 && hist[hist.length - 2] === candidate[i]) {
          recentRepeats++;
        }
      }
    }

    if (directRepeats < minRepeats || (directRepeats === minRepeats && recentRepeats < minRecentRepeats)) {
      minRepeats = directRepeats;
      minRecentRepeats = recentRepeats;
      bestCandidate = candidate;
    }

    // Found a derangement where NO ONE repeats their previous role, and no recent repeats
    if (directRepeats === 0 && recentRepeats === 0) {
      return candidate;
    }
    // Found zero direct repeats after reasonable attempts
    if (directRepeats === 0 && attempt > 50) {
      return candidate;
    }
  }

  if (minRepeats === 0 && bestCandidate.length === playerCount) {
    return bestCandidate;
  }

  // 2. Randomized Backtracking Constraint Solver:
  // Guarantees finding a 0-repeat assignment if one mathematically exists
  const solved = solveDerangementWithBacktracking(rawPool, previousRoles);
  if (solved) {
    return solved;
  }

  // 3. Fallback: if mathematically impossible to have 0 repeats (e.g. pool is 100% same role),
  // return best candidate with minimal repeats
  return bestCandidate.length === playerCount ? bestCandidate : cryptoShuffle(rawPool);
}

export function assignRoles(
  playerCount: number,
  customDistribution?: Record<Role, number>,
  previousRoles?: (Role | undefined)[],
  recentHistories?: Role[][]
): Role[] {
  return assignStrictRandomRoles(playerCount, customDistribution, previousRoles, recentHistories);
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
      | 'DICTATOR_SUICIDE'
      | 'BODYGUARD_SACRIFICE'
      | 'JAILOR';
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
  jailorGuiltyTriggered?: boolean;
  jailorExecutedPlayerId?: string | null;
  transporterSwappedPairs?: [string, string][];
}

export function resolveNightActions(
  actions: ServerNightAction[],
  players: ServerPlayer[],
  options?: {
    enragedWolves?: boolean;
    lovers?: [string, string] | null;
    caughtLittleGirlId?: string | null;
    dousedPlayerIds?: string[];
    jailedPlayerId?: string | null;
    jailorExecuting?: boolean;
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
  let jailorGuiltyTriggered = false;
  let jailorExecutedPlayerId: string | null = null;

  // Core Mechanic 1: Role Block (Silence)
  // The Jailed player cannot use any of their night abilities (e.g., Doctor cannot heal, Werewolf cannot attack).
  const effectiveActions = options?.jailedPlayerId
    ? actions.filter((a) => a.actorId !== options.jailedPlayerId)
    : actions;

  // --- Transporter Swap & Action Redirection Engine (Highest Priority) ---
  // The Transporter selects exactly Two (2) distinct living players (can include themselves).
  // Any night action (Kill, Heal, Investigate, Protect, Poison, etc.) directed at Target A
  // automatically redirects and resolves on Target B, and vice versa.
  // Execution Priority: The swap is calculated and locked before ANY other actions are processed!
  // Jailor Interaction: If Transporter is in Jail, their action was filtered out above.
  // If Transporter tries to swap someone in Jail, the swap fails for the jailed player.
  const transporterSwappedPairs: [string, string][] = [];
  const redirectMap = new Map<string, string>();

  const transportActions = effectiveActions.filter((a) => a.type === 'TRANSPORT');
  for (const transportAction of transportActions) {
    const actor = players.find((p) => p.id === transportAction.actorId);
    if (!actor || !actor.isAlive) continue;

    const targetAId = transportAction.targetId;
    const targetBId = transportAction.secondaryTargetId;

    if (!targetAId || !targetBId || targetAId === targetBId) continue;

    const targetAPlayer = players.find((p) => p.id === targetAId && p.isAlive);
    const targetBPlayer = players.find((p) => p.id === targetBId && p.isAlive);
    if (!targetAPlayer || !targetBPlayer) continue;

    // If either target is jailed, the swap fails for the jailed player
    if (options?.jailedPlayerId) {
      if (targetAId === options.jailedPlayerId || targetBId === options.jailedPlayerId) {
        continue;
      }
    }

    transporterSwappedPairs.push([targetAId, targetBId]);
    redirectMap.set(targetAId, targetBId);
    redirectMap.set(targetBId, targetAId);
  }

  // Redirection: Rewrite the target IDs of all nocturnal actions before resolution
  const redirectedActions = effectiveActions.map((action) => {
    if (action.type === 'TRANSPORT' || action.type === 'PASS_TRANSPORT') {
      return action;
    }
    const newTargetId = action.targetId && redirectMap.has(action.targetId)
      ? redirectMap.get(action.targetId)!
      : action.targetId;

    const newSecondaryTargetId = action.secondaryTargetId && redirectMap.has(action.secondaryTargetId)
      ? redirectMap.get(action.secondaryTargetId)!
      : action.secondaryTargetId;

    return {
      ...action,
      targetId: newTargetId,
      secondaryTargetId: newSecondaryTargetId,
    };
  });

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
      | 'DICTATOR_SUICIDE'
      | 'BODYGUARD_SACRIFICE'
      | 'JAILOR';
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

  // Identify Veterans on Alert (jailed players cannot alert)
  const veteransOnAlert = new Set<string>();
  for (const action of redirectedActions) {
    if (action.type === 'VETERAN_ALERT') {
      if (!options?.jailedPlayerId || action.actorId !== options.jailedPlayerId) {
        veteransOnAlert.add(action.actorId);
      }
    }
  }

  // 1. Defenses: Doctor and Bodyguard
  for (const action of redirectedActions) {
    if (action.type === 'PROTECT' || action.type === 'GUARD') {
      protectedTargets.add(action.targetId);
    }
  }

  // 2. Veteran retaliation: Anyone targeting a Veteran on alert gets shot!
  for (const action of redirectedActions) {
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
  for (const action of redirectedActions) {
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
  for (const action of redirectedActions) {
    if (action.type === 'HEAL') {
      witchHealTarget = action.targetId;
    } else if (action.type === 'POISON') {
      witchPoisonTarget = action.targetId;
    }
  }

  // 5. Seer / Apprentice Seer investigation
  for (const action of redirectedActions) {
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

        // The Seer's UI shows their chosen target, but alignment resolves to the redirected target!
        const originalAction = effectiveActions.find(
          (a) => a.actorId === action.actorId && a.type === 'INVESTIGATE'
        );
        const intendedTargetId = originalAction?.targetId || target.id;

        seerReport = {
          seerId: action.actorId,
          targetId: intendedTargetId,
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

    // Absolute Protection (Invulnerability): Jailed player cannot be targeted or affected by outside actions (attacks fail silently)
    if (options?.jailedPlayerId && victimId === options.jailedPlayerId) {
      savedPlayerIds.push(victimId);
      continue;
    }

    // Arsonist possesses permanent Night Immunity against Werewolves!
    if (victimPlayer && victimPlayer.role === 'ARSONIST') {
      savedPlayerIds.push(victimId);
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

    // Absolute Protection for Jailed Player
    if (options?.jailedPlayerId && serialKillerKillTarget === options.jailedPlayerId) {
      savedPlayerIds.push(serialKillerKillTarget);
    } else if (isVeteranAlert || isArsonistImmune) {
      savedPlayerIds.push(serialKillerKillTarget);
    } else if (isProtected || isSavedByWitch) {
      savedPlayerIds.push(serialKillerKillTarget);
    } else {
      killedPlayerIds.push({ id: serialKillerKillTarget, reason: 'SERIAL_KILLER' });
    }
  }

  // Resolve Arsonist Ignition
  if (arsonistIgnite && options?.dousedPlayerIds) {
    for (const dousedId of options.dousedPlayerIds) {
      // Absolute Protection: Jailed player cannot be ignited inside jail
      if (options?.jailedPlayerId && dousedId === options.jailedPlayerId) {
        continue;
      }
      const dousedPlayer = players.find((p) => p.id === dousedId);
      if (dousedPlayer && dousedPlayer.isAlive && !killedPlayerIds.some((k) => k.id === dousedId)) {
        killedPlayerIds.push({ id: dousedId, reason: 'ARSONIST' });
      }
    }
  }

  // Resolve Witch poison (cannot be saved by doctor or bodyguard; fails silently on jailed player)
  if (witchPoisonTarget && !killedPlayerIds.some((k) => k.id === witchPoisonTarget)) {
    if (!options?.jailedPlayerId || witchPoisonTarget !== options.jailedPlayerId) {
      killedPlayerIds.push({ id: witchPoisonTarget, reason: 'POISON' });
    }
  }

  // Resolve White Wolf alternate kill
  if (whiteWolfKillTarget && !killedPlayerIds.some((k) => k.id === whiteWolfKillTarget)) {
    if (options?.jailedPlayerId && whiteWolfKillTarget === options.jailedPlayerId) {
      savedPlayerIds.push(whiteWolfKillTarget);
    } else if (!protectedTargets.has(whiteWolfKillTarget) && witchHealTarget !== whiteWolfKillTarget) {
      killedPlayerIds.push({ id: whiteWolfKillTarget, reason: 'WHITE_WOLF' });
    } else {
      savedPlayerIds.push(whiteWolfKillTarget);
    }
  }

  // Resolve Little Girl caught in shadows
  if (options?.caughtLittleGirlId && !killedPlayerIds.some((k) => k.id === options.caughtLittleGirlId)) {
    killedPlayerIds.push({ id: options.caughtLittleGirlId, reason: 'LITTLE_GIRL_CAUGHT' });
  }

  // Resolve Bodyguard sacrifice:
  for (const action of redirectedActions) {
    if (action.type === 'GUARD') {
      const wasGuardedTargetAttacked =
        chosenWolfVictimIds.includes(action.targetId) ||
        whiteWolfKillTarget === action.targetId ||
        serialKillerKillTarget === action.targetId;

      if (wasGuardedTargetAttacked) {
        if (!killedPlayerIds.some((k) => k.id === action.actorId)) {
          killedPlayerIds.push({ id: action.actorId, reason: 'BODYGUARD_SACRIFICE' });
        }
      }
    }
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
  for (const action of redirectedActions) {
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

  // Core Mechanic 2: Jailor Interrogation & Execution
  // If the Jailor chooses 'Execute', the Jailed player receives an 'Unstoppable Attack' and dies inside the jail.
  // No outside Doctor or Bodyguard can save them.
  if (options?.jailedPlayerId && options?.jailorExecuting) {
    const jailedPlayer = players.find((p) => p.id === options.jailedPlayerId);
    if (jailedPlayer && jailedPlayer.isAlive) {
      if (!killedPlayerIds.some((k) => k.id === options.jailedPlayerId)) {
        killedPlayerIds.push({ id: options.jailedPlayerId, reason: 'JAILOR' });
      }
      jailorExecutedPlayerId = options.jailedPlayerId;
      // The Guilt Penalty (Crucial Rule)
      // If the Jailor executes a player who belongs to the Villager team (an innocent/good guy),
      // the Jailor suffers from 'Guilt'.
      // Penalty: The Jailor immediately loses all remaining Execution limits (Execution count drops to 0 for the rest of the game).
      if (jailedPlayer.team === 'VILLAGERS') {
        jailorGuiltyTriggered = true;
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
    jailorGuiltyTriggered,
    jailorExecutedPlayerId,
    transporterSwappedPairs,
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
