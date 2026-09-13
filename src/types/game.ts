export type Role =
  | 'VILLAGER'
  | 'WEREWOLF'
  | 'SEER'
  | 'DOCTOR'
  | 'HUNTER'
  | 'WITCH'
  | 'BODYGUARD';

export type Team = 'VILLAGERS' | 'WEREWOLVES';

export type GamePhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'NIGHT'
  | 'DAY_ANNOUNCEMENT'
  | 'DISCUSSION'
  | 'VOTING'
  | 'VOTE_RESULT'
  | 'HUNTER_ACTION'
  | 'GAME_OVER';

export interface RoleInfo {
  role: Role;
  name: string;
  team: Team;
  icon: string;
  description: string;
  ability: string;
  nightPriority: number;
}

export interface ClientPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isAlive: boolean;
  isBot: boolean;
  connected: boolean;
  role?: Role; // Only revealed to self, or all players when game is over / when dead
  targetId?: string | null; // For UI targeting during night / day
  votesReceived?: number;
  hasVoted?: boolean;
}

export interface GameSettings {
  roomName: string;
  maxPlayers: number;
  discussionTime: number; // in seconds
  votingTime: number; // in seconds
  nightTime: number; // in seconds
  revealRoleOnDeath: boolean;
  roleDistribution: Record<Role, number>;
  autoPopulateBots?: boolean;
}

export interface GameEvent {
  id: string;
  type:
    | 'PHASE_CHANGE'
    | 'DEATH'
    | 'VOTE_CAST'
    | 'SEER_REVEAL'
    | 'NIGHT_KILL'
    | 'HUNTER_SHOT'
    | 'GAME_WIN'
    | 'HEAL'
    | 'SYSTEM';
  message: string;
  round: number;
  timestamp: number;
  targetPlayerId?: string;
}

export type ChatChannel = 'PUBLIC' | 'WEREWOLF' | 'DEAD' | 'SYSTEM';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  channel: ChatChannel;
  text: string;
  timestamp: number;
  isNight?: boolean;
}

export interface SeerResult {
  targetId: string;
  targetName: string;
  isWerewolf: boolean;
  revealedRole?: Role;
}

export interface WitchPotions {
  healAvailable: boolean;
  poisonAvailable: boolean;
  nightVictimId: string | null;
  nightVictimName: string | null;
}

export interface GameDeathRecord {
  id: string;
  name: string;
  role?: Role;
  reason: 'WEREWOLF' | 'VOTE' | 'POISON' | 'HUNTER';
  round: number;
}

export interface ClientGameState {
  roomId: string;
  roomCode: string;
  phase: GamePhase;
  round: number;
  timer: number;
  timerMax: number;
  players: ClientPlayer[];
  myPlayerId: string;
  myRole?: Role;
  myTeam?: Team;
  isHost: boolean;
  werewolfTeammates?: { id: string; name: string }[];
  seerResult?: SeerResult | null;
  seerHistory?: SeerResult[];
  witchPotions?: WitchPotions;
  votes: Record<string, string | null>; // voterId -> targetId
  voteCounts?: Record<string, number>;
  latestDeaths?: GameDeathRecord[];
  hunterPendingId?: string | null;
  winnerTeam?: Team | null;
  winReason?: string;
  events: GameEvent[];
  settings: GameSettings;
}

export interface RoomListItem {
  id: string;
  code: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  phase: GamePhase;
}
