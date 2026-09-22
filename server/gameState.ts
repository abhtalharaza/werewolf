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
  private botSkipTimeouts: NodeJS.Timeout[] = [];

  private clearBotSkipTimeouts() {
    for (const t of this.botSkipTimeouts) {
      clearTimeout(t);
    }
    this.botSkipTimeouts = [];
  }

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
      witchGracePeriodGiven: false,
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
      silencedPlayerId: null,
      bearGrowl: null,
      toughGuyWoundedAtRound: null,
      dousedPlayerIds: [],
      wildChildModelId: null,
      dictatorCoupUsed: false,
      dictatorGuiltPending: false,
      dictatorPlayerId: null,
      veteranAlertsRemaining: {},
      amnesiacRememberedIds: [],
      skipDiscussionVotes: [],
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

    const hasConnectedHost = this.room.players.some((p) => p.isHost && p.connected);
    const shouldBeHost = Boolean(playerData.isHost) || !hasConnectedHost;

    const newPlayer: ServerPlayer = {
      ...playerData,
      isHost: shouldBeHost,
      isReady: shouldBeHost ? true : false,
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
    this.room.settings = {
      ...this.room.settings,
      ...settings,
      roleDistribution: settings.roleDistribution
        ? { ...this.room.settings.roleDistribution, ...settings.roleDistribution }
        : this.room.settings.roleDistribution,
    };
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
    this.room.silencedPlayerId = null;
    this.room.bearGrowl = null;
    this.room.toughGuyWoundedAtRound = null;
    this.room.dousedPlayerIds = [];
    this.room.wildChildModelId = null;
    this.room.dictatorCoupUsed = false;
    this.room.dictatorGuiltPending = false;
    this.room.dictatorPlayerId = null;
    this.room.veteranAlertsRemaining = {};
    this.room.amnesiacRememberedIds = [];
    this.room.players.forEach((p) => {
      if (p.role === 'VETERAN') {
        this.room.veteranAlertsRemaining[p.id] = 3;
      }
    });

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

  private startWitchGraceTimer() {
    this.clearTimer();
    this.room.intervalId = setInterval(() => {
      this.room.timer--;
      if (this.room.timer <= 0) {
        this.clearTimer();
        this.resolveNightAndStartDay();
      } else {
        this.notify();
      }
    }, 1000);
  }

  private startNightPhase() {
    this.room.nightActions = [];
    this.room.witchGracePeriodGiven = false;
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

    const hasAliveWitch = this.room.players.some(
      (p) => p.role === 'WITCH' && p.isAlive
    );
    const nightDuration = hasAliveWitch ? 20 : this.room.settings.nightTime;

    this.setPhase('NIGHT', nightDuration);
    this.addEvent(
      'PHASE_CHANGE',
      hasAliveWitch
        ? `Night fell upon the village (20s). Werewolves hunt for 15s; the Witch holds nocturnal sway for 20s with an exclusive 5s decision window!`
        : `Night fell upon the village (${nightDuration}s). Werewolves hunt throughout the entire night!`
    );
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
      dousedPlayerIds: this.room.dousedPlayerIds,
    });

    // Witch potion permanence: Mark potions as used if executed tonight
    if (this.room.nightActions.some((a) => a.type === 'HEAL')) {
      this.room.witchHealUsed = true;
    }
    if (this.room.nightActions.some((a) => a.type === 'POISON')) {
      this.room.witchPoisonUsed = true;
    }

    // Only record protections where the player was actually attacked and saved
    this.room.morningProtections = (resolution.protections || []).filter(
      (p) => p.wasAttackedAndSaved
    );

    // Announce if any player was saved by the Witch's Elixir of Life
    for (const prot of this.room.morningProtections) {
      if (prot.role === 'WITCH') {
        this.addEvent(
          'SYSTEM',
          `✨ The Witch secretly administered the mystic Elixir of Life! ${prot.targetName} was rescued from death's door!`
        );
      }
    }

    this.room.enragedWolvesThisNight = false;

    // Track newly doused player
    if (
      resolution.newDousedPlayerId &&
      !this.room.dousedPlayerIds.includes(resolution.newDousedPlayerId)
    ) {
      this.room.dousedPlayerIds.push(resolution.newDousedPlayerId);
      const dousedPlayer = this.getPlayer(resolution.newDousedPlayerId);
      this.addEvent(
        'SYSTEM',
        `A pungent stench of gasoline lingers in the night air around the village...`
      );
    }

    // Set silenced player for the day
    this.room.silencedPlayerId = resolution.silencedPlayerId || null;
    if (this.room.silencedPlayerId) {
      const silencedP = this.getPlayer(this.room.silencedPlayerId);
      this.addEvent(
        'SPELLCASTER_SILENCE',
        `🔮 ${silencedP?.name || 'A player'} was struck with a dark silence hex by the Spellcaster! If they speak today, they will die instantly!`
      );
    }

    // Tough Guy wounded handling
    if (resolution.toughGuyWoundedId) {
      this.room.toughGuyWoundedAtRound = this.room.round;
      const tg = this.getPlayer(resolution.toughGuyWoundedId);
      this.addEvent(
        'SYSTEM',
        `🩸 ${tg?.name} (Tough Guy) was attacked in the shadows by Werewolves, but their iron grit keeps them standing for one more day!`
      );
    }

    // Check if Tough Guy succumbs from previous night's wounds
    if (
      this.room.toughGuyWoundedAtRound !== null &&
      this.room.round > this.room.toughGuyWoundedAtRound
    ) {
      const woundedTg = this.room.players.find(
        (p) => p.role === 'TOUGH_GUY' && p.isAlive
      );
      if (woundedTg) {
        resolution.killedPlayerIds.push({
          id: woundedTg.id,
          reason: 'TOUGH_GUY_WOUND',
        });
      }
      this.room.toughGuyWoundedAtRound = null;
    }

    // Check Dictator guilt suicide from previous day's coup
    if (this.room.dictatorGuiltPending && this.room.dictatorPlayerId) {
      const dictator = this.getPlayer(this.room.dictatorPlayerId);
      if (dictator && dictator.isAlive) {
        resolution.killedPlayerIds.push({
          id: dictator.id,
          reason: 'DICTATOR_SUICIDE',
        });
      }
      this.room.dictatorGuiltPending = false;
    }

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
        if (killed.reason === 'SERIAL_KILLER') deathMsg = `🔪 ${player.name} was butchered in cold blood by the Serial Killer!`;
        if (killed.reason === 'ARSONIST') deathMsg = `🔥 ${player.name} was doused and incinerated in a blazing inferno by the Arsonist!`;
        if (killed.reason === 'VETERAN_SHOT') deathMsg = `💥 ${player.name} targeted a Veteran on alert and was blasted to death!`;
        if (killed.reason === 'TOUGH_GUY_WOUND') deathMsg = `🩸 ${player.name} (Tough Guy) finally collapsed from the fatal werewolf wounds sustained earlier!`;
        if (killed.reason === 'DICTATOR_SUICIDE') deathMsg = `⚖️ ${player.name} the Dictator, tortured by the guilt of executing an innocent, ended their own life in the night!`;

        this.addEvent('DEATH', deathMsg);

        // Wild Child check: Did their Role Model perish?
        if (this.room.wildChildModelId === player.id) {
          const wildChild = this.room.players.find(
            (p) => p.role === 'WILD_CHILD' && p.isAlive
          );
          if (wildChild) {
            wildChild.role = 'WEREWOLF';
            wildChild.team = 'WEREWOLVES';
            this.addEvent(
              'WILD_CHILD_TRANSFORM',
              `🐺 ${wildChild.name}'s beloved Role Model has died! Consumed by grief and primal fury, the Wild Child has become a WEREWOLF!`
            );
          }
        }
      }
    }

    // Amnesiac Awakening: Has any living Amnesiac chosen to remember a fallen soul?
    const amnesiacActions = this.room.nightActions.filter((a) => a.type === 'AMNESIAC_REMEMBER');
    for (const act of amnesiacActions) {
      const amnPlayer = this.getPlayer(act.actorId);
      const deadTarget = this.getPlayer(act.targetId);
      if (amnPlayer && amnPlayer.isAlive && deadTarget) {
        const rememberedRole = deadTarget.role;
        amnPlayer.role = rememberedRole;
        amnPlayer.team = getRoleTeam(rememberedRole);
        if (rememberedRole === 'VETERAN' && !this.room.veteranAlertsRemaining[amnPlayer.id]) {
          this.room.veteranAlertsRemaining[amnPlayer.id] = 3;
        }
        if (!this.room.amnesiacRememberedIds.includes(amnPlayer.id)) {
          this.room.amnesiacRememberedIds.push(amnPlayer.id);
        }

        // Public announcement: Suspense! Everyone knows an Amnesiac remembered, but not what role they became!
        this.addEvent(
          'AMNESIAC_REMEMBER',
          `📢 Ek Amnesiac ko yaad aa gaya hai ki wo kaun tha! (An Amnesiac remembered who they were!)`
        );
      }
    }

    // Clean up doused list for any deceased players
    this.room.dousedPlayerIds = this.room.dousedPlayerIds.filter((id) => {
      const p = this.getPlayer(id);
      return p && p.isAlive;
    });

    // Bear Tamer check: Does the bear growl at dawn?
    const aliveBearTamer = this.room.players.find(
      (p) => p.role === 'BEAR_TAMER' && p.isAlive
    );
    if (aliveBearTamer) {
      const livingPlayers = this.room.players.filter((p) => p.isAlive);
      const btIdx = livingPlayers.findIndex((p) => p.id === aliveBearTamer.id);
      if (btIdx !== -1 && livingPlayers.length > 1) {
        const leftNeighbor =
          livingPlayers[(btIdx - 1 + livingPlayers.length) % livingPlayers.length];
        const rightNeighbor = livingPlayers[(btIdx + 1) % livingPlayers.length];
        const isLeftWolf =
          leftNeighbor &&
          (leftNeighbor.role === 'WEREWOLF' ||
            leftNeighbor.role === 'WOLF_CUB' ||
            leftNeighbor.role === 'WHITE_WOLF');
        const isRightWolf =
          rightNeighbor &&
          (rightNeighbor.role === 'WEREWOLF' ||
            rightNeighbor.role === 'WOLF_CUB' ||
            rightNeighbor.role === 'WHITE_WOLF');

        this.room.bearGrowl = Boolean(isLeftWolf || isRightWolf);
        if (this.room.bearGrowl) {
          this.addEvent(
            'BEAR_GROWL',
            `🐻 ROAAAR! The Bear Tamer's bear growls aggressively! A ravenous beast sits immediately adjacent!`
          );
        } else {
          this.addEvent(
            'BEAR_GROWL',
            `🐻 The Bear Tamer's bear rests calmly. No wolves are seated beside them.`
          );
        }
      } else {
        this.room.bearGrowl = false;
      }
    } else {
      this.room.bearGrowl = null;
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
    this.clearBotSkipTimeouts();
    this.room.skipDiscussionVotes = [];
    this.setPhase('DISCUSSION', this.room.settings.discussionTime);
    this.addEvent('PHASE_CHANGE', 'Dawn breaks. The village council convenes for discussion.');
  }

  private startVotingPhase() {
    this.clearBotSkipTimeouts();
    this.room.skipDiscussionVotes = [];
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

        // Wild Child check: Did their Role Model get executed?
        if (this.room.wildChildModelId === eliminated.id) {
          const wildChild = this.room.players.find(
            (p) => p.role === 'WILD_CHILD' && p.isAlive
          );
          if (wildChild) {
            wildChild.role = 'WEREWOLF';
            wildChild.team = 'WEREWOLVES';
            this.addEvent(
              'WILD_CHILD_TRANSFORM',
              `🐺 ${wildChild.name}'s beloved Role Model was executed at the gallows! The Wild Child transforms into a WEREWOLF!`
            );
          }
        }

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

  public executeDictatorCoup(playerId: string, targetId: string): { success: boolean; error?: string } {
    if (this.room.phase !== 'DISCUSSION' && this.room.phase !== 'VOTING') {
      return { success: false, error: 'A Coup can only be staged during Day Discussion or Voting' };
    }
    const player = this.getPlayer(playerId);
    if (!player || !player.isAlive || player.role !== 'DICTATOR') {
      return { success: false, error: 'Only the living Dictator can stage a Coup' };
    }
    if (this.room.dictatorCoupUsed) {
      return { success: false, error: 'The Coup has already been executed this game' };
    }
    const target = this.getPlayer(targetId);
    if (!target || !target.isAlive) {
      return { success: false, error: 'Invalid execution target' };
    }
    if (targetId === playerId) {
      return { success: false, error: 'You cannot execute yourself' };
    }

    this.room.dictatorCoupUsed = true;
    this.room.dictatorPlayerId = playerId;
    this.clearTimer();

    this.addEvent(
      'DICTATOR_COUP',
      `👑 COUP D'ÉTAT! ${player.name} steps forward, revealing themselves as THE DICTATOR! Halting village voting and personally executing ${target.name}!`
    );

    target.isAlive = false;
    const isWolf =
      target.role === 'WEREWOLF' ||
      target.role === 'WOLF_CUB' ||
      target.role === 'WHITE_WOLF' ||
      (target.role === 'CURSED' && target.team === 'WEREWOLVES');

    this.room.latestDeaths = [
      {
        id: target.id,
        name: target.name,
        role: this.room.settings.revealRoleOnDeath ? target.role : undefined,
        reason: 'DICTATOR_EXECUTE',
        round: this.room.round,
      },
    ];

    this.addEvent(
      'DEATH',
      `⚖️ ${target.name} (${target.role}) was executed under the absolute authority of Dictator ${player.name}!`
    );

    if (isWolf) {
      this.addEvent(
        'SYSTEM',
        `🎯 ${target.name} WAS a Werewolf! Dictator ${player.name}'s autocratic judgment protected the village!`
      );
    } else {
      this.room.dictatorGuiltPending = true;
      this.addEvent(
        'SYSTEM',
        `⚠️ ${target.name} was NOT a Werewolf! Stricken by overwhelming guilt and dishonor, Dictator ${player.name} will commit suicide tonight!`
      );
    }

    // Check lovers
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
          `💔 ${partner.name} died of sheer heartbreak after losing their beloved ${target.name}!`
        );
      }
    }

    // Check Wild Child
    if (this.room.wildChildModelId === target.id) {
      const wildChild = this.room.players.find((p) => p.role === 'WILD_CHILD' && p.isAlive);
      if (wildChild) {
        wildChild.role = 'WEREWOLF';
        wildChild.team = 'WEREWOLVES';
        this.addEvent(
          'WILD_CHILD_TRANSFORM',
          `🐺 ${wildChild.name}'s beloved Role Model was executed! The Wild Child transforms into a WEREWOLF!`
        );
      }
    }

    const win = checkWinCondition(this.room.players);
    if (win.gameOver) {
      this.endGame(win.winnerTeam!, win.reason);
      return { success: true };
    }

    // Check if target was the Hunter taking revenge shot
    if (target.role === 'HUNTER') {
      this.room.hunterPendingId = target.id;
      this.room.hunterContext = 'DAY_VOTE';
      this.room.hunterEliminationReason = 'DICTATOR';
      this.setPhase('HUNTER_ACTION', 15);
      const hunter = this.getPlayer(this.room.hunterPendingId);
      this.addEvent(
        'HUNTER_SHOT',
        `🎯 ${hunter?.name || 'The Hunter'} was condemned by the Dictator's decree! With their dying breath, they raise their rifle for one final revenge shot!`
      );
      return { success: true };
    }

    // Transition through VOTE_RESULT so all players see the execution card and announcement
    this.setPhase('VOTE_RESULT', 7);
    return { success: true };
  }

  public eliminateSilencedViolation(playerId: string) {
    const player = this.getPlayer(playerId);
    if (!player || !player.isAlive) return;

    player.isAlive = false;
    this.room.latestDeaths.push({
      id: player.id,
      name: player.name,
      role: this.room.settings.revealRoleOnDeath ? player.role : undefined,
      reason: 'SILENCED_VIOLATION',
      round: this.room.round,
    });

    this.addEvent(
      'DEATH',
      `⚡ ${player.name} dared to speak while afflicted by the Spellcaster's Silence hex and was instantly struck dead!`
    );

    // Check lovers
    if (this.room.lovers && this.room.lovers.includes(player.id)) {
      const partnerId = this.room.lovers.find((id) => id !== player.id);
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
          `💔 ${partner.name} collapsed and died of heartbreak after ${player.name}'s sudden death!`
        );
      }
    }

    // Check Wild Child
    if (this.room.wildChildModelId === player.id) {
      const wildChild = this.room.players.find((p) => p.role === 'WILD_CHILD' && p.isAlive);
      if (wildChild) {
        wildChild.role = 'WEREWOLF';
        wildChild.team = 'WEREWOLVES';
        this.addEvent(
          'WILD_CHILD_TRANSFORM',
          `🐺 ${wildChild.name}'s beloved Role Model died! The Wild Child transforms into a WEREWOLF!`
        );
      }
    }

    const win = checkWinCondition(this.room.players);
    if (win.gameOver) {
      this.endGame(win.winnerTeam!, win.reason);
    } else {
      this.notify();
    }
  }

  private endGame(winnerTeam: Team, winReason: string) {
    this.clearTimer();
    this.room.phase = 'GAME_OVER';
    this.room.winnerTeam = winnerTeam;
    this.room.winReason = winReason;

    let announcement = 'THE GAME HAS CONCLUDED.';
    if (winnerTeam === 'VILLAGERS') {
      announcement = 'VICTORY FOR THE VILLAGERS! The darkness has been vanquished.';
    } else if (winnerTeam === 'JESTER') {
      announcement = 'THE JESTER WINS! The village was duped into executing them!';
    } else if (winnerTeam === 'WHITE_WOLF') {
      announcement = 'VICTORY FOR THE WHITE WEREWOLF! The lone predator eliminated all packmates and villagers.';
    } else if (winnerTeam === 'SERIAL_KILLER') {
      announcement = 'VICTORY FOR THE SERIAL KILLER! Every last soul in the village was mercilessly butchered.';
    } else if (winnerTeam === 'ARSONIST') {
      announcement = 'VICTORY FOR THE ARSONIST! The entire village was engulfed in flame and reduced to ashes!';
    } else {
      announcement = 'VICTORY FOR THE WEREWOLVES! The village has been devoured.';
    }

    this.addEvent('GAME_WIN', announcement);

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
    this.clearBotSkipTimeouts();
    this.room.phase = 'LOBBY';
    this.room.round = 0;
    this.room.timer = 0;
    this.room.winnerTeam = null;
    this.room.winReason = null;
    this.room.latestDeaths = [];
    this.room.votes = {};
    this.room.skipDiscussionVotes = [];
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

  // VOTE TO SKIP DISCUSSION PHASE
  public toggleSkipDiscussionVote(playerId: string): { success: boolean; skipped?: boolean; error?: string } {
    if (this.room.phase !== 'DISCUSSION') {
      return { success: false, error: 'Discussion time can only be skipped during the Discussion phase.' };
    }

    const player = this.getPlayer(playerId);
    if (!player || !player.isAlive) {
      return { success: false, error: 'Only living players can vote to skip discussion.' };
    }

    if (!Array.isArray(this.room.skipDiscussionVotes)) {
      this.room.skipDiscussionVotes = [];
    }

    // Toggle current player's vote
    const index = this.room.skipDiscussionVotes.indexOf(playerId);
    if (index >= 0) {
      this.room.skipDiscussionVotes.splice(index, 1);
    } else {
      this.room.skipDiscussionVotes.push(playerId);
    }

    const livingPlayers = this.room.players.filter((p) => p.isAlive);

    // Keep only IDs of living players
    this.room.skipDiscussionVotes = this.room.skipDiscussionVotes.filter((id) =>
      livingPlayers.some((p) => p.id === id)
    );

    // CRITICAL: Discussion MUST NOT skip unless ALL living players in the game have cast their vote!
    const allLivingVoted =
      livingPlayers.length > 0 &&
      livingPlayers.every((p) => this.room.skipDiscussionVotes.includes(p.id));

    if (allLivingVoted) {
      this.clearBotSkipTimeouts();
      this.addEvent(
        'PHASE_CHANGE',
        '⏩ All living council members agreed to skip discussion! Commencing vote immediately.'
      );
      this.startVotingPhase();
      return { success: true, skipped: true };
    }

    // If not all living players have voted yet:
    const livingHumans = livingPlayers.filter((p) => !p.isBot);
    const livingHumanVotes = livingHumans.filter((h) => this.room.skipDiscussionVotes.includes(h.id));

    if (livingHumanVotes.length === 0) {
      // If all human players have retracted their skip vote, cancel bot timeouts and clear bot skip votes
      this.clearBotSkipTimeouts();
      this.room.skipDiscussionVotes = this.room.skipDiscussionVotes.filter(
        (id) => !livingPlayers.some((p) => p.id === id && p.isBot)
      );
    } else {
      // If there are bots in the game who haven't voted yet, let them deliberate and vote one by one with realistic delays
      this.scheduleBotSkipVotes();
    }

    this.notify();
    return { success: true, skipped: false };
  }

  // Schedule bots to consider skipping one-by-one so votes accumulate naturally rather than skipping instantly
  private scheduleBotSkipVotes() {
    const livingPlayers = this.room.players.filter((p) => p.isAlive);
    const unvotedBots = livingPlayers.filter(
      (p) => p.isBot && !this.room.skipDiscussionVotes.includes(p.id)
    );

    if (unvotedBots.length === 0) return;

    // Clear previously scheduled bot timeouts to prevent duplication
    this.clearBotSkipTimeouts();

    unvotedBots.forEach((bot, idx) => {
      // Stagger each bot's vote so the user sees other council members deliberating
      const delayMs = (idx + 1) * 3000 + Math.floor(Math.random() * 1200);
      const timer = setTimeout(() => {
        if (this.room.phase !== 'DISCUSSION') return;
        if (!bot.isAlive) return;

        // Ensure at least one living human player still has an active skip vote
        const currentLiving = this.room.players.filter((p) => p.isAlive);
        const hasActiveHumanSkip = currentLiving.some(
          (p) => !p.isBot && this.room.skipDiscussionVotes.includes(p.id)
        );
        if (!hasActiveHumanSkip) return;

        if (!this.room.skipDiscussionVotes.includes(bot.id)) {
          this.room.skipDiscussionVotes.push(bot.id);
        }

        // Check if ALL living players have now voted to skip
        const allNowVoted =
          currentLiving.length > 0 &&
          currentLiving.every((p) => this.room.skipDiscussionVotes.includes(p.id));

        if (allNowVoted) {
          this.clearBotSkipTimeouts();
          this.addEvent(
            'PHASE_CHANGE',
            '⏩ All living council members agreed to skip discussion! Commencing vote immediately.'
          );
          this.startVotingPhase();
        } else {
          this.notify();
        }
      }, delayMs);

      this.botSkipTimeouts.push(timer);
    });
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
      | 'CANCEL_HEAL'
      | 'CANCEL_POISON'
      | 'PASS_HEAL'
      | 'CUPID_LOVERS'
      | 'THIEF_CHOOSE'
      | 'DOPPELGANGER_BIND'
      | 'WHITE_WOLF_KILL'
      | 'LITTLE_GIRL_PEEK'
      | 'SERIAL_KILLER_KILL'
      | 'SILENCE'
      | 'ARSONIST_DOUSE'
      | 'ARSONIST_IGNITE'
      | 'WILD_CHILD_CHOOSE'
      | 'VETERAN_ALERT'
      | 'AMNESIAC_REMEMBER'
      | 'PASS_AMNESIAC',
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

    // Witch cancellation actions
    if (type === 'CANCEL_HEAL') {
      if (player.role !== 'WITCH') {
        return { success: false, error: 'Only the Witch can cancel potions' };
      }
      this.room.nightActions = this.room.nightActions.filter(
        (a) => !(a.actorId === playerId && a.type === 'HEAL')
      );
      this.notify();
      return { success: true };
    }

    if (type === 'CANCEL_POISON') {
      if (player.role !== 'WITCH') {
        return { success: false, error: 'Only the Witch can cancel potions' };
      }
      this.room.nightActions = this.room.nightActions.filter(
        (a) => !(a.actorId === playerId && a.type === 'POISON')
      );
      this.notify();
      return { success: true };
    }

    if (type === 'PASS_HEAL') {
      if (player.role !== 'WITCH') {
        return { success: false, error: 'Only the Witch can pass healing' };
      }
      // If the Witch explicitly passes during the 5s grace period, immediately conclude the night
      if (this.room.witchGracePeriodGiven) {
        this.clearTimer();
        this.resolveNightAndStartDay();
        return { success: true };
      }
      return { success: true };
    }

    const isWolfPack =
      player.role === 'WEREWOLF' ||
      player.role === 'WOLF_CUB' ||
      player.role === 'WHITE_WOLF' ||
      (player.role === 'CURSED' && player.team === 'WEREWOLVES');

    // Role validation
    if (type === 'KILL') {
      const hasAliveWitch = this.room.players.some(
        (p) => p.role === 'WITCH' && p.isAlive
      );
      if (hasAliveWitch && this.room.timer <= 5) {
        return {
          success: false,
          error: 'Werewolf hunting time has ended (15 seconds passed)! The remaining 5 seconds are exclusively for the Witch.',
        };
      }
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
    const hasLivingTrueSeer = this.room.players.some((p) => p.role === 'SEER' && p.isAlive);
    const isApprenticeSeerActive = player.role === 'APPRENTICE_SEER' && !hasLivingTrueSeer;

    if (type === 'INVESTIGATE' && player.role !== 'SEER' && !isApprenticeSeerActive) {
      return { success: false, error: 'Only the Seer (or an active Apprentice Seer) can investigate' };
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

    // Witch potion limits & target validation
    if (type === 'HEAL') {
      if (this.room.witchHealUsed) {
        return { success: false, error: 'Elixir of Life has already been used once this game' };
      }
      const targetPlayer = this.getPlayer(targetId);
      if (!targetPlayer || !targetPlayer.isAlive) {
        return { success: false, error: 'Target player is not among the living' };
      }
    }
    if (type === 'POISON') {
      if (this.room.witchPoisonUsed) {
        return { success: false, error: 'Vial of Poison has already been used once this game' };
      }
      if (targetId === playerId) {
        return { success: false, error: 'The Witch cannot poison herself' };
      }
      const targetPlayer = this.getPlayer(targetId);
      if (!targetPlayer || !targetPlayer.isAlive) {
        return { success: false, error: 'Target player is not alive' };
      }
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
      const hasAliveWitch = this.room.players.some(
        (p) => p.role === 'WITCH' && p.isAlive
      );
      if (hasAliveWitch && this.room.timer <= 5) {
        return {
          success: false,
          error: 'Werewolf hunting time has ended (15 seconds passed)! The remaining 5 seconds are exclusively for the Witch.',
        };
      }
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

    // SERIAL KILLER
    if (type === 'SERIAL_KILLER_KILL') {
      if (player.role !== 'SERIAL_KILLER') return { success: false, error: 'Only the Serial Killer can strike' };
      if (targetId === playerId) return { success: false, error: 'The Serial Killer cannot target themselves' };
      const target = this.getPlayer(targetId);
      if (!target || !target.isAlive) return { success: false, error: 'Target is invalid or already dead' };
    }

    // SPELLCASTER (SILENCER)
    if (type === 'SILENCE') {
      if (player.role !== 'SPELLCASTER') return { success: false, error: 'Only the Spellcaster can silence' };
      const target = this.getPlayer(targetId);
      if (!target || !target.isAlive) return { success: false, error: 'Target is invalid or already dead' };
    }

    // ARSONIST
    if (type === 'ARSONIST_DOUSE') {
      if (player.role !== 'ARSONIST') return { success: false, error: 'Only the Arsonist can douse' };
      if (targetId === playerId) return { success: false, error: 'The Arsonist cannot douse themselves' };
      const target = this.getPlayer(targetId);
      if (!target || !target.isAlive) return { success: false, error: 'Target is invalid or already dead' };
    }
    if (type === 'ARSONIST_IGNITE') {
      if (player.role !== 'ARSONIST') return { success: false, error: 'Only the Arsonist can ignite' };
    }

    // WILD CHILD
    if (type === 'WILD_CHILD_CHOOSE') {
      if (player.role !== 'WILD_CHILD') return { success: false, error: 'Only the Wild Child can choose a Role Model' };
      if (this.room.round !== 1 && this.room.wildChildModelId) {
        return { success: false, error: 'Role model can only be chosen on Night 1' };
      }
      if (targetId === playerId) {
        return { success: false, error: 'You cannot choose yourself as your Role Model' };
      }
      const target = this.getPlayer(targetId);
      if (!target || !target.isAlive) return { success: false, error: 'Invalid Role Model target' };
      this.room.wildChildModelId = targetId;
      this.addEvent('SYSTEM', `The Wild Child chose their beloved Role Model in the night.`);
      this.notify();
      return { success: true };
    }

    // VETERAN
    if (type === 'VETERAN_ALERT') {
      if (player.role !== 'VETERAN') return { success: false, error: 'Only the Veteran can go on Alert' };
      const remaining = this.room.veteranAlertsRemaining[playerId] ?? 3;
      if (remaining <= 0) {
        return { success: false, error: 'No alerts remaining (maximum 3 per game)' };
      }
      // Decrement alert count
      this.room.veteranAlertsRemaining[playerId] = remaining - 1;
    }

    // AMNESIAC PASS (Skip choosing tonight)
    if (type === 'PASS_AMNESIAC') {
      if (player.role !== 'AMNESIAC') return { success: false, error: 'Only the Amnesiac can pass' };
      this.room.nightActions = this.room.nightActions.filter((a) => a.actorId !== playerId);
      player.targetId = null;
      this.notify();
      return { success: true };
    }

    // AMNESIAC REMEMBER
    if (type === 'AMNESIAC_REMEMBER') {
      if (player.role !== 'AMNESIAC') return { success: false, error: 'Only the Amnesiac can remember a role' };
      if (this.room.amnesiacRememberedIds.includes(playerId)) {
        return { success: false, error: 'You have already recovered your true identity!' };
      }
      const target = this.getPlayer(targetId);
      if (!target) return { success: false, error: 'Invalid soul selected' };
      if (target.isAlive) {
        return { success: false, error: 'The Amnesiac can only remember the role of a dead (eliminated) player!' };
      }
      if (target.role === 'AMNESIAC') {
        return { success: false, error: 'You cannot remember another Amnesiac!' };
      }

      this.room.nightActions = this.room.nightActions.filter((a) => a.actorId !== playerId);
      this.room.nightActions.push({
        actorId: playerId,
        role: 'AMNESIAC',
        type: 'AMNESIAC_REMEMBER',
        targetId,
        chosenRole: target.role,
      });
      player.targetId = targetId;
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
            if (act.type === 'HEAL' && this.room.witchHealUsed) continue;
            if (act.type === 'POISON' && this.room.witchPoisonUsed) continue;
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
    const hasLivingTrueSeer = this.room.players.some((p) => p.role === 'SEER' && p.isAlive);
    const isApprenticeActive = requester?.role === 'APPRENTICE_SEER' && !hasLivingTrueSeer;
    const seerOrApprentice = isSeer || isApprenticeActive;

    const isWerewolf =
      requester?.role === 'WEREWOLF' ||
      requester?.role === 'WOLF_CUB' ||
      requester?.role === 'WHITE_WOLF' ||
      (requester?.role === 'CURSED' && requester?.team === 'WEREWOLVES');

    const seerKnown = seerOrApprentice ? this.seerHistory.get(forPlayerId) : undefined;

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

      const isMinion = requester?.role === 'MINION';
      const isWolfToMinion =
        isMinion &&
        (p.role === 'WEREWOLF' || p.role === 'WOLF_CUB' || p.role === 'WHITE_WOLF');

      if (isGameOver) {
        roleToReveal = p.role;
      } else if (p.id === forPlayerId) {
        roleToReveal = p.role;
      } else if (isWolfTeammate) {
        roleToReveal = p.role;
      } else if (isWolfToMinion) {
        // Minion learns the Werewolves on Night 1!
        roleToReveal = p.role;
      } else if (!p.isAlive && killedByWolf) {
        // EXCLUSIVE WEREWOLF REVEAL: Werewolves see the secret role of their killed prey, others NEVER see it!
        if (isWerewolf) {
          roleToReveal = p.role;
        }
      } else if (!p.isAlive && !killedByWolf && this.room.settings.revealRoleOnDeath) {
        roleToReveal = p.role;
      } else if (seerOrApprentice && seerKnown && seerKnown.has(p.id)) {
        // The Seer or active Apprentice Seer has investigated this player!
        roleToReveal = seerKnown.get(p.id)!.revealedRole;
      } else if (!p.isAlive && requester?.role === 'AMNESIAC') {
        // Amnesiac inspects all deceased players and their true roles in the graveyard
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
    } else if (requester?.role === 'MINION') {
      // Minion learns who the Werewolves are on Night 1!
      werewolfTeammates = this.room.players
        .filter(
          (p) =>
            p.isAlive &&
            (p.role === 'WEREWOLF' ||
              p.role === 'WOLF_CUB' ||
              p.role === 'WHITE_WOLF' ||
              (p.role === 'CURSED' && p.team === 'WEREWOLVES'))
        )
        .map((p) => ({ id: p.id, name: p.name }));
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

      const healAction = this.room.nightActions.find(
        (a) => a.actorId === requester.id && a.type === 'HEAL'
      );
      const healTarget = healAction ? this.getPlayer(healAction.targetId) : null;

      const poisonAction = this.room.nightActions.find(
        (a) => a.actorId === requester.id && a.type === 'POISON'
      );
      const poisonTarget = poisonAction ? this.getPlayer(poisonAction.targetId) : null;

      witchPotions = {
        healAvailable: !this.room.witchHealUsed,
        poisonAvailable: !this.room.witchPoisonUsed,
        nightVictimId: victim ? victim.id : null,
        nightVictimName: victim ? (isWitchVictim ? `${victim.name} (YOU!)` : victim.name) : null,
        isWitchTargeted: isWitchVictim,
        healActiveTonight: Boolean(healAction),
        healTargetId: healAction?.targetId || null,
        healTargetName: healTarget?.name || null,
        poisonActiveTonight: Boolean(poisonAction),
        poisonTargetId: poisonAction?.targetId || null,
        poisonTargetName: poisonTarget?.name || null,
        isWitchDecisionTime: Boolean(
          this.room.witchGracePeriodGiven ||
            (this.room.timer <= 5 && !this.room.witchHealUsed && victim !== null)
        ),
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

    // Amnesiac graveyard with real roles
    let amnesiacGraveyard: { id: string; name: string; role: Role }[] | undefined = undefined;
    if (requester?.role === 'AMNESIAC') {
      amnesiacGraveyard = this.room.players
        .filter((p) => !p.isAlive && p.role !== 'AMNESIAC')
        .map((p) => ({ id: p.id, name: p.name, role: p.role }));
    }

    const hasAliveWitch = this.room.players.some(
      (p) => p.role === 'WITCH' && p.isAlive
    );
    const werewolfHuntingLocked =
      this.room.phase === 'NIGHT' && hasAliveWitch && this.room.timer <= 5;
    const werewolfHuntingTimeRemaining =
      this.room.phase === 'NIGHT'
        ? hasAliveWitch
          ? Math.max(0, this.room.timer - 5)
          : this.room.timer
        : 0;

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
      seerHistory: (isSeer || isApprenticeActive) && seerKnown ? Array.from(seerKnown.values()) : undefined,
      witchPotions,
      hasAliveWitch,
      werewolfHuntingLocked,
      werewolfHuntingTimeRemaining,
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
      silencedPlayerId: this.room.silencedPlayerId,
      bearGrowl: this.room.bearGrowl,
      toughGuyWounded: this.room.toughGuyWoundedAtRound !== null,
      dousedPlayerIds: requester?.role === 'ARSONIST' ? this.room.dousedPlayerIds : undefined,
      wildChildModelId: requester?.role === 'WILD_CHILD' ? this.room.wildChildModelId : undefined,
      wildChildModelName:
        requester?.role === 'WILD_CHILD' && this.room.wildChildModelId
          ? this.getPlayer(this.room.wildChildModelId)?.name
          : undefined,
      dictatorCoupUsed: this.room.dictatorCoupUsed,
      dictatorGuiltPending: requester?.role === 'DICTATOR' ? this.room.dictatorGuiltPending : undefined,
      dictatorPlayerId: this.room.dictatorPlayerId,
      veteranAlertsRemaining:
        requester?.role === 'VETERAN' ? (this.room.veteranAlertsRemaining[forPlayerId] ?? 3) : undefined,
      veteranOnAlertTonight: this.room.nightActions.some(
        (a) => a.actorId === forPlayerId && a.type === 'VETERAN_ALERT'
      ),
      isApprenticeSeerActive: isApprenticeActive,
      amnesiacRemembered: requester ? this.room.amnesiacRememberedIds.includes(requester.id) : false,
      amnesiacGraveyard,
      skipDiscussionVotes: this.room.phase === 'DISCUSSION' ? (this.room.skipDiscussionVotes || []) : [],
      skipDiscussionTotalRequired: this.room.phase === 'DISCUSSION' ? this.room.players.filter((p) => p.isAlive).length : 0,
    };
  }

  private notify() {
    this.onStateChange(this);
  }

  public destroy() {
    this.clearTimer();
  }
}
