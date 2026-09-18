import { Role, Team, GamePhase, GameSettings, GameEvent, GameDeathRecord } from '../src/types/game.js';

export interface ServerPlayer {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  isBot: boolean;
  role: Role;
  team: Team;
  connected: boolean;
  targetId: string | null;
  hasVoted: boolean;
  voteTargetId: string | null;
  hunterShotAvailable?: boolean;
}

export interface ServerNightAction {
  actorId: string;
  role: Role;
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
    | 'LITTLE_GIRL_PEEK'
    | 'SERIAL_KILLER_KILL'
    | 'SILENCE'
    | 'ARSONIST_DOUSE'
    | 'ARSONIST_IGNITE'
    | 'WILD_CHILD_CHOOSE'
    | 'VETERAN_ALERT'
    | 'AMNESIAC_REMEMBER'
    | 'PASS_AMNESIAC'
    | 'CANCEL_HEAL'
    | 'CANCEL_POISON'
    | 'PASS_HEAL';
  targetId: string;
  secondaryTargetId?: string;
  chosenRole?: Role;
}

export interface ProtectionRecord {
  role: 'DOCTOR' | 'BODYGUARD' | 'WITCH' | 'ARSONIST_IMMUNITY';
  protectorId: string;
  targetId: string;
  targetName: string;
  wasAttackedAndSaved: boolean;
}

export interface ServerRoom {
  id: string;
  code: string;
  name: string;
  phase: GamePhase;
  round: number;
  timer: number;
  timerMax: number;
  intervalId: NodeJS.Timeout | null;
  players: ServerPlayer[];
  settings: GameSettings;
  nightActions: ServerNightAction[];
  witchHealUsed: boolean;
  witchPoisonUsed: boolean;
  witchGracePeriodGiven: boolean;
  votes: Record<string, string | null>; // voterId -> targetId
  events: GameEvent[];
  latestDeaths: GameDeathRecord[];
  morningProtections: ProtectionRecord[];
  hunterPendingId: string | null;
  hunterContext?: 'NIGHT' | 'DAY_VOTE' | null;
  hunterEliminationReason?: string | null;
  winnerTeam: Team | null;
  winReason: string | null;
  createdAt: number;
  lovers: [string, string] | null;
  wolfCubKilledByVote: boolean;
  enragedWolvesThisNight: boolean;
  doppelgangerBinds: Record<string, string>; // doppelgangerId -> targetId
  thiefReserveRoles: Role[];
  werewolfKillsHistory: { victimId: string; victimRole: Role; round: number }[];
  littleGirlPeekResults: Record<string, { werewolfNames: string[]; targetName?: string; caught: boolean }>;
  // Additional role state
  silencedPlayerId: string | null;
  bearGrowl: boolean | null;
  toughGuyWoundedAtRound: number | null;
  dousedPlayerIds: string[];
  wildChildModelId: string | null;
  dictatorCoupUsed: boolean;
  dictatorGuiltPending: boolean;
  dictatorPlayerId: string | null;
  veteranAlertsRemaining: Record<string, number>; // playerId -> count
  amnesiacRememberedIds: string[];
}
