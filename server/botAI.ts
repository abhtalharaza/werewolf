import { Role } from '../src/types/game.js';
import { ServerPlayer, ServerNightAction } from './types.js';

const BOT_NAMES = [
  'Rowan',
  'Bran',
  'Astrid',
  'Gareth',
  'Kaelen',
  'Isolde',
  'Theron',
  'Gwyneth',
  'Darcy',
  'Cedric',
];

const BOT_AVATARS = [
  'elder',
  'hunter',
  'sorceress',
  'blacksmith',
  'priestess',
  'rogue',
  'knight',
  'herbalist',
  'bard',
  'gravedigger',
];

export function generateBotPlayer(existingPlayers: ServerPlayer[]): ServerPlayer {
  const existingNames = new Set(existingPlayers.map((p) => p.name));
  const availableNames = BOT_NAMES.filter((n) => !existingNames.has(n));
  const name = availableNames.length > 0
    ? availableNames[Math.floor(Math.random() * availableNames.length)]
    : `Villager_${Math.floor(Math.random() * 900 + 100)}`;

  const avatar = BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)];

  return {
    id: 'bot-' + Math.random().toString(36).substring(2, 9),
    socketId: 'bot-socket-' + Math.random().toString(36).substring(2, 9),
    name,
    avatar,
    isHost: false,
    isReady: true,
    isAlive: true,
    isBot: true,
    role: 'VILLAGER',
    team: 'VILLAGERS',
    connected: true,
    targetId: null,
    hasVoted: false,
    voteTargetId: null,
  };
}

