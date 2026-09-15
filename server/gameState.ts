import {
  Role,
  Team,
  GamePhase,
  GameSettings,
  ClientGameState,
  ClientPlayer,
  GameEvent,
  GameDeathRecord,
  SeerResult,
  WitchPotions,
  WerewolfVoteRecord,
} from '../src/types/game.js';
import { ServerRoom, ServerPlayer, ServerNightAction } from './types.js';
import { assignRoles, getRoleTeam, resolveNightActions, checkWinCondition } from './roleEngine.js';
import { generateBotPlayer, getBotNightActions, getBotVotes, getBotChatMessage } from './botAI.js';
import { db } from './db.js';

export class GameRoom {
  public room: ServerRoom;
  private onStateChange: (room: GameRoom) => void;
  private onChatMessage: (channel: string, message: unknown) => void;
  private seerResults: Map<string, SeerResult> = new Map(); // seerId -> current night result
  private seerHistory: Map<string, Map<string, SeerResult>> = new Map(); // seerId -> (targetId -> result)

  constructor(
    code: string,
    name: string,
    hostPlayer: Omit<ServerPlayer, 'role' | 'team'>,
    onStateChange: (room: GameRoom) => void,
    onChatMessage: (channel: string, message: unknown) => void,
    initialSettings?: Partial<GameSettings>
  ) {
    this.onStateChange = onStateChange;
    this.onChatMessage = onChatMessage;

    const defaultSettings: GameSettings = {
      roomName: name || 'Whispering Pines',
      maxPlayers: 10,
      discussionTime: 40,
      votingTime: 15,
      nightTime: 15,
      revealRoleOnDeath: true,
      roleDistribution: {
        WEREWOLF: 2,
        VILLAGER: 3,
        SEER: 1,
        DOCTOR: 1,
        HUNTER: 1,
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
      },
    };

    const host: ServerPlayer = {
      ...hostPlayer,
      isHost: true,
      isReady: true,
      isAlive: true,
      role: 'VILLAGER',
      team: 'VILLAGERS',
      targetId: null,
      hasVoted: false,
      voteTargetId: null,
    };

    this.room = {
      id: 'room-' + Math.random().toString(36).substring(2, 9),
      code: code.toUpperCase(),
      name: defaultSettings.roomName,
      phase: 'LOBBY',
      round: 0,
      timer: 0,
      timerMax: 0,
      intervalId: null,
      players: [host],
      settings: { ...defaultSettings, ...(initialSettings || {}) },
      nightActions: [],
      witchHealUsed: false,
      witchPoisonUsed: false,
      votes: {},
      events: [
        {
          id: 'ev-init',
          type: 'SYSTEM',
          message: `Room ${code.toUpperCase()} created by ${host.name}. Gather your villagers!`,
          round: 0,
          timestamp: Date.now(),
        },
      ],
      latestDeaths: [],
      morningProtections: [],
      hunterPendingId: null,
      hunterContext: null,
      hunterEliminationReason: null,
      winnerTeam: null,
      winReason: null,
      createdAt: Date.now(),
      lovers: null,
      wolfCubKilledByVote: false,
      enragedWolvesThisNight: false,
      doppelgangerBinds: {},
      thiefReserveRoles: [],
      werewolfKillsHistory: [],
      littleGirlPeekResults: {},
    };

    if (initialSettings?.autoPopulateBots) {
      const botsNeeded = Math.min(5, (this.room.settings.maxPlayers || 10) - 1);
      for (let i = 0; i < botsNeeded; i++) {
        const bot = generateBotPlayer(this.room.players);
        this.room.players.push(bot);
      }
    }
  }

  public getCode() {
    return this.room.code;
  }

  public getPlayers() {
    return this.room.players;
  }

  public getPlayer(id: string) {
    return this.room.players.find((p) => p.id === id);
  }

  public addPlayer(playerData: Omit<ServerPlayer, 'role' | 'team'>): { success: boolean; error?: string } {
    if (this.room.phase !== 'LOBBY') {
      return { success: false, error: 'Game is already in progress' };
    }
    if (this.room.players.length >= this.room.settings.maxPlayers) {
      return { success: false, error: 'Room is at maximum capacity' };
    }

    const existing = this.room.players.find((p) => p.id === playerData.id);
    if (existing) {
      existing.connected = true;
      existing.socketId = playerData.socketId;
      this.notify();
      return { success: true };
    }

    const newPlayer: ServerPlayer = {
      ...playerData,
      isHost: false,
      isReady: false,
      isAlive: true,
      role: 'VILLAGER',
      team: 'VILLAGERS',
      targetId: null,
      hasVoted: false,
      voteTargetId: null,
    };

    this.room.players.push(newPlayer);
    this.addEvent('SYSTEM', `${newPlayer.name} has entered the village.`);
    this.notify();
    return { success: true };
  }

  public removePlayer(playerId: string) {
    const idx = this.room.players.findIndex((p) => p.id === playerId);
    if (idx === -1) return;

    const removed = this.room.players[idx];
    if (this.room.phase === 'LOBBY' || this.room.phase === 'GAME_OVER') {
      this.room.players.splice(idx, 1);
      // Transfer host if host left
      if (removed.isHost && this.room.players.length > 0) {
        const nextHuman = this.room.players.find((p) => !p.isBot);
        if (nextHuman) {
          nextHuman.isHost = true;
          this.addEvent('SYSTEM', `${nextHuman.name} is now the village host.`);
        } else {
          this.room.players[0].isHost = true;
          this.addEvent('SYSTEM', `${this.room.players[0].name} is now the village host.`);
        }
      }
    } else {
      // In-game: mark as disconnected
      removed.connected = false;
      this.addEvent('SYSTEM', `${removed.name} has left the village.`);
    }

    // Always detach socketId so broadcasts never target this socket for this room
    removed.socketId = '' as any;

    this.notify();
  }

  public addBot() {
    if (this.room.phase !== 'LOBBY') return;
    if (this.room.players.length >= this.room.settings.maxPlayers) return;

    const bot = generateBotPlayer(this.room.players);
    this.room.players.push(bot);
    this.addEvent('SYSTEM', `${bot.name} (Bot) has joined the gathering.`);
    this.notify();
  }

  public removeBot(botId?: string) {
    if (this.room.phase !== 'LOBBY') return;
    const botIdx = botId
      ? this.room.players.findIndex((p) => p.id === botId && p.isBot)
      : this.room.players.findIndex((p) => p.isBot);

    if (botIdx !== -1) {
      const removed = this.room.players.splice(botIdx, 1)[0];
      this.addEvent('SYSTEM', `${removed.name} has left the village.`);
      this.notify();
    }
  }

