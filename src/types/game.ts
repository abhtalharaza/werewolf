export type Role =
  | 'VILLAGER'
  | 'WEREWOLF'
  | 'SEER'
  | 'DOCTOR'
  | 'HUNTER'
  | 'WITCH'
  | 'BODYGUARD'
  | 'CUPID'
  | 'LITTLE_GIRL'
  | 'JESTER'
  | 'MAYOR'
  | 'THIEF'
  | 'WOLF_CUB'
  | 'CURSED'
  | 'MASON'
  | 'LYCAN'
  | 'DOPPELGANGER'
  | 'WHITE_WOLF'
  | 'SERIAL_KILLER'
  | 'SPELLCASTER'
  | 'APPRENTICE_SEER'
  | 'BEAR_TAMER'
  | 'TOUGH_GUY'
  | 'ARSONIST'
  | 'MINION'
  | 'WILD_CHILD'
  | 'DICTATOR'
  | 'VETERAN'
  | 'AMNESIAC';

export type Team =
  | 'VILLAGERS'
  | 'WEREWOLVES'
  | 'JESTER'
  | 'WHITE_WOLF'
  | 'SERIAL_KILLER'
  | 'ARSONIST'
  | 'NEUTRAL';

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
    | 'LOVERS_BOUND'
    | 'CURSED_TRANSFORM'
    | 'WOLF_CUB_ENRAGE'
    | 'DOPPELGANGER_SHIFT'
    | 'THIEF_STOLEN'
    | 'SERIAL_KILLER_STRIKE'
    | 'SPELLCASTER_SILENCE'
    | 'BEAR_GROWL'
    | 'ARSONIST_IGNITION'
    | 'WILD_CHILD_TRANSFORM'
    | 'DICTATOR_COUP'
    | 'VETERAN_SHOT'
    | 'AMNESIAC_REMEMBER'
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
  alignment?: 'Werewolf' | 'Good Team';
}

export interface WitchPotions {
  healAvailable: boolean;
  poisonAvailable: boolean;
  nightVictimId: string | null;
  nightVictimName: string | null;
  isWitchTargeted?: boolean;
  healActiveTonight?: boolean;
  healTargetId?: string | null;
  healTargetName?: string | null;
  poisonActiveTonight?: boolean;
  poisonTargetId?: string | null;
  poisonTargetName?: string | null;
  isWitchDecisionTime?: boolean;
}

export interface GameDeathRecord {
  id: string;
  name: string;
  role?: Role;
  reason:
    | 'WEREWOLF'
    | 'VOTE'
    | 'POISON'
    | 'HUNTER'
    | 'HEARTBREAK'
    | 'WHITE_WOLF'
    | 'LITTLE_GIRL_CAUGHT'
    | 'SERIAL_KILLER'
    | 'ARSONIST'
    | 'VETERAN_SHOT'
    | 'DICTATOR_EXECUTE'
    | 'DICTATOR_SUICIDE'
    | 'TOUGH_GUY_WOUND'
    | 'SILENCED_VIOLATION';
  round: number;
}

export interface WerewolfVoteRecord {
  werewolfId: string;
  werewolfName: string;
  targetId: string;
  targetName: string;
}

export interface ProtectionRecord {
  role: 'DOCTOR' | 'BODYGUARD' | 'WITCH' | 'ARSONIST_IMMUNITY';
  targetName: string;
  wasAttackedAndSaved: boolean;
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
  myNightAction?: { type: string; targetId?: string };
  isHost: boolean;
  werewolfTeammates?: { id: string; name: string }[];
  werewolfVotes?: WerewolfVoteRecord[];
  werewolfVictimRoles?: Record<string, Role>; // Secret victim roles visible EXCLUSIVELY to werewolves!
  seerResult?: SeerResult | null;
  seerHistory?: SeerResult[];
  witchPotions?: WitchPotions;
  hasAliveWitch?: boolean;
  werewolfHuntingLocked?: boolean;
  werewolfHuntingTimeRemaining?: number;
  lovers?: { partnerId: string; partnerName: string };
  loverPartner?: { id: string; name: string };
  cupidLovers?: { lover1Id: string; lover1Name: string; lover2Id: string; lover2Name: string };
  masonTeammates?: { id: string; name: string }[];
  masonAllies?: { id: string; name: string }[];
  thiefReserveRoles?: Role[];
  doppelgangerTargetId?: string;
  doppelgangerTargetName?: string;
  whiteWolfCanKillTonight?: boolean;
  littleGirlPeekResult?: { werewolfNames: string[]; targetName?: string; caught: boolean } | null;
  unreadyPlayerNames?: string[];
  isMayor?: boolean;
  votes: Record<string, string | null>; // voterId -> targetId
  voteCounts?: Record<string, number>;
  latestDeaths?: GameDeathRecord[];
  morningProtections?: {
    role: 'DOCTOR' | 'BODYGUARD' | 'WITCH' | 'ARSONIST_IMMUNITY';
    targetName: string;
    wasAttackedAndSaved: boolean;
  }[];
  hunterPendingId?: string | null;
  hunterEliminationReason?: string | null;
  winnerTeam?: Team | null;
  winReason?: string;
  events: GameEvent[];
  settings: GameSettings;
  // New role states
  silencedPlayerId?: string | null;
  bearGrowl?: boolean | null;
  dousedPlayerIds?: string[];
  wildChildModelId?: string | null;
  wildChildModelName?: string | null;
  dictatorCoupUsed?: boolean;
  dictatorGuiltPending?: boolean;
  dictatorPlayerId?: string | null;
  veteranAlertsRemaining?: number;
  veteranOnAlertTonight?: boolean;
  isApprenticeSeerActive?: boolean;
  toughGuyWounded?: boolean;
  amnesiacRemembered?: boolean;
  amnesiacChosenRole?: Role;
  amnesiacChosenPlayerName?: string;
  amnesiacGraveyard?: { id: string; name: string; role: Role }[];
}

export interface RoomListItem {
  id: string;
  code: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  phase: GamePhase;
}
