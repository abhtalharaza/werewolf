import { Team, Role } from '../src/types/game.js';

export interface GameRecord {
  id: string;
  roomCode: string;
  roomName: string;
  winnerTeam: Team;
  winReason: string;
  roundsPlayed: number;
  playerCount: number;
  players: {
    name: string;
    avatar: string;
    role: Role;
    team: Team;
    survived: boolean;
  }[];
  timestamp: number;
}

export interface GameStats {
  totalGames: number;
  villagerWins: number;
  werewolfWins: number;
  totalEliminations: number;
}

class InMemoryDatabase {
  private games: GameRecord[] = [];
  private stats: GameStats = {
    totalGames: 12,
    villagerWins: 7,
    werewolfWins: 5,
    totalEliminations: 48,
  };

  constructor() {
    // Seed initial historical records so the stats and history view are populated with sample lore data
    this.games = [
      {
        id: 'hist-1',
        roomCode: 'WOLF01',
        roomName: 'Shadow Glen',
        winnerTeam: 'VILLAGERS',
        winReason: 'All werewolves were discovered and executed by the village council.',
        roundsPlayed: 4,
        playerCount: 6,
        players: [
          { name: 'Eldred', avatar: 'elder', role: 'SEER', team: 'VILLAGERS', survived: true },
          { name: 'Corvus', avatar: 'rogue', role: 'WEREWOLF', team: 'WEREWOLVES', survived: false },
          { name: 'Garrick', avatar: 'hunter', role: 'HUNTER', team: 'VILLAGERS', survived: true },
          { name: 'Morrigan', avatar: 'sorceress', role: 'WITCH', team: 'VILLAGERS', survived: true },
          { name: 'Torvald', avatar: 'blacksmith', role: 'WEREWOLF', team: 'WEREWOLVES', survived: false },
          { name: 'Seraphina', avatar: 'priestess', role: 'DOCTOR', team: 'VILLAGERS', survived: true },
        ],
        timestamp: Date.now() - 3600000 * 5,
      },
      {
        id: 'hist-2',
        roomCode: 'DARK09',
        roomName: 'Misty Hollow',
        winnerTeam: 'WEREWOLVES',
        winReason: 'The pack overwhelmed the surviving villagers under the full blood moon.',
        roundsPlayed: 3,
        playerCount: 5,
        players: [
          { name: 'Mortimer', avatar: 'gravedigger', role: 'WEREWOLF', team: 'WEREWOLVES', survived: true },
          { name: 'Valerius', avatar: 'knight', role: 'BODYGUARD', team: 'VILLAGERS', survived: false },
          { name: 'Althea', avatar: 'herbalist', role: 'VILLAGER', team: 'VILLAGERS', survived: false },
          { name: 'Finnegan', avatar: 'bard', role: 'VILLAGER', team: 'VILLAGERS', survived: false },
          { name: 'Corvus', avatar: 'rogue', role: 'WEREWOLF', team: 'WEREWOLVES', survived: true },
        ],
        timestamp: Date.now() - 3600000 * 2,
      },
    ];
  }

  public recordGame(game: Omit<GameRecord, 'id' | 'timestamp'>) {
    const record: GameRecord = {
      ...game,
      id: 'game-' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    this.games.unshift(record);
    if (this.games.length > 50) this.games.pop();

    this.stats.totalGames++;
    if (record.winnerTeam === 'VILLAGERS') this.stats.villagerWins++;
    if (record.winnerTeam === 'WEREWOLVES') this.stats.werewolfWins++;
    this.stats.totalEliminations += record.players.filter((p) => !p.survived).length;

    return record;
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }

  public getRecentGames(): GameRecord[] {
    return [...this.games.slice(0, 10)];
  }
}

export const db = new InMemoryDatabase();