  public kickPlayer(requesterId: string, targetPlayerId: string): { success: boolean; error?: string } {
    if (this.room.phase !== 'LOBBY') {
      return { success: false, error: 'Players can only be removed while in the gathering' };
    }
    const requester = this.getPlayer(requesterId);
    if (!requester || !requester.isHost) {
      return { success: false, error: 'Only the village host can banish players' };
    }
    if (requesterId === targetPlayerId) {
      return { success: false, error: 'Host cannot banish themselves' };
    }

    const idx = this.room.players.findIndex((p) => p.id === targetPlayerId);
    if (idx === -1) {
      return { success: false, error: 'Player not found in this village' };
    }

    const removed = this.room.players.splice(idx, 1)[0];
    this.addEvent('SYSTEM', `${removed.name} was banished from the village by the host.`);
    this.notify();

    return { success: true };
  }

  public toggleReady(playerId: string) {
    const player = this.getPlayer(playerId);
    if (player && this.room.phase === 'LOBBY') {
      player.isReady = !player.isReady;
      this.notify();
    }
  }

  public updateSettings(settings: Partial<GameSettings>, newHostName?: string) {
    if (this.room.phase !== 'LOBBY') return;
    this.room.settings = { ...this.room.settings, ...settings };
    if (settings.roomName && settings.roomName.trim()) {
      this.room.name = settings.roomName.trim();
      this.room.settings.roomName = settings.roomName.trim();
    }
    if (newHostName && typeof newHostName === 'string' && newHostName.trim()) {
      const host = this.room.players.find((p) => p.isHost);
      if (host) {
        host.name = newHostName.trim();
      }
    }
    this.notify();
  }

  // START GAME
  public startGame(requesterId: string): { success: boolean; error?: string } {
    const requester = this.getPlayer(requesterId);
    if (!requester || !requester.isHost) {
      return { success: false, error: 'Only the host can start the game' };
    }

    // Bug Fix: Check that all players are ready before game starts!
    const unreadyPlayers = this.room.players.filter((p) => !p.isReady);
    if (unreadyPlayers.length > 0) {
      const names = unreadyPlayers.map((p) => p.name).join(', ');
      return {
        success: false,
        error: `Cannot start yet: Waiting for all players to mark ready! (${names} not ready)`,
      };
    }

    if (this.room.players.length < 4) {
      const needed = Math.min(5, this.room.settings.maxPlayers || 10) - this.room.players.length;
      for (let i = 0; i < needed; i++) {
        const bot = generateBotPlayer(this.room.players);
        this.room.players.push(bot);
      }
      this.addEvent('SYSTEM', `${needed} AI Villagers were summoned so the hunt could commence.`);
    }

    const assigned = assignRoles(this.room.players.length, this.room.settings.roleDistribution);
    this.room.players.forEach((player, idx) => {
      player.role = assigned[idx];
      player.team = getRoleTeam(assigned[idx]);
      player.isAlive = true;
      player.targetId = null;
      player.hasVoted = false;
      player.voteTargetId = null;
    });

    this.room.round = 1;
    this.room.witchHealUsed = false;
    this.room.witchPoisonUsed = false;
    this.room.lovers = null;
    this.room.wolfCubKilledByVote = false;
    this.room.enragedWolvesThisNight = false;
    this.room.doppelgangerBinds = {};
    this.room.werewolfKillsHistory = [];
    this.room.littleGirlPeekResults = {};
    this.room.winnerTeam = null;
    this.room.winReason = null;
    this.seerResults.clear();

    // Setup thief reserve cards if Thief is in game
    if (assigned.includes('THIEF')) {
      const reservePool: Role[] = ['DOCTOR', 'SEER', 'BODYGUARD', 'HUNTER', 'VILLAGER'];
      this.room.thiefReserveRoles = [
        reservePool[Math.floor(Math.random() * reservePool.length)],
        reservePool[Math.floor(Math.random() * reservePool.length)],
      ];
    } else {
      this.room.thiefReserveRoles = [];
    }

    this.setPhase('ROLE_REVEAL', 6);
    this.addEvent('PHASE_CHANGE', 'The darkness descends. Learn your secret fate in silence.');
    return { success: true };
  }

  private setPhase(phase: GamePhase, durationSeconds: number) {
    this.clearTimer();
    this.room.phase = phase;
    this.room.timer = durationSeconds;
    this.room.timerMax = durationSeconds;

    this.notify();

    this.room.intervalId = setInterval(() => {
      this.room.timer--;
      if (this.room.timer <= 0) {
        this.clearTimer();
        this.onPhaseTimerExpired();
      } else {
        this.notify();
      }
    }, 1000);

    // Schedule bot reactions for this phase
    this.handleBotActionsForPhase(phase);
  }

  private clearTimer() {
    if (this.room.intervalId) {
      clearInterval(this.room.intervalId);
      this.room.intervalId = null;
    }
  }

  private onPhaseTimerExpired() {
    switch (this.room.phase) {
      case 'ROLE_REVEAL':
        this.startNightPhase();
        break;
      case 'NIGHT':
        this.resolveNightAndStartDay();
        break;
      case 'DAY_ANNOUNCEMENT':
        if (this.room.hunterPendingId) {
          this.setPhase('HUNTER_ACTION', 15);
          const hunter = this.getPlayer(this.room.hunterPendingId);
          let reasonText = 'slain in the night';
          if (this.room.hunterEliminationReason === 'WEREWOLF') {
            reasonText = 'devoured by the Werewolves';
          } else if (this.room.hunterEliminationReason === 'POISON') {
            reasonText = 'poisoned by the Witch';
          }
          this.addEvent(
            'HUNTER_SHOT',
            `🎯 ${hunter?.name || 'The Hunter'} was ${reasonText}! With their dying breath, they raise their rifle for one final revenge shot!`
          );
          return;
        }
        this.startDiscussionPhase();
        break;
      case 'DISCUSSION':
        this.startVotingPhase();
        break;
      case 'VOTING':
        this.resolveVotes();
        break;
      case 'VOTE_RESULT':
        this.afterVoteResult();
        break;
      case 'HUNTER_ACTION':
        this.resolveHunterAction();
        break;
      default:
        break;
    }
  }

  private startNightPhase() {
    this.room.nightActions = [];
    this.room.players.forEach((p) => {
      p.targetId = null;
    });
    this.seerResults.clear();
    this.room.littleGirlPeekResults = {};
    this.room.morningProtections = [];

    if (this.room.wolfCubKilledByVote) {
      this.room.enragedWolvesThisNight = true;
      this.room.wolfCubKilledByVote = false;
    }

    this.setPhase('NIGHT', this.room.settings.nightTime);
    this.addEvent('PHASE_CHANGE', `Night fell upon the village. Round ${this.room.round}.`);
  }

