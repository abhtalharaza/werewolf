import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientGameState, ChatMessage, GameSettings, ChatChannel, Role } from '../types/game.js';
import { sounds } from '../utils/audio.js';
import confetti from 'canvas-confetti';

export function useSocketGame() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setTimedError = useCallback((msg: string | null) => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setError(msg);
    if (msg) {
      errorTimerRef.current = setTimeout(() => {
        setError(null);
      }, 4500);
    }
  }, []);

  const clearError = useCallback(() => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setError(null);
  }, []);

  const prevPhaseRef = useRef<string | null>(null);
  const prevDeathsCountRef = useRef<number>(0);
  const currentRoomCodeRef = useRef<string | null>(null);
  const myPlayerIdRef = useRef<string | null>(null);
  const isLeavingRef = useRef<boolean>(false);

  // Initialize socket connection
  useEffect(() => {
    const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || window.location.origin;
    const s = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setConnected(true);
      setError(null);

      // Auto-reconnect if we were already in an active room
      const activeCode = currentRoomCodeRef.current;
      const activePlayerId = myPlayerIdRef.current;
      if (activeCode && activePlayerId && !isLeavingRef.current) {
        s.emit(
          'room:reconnect',
          { roomCode: activeCode, playerId: activePlayerId },
          (res: { success: boolean; state?: ClientGameState; error?: string }) => {
            if (res && res.success && res.state) {
              setGameState(res.state);
            }
          }
        );
      }
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('connect_error', () => {
      setConnected(false);
    });

    s.on('game:state', (state: ClientGameState) => {
      // If user chose to leave, ignore lingering packets
      if (isLeavingRef.current) return;

      // Verify this player belongs to the room (do not self-destruct if momentarily disconnected)
      const me = state.players.find((p) => p.id === state.myPlayerId);
      if (!me) {
        if (currentRoomCodeRef.current === state.roomCode) {
          currentRoomCodeRef.current = null;
          myPlayerIdRef.current = null;
          setGameState(null);
          setChatMessages([]);
        }
        return;
      }

      currentRoomCodeRef.current = state.roomCode;
      myPlayerIdRef.current = state.myPlayerId;
      setGameState(state);

      // Auto-clear error when moving out of lobby or when everyone is ready
      if (state.phase !== 'LOBBY') {
        clearError();
      } else {
        const unreadyCount = state.players.filter((p) => !p.isReady).length;
        if (unreadyCount === 0) {
          setError((prev) => (prev && prev.includes('Waiting for all players to mark ready') ? null : prev));
        }
      }

      // Sound triggers based on phase transitions
      if (prevPhaseRef.current !== state.phase) {
        if (state.phase === 'ROLE_REVEAL') {
          sounds.playMysticReveal();
        } else if (state.phase === 'NIGHT') {
          sounds.playWolfHowl();
        } else if (state.phase === 'DAY_ANNOUNCEMENT') {
          sounds.playBellToll();
        } else if (state.phase === 'VOTING') {
          sounds.playVoteCast();
        } else if (state.phase === 'GAME_OVER') {
          if (state.winnerTeam === state.myTeam) {
            sounds.playVictory();
            try {
              confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#a855f7', '#ec4899', '#3b82f6', '#fbbf24'],
              });
            } catch {
              // ignore
            }
          } else {
            sounds.playElimination();
          }
        }
        prevPhaseRef.current = state.phase;
      }

      // Sound trigger for elimination
      const deadCount = state.players.filter((p) => !p.isAlive).length;
      if (deadCount > prevDeathsCountRef.current && state.phase !== 'LOBBY') {
        sounds.playElimination();
      }
      prevDeathsCountRef.current = deadCount;
    });

    s.on('chat:message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-100), msg]);
      sounds.playChatPing();
    });

    s.on('room:kicked', ({ reason }: { reason?: string }) => {
      currentRoomCodeRef.current = null;
      myPlayerIdRef.current = null;
      setGameState(null);
      setChatMessages([]);
      setError(reason || 'You were banished from the village by the host.');
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const createRoom = useCallback(
    (name: string, hostName: string, avatar: string, settings?: Partial<GameSettings>): Promise<boolean> => {
      if (!socket) return Promise.resolve(false);
      setLoading(true);
      setError(null);
      isLeavingRef.current = false;

      return new Promise((resolve) => {
        socket.emit(
          'room:create',
          { name, hostName, avatar, settings },
          (res: { success: boolean; roomCode?: string; playerId?: string; state?: ClientGameState; error?: string }) => {
            setLoading(false);
            if (!res.success) {
              setError(res.error || 'Could not create room');
              resolve(false);
            } else {
              isLeavingRef.current = false;
              if (res.roomCode) currentRoomCodeRef.current = res.roomCode;
              if (res.playerId) myPlayerIdRef.current = res.playerId;
              if (res.state) setGameState(res.state);
              resolve(true);
            }
          }
        );
      });
    },
    [socket]
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string, avatar: string): Promise<boolean> => {
      if (!socket) return Promise.resolve(false);
      setLoading(true);
      setError(null);
      isLeavingRef.current = false;

      return new Promise((resolve) => {
        socket.emit(
          'room:join',
          { roomCode: roomCode.trim().toUpperCase(), playerName, avatar },
          (res: { success: boolean; roomCode?: string; playerId?: string; state?: ClientGameState; error?: string }) => {
            setLoading(false);
            if (!res.success) {
              setError(res.error || 'Could not join room');
              resolve(false);
            } else {
              isLeavingRef.current = false;
              if (res.roomCode) currentRoomCodeRef.current = res.roomCode;
              if (res.playerId) myPlayerIdRef.current = res.playerId;
              if (res.state) setGameState(res.state);
              resolve(true);
            }
          }
        );
      });
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    isLeavingRef.current = true;
    const roomCode = currentRoomCodeRef.current || gameState?.roomCode;
    const playerId = myPlayerIdRef.current || gameState?.myPlayerId;

    currentRoomCodeRef.current = null;
    myPlayerIdRef.current = null;

    if (socket && roomCode && playerId) {
      socket.emit('room:leave', { roomCode, playerId });
    }

    setGameState(null);
    setChatMessages([]);
    setError(null);
  }, [socket, gameState]);

  const toggleReady = useCallback(() => {
    if (!socket || !gameState) return;
    socket.emit('room:ready', { roomCode: gameState.roomCode, playerId: gameState.myPlayerId });
  }, [socket, gameState]);

  const addBot = useCallback(() => {
    if (!socket || !gameState) return;
    socket.emit('room:add_bot', { roomCode: gameState.roomCode });
  }, [socket, gameState]);

  const removeBot = useCallback(
    (botId?: string) => {
      if (!socket || !gameState) return;
      socket.emit('room:remove_bot', { roomCode: gameState.roomCode, botId });
    },
    [socket, gameState]
  );

  const kickPlayer = useCallback(
    (targetPlayerId: string) => {
      if (!socket || !gameState) return;
      socket.emit('room:kick_player', {
        roomCode: gameState.roomCode,
        requesterId: gameState.myPlayerId,
        targetPlayerId,
      });
    },
    [socket, gameState]
  );

  const updateSettings = useCallback(
    (settings: Partial<GameSettings>, hostName?: string): Promise<boolean> => {
      if (!socket || !gameState) return Promise.resolve(false);
      // Optimistically update local gameState.settings so UI reflects changes immediately!
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          settings: {
            ...prev.settings,
            ...settings,
            roleDistribution: settings.roleDistribution
              ? { ...settings.roleDistribution }
              : prev.settings.roleDistribution,
          },
        };
      });
      return new Promise((resolve) => {
        socket.emit(
          'room:settings',
          { roomCode: gameState.roomCode, settings, hostName },
          (res?: { success: boolean; error?: string; settings?: GameSettings }) => {
            if (res && res.success && res.settings) {
              setGameState((prev) => (prev ? { ...prev, settings: res.settings! } : prev));
              resolve(true);
            } else {
              resolve(true);
            }
          }
        );
      });
    },
    [socket, gameState]
  );

  const startGame = useCallback((): Promise<boolean> => {
    if (!socket || !gameState) return Promise.resolve(false);
    return new Promise((resolve) => {
      socket.emit('game:start', { roomCode: gameState.roomCode, playerId: gameState.myPlayerId }, (res: { success: boolean; error?: string }) => {
        if (!res.success) {
          setTimedError(res.error || 'Cannot start game');
          resolve(false);
        } else {
          clearError();
          resolve(true);
        }
      });
    });
  }, [socket, gameState, setTimedError, clearError]);

  const submitNightAction = useCallback(
    (
      actionType:
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
        | 'PASS_HEAL',
      targetId: string,
      secondaryTargetId?: string,
      chosenRole?: Role
    ): Promise<boolean> => {
      if (!socket || !gameState) return Promise.resolve(false);
      if (actionType === 'INVESTIGATE') {
        sounds.playMysticReveal();
      } else {
        sounds.playVoteCast();
      }
      return new Promise((resolve) => {
        socket.emit(
          'night:action',
          {
            roomCode: gameState.roomCode,
            playerId: gameState.myPlayerId,
            actionType,
            targetId,
            secondaryTargetId,
            chosenRole,
          },
          (res: { success: boolean; error?: string; seerResult?: any }) => {
            if (!res.success) {
              setError(res.error || 'Action failed');
              resolve(false);
            } else {
              if (res.seerResult) {
                setGameState((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    seerResult: res.seerResult,
                    players: prev.players.map((p) =>
                      p.id === res.seerResult.targetId
                        ? { ...p, role: res.seerResult.revealedRole }
                        : p
                    ),
                  };
                });
              }
              resolve(true);
            }
          }
        );
      });
    },
    [socket, gameState]
  );

  const submitVote = useCallback(
    (targetId: string | null): Promise<boolean> => {
      if (!socket || !gameState) return Promise.resolve(false);
      sounds.playVoteCast();
      return new Promise((resolve) => {
        socket.emit(
          'vote:cast',
          {
            roomCode: gameState.roomCode,
            playerId: gameState.myPlayerId,
            targetId,
          },
          (res: { success: boolean; error?: string }) => {
            if (!res.success) {
              setError(res.error || 'Vote rejected');
              resolve(false);
            } else {
              resolve(true);
            }
          }
        );
      });
    },
    [socket, gameState]
  );

  const hunterShoot = useCallback(
    (targetId: string) => {
      if (!socket || !gameState) return;
      sounds.playElimination();
      socket.emit('hunter:shoot', {
        roomCode: gameState.roomCode,
        playerId: gameState.myPlayerId,
        targetId,
      });
    },
    [socket, gameState]
  );

  const dictatorCoup = useCallback(
    (targetId: string): Promise<{ success: boolean; error?: string }> => {
      if (!socket || !gameState) return Promise.resolve({ success: false, error: 'Not connected' });
      sounds.playElimination();
      return new Promise((resolve) => {
        socket.emit(
          'dictator:coup',
          {
            roomCode: gameState.roomCode,
            playerId: gameState.myPlayerId,
            targetId,
          },
          (res: { success: boolean; error?: string }) => {
            if (!res.success && res.error) {
              setError(res.error);
            }
            resolve(res);
          }
        );
      });
    },
    [socket, gameState]
  );

  const sendChatMessage = useCallback(
    (channel: ChatChannel, text: string) => {
      if (!socket || !gameState || !text.trim()) return;
      socket.emit('chat:send', {
        roomCode: gameState.roomCode,
        playerId: gameState.myPlayerId,
        channel,
        text,
      });
    },
    [socket, gameState]
  );

  const restartGame = useCallback(() => {
    if (!socket || !gameState) return;
    socket.emit('game:restart', {
      roomCode: gameState.roomCode,
      playerId: gameState.myPlayerId,
    });
  }, [socket, gameState]);

  return {
    connected,
    gameState,
    chatMessages,
    error,
    loading,
    clearError: () => setError(null),
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    addBot,
    removeBot,
    kickPlayer,
    updateSettings,
    startGame,
    submitNightAction,
    submitVote,
    hunterShoot,
    dictatorCoup,
    sendChatMessage,
    restartGame,
  };
}
