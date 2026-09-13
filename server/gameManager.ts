import { GameRoom } from './gameState.js';
import { ServerPlayer } from './types.js';
import { GameSettings, RoomListItem } from '../src/types/game.js';

class GameManager {
  private rooms: Map<string, GameRoom> = new Map(); // roomCode -> GameRoom
  private playerToRoom: Map<string, string> = new Map(); // socketId or playerId -> roomCode

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Prevent collision
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  public createRoom(
    name: string,
    hostPlayer: Omit<ServerPlayer, 'role' | 'team'>,
    onStateChange: (room: GameRoom) => void,
    onChatMessage: (channel: string, message: unknown) => void,
    settings?: Partial<GameSettings>
  ): GameRoom {
    const code = this.generateRoomCode();
    const gameRoom = new GameRoom(code, name, hostPlayer, onStateChange, onChatMessage, settings);
    this.rooms.set(code, gameRoom);
    this.playerToRoom.set(hostPlayer.socketId, code);
    this.playerToRoom.set(hostPlayer.id, code);
    return gameRoom;
  }

  public getRoom(code: string): GameRoom | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  public getRoomByPlayer(idOrSocketId: string): GameRoom | undefined {
    const code = this.playerToRoom.get(idOrSocketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  public linkPlayer(idOrSocketId: string, code: string) {
    this.playerToRoom.set(idOrSocketId, code.toUpperCase());
  }

  public unlinkPlayer(idOrSocketId: string) {
    this.playerToRoom.delete(idOrSocketId);
  }

  public getPublicRooms(): RoomListItem[] {
    const list: RoomListItem[] = [];
    for (const [code, room] of this.rooms.entries()) {
      list.push({
        id: room.room.id,
        code,
        name: room.room.name,
        playerCount: room.room.players.length,
        maxPlayers: room.room.settings.maxPlayers,
        phase: room.room.phase,
      });
    }
    return list;
  }

  public removeRoom(code: string) {
    const room = this.rooms.get(code.toUpperCase());
    if (room) {
      room.destroy();
      this.rooms.delete(code.toUpperCase());
    }
  }
}

export const gameManager = new GameManager();