  private resolveNightAndStartDay() {
    // Check if any little girl was caught
    let caughtLittleGirlId: string | null = null;
    for (const [girlId, result] of Object.entries(this.room.littleGirlPeekResults)) {
      if (result.caught) {
        caughtLittleGirlId = girlId;
        break;
      }
    }

    // Resolve actions
    const resolution = resolveNightActions(this.room.nightActions, this.room.players, {
      enragedWolves: this.room.enragedWolvesThisNight,
      lovers: this.room.lovers,
      caughtLittleGirlId,
    });

    // Only record protections where the player was actually attacked and saved
    this.room.morningProtections = (resolution.protections || []).filter(
      (p) => p.wasAttackedAndSaved
    );
    this.room.enragedWolvesThisNight = false;

    // Handle role transformations (e.g., Cursed turns into Werewolf!)
    for (const trans of resolution.transformedPlayerIds) {
      const p = this.getPlayer(trans.id);
      if (p) {
        p.role = trans.newRole;
        p.team = trans.newTeam;
        this.addEvent(
          'CURSED_TRANSFORM',
          `${p.name} was attacked in the dark and cursed to join the Werewolf pack!`
        );
      }
    }

    // Store seer report
    if (resolution.seerReport) {
      const targetPlayer = this.getPlayer(resolution.seerReport.targetId);
      const res: SeerResult = {
        targetId: resolution.seerReport.targetId,
        targetName: targetPlayer?.name || 'Unknown',
        isWerewolf: resolution.seerReport.isWerewolf,
        revealedRole: resolution.seerReport.role,
        alignment: resolution.seerReport.isWerewolf ? 'Werewolf' : 'Good Team',
      };
      this.seerResults.set(resolution.seerReport.seerId, res);
      if (!this.seerHistory.has(resolution.seerReport.seerId)) {
        this.seerHistory.set(resolution.seerReport.seerId, new Map());
      }
      this.seerHistory.get(resolution.seerReport.seerId)!.set(resolution.seerReport.targetId, res);
    }

    // Process deaths
    const deaths: GameDeathRecord[] = [];
    for (const killed of resolution.killedPlayerIds) {
      const player = this.getPlayer(killed.id);
      if (player && player.isAlive) {
        player.isAlive = false;

        // Werewolf kill tracking: Record for secret werewolf reveal!
        if (killed.reason === 'WEREWOLF') {
          this.room.werewolfKillsHistory.push({
            victimId: player.id,
            victimRole: player.role,
            round: this.room.round,
          });
        }

        // Doppelganger check: if any living doppelganger bound this player, copy their role!
        for (const [dopId, targetId] of Object.entries(this.room.doppelgangerBinds)) {
          if (targetId === player.id) {
            const doppel = this.getPlayer(dopId);
            if (doppel && doppel.isAlive) {
              doppel.role = player.role;
              doppel.team = getRoleTeam(player.role);
              this.addEvent(
                'DOPPELGANGER_SHIFT',
                `${doppel.name} the Doppelganger inherited the fallen ${player.name}'s secret mantle!`
              );
            }
          }
        }

        // Hunter elimination check: Werewolf attack, Witch poison, White Wolf, or heartbreak!
        if (player.role === 'HUNTER') {
          this.room.hunterPendingId = player.id;
          this.room.hunterContext = 'NIGHT';
          this.room.hunterEliminationReason = killed.reason;
        }

        deaths.push({
          id: player.id,
          name: player.name,
          role:
            killed.reason === 'WEREWOLF'
              ? undefined
              : this.room.settings.revealRoleOnDeath
              ? player.role
              : undefined,
          reason: killed.reason,
          round: this.room.round,
        });

        let deathMsg = `${player.name} was slain during the shadows of the night.`;
        if (killed.reason === 'WEREWOLF') deathMsg = `${player.name} was brutally devoured by the Werewolves!`;
        if (killed.reason === 'POISON') deathMsg = `${player.name} succumbed to a mysterious, fatal poison!`;
        if (killed.reason === 'WHITE_WOLF') deathMsg = `${player.name} was eliminated in cold blood by the White Wolf!`;
        if (killed.reason === 'LITTLE_GIRL_CAUGHT') deathMsg = `${player.name} (Little Girl) was caught spying in the shadows and slain!`;
        if (killed.reason === 'HEARTBREAK') deathMsg = `💔 ${player.name} collapsed and died of sheer heartbreak!`;

        this.addEvent('DEATH', deathMsg);
      }
    }

    this.room.latestDeaths = deaths;

    // Check win condition (defer if Hunter has a pending parting shot!)
    if (!this.room.hunterPendingId) {
      const win = checkWinCondition(this.room.players);
      if (win.gameOver) {
        this.endGame(win.winnerTeam!, win.reason);
        return;
      }
    }

    this.setPhase('DAY_ANNOUNCEMENT', 7);
  }

  private startDiscussionPhase() {
    this.setPhase('DISCUSSION', this.room.settings.discussionTime);
    this.addEvent('PHASE_CHANGE', 'Dawn breaks. The village council convenes for discussion.');
  }

  private startVotingPhase() {
    this.room.votes = {};
    this.room.players.forEach((p) => {
      p.hasVoted = false;
      p.voteTargetId = null;
    });
    this.setPhase('VOTING', this.room.settings.votingTime);
    this.addEvent('PHASE_CHANGE', 'Accusations are made! Cast your vote to eliminate a suspect.');
  }