export function getBotNightActions(players: ServerPlayer[]): ServerNightAction[] {
  const actions: ServerNightAction[] = [];
  const alivePlayers = players.filter((p) => p.isAlive);
  const aliveBots = alivePlayers.filter((p) => p.isBot);

  // Alive werewolves targeting (WEREWOLF, WOLF_CUB, WHITE_WOLF)
  const wolfBots = aliveBots.filter(
    (p) => p.role === 'WEREWOLF' || p.role === 'WOLF_CUB' || p.role === 'WHITE_WOLF'
  );
  const nonWolfAlive = alivePlayers.filter(
    (p) => p.role !== 'WEREWOLF' && p.role !== 'WOLF_CUB' && p.role !== 'WHITE_WOLF'
  );

  let chosenWolfTargetId: string | null = null;
  if (wolfBots.length > 0 && nonWolfAlive.length > 0) {
    // Werewolf bots pick a non-werewolf victim
    const target = nonWolfAlive[Math.floor(Math.random() * nonWolfAlive.length)];
    chosenWolfTargetId = target.id;
    for (const wolf of wolfBots) {
      actions.push({
        actorId: wolf.id,
        role: wolf.role,
        type: 'KILL',
        targetId: target.id,
      });
    }
  }

  // Witch bot: 40% chance to heal wolf victim if available
  const witchBots = aliveBots.filter((p) => p.role === 'WITCH');
  for (const witch of witchBots) {
    if (chosenWolfTargetId && Math.random() < 0.4) {
      actions.push({
        actorId: witch.id,
        role: 'WITCH',
        type: 'HEAL',
        targetId: chosenWolfTargetId,
      });
    }
  }

  // Doctor bots
  const doctorBots = aliveBots.filter((p) => p.role === 'DOCTOR');
  for (const doc of doctorBots) {
    const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    actions.push({
      actorId: doc.id,
      role: 'DOCTOR',
      type: 'PROTECT',
      targetId: target.id,
    });
  }

  // Bodyguard bots
  const guardBots = aliveBots.filter((p) => p.role === 'BODYGUARD');
  for (const guard of guardBots) {
    // Bodyguard cannot guard self, protect someone else
    const others = alivePlayers.filter((p) => p.id !== guard.id);
    if (others.length > 0) {
      const target = others[Math.floor(Math.random() * others.length)];
      actions.push({
        actorId: guard.id,
        role: 'BODYGUARD',
        type: 'GUARD',
        targetId: target.id,
      });
    }
  }

  // Seer bots
  const seerBots = aliveBots.filter((p) => p.role === 'SEER');
  for (const seer of seerBots) {
    const others = alivePlayers.filter((p) => p.id !== seer.id);
    if (others.length > 0) {
      const target = others[Math.floor(Math.random() * others.length)];
      actions.push({
        actorId: seer.id,
        role: 'SEER',
        type: 'INVESTIGATE',
        targetId: target.id,
      });
    }
  }

  // Serial Killer bots
  const skBots = aliveBots.filter((p) => p.role === 'SERIAL_KILLER');
  for (const sk of skBots) {
    const others = alivePlayers.filter((p) => p.id !== sk.id);
    if (others.length > 0) {
      const target = others[Math.floor(Math.random() * others.length)];
      actions.push({
        actorId: sk.id,
        role: 'SERIAL_KILLER',
        type: 'SERIAL_KILLER_KILL',
        targetId: target.id,
      });
    }
  }

  // Spellcaster bots
  const casterBots = aliveBots.filter((p) => p.role === 'SPELLCASTER');
  for (const caster of casterBots) {
    const others = alivePlayers.filter((p) => p.id !== caster.id);
    if (others.length > 0) {
      const target = others[Math.floor(Math.random() * others.length)];
      actions.push({
        actorId: caster.id,
        role: 'SPELLCASTER',
        type: 'SILENCE',
        targetId: target.id,
      });
    }
  }

  // Arsonist bots (70% douse, 30% ignite if any doused)
  const arsoBots = aliveBots.filter((p) => p.role === 'ARSONIST');
  for (const arso of arsoBots) {
    const others = alivePlayers.filter((p) => p.id !== arso.id);
    if (others.length > 0) {
      const shouldIgnite = Math.random() < 0.25;
      if (shouldIgnite) {
        actions.push({
          actorId: arso.id,
          role: 'ARSONIST',
          type: 'ARSONIST_IGNITE',
          targetId: arso.id,
        });
      } else {
        const target = others[Math.floor(Math.random() * others.length)];
        actions.push({
          actorId: arso.id,
          role: 'ARSONIST',
          type: 'ARSONIST_DOUSE',
          targetId: target.id,
        });
      }
    }
  }

  // Veteran bots (35% chance to alert)
  const vetBots = aliveBots.filter((p) => p.role === 'VETERAN');
  for (const vet of vetBots) {
    if (Math.random() < 0.35) {
      actions.push({
        actorId: vet.id,
        role: 'VETERAN',
        type: 'VETERAN_ALERT',
        targetId: vet.id,
      });
    }
  }

  // Apprentice Seer bots (if no living true seer)
  const hasLivingSeer = alivePlayers.some((p) => p.role === 'SEER');
  if (!hasLivingSeer) {
    const appSeerBots = aliveBots.filter((p) => p.role === 'APPRENTICE_SEER');
    for (const appSeer of appSeerBots) {
      const others = alivePlayers.filter((p) => p.id !== appSeer.id);
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        actions.push({
          actorId: appSeer.id,
          role: 'APPRENTICE_SEER',
          type: 'INVESTIGATE',
          targetId: target.id,
        });
      }
    }
  }

  return actions;
}

export function getBotVotes(players: ServerPlayer[]): Record<string, string | null> {
  const votes: Record<string, string | null> = {};
  const alivePlayers = players.filter((p) => p.isAlive);
  const aliveBots = alivePlayers.filter((p) => p.isBot);

  for (const bot of aliveBots) {
    // 15% chance to skip vote, 85% to vote for someone other than self
    if (Math.random() < 0.15) {
      votes[bot.id] = null;
    } else {
      const others = alivePlayers.filter((p) => p.id !== bot.id);
      if (others.length > 0) {
        const picked = others[Math.floor(Math.random() * others.length)];
        votes[bot.id] = picked.id;
      }
    }
  }

  return votes;
}

const DISCUSSION_SNIPPETS = [
  'The night felt unnervingly cold... did anyone hear scratches by the eastern gate?',
  'We need to pay attention to who has been avoiding eye contact today.',
  'I suggest we hear everyone out before making any hasty accusations.',
  'Whoever attacked last night was deliberate. We must act with united conviction.',
  'Look at the voting patterns from yesterday—there are clear pack movements!',
  'I am just a simple villager, my only desire is to root out the wolves.',
  'Let us not turn on each other blindly. That is exactly what the beasts want.',
  'Mark my words, silence in this council is often the veil of a predator.',
];

export function getBotChatMessage(bot: ServerPlayer): string {
  return DISCUSSION_SNIPPETS[Math.floor(Math.random() * DISCUSSION_SNIPPETS.length)];
}
