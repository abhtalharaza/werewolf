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
      hunterPendingId: null,
      winnerTeam: null,
      winReason: null,
      createdAt: Date.now(),
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

  public updateSettings(settings: Partial<GameSettings>) {
    if (this.room.phase !== 'LOBBY') return;
    this.room.settings = { ...this.room.settings, ...settings };
    if (settings.roomName) this.room.name = settings.roomName;
    this.notify();
  }

  // START GAME
  public startGame(requesterId: string): { success: boolean; error?: string } {
    const requester = this.getPlayer(requesterId);
    if (!requester || !requester.isHost) {
      return { success: false, error: 'Only the host can start the game' };
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
    this.room.winnerTeam = null;
    this.room.winReason = null;
    this.seerResults.clear();

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
    this.setPhase('NIGHT', this.room.settings.nightTime);
    this.addEvent('PHASE_CHANGE', `Night falls upon the village. Round ${this.room.round}.`);
  }

  private resolveNightAndStartDay() {
    // Resolve actions
    const resolution = resolveNightActions(this.room.nightActions, this.room.players);

    // Store seer report
    if (resolution.seerReport) {
      const targetPlayer = this.getPlayer(resolution.seerReport.targetId);
      const res: SeerResult = {
        targetId: resolution.seerReport.targetId,
        targetName: targetPlayer?.name || 'Unknown',
        isWerewolf: resolution.seerReport.isWerewolf,
        revealedRole: resolution.seerReport.role,
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
        deaths.push({
          id: player.id,
          name: player.name,
          role: this.room.settings.revealRoleOnDeath ? player.role : undefined,
          reason: killed.reason,
          round: this.room.round,
        });
        this.addEvent(
          'DEATH',
          `${player.name} was slain during the shadows of the night. (${killed.reason.toLowerCase()})`
        );
      }
    }

    this.room.latestDeaths = deaths;

    // Check win condition
    const win = checkWinCondition(this.room.players);
    if (win.gameOver) {
      this.endGame(win.winnerTeam!, win.reason);
      return;
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
    // Tally votes
    const counts: Record<string, number> = {};
    let skipCount = 0;

    for (const targetId of Object.values(this.room.votes)) {
      if (targetId === null) {
        skipCount++;
      } else {
        counts[targetId] = (counts[targetId] || 0) + 1;
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
        deaths.push({
          id: eliminated.id,
          name: eliminated.name,
          role: this.room.settings.revealRoleOnDeath ? eliminated.role : undefined,
          reason: 'VOTE',
          round: this.room.round,
        });
        this.addEvent('DEATH', `${eliminated.name} was sentenced to the gallows by the village council.`);

        // Check if eliminated player is hunter
        if (eliminated.role === 'HUNTER') {
          this.room.hunterPendingId = eliminated.id;
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
      this.addEvent('HUNTER_SHOT', `${hunter?.name || 'The Hunter'} draws their final arrow in vengeance!`);
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
      this.addEvent('HUNTER_SHOT', `${target.name} was brought down by the Hunter's parting shot!`);
    }

    this.room.hunterPendingId = null;
    this.clearTimer();
    this.afterVoteResult();
  }

  private resolveHunterAction() {
    // If timer ran out without a shot, pick random alive player or forfeit
    if (this.room.hunterPendingId) {
      const alive = this.room.players.filter((p) => p.isAlive && p.id !== this.room.hunterPendingId);
      if (alive.length > 0) {
        const target = alive[Math.floor(Math.random() * alive.length)];
        this.hunterShoot(this.room.hunterPendingId, target.id);
        return;
      }
      this.room.hunterPendingId = null;
    }
    this.afterVoteResult();
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
    type: 'KILL' | 'INVESTIGATE' | 'PROTECT' | 'GUARD' | 'POISON' | 'HEAL',
    targetId: string
  ): { success: boolean; error?: string; seerResult?: SeerResult } {
    if (this.room.phase !== 'NIGHT') {
      return { success: false, error: 'Not the night phase' };
    }

    const player = this.getPlayer(playerId);
    if (!player || !player.isAlive) {
      return { success: false, error: 'Player cannot act' };
    }

    // Role validation
    if (type === 'KILL' && player.role !== 'WEREWOLF') {
      return { success: false, error: 'Only werewolves can attack' };
    }
    if (type === 'INVESTIGATE' && player.role !== 'SEER') {
      return { success: false, error: 'Only the seer can investigate' };
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
    if (type === 'PROTECT' && player.role !== 'DOCTOR') {
      return { success: false, error: 'Only the doctor can heal/protect' };
    }
    if (type === 'GUARD' && player.role !== 'BODYGUARD') {
      return { success: false, error: 'Only the bodyguard can guard' };
    }
    if ((type === 'POISON' || type === 'HEAL') && player.role !== 'WITCH') {
      return { success: false, error: 'Only the witch can use potions' };
    }

    if (type === 'HEAL' && this.room.witchHealUsed) {
      return { success: false, error: 'Heal potion has already been consumed' };
    }
    if (type === 'POISON' && this.room.witchPoisonUsed) {
      return { success: false, error: 'Poison potion has already been consumed' };
    }

    if (type === 'HEAL') this.room.witchHealUsed = true;
    if (type === 'POISON') this.room.witchPoisonUsed = true;

    // Remove existing action of this type by this player
    this.room.nightActions = this.room.nightActions.filter(
      (a) => !(a.actorId === playerId && a.type === type)
    );

    this.room.nightActions.push({
      actorId: playerId,
      role: player.role,
      type,
      targetId,
    });

    player.targetId = targetId;

    let computedSeerResult: SeerResult | undefined = undefined;
    if (type === 'INVESTIGATE') {
      const targetPlayer = this.getPlayer(targetId);
      if (targetPlayer) {
        computedSeerResult = {
          targetId: targetPlayer.id,
          targetName: targetPlayer.name,
          isWerewolf: targetPlayer.role === 'WEREWOLF',
          revealedRole: targetPlayer.role,
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

    // Calculate vote counts if in voting or result
    const voteCounts: Record<string, number> = {};
    for (const targetId of Object.values(this.room.votes)) {
      if (targetId) {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }
    }

    const isSeer = requester?.role === 'SEER';
    const isWerewolf = requester?.role === 'WEREWOLF';
    const seerKnown = isSeer ? this.seerHistory.get(forPlayerId) : undefined;

    const clientPlayers: ClientPlayer[] = this.room.players.map((p) => {
      let roleToReveal: Role | undefined = undefined;
      const isWolfTeammate = isWerewolf && p.role === 'WEREWOLF';

      if (isGameOver) {
        roleToReveal = p.role;
      } else if (p.id === forPlayerId) {
        roleToReveal = p.role;
      } else if (isWolfTeammate) {
        roleToReveal = 'WEREWOLF';
      } else if (!p.isAlive && this.room.settings.revealRoleOnDeath) {
        roleToReveal = p.role;
      } else if (isSeer && seerKnown && seerKnown.has(p.id)) {
        // The seer has investigated this player! Reveal their true role to the seer
        roleToReveal = p.role;
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
        .filter((p) => p.role === 'WEREWOLF')
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
      const wolfAction = this.room.nightActions.find((a) => a.type === 'KILL');
      const victim = wolfAction ? this.getPlayer(wolfAction.targetId) : null;
      witchPotions = {
        healAvailable: !this.room.witchHealUsed,
        poisonAvailable: !this.room.witchPoisonUsed,
        nightVictimId: victim ? victim.id : null,
        nightVictimName: victim ? victim.name : null,
      };
    }

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
      isHost: requester?.isHost || false,
      werewolfTeammates,
      werewolfVotes,
      seerResult: this.seerResults.get(forPlayerId) || null,
      seerHistory:
        isSeer && seerKnown ? Array.from(seerKnown.values()) : undefined,
      witchPotions,
      votes: this.room.votes,
      voteCounts,
      latestDeaths: this.room.latestDeaths,
      hunterPendingId: this.room.hunterPendingId,
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