  private resolveVotes() {
    // Tally votes (Mayor's vote counts as 2!)
    const counts: Record<string, number> = {};
    let skipCount = 0;

    for (const [voterId, targetId] of Object.entries(this.room.votes)) {
      const voter = this.getPlayer(voterId);
      const weight = voter && voter.role === 'MAYOR' ? 2 : 1;
      if (targetId === null) {
        skipCount += weight;
      } else {
        counts[targetId] = (counts[targetId] || 0) + weight;
      }
    }

    let highestTarget: string | null = null;
    let highestCount = 0;
    let isTie = false;

    for (const [targetId, count] of Object.entries(counts)) {
      if (count > highestCount) {
        highestCount = count;
        highestTarget = targetId;
        isTie = false;
      } else if (count === highestCount && count > 0) {
        isTie = true;
      }
    }

    const deaths: GameDeathRecord[] = [];

    if (highestTarget && !isTie && highestCount > skipCount) {
      const eliminated = this.getPlayer(highestTarget);
      if (eliminated && eliminated.isAlive) {
        eliminated.isAlive = false;

        // JESTER WIN RULE: If Jester is executed by day vote, JESTER WINS IMMEDIATELY!
        if (eliminated.role === 'JESTER') {
          deaths.push({
            id: eliminated.id,
            name: eliminated.name,
            role: 'JESTER',
            reason: 'VOTE',
            round: this.room.round,
          });
          this.room.latestDeaths = deaths;
          this.addEvent(
            'DEATH',
            `🎭 ${eliminated.name} burst into laughter at the gallows... They were the JESTER!`
          );
          this.endGame(
            'JESTER',
            `${eliminated.name} the Jester tricked the entire village council into executing them! JESTER WINS THE GAME!`
          );
          return;
        }

        // WOLF CUB RULE: If Wolf Cub is executed by vote, Werewolves kill TWO players next night!
        if (eliminated.role === 'WOLF_CUB') {
          this.room.wolfCubKilledByVote = true;
          this.addEvent(
            'WOLF_CUB_ENRAGE',
            'The Wolf Cub was executed! The Werewolves howl in fury and will strike TWO victims next night!'
          );
        }

        // Doppelganger check
        for (const [dopId, targetId] of Object.entries(this.room.doppelgangerBinds)) {
          if (targetId === eliminated.id) {
            const doppel = this.getPlayer(dopId);
            if (doppel && doppel.isAlive) {
              doppel.role = eliminated.role;
              doppel.team = getRoleTeam(eliminated.role);
              this.addEvent(
                'DOPPELGANGER_SHIFT',
                `${doppel.name} the Doppelganger inherited the fallen ${eliminated.name}'s secret mantle!`
              );
            }
          }
        }

        deaths.push({
          id: eliminated.id,
          name: eliminated.name,
          role: this.room.settings.revealRoleOnDeath ? eliminated.role : undefined,
          reason: 'VOTE',
          round: this.room.round,
        });
        this.addEvent('DEATH', `${eliminated.name} was sentenced to the gallows by the village council.`);

        // Lovers check: if eliminated player is a lover, partner dies of heartbreak!
        if (this.room.lovers && this.room.lovers.includes(eliminated.id)) {
          const partnerId = this.room.lovers.find((id) => id !== eliminated.id)!;
          const partner = this.getPlayer(partnerId);
          if (partner && partner.isAlive) {
            partner.isAlive = false;
            deaths.push({
              id: partner.id,
              name: partner.name,
              role: this.room.settings.revealRoleOnDeath ? partner.role : undefined,
              reason: 'HEARTBREAK',
              round: this.room.round,
            });
            this.addEvent(
              'DEATH',
              `💔 ${partner.name} collapsed and died of heartbreak upon losing their beloved ${eliminated.name}!`
            );

            // Check if heartbreak eliminated the Hunter
            if (partner.role === 'HUNTER') {
              this.room.hunterPendingId = partner.id;
              this.room.hunterContext = 'DAY_VOTE';
              this.room.hunterEliminationReason = 'HEARTBREAK';
            }
          }
        }

        // Check if eliminated player is hunter
        if (eliminated.role === 'HUNTER') {
          this.room.hunterPendingId = eliminated.id;
          this.room.hunterContext = 'DAY_VOTE';
          this.room.hunterEliminationReason = 'VOTE';
        }
      }
    } else {
      this.addEvent('SYSTEM', 'The council could not reach a decisive verdict. No one was executed today.');
    }

    this.room.latestDeaths = deaths;

    // Check if Hunter needs to take revenge shot
    if (this.room.hunterPendingId) {
      this.setPhase('HUNTER_ACTION', 15);
      const hunter = this.getPlayer(this.room.hunterPendingId);
      this.addEvent(
        'HUNTER_SHOT',
        `🎯 ${hunter?.name || 'The Hunter'} was condemned by the village vote! With their dying breath, they raise their rifle for one final revenge shot!`
      );
      return;
    }

    this.setPhase('VOTE_RESULT', 7);
  }

  private afterVoteResult() {
    const win = checkWinCondition(this.room.players);
    if (win.gameOver) {
      this.endGame(win.winnerTeam!, win.reason);
      return;
    }

    // Proceed to next night
    this.room.round++;
    this.startNightPhase();
  }

  public hunterShoot(hunterId: string, targetId: string) {
    if (this.room.phase !== 'HUNTER_ACTION' || this.room.hunterPendingId !== hunterId) return;

    const hunter = this.getPlayer(hunterId);
    const target = this.getPlayer(targetId);
    if (target && target.isAlive) {
      target.isAlive = false;
      this.room.latestDeaths.push({
        id: target.id,
        name: target.name,
        role: this.room.settings.revealRoleOnDeath ? target.role : undefined,
        reason: 'HUNTER',
        round: this.room.round,
      });
      this.addEvent(
        'HUNTER_SHOT',
        `🎯 ${hunter?.name || 'The Hunter'} fired their parting bullet and eliminated ${target.name}!`
      );

      // Check if target was a Lover!
      if (this.room.lovers && this.room.lovers.includes(target.id)) {
        const partnerId = this.room.lovers.find((id) => id !== target.id);
        const partner = partnerId ? this.getPlayer(partnerId) : null;
        if (partner && partner.isAlive) {
          partner.isAlive = false;
          this.room.latestDeaths.push({
            id: partner.id,
            name: partner.name,
            role: this.room.settings.revealRoleOnDeath ? partner.role : undefined,
            reason: 'HEARTBREAK',
            round: this.room.round,
          });
          this.addEvent(
            'DEATH',
            `💔 ${partner.name} collapsed and died of sheer heartbreak upon losing their beloved ${target.name}!`
          );
        }
      }

      // If Wolf Cub was eliminated by Hunter shot, enrage pack next night
      if (target.role === 'WOLF_CUB') {
        this.room.wolfCubKilledByVote = true;
        this.addEvent(
          'WOLF_CUB_ENRAGE',
          'The Wolf Cub was struck down! The Werewolves howl in fury and will strike TWO victims next night!'
        );
      }
    }

    const previousContext = this.room.hunterContext;
    this.room.hunterPendingId = null;
    this.room.hunterContext = null;
    this.room.hunterEliminationReason = null;
    this.clearTimer();

    // Check win condition after hunter's parting shot
    const win = checkWinCondition(this.room.players);
    if (win.gameOver) {
      this.endGame(win.winnerTeam!, win.reason);
      return;
    }

    if (previousContext === 'NIGHT') {
      this.startDiscussionPhase();
    } else {
      this.afterVoteResult();
    }
  }

