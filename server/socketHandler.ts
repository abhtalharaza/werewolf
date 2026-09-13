import { Server, Socket } from 'socket.io';
import { gameManager } from './gameManager.js';
import { GameRoom } from './gameState.js';
import { ChatMessage, ChatChannel } from '../src/types/game.js';

export function broadcastRoomState(io: Server, room: GameRoom) {
  const players = room.getPlayers();
  for (const player of players) {
    if (!player.isBot && player.socketId && player.connected) {
      const sanitized = room.getSanitizedState(player.id);
      io.to(player.socketId).emit('game:state', sanitized);
    }
  }
}

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    // 1. CREATE ROOM
    socket.on('room:create', ({ name, hostName, avatar, settings }, callback) => {
      try {
        const playerId = 'p-' + Math.random().toString(36).substring(2, 9);
        const hostPlayer = {
          id: playerId,
          socketId: socket.id,
          name: hostName.trim() || 'Village Host',
          avatar: avatar || 'elder',
          isHost: true,
          isReady: true,
          isAlive: true,
          isBot: false,
          connected: true,
          targetId: null,
          hasVoted: false,
          voteTargetId: null,
        };

        const room = gameManager.createRoom(
          name || 'Whispering Pines',
          hostPlayer,
          (updatedRoom) => {
            broadcastRoomState(io, updatedRoom);
          },
          (channel, message) => {
            io.to(room.getCode()).emit('chat:message', message);
          },
          settings
        );

        socket.join(room.getCode());
        broadcastRoomState(io, room);

        if (callback) {
          callback({
            success: true,
            roomCode: room.getCode(),
            playerId,
            state: room.getSanitizedState(playerId),
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create room';
        if (callback) callback({ success: false, error: message });
      }
    });

    // 2. JOIN ROOM
    socket.on('room:join', ({ roomCode, playerName, avatar, existingPlayerId }, callback) => {
      try {
        const room = gameManager.getRoom(roomCode);
        if (!room) {
          if (callback) callback({ success: false, error: 'Room not found. Please verify the code.' });
          return;
        }

        const playerId = existingPlayerId || 'p-' + Math.random().toString(36).substring(2, 9);
        const result = room.addPlayer({
          id: playerId,
          socketId: socket.id,
          name: playerName.trim() || 'Villager',
          avatar: avatar || 'hunter',
          isHost: false,
          isReady: false,
          isAlive: true,
          isBot: false,
          connected: true,
          targetId: null,
          hasVoted: false,
          voteTargetId: null,
        });

        if (!result.success) {
          if (callback) callback({ success: false, error: result.error });
          return;
        }

        gameManager.linkPlayer(socket.id, roomCode);
        gameManager.linkPlayer(playerId, roomCode);

        socket.join(room.getCode());
        broadcastRoomState(io, room);

        if (callback) {
          callback({
            success: true,
            roomCode: room.getCode(),
            playerId,
            state: room.getSanitizedState(playerId),
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to join room';
        if (callback) callback({ success: false, error: message });
      }
    });

    // 3. READY TOGGLE
    socket.on('room:ready', ({ roomCode, playerId }) => {
      const room = gameManager.getRoom(roomCode);
      if (room) {
        room.toggleReady(playerId);
      }
    });

    // 4. ADD BOT
    socket.on('room:add_bot', ({ roomCode }) => {
      const room = gameManager.getRoom(roomCode);
      if (room) {
        room.addBot();
      }
    });

    // 5. REMOVE BOT
    socket.on('room:remove_bot', ({ roomCode, botId }) => {
      const room = gameManager.getRoom(roomCode);
      if (room) {
        room.removeBot(botId);
      }
    });

    // 5.5 KICK PLAYER (HOST ONLY)
    socket.on('room:kick_player', ({ roomCode, requesterId, targetPlayerId }) => {
      const room = gameManager.getRoom(roomCode);
      if (!room) return;

      const targetPlayer = room.getPlayer(targetPlayerId);
      const targetSocketId = targetPlayer?.socketId;

      const result = room.kickPlayer(requesterId, targetPlayerId);
      if (result.success) {
        if (targetSocketId && io.sockets.sockets.get(targetSocketId)) {
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          targetSocket?.leave(room.getCode());
          targetSocket?.emit('room:kicked', {
            reason: 'You were banished from the village by the host.',
          });
        }
        broadcastRoomState(io, room);
      }
    });

    // 6. UPDATE SETTINGS
    socket.on('room:settings', ({ roomCode, settings }) => {
      const room = gameManager.getRoom(roomCode);
      if (room) {
        room.updateSettings(settings);
      }
    });

    // 7. START GAME
    socket.on('game:start', ({ roomCode, playerId }, callback) => {
      const room = gameManager.getRoom(roomCode);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found' });
        return;
      }

      const res = room.startGame(playerId);
      if (callback) callback(res);
    });

    // 8. NIGHT ACTION
    socket.on('night:action', ({ roomCode, playerId, actionType, targetId }, callback) => {
      const room = gameManager.getRoom(roomCode);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found' });
        return;
      }

      const res = room.submitNightAction(playerId, actionType, targetId);
      if (callback) callback(res);
    });

    // 9. CAST VOTE
    socket.on('vote:cast', ({ roomCode, playerId, targetId }, callback) => {
      const room = gameManager.getRoom(roomCode);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found' });
        return;
      }

      const res = room.submitVote(playerId, targetId);
      if (callback) callback(res);
    });

    // 10. HUNTER SHOOT
    socket.on('hunter:shoot', ({ roomCode, playerId, targetId }) => {
      const room = gameManager.getRoom(roomCode);
      if (room) {
        room.hunterShoot(playerId, targetId);
      }
    });

    // 11. RESTART GAME
    socket.on('game:restart', ({ roomCode, playerId }) => {
      const room = gameManager.getRoom(roomCode);
      if (room) {
        room.restartGame(playerId);
      }
    });

    // 12. CHAT MESSAGE
    socket.on(
      'chat:send',
      ({ roomCode, playerId, channel, text }: { roomCode: string; playerId: string; channel: ChatChannel; text: string }) => {
        const room = gameManager.getRoom(roomCode);
        if (!room) return;

        const sender = room.getPlayer(playerId);
        if (!sender) return;

        // Security check for channels
        if (channel === 'WEREWOLF' && sender.role !== 'WEREWOLF') {
          return;
        }
        if (channel === 'DEAD' && sender.isAlive) {
          return;
        }

        const msg: ChatMessage = {
          id: 'chat-' + Math.random().toString(36).substring(2, 9),
          senderId: sender.id,
          senderName: sender.name,
          senderAvatar: sender.avatar,
          channel,
          text: text.trim().slice(0, 300),
          timestamp: Date.now(),
          isNight: room.room.phase === 'NIGHT',
        };

        if (channel === 'PUBLIC') {
          io.to(room.getCode()).emit('chat:message', msg);
        } else if (channel === 'WEREWOLF') {
          // Send only to werewolves
          const wolves = room.getPlayers().filter((p) => p.role === 'WEREWOLF');
          for (const wolf of wolves) {
            if (!wolf.isBot && wolf.socketId) {
              io.to(wolf.socketId).emit('chat:message', msg);
            }
          }
        } else if (channel === 'DEAD') {
          // Send only to dead players
          const dead = room.getPlayers().filter((p) => !p.isAlive);
          for (const d of dead) {
            if (!d.isBot && d.socketId) {
              io.to(d.socketId).emit('chat:message', msg);
            }
          }
        }
      }
    );

    // 13. LEAVE ROOM
    socket.on('room:leave', ({ roomCode, playerId }, callback) => {
      socket.leave(roomCode);
      gameManager.unlinkPlayer(socket.id);
      if (playerId) gameManager.unlinkPlayer(playerId);

      const room = gameManager.getRoom(roomCode);
      if (room) {
        room.removePlayer(playerId);
        const humanPlayers = room.getPlayers().filter((p) => !p.isBot && p.connected);
        if (humanPlayers.length === 0) {
          gameManager.removeRoom(roomCode);
        }
      }
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    // 14. DISCONNECT
    socket.on('disconnect', () => {
      const room = gameManager.getRoomByPlayer(socket.id);
      if (room) {
        const player = room.getPlayers().find((p) => p.socketId === socket.id);
        if (player) {
          room.removePlayer(player.id);
          const humanPlayers = room.getPlayers().filter((p) => !p.isBot && p.connected);
          if (humanPlayers.length === 0) {
            gameManager.removeRoom(room.getCode());
          }
        }
      }
      gameManager.unlinkPlayer(socket.id);
    });
  });
}
