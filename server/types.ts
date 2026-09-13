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
  type: 'KILL' | 'INVESTIGATE' | 'PROTECT' | 'GUARD' | 'POISON' | 'HEAL';
  targetId: string;
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
  votes: Record<string, string | null>; // voterId -> targetId
  events: GameEvent[];
  latestDeaths: GameDeathRecord[];
  hunterPendingId: string | null;
  winnerTeam: Team | null;
  winReason: string | null;
  createdAt: number;
}