  private resolveHunterAction() {
    // If timer ran out without a shot, pick random alive player
    if (this.room.hunterPendingId) {
      const alive = this.room.players.filter((p) => p.isAlive && p.id !== this.room.hunterPendingId);
      if (alive.length > 0) {
        const target = alive[Math.floor(Math.random() * alive.length)];
        this.hunterShoot(this.room.hunterPendingId, target.id);
        return;
      }
      this.room.hunterPendingId = null;
    }

    const previousContext = this.room.hunterContext;
    this.room.hunterContext = null;
    this.room.hunterEliminationReason = null;

    const win = checkWinCondition(this.room.players);
    if (win.gameOver) {
      this.endGame(win.winnerTeam!, win.reason);
      return;
    }

    if (previousContext === 'NIGHT') {
      this.startDiscussionPhase();
    } else {
      this.afterVoteResult();
    }
  }

  private endGame(winnerTeam: Team, winReason: string) {
    this.clearTimer();
    this.room.phase = 'GAME_OVER';
    this.room.winnerTeam = winnerTeam;
    this.room.winReason = winReason;

    this.addEvent(
      'GAME_WIN',
      winnerTeam === 'VILLAGERS'
        ? 'VICTORY FOR THE VILLAGERS! The darkness has been vanquished.'
        : winnerTeam === 'JESTER'
        ? 'THE JESTER WINS! The village has been duped into executing them!'
        : winnerTeam === 'WHITE_WOLF'
        ? 'VICTORY FOR THE WHITE WEREWOLF! The lone predator eliminated all packmates and villagers.'
        : 'VICTORY FOR THE WEREWOLVES! The village has been devoured.'
    );

    // Save game record to database
    db.recordGame({
      roomCode: this.room.code,
      roomName: this.room.name,
      winnerTeam,
      winReason,
      roundsPlayed: this.room.round,
      playerCount: this.room.players.length,
      players: this.room.players.map((p) => ({
        name: p.name,
        avatar: p.avatar,
        role: p.role,
        team: p.team,
        survived: p.isAlive,
      })),
    });

    this.notify();
  }

  public restartGame(requesterId: string) {
    const requester = this.getPlayer(requesterId);
    if (!requester || !requester.isHost) return;

    this.clearTimer();
    this.room.phase = 'LOBBY';
    this.room.round = 0;
    this.room.timer = 0;
    this.room.winnerTeam = null;
    this.room.winReason = null;
    this.room.latestDeaths = [];
    this.room.votes = {};
    this.room.nightActions = [];
    this.seerResults.clear();
    this.seerHistory.clear();

    this.room.players.forEach((p) => {
      p.isAlive = true;
      p.isReady = p.isHost || p.isBot;
      p.targetId = null;
      p.hasVoted = false;
      p.voteTargetId = null;
    });

    this.addEvent('SYSTEM', 'The village gathers once more in the tavern square.');
    this.notify();
  }

  // NIGHT ACTION SUBMISSION
  public submitNightAction(
    playerId: string,
    type:
      | 'KILL'
      | 'INVESTIGATE'
      | 'PROTECT'
      | 'GUARD'
      | 'POISON'
      | 'HEAL'
      | 'CUPID_LOVERS'
      | 'THIEF_CHOOSE'
      | 'DOPPELGANGER_BIND'
      | 'WHITE_WOLF_KILL'
      | 'LITTLE_GIRL_PEEK',
    targetId: string,
    secondaryTargetId?: string,
    chosenRole?: Role
  ): { success: boolean; error?: string; seerResult?: SeerResult } {
    if (this.room.phase !== 'NIGHT') {
      return { success: false, error: 'Not the night phase' };
    }

    const player = this.getPlayer(playerId);
    if (!player || !player.isAlive) {
      return { success: false, error: 'Player cannot act' };
    }

    const isWolfPack =
      player.role === 'WEREWOLF' ||
      player.role === 'WOLF_CUB' ||
      player.role === 'WHITE_WOLF' ||
      (player.role === 'CURSED' && player.team === 'WEREWOLVES');

    // Role validation
    if (type === 'KILL') {
      if (!isWolfPack) {
        return { success: false, error: 'Only werewolves can attack' };
      }
      if (targetId === playerId) {
        return { success: false, error: 'Werewolves cannot target themselves' };
      }
      const targetPlayer = this.getPlayer(targetId);
      if (
        targetPlayer &&
        (targetPlayer.role === 'WEREWOLF' ||
          targetPlayer.role === 'WOLF_CUB' ||
          targetPlayer.role === 'WHITE_WOLF' ||
          (targetPlayer.role === 'CURSED' && targetPlayer.team === 'WEREWOLVES'))
      ) {
        return { success: false, error: 'Werewolves cannot attack members of the pack' };
      }
      // Once confirmed, a werewolf kill cannot be undone ("ek bar mar diya toh mar diya")
      const alreadySubmittedKill = this.room.nightActions.some(
        (a) => a.actorId === playerId && a.type === 'KILL'
      );
      if (alreadySubmittedKill) {
        return {
          success: false,
          error: 'Your pack kill target is already locked in for tonight and cannot be undone',
        };
      }
    }
    if (type === 'INVESTIGATE' && player.role !== 'SEER') {
      return { success: false, error: 'Only the seer can investigate' };
    }
    if (type === 'PROTECT' && player.role !== 'DOCTOR') {
      return { success: false, error: 'Only the doctor can heal/protect' };
    }
    if (type === 'GUARD' && player.role !== 'BODYGUARD') {
      return { success: false, error: 'Only the bodyguard can guard' };
    }
    if ((type === 'POISON' || type === 'HEAL') && player.role !== 'WITCH') {
      return { success: false, error: 'Only the witch can use potions' };
    }

    // Witch potion limits
    if (type === 'HEAL') {
      if (this.room.witchHealUsed) {
        return { success: false, error: 'Elixir of Life has already been used once this game' };
      }
      this.room.witchHealUsed = true;
    }
    if (type === 'POISON') {
      if (this.room.witchPoisonUsed) {
        return { success: false, error: 'Vial of Poison has already been used once this game' };
      }
      this.room.witchPoisonUsed = true;
    }

    // CUPID
    if (type === 'CUPID_LOVERS') {
      if (player.role !== 'CUPID') return { success: false, error: 'Only Cupid can choose lovers' };
      if (this.room.round !== 1) return { success: false, error: 'Cupid only acts on Night 1' };
      if (!secondaryTargetId || targetId === secondaryTargetId) {
        return { success: false, error: 'Cupid must choose two distinct players' };
      }
      this.room.lovers = [targetId, secondaryTargetId];
      const p1 = this.getPlayer(targetId);
      const p2 = this.getPlayer(secondaryTargetId);
      this.addEvent(
        'LOVERS_BOUND',
        `Cupid's arrow bound ${p1?.name || 'Villager'} and ${p2?.name || 'Villager'} in eternal love!`
      );
      this.notify();
      return { success: true };
    }

    // THIEF
    if (type === 'THIEF_CHOOSE') {
      if (player.role !== 'THIEF') return { success: false, error: 'Only the Thief can choose a card' };
      if (this.room.round !== 1) return { success: false, error: 'Thief only acts on Night 1' };
      if (!chosenRole || !this.room.thiefReserveRoles.includes(chosenRole)) {
        return { success: false, error: 'Invalid card selection' };
      }
      player.role = chosenRole;
      player.team = getRoleTeam(chosenRole);
      this.addEvent('THIEF_STOLEN', `The Thief slipped into the shadows and assumed a new identity.`);
      this.notify();
      return { success: true };
    }

    // DOPPELGANGER
    if (type === 'DOPPELGANGER_BIND') {
      if (player.role !== 'DOPPELGANGER') return { success: false, error: 'Only the Doppelganger can bind' };
      if (this.room.round !== 1) return { success: false, error: 'Doppelganger only chooses on Night 1' };
      this.room.doppelgangerBinds[playerId] = targetId;
      const target = this.getPlayer(targetId);
      this.addEvent('SYSTEM', `The Doppelganger locked gaze with their future reflection (${target?.name})...`);
      this.notify();
      return { success: true };
    }

    // WHITE WOLF
    if (type === 'WHITE_WOLF_KILL') {
      if (player.role !== 'WHITE_WOLF') return { success: false, error: 'Only the White Wolf can strike wolves' };
      if (this.room.round % 2 !== 0) return { success: false, error: 'White Wolf may only strike on alternate (even) rounds' };
      if (targetId === playerId) return { success: false, error: 'White Wolf cannot target themselves' };
      const target = this.getPlayer(targetId);
      if (!target || !target.isAlive || (target.role !== 'WEREWOLF' && target.role !== 'WOLF_CUB')) {
        return { success: false, error: 'White Wolf can only strike living werewolves of the pack' };
      }
      // Once confirmed, White Wolf solo kill cannot be undone
      const alreadySubmittedSoloKill = this.room.nightActions.some(
        (a) => a.actorId === playerId && a.type === 'WHITE_WOLF_KILL'
      );
      if (alreadySubmittedSoloKill) {
        return {
          success: false,
          error: 'Your solo hunt target is already locked in for tonight and cannot be undone',
        };
      }
    }

    // LITTLE GIRL
    if (type === 'LITTLE_GIRL_PEEK') {
      if (player.role !== 'LITTLE_GIRL') return { success: false, error: 'Only Little Girl can peek' };
      
      // If already peeked this night, retain status and refresh current wolf target
      const existing = this.room.littleGirlPeekResults[playerId];
      if (existing) {
        if (!existing.caught) {
          const wolfKillAction = this.room.nightActions.find((a) => a.type === 'KILL');
          const target = wolfKillAction ? this.getPlayer(wolfKillAction.targetId) : null;
          existing.targetName = target?.name;
        }
        this.notify();
        return { success: true };
      }

      const caught = Math.random() < 0.3;
      if (caught) {
        this.room.littleGirlPeekResults[playerId] = {
          werewolfNames: [],
          caught: true,
        };
      } else {
        const wolfNames = this.room.players
          .filter(
            (p) =>
              p.isAlive &&
              (p.role === 'WEREWOLF' || p.role === 'WOLF_CUB' || p.role === 'WHITE_WOLF')
          )
          .map((p) => p.name);
        const wolfKillAction = this.room.nightActions.find((a) => a.type === 'KILL');
        const target = wolfKillAction ? this.getPlayer(wolfKillAction.targetId) : null;
        this.room.littleGirlPeekResults[playerId] = {
          werewolfNames: wolfNames,
          targetName: target?.name,
          caught: false,
        };
      }
      this.notify();
      return { success: true };
    }

    // Seer restriction: only 1 player inspection per night
    if (type === 'INVESTIGATE') {
      const alreadyInvestigated = this.room.nightActions.some(
        (a) => a.actorId === playerId && a.type === 'INVESTIGATE'
      );
      if (alreadyInvestigated || this.seerResults.has(playerId)) {
        return { success: false, error: 'The Seer may only inspect one soul per night' };
      }
    }

    // Remove existing action of this type by this player
    this.room.nightActions = this.room.nightActions.filter(
      (a) => !(a.actorId === playerId && a.type === type)
    );

    this.room.nightActions.push({
      actorId: playerId,
      role: player.role,
      type,
      targetId,
      secondaryTargetId,
      chosenRole,
    });

    player.targetId = targetId;

    let computedSeerResult: SeerResult | undefined = undefined;
    if (type === 'INVESTIGATE') {
      const targetPlayer = this.getPlayer(targetId);
      if (targetPlayer) {
        // Appears as Werewolf: Werewolf, Wolf Cub, White Wolf, or Lycan
        const appearsAsWolf =
          targetPlayer.role === 'WEREWOLF' ||
          targetPlayer.role === 'WOLF_CUB' ||
          targetPlayer.role === 'WHITE_WOLF' ||
          targetPlayer.role === 'LYCAN';

        computedSeerResult = {
          targetId: targetPlayer.id,
          targetName: targetPlayer.name,
          isWerewolf: appearsAsWolf,
          revealedRole: appearsAsWolf ? 'WEREWOLF' : 'VILLAGER',
          alignment: appearsAsWolf ? 'Werewolf' : 'Good Team',
        };
        this.seerResults.set(playerId, computedSeerResult);
        if (!this.seerHistory.has(playerId)) {
          this.seerHistory.set(playerId, new Map());
        }
        this.seerHistory.get(playerId)!.set(targetId, computedSeerResult);
      }
    }

    this.notify();
    return { success: true, seerResult: computedSeerResult };
  }

  // VOTING SUBMISSION
  public submitVote(playerId: string, targetId: string | null): { success: boolean; error?: string } {
    if (this.room.phase !== 'VOTING') {
      return { success: false, error: 'Not the voting phase' };
    }

    const player = this.getPlayer(playerId);
    if (!player || !player.isAlive) {
      return { success: false, error: 'Only living players may cast a vote' };
    }

    this.room.votes[playerId] = targetId;
    player.hasVoted = true;
    player.voteTargetId = targetId;

    // Check if all alive players have voted
    const aliveCount = this.room.players.filter((p) => p.isAlive).length;
    const voteCount = Object.keys(this.room.votes).length;

    this.notify();

    if (voteCount >= aliveCount) {
      // All votes in! Advance immediately, no waiting for the remaining timer
      this.clearTimer();
      this.resolveVotes();
    }

    return { success: true };
  }

  // BOT PHASE HANDLER
  private handleBotActionsForPhase(phase: GamePhase) {
    if (phase === 'NIGHT') {
      // Simulate bots choosing night targets after 2-4 seconds
      setTimeout(() => {
        if (this.room.phase === 'NIGHT') {
          const botActions = getBotNightActions(this.room.players);
          for (const act of botActions) {
            this.room.nightActions.push(act);
          }
          this.notify();
        }
      }, 2500);
    } else if (phase === 'DISCUSSION') {
      // Have a bot say something in public chat during discussion
      const aliveBots = this.room.players.filter((p) => p.isAlive && p.isBot);
      if (aliveBots.length > 0 && Math.random() > 0.3) {
        setTimeout(() => {
          if (this.room.phase === 'DISCUSSION') {
            const speaker = aliveBots[Math.floor(Math.random() * aliveBots.length)];
            const text = getBotChatMessage(speaker);
            this.onChatMessage('PUBLIC', {
              id: 'bot-msg-' + Math.random().toString(36).substring(2, 9),
              senderId: speaker.id,
              senderName: speaker.name,
              senderAvatar: speaker.avatar,
              channel: 'PUBLIC',
              text,
              timestamp: Date.now(),
            });
          }
        }, 4000);
      }
    } else if (phase === 'VOTING') {
      // Bots cast votes quickly within 1.5 seconds
      setTimeout(() => {
        if (this.room.phase === 'VOTING') {
          const botVotes = getBotVotes(this.room.players);
          for (const [botId, targetId] of Object.entries(botVotes)) {
            const bot = this.getPlayer(botId);
            if (bot && bot.isAlive) {
              this.room.votes[botId] = targetId;
              bot.hasVoted = true;
              bot.voteTargetId = targetId;
            }
          }
          this.notify();

          // Check if all votes in
          const aliveCount = this.room.players.filter((p) => p.isAlive).length;
          if (Object.keys(this.room.votes).length >= aliveCount) {
            this.clearTimer();
            this.resolveVotes();
          }
        }
      }, 1500);
    } else if (phase === 'HUNTER_ACTION') {
      const hunter = this.room.hunterPendingId ? this.getPlayer(this.room.hunterPendingId) : null;
      if (hunter && hunter.isBot) {
        setTimeout(() => {
          if (this.room.phase === 'HUNTER_ACTION') {
            const aliveTargets = this.room.players.filter((p) => p.isAlive && p.id !== hunter.id);
            if (aliveTargets.length > 0) {
              const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
              this.hunterShoot(hunter.id, target.id);
            }
          }
        }, 2500);
      }
    }
  }

  private addEvent(type: GameEvent['type'], message: string, targetPlayerId?: string) {
    this.room.events.unshift({
      id: 'ev-' + Math.random().toString(36).substring(2, 9),
      type,
      message,
      round: this.room.round,
      timestamp: Date.now(),
      targetPlayerId,
    });
    if (this.room.events.length > 40) {
      this.room.events.pop();
    }
  }

  // STATE SANITIZATION: Never leak other players' secret roles to non-eligible clients
  public getSanitizedState(forPlayerId: string): ClientGameState {
    const requester = this.getPlayer(forPlayerId);
    const isGameOver = this.room.phase === 'GAME_OVER';

    const isSeer = requester?.role === 'SEER';
    const isWerewolf =
      requester?.role === 'WEREWOLF' ||
      requester?.role === 'WOLF_CUB' ||
      requester?.role === 'WHITE_WOLF' ||
      (requester?.role === 'CURSED' && requester?.team === 'WEREWOLVES');

    const seerKnown = isSeer ? this.seerHistory.get(forPlayerId) : undefined;

    // Werewolf victim roles: Secret dictionary visible EXCLUSIVELY to werewolves!
    const werewolfVictimRoles: Record<string, Role> = {};
    if (isWerewolf) {
      for (const kill of this.room.werewolfKillsHistory) {
        werewolfVictimRoles[kill.victimId] = kill.victimRole;
      }
    }

    // Calculate vote counts (Mayor vote counts double!)
    const voteCounts: Record<string, number> = {};
    for (const [voterId, targetId] of Object.entries(this.room.votes)) {
      if (targetId) {
        const voter = this.getPlayer(voterId);
        const weight = voter && voter.role === 'MAYOR' ? 2 : 1;
        voteCounts[targetId] = (voteCounts[targetId] || 0) + weight;
      }
    }

    const clientPlayers: ClientPlayer[] = this.room.players.map((p) => {
      let roleToReveal: Role | undefined = undefined;
      const isWolfTeammate =
        isWerewolf &&
        (p.role === 'WEREWOLF' || p.role === 'WOLF_CUB' || p.role === 'WHITE_WOLF');

      const killedByWolf = this.room.werewolfKillsHistory.some((k) => k.victimId === p.id);

      if (isGameOver) {
        roleToReveal = p.role;
      } else if (p.id === forPlayerId) {
        roleToReveal = p.role;
      } else if (isWolfTeammate) {
        roleToReveal = p.role;
      } else if (!p.isAlive && killedByWolf) {
        // EXCLUSIVE WEREWOLF REVEAL: Werewolves see the secret role of their killed prey, others NEVER see it!
        if (isWerewolf) {
          roleToReveal = p.role;
        }
      } else if (!p.isAlive && !killedByWolf && this.room.settings.revealRoleOnDeath) {
        roleToReveal = p.role;
      } else if (isSeer && seerKnown && seerKnown.has(p.id)) {
        // The seer has investigated this player!
        roleToReveal = seerKnown.get(p.id)!.revealedRole;
      }

      // Werewolves can see what each werewolf teammate is targeting at night
      const canSeeTargetId = p.id === forPlayerId || isWolfTeammate;

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
        isReady: p.isReady,
        isAlive: p.isAlive,
        isBot: p.isBot,
        connected: p.connected,
        role: roleToReveal,
        targetId: canSeeTargetId ? p.targetId : undefined,
        votesReceived: voteCounts[p.id] || 0,
        hasVoted: p.hasVoted,
      };
    });

    // Werewolf teammate knowledge & night votes (ONLY shared among werewolves)
    let werewolfTeammates: { id: string; name: string }[] | undefined = undefined;
    let werewolfVotes: WerewolfVoteRecord[] | undefined = undefined;
    if (isWerewolf) {
      werewolfTeammates = this.room.players
        .filter(
          (p) =>
            p.role === 'WEREWOLF' ||
            p.role === 'WOLF_CUB' ||
            p.role === 'WHITE_WOLF' ||
            p.team === 'WEREWOLVES'
        )
        .map((p) => ({ id: p.id, name: p.name }));

      werewolfVotes = this.room.nightActions
        .filter((a) => a.type === 'KILL')
        .map((a) => {
          const wolf = this.getPlayer(a.actorId);
          const victim = this.getPlayer(a.targetId);
          return {
            werewolfId: a.actorId,
            werewolfName: wolf?.name || 'Werewolf',
            targetId: a.targetId,
            targetName: victim?.name || 'Unknown',
          };
        });
    }

    // Witch potion knowledge
    let witchPotions: WitchPotions | undefined = undefined;
    if (requester && requester.role === 'WITCH') {
      const wolfActions = this.room.nightActions.filter((a) => a.type === 'KILL');
      const counts: Record<string, number> = {};
      for (const a of wolfActions) {
        counts[a.targetId] = (counts[a.targetId] || 0) + 1;
      }
      let topVictimId: string | null = null;
      let maxCnt = 0;
      for (const [tid, cnt] of Object.entries(counts)) {
        if (cnt > maxCnt) {
          maxCnt = cnt;
          topVictimId = tid;
        }
      }
      const victim = topVictimId ? this.getPlayer(topVictimId) : null;
      const isWitchVictim = victim ? victim.id === requester.id : false;

      witchPotions = {
        healAvailable: !this.room.witchHealUsed,
        poisonAvailable: !this.room.witchPoisonUsed,
        nightVictimId: victim ? victim.id : null,
        nightVictimName: victim ? (isWitchVictim ? `${victim.name} (YOU!)` : victim.name) : null,
        isWitchTargeted: isWitchVictim,
      };
    }

    // Lovers knowledge: Only shared with the two lovers!
    let lovers: { partnerId: string; partnerName: string } | undefined = undefined;
    if (this.room.lovers && requester && this.room.lovers.includes(requester.id)) {
      const partnerId = this.room.lovers.find((id) => id !== requester.id)!;
      const partner = this.getPlayer(partnerId);
      lovers = {
        partnerId,
        partnerName: partner?.name || 'Beloved Lover',
      };
    }

    // Cupid knowledge: Cupid knows whom they have bound!
    let cupidLovers: { lover1Id: string; lover1Name: string; lover2Id: string; lover2Name: string } | undefined = undefined;
    if (requester?.role === 'CUPID' && this.room.lovers && this.room.lovers.length === 2) {
      const p1 = this.getPlayer(this.room.lovers[0]);
      const p2 = this.getPlayer(this.room.lovers[1]);
      cupidLovers = {
        lover1Id: this.room.lovers[0],
        lover1Name: p1?.name || 'Lover 1',
        lover2Id: this.room.lovers[1],
        lover2Name: p2?.name || 'Lover 2',
      };
    }

    // Mason teammates knowledge: Masons recognize each other
    let masonTeammates: { id: string; name: string }[] | undefined = undefined;
    if (requester?.role === 'MASON') {
      masonTeammates = this.room.players
        .filter((p) => p.role === 'MASON')
        .map((p) => ({ id: p.id, name: p.name }));
    }

    // Doppelganger target
    let doppelgangerTargetId: string | undefined = undefined;
    let doppelgangerTargetName: string | undefined = undefined;
    if (requester?.role === 'DOPPELGANGER' && this.room.doppelgangerBinds[forPlayerId]) {
      doppelgangerTargetId = this.room.doppelgangerBinds[forPlayerId];
      const boundTarget = this.getPlayer(this.room.doppelgangerBinds[forPlayerId]);
      doppelgangerTargetName = boundTarget?.name;
    }

    // White Wolf special kill available on even nights
    const whiteWolfCanKillTonight = requester?.role === 'WHITE_WOLF' && this.room.round % 2 === 0;

    // Little Girl peek results
    let littleGirlPeekResult = this.room.littleGirlPeekResults[forPlayerId] || null;
    if (requester?.role === 'LITTLE_GIRL' && littleGirlPeekResult && !littleGirlPeekResult.caught) {
      const wolfKillAction = this.room.nightActions.find((a) => a.type === 'KILL');
      const target = wolfKillAction ? this.getPlayer(wolfKillAction.targetId) : null;
      littleGirlPeekResult = {
        ...littleGirlPeekResult,
        targetName: target?.name,
      };
    }

    // Unready players
    const unreadyPlayerNames = this.room.players.filter((p) => !p.isReady).map((p) => p.name);

    // Latest deaths with confidential role masking:
    // If killed by werewolf, role is ONLY visible to werewolves!
    const sanitizedLatestDeaths = this.room.latestDeaths.map((death) => {
      if (death.reason === 'WEREWOLF') {
        const killRecord = this.room.werewolfKillsHistory.find((k) => k.victimId === death.id);
        return {
          ...death,
          role: isWerewolf && killRecord ? killRecord.victimRole : undefined,
        };
      }
      return death;
    });

    // Player's registered night action
    const currentNightAction = this.room.nightActions.find((a) => a.actorId === forPlayerId);
    const myNightAction = currentNightAction
      ? { type: currentNightAction.type, targetId: currentNightAction.targetId }
      : undefined;

    return {
      roomId: this.room.id,
      roomCode: this.room.code,
      phase: this.room.phase,
      round: this.room.round,
      timer: this.room.timer,
      timerMax: this.room.timerMax,
      players: clientPlayers,
      myPlayerId: forPlayerId,
      myRole: requester?.role,
      myTeam: requester?.team,
      myNightAction,
      isHost: requester?.isHost || false,
      werewolfTeammates,
      werewolfVotes,
      werewolfVictimRoles: isWerewolf ? werewolfVictimRoles : undefined,
      seerResult: this.seerResults.get(forPlayerId) || null,
      seerHistory: isSeer && seerKnown ? Array.from(seerKnown.values()) : undefined,
      witchPotions,
      lovers,
      cupidLovers,
      masonTeammates,
      thiefReserveRoles:
        requester?.role === 'THIEF' && this.room.round === 1 ? this.room.thiefReserveRoles : undefined,
      doppelgangerTargetId,
      doppelgangerTargetName,
      whiteWolfCanKillTonight,
      littleGirlPeekResult,
      unreadyPlayerNames,
      isMayor: requester?.role === 'MAYOR',
      votes: this.room.votes,
      voteCounts,
      latestDeaths: sanitizedLatestDeaths,
      morningProtections: this.room.morningProtections
        ? this.room.morningProtections.map((p) => ({
            role: p.role,
            targetName: p.targetName,
            wasAttackedAndSaved: p.wasAttackedAndSaved,
          }))
        : [],
      hunterPendingId: this.room.hunterPendingId,
      hunterEliminationReason: this.room.hunterEliminationReason || null,
      winnerTeam: this.room.winnerTeam,
      winReason: this.room.winReason || undefined,
      events: this.room.events,
      settings: this.room.settings,
    };
  }

  private notify() {
    this.onStateChange(this);
  }

  public destroy() {
    this.clearTimer();
  }
}
