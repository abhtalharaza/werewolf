/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AtmosphereBackground } from './components/AtmosphereBackground.js';
import { LandingView } from './components/LandingView.js';
import { CreateRoomModal } from './components/CreateRoomModal.js';
import { JoinRoomModal } from './components/JoinRoomModal.js';
import { HowToPlayModal } from './components/HowToPlayModal.js';
import { LobbyView } from './components/LobbyView.js';
import { RoleRevealView } from './components/RoleRevealView.js';
import { GameBoard } from './components/GameBoard.js';
import { GameOverView } from './components/GameOverView.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { useSocketGame } from './hooks/useSocketGame.js';

export default function App() {
  const {
    connected,
    loading,
    error,
    gameState,
    chatMessages,
    createRoom,
    joinRoom,
    toggleReady,
    addBot,
    removeBot,
    startGame,
    submitNightAction,
    submitVote,
    hunterShoot,
    sendChatMessage,
    restartGame,
    leaveRoom,
  } = useSocketGame();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [joinInitialCode, setJoinInitialCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Check URL query parameters for room code invite (e.g. ?room=WOLF01)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room') || params.get('code');
    if (code && !gameState) {
      setJoinInitialCode(code.toUpperCase());
      setIsJoinOpen(true);
    }
  }, [gameState]);

  // Victory celebration confetti trigger on game over
  useEffect(() => {
    if (gameState?.phase === 'GAME_OVER') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: gameState.winnerTeam === 'VILLAGERS'
            ? ['#6366f1', '#a855f7', '#38bdf8']
            : ['#ef4444', '#991b1b', '#f97316'],
        });
      } catch {
        // Safe fallback if canvas not available
      }
    }
  }, [gameState?.phase, gameState?.winnerTeam]);

  const handleCreateRoom = async (
    name: string,
    hostName: string,
    avatar: string,
    settings: any
  ) => {
    setActionLoading(true);
    const success = await createRoom(name, hostName, avatar, settings);
    setActionLoading(false);
    return success;
  };

  const handleJoinRoom = async (code: string, playerName: string, avatar: string) => {
    setActionLoading(true);
    const success = await joinRoom(code, playerName, avatar);
    setActionLoading(false);
    return success;
  };

  // Determine atmospheric tone based on current game phase
  const isNightPhase = gameState?.phase === 'NIGHT';
  const isDayPhase =
    gameState?.phase === 'DAY_ANNOUNCEMENT' ||
    gameState?.phase === 'DISCUSSION' ||
    gameState?.phase === 'VOTING' ||
    gameState?.phase === 'VOTE_RESULT';

  return (
    <div id="werewolf-app-root" className="relative min-h-screen text-zinc-100 font-sans selection:bg-purple-600 selection:text-white overflow-x-hidden">
      {/* Dynamic Gothic Atmosphere */}
      <AtmosphereBackground phase={gameState?.phase} />

      {/* Global Error Banner */}
      {error && (
        <div
          id="global-error-banner"
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-red-950/90 border border-red-700/80 text-red-200 text-xs shadow-xl backdrop-blur-md flex items-center gap-2 animate-bounce"
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Screen Router */}
      {!gameState && (
        <LandingView
          onCreateClick={() => setIsCreateOpen(true)}
          onJoinClick={(code) => {
            if (code) setJoinInitialCode(code);
            setIsJoinOpen(true);
          }}
          onHowToPlayClick={() => setIsHowToPlayOpen(true)}
        />
      )}

      {gameState && gameState.phase === 'LOBBY' && (
        <LobbyView
          gameState={gameState}
          onToggleReady={toggleReady}
          onAddBot={addBot}
          onRemoveBot={removeBot}
          onStartGame={startGame}
          onLeaveRoom={leaveRoom}
          onSendChat={(text) => sendChatMessage('PUBLIC', text)}
          chatMessages={chatMessages}
        />
      )}

      {gameState && gameState.phase === 'ROLE_REVEAL' && gameState.myRole && (
        <RoleRevealView
          role={gameState.myRole}
          timer={gameState.timer}
        />
      )}

      {gameState &&
        gameState.phase !== 'LOBBY' &&
        gameState.phase !== 'ROLE_REVEAL' &&
        gameState.phase !== 'GAME_OVER' && (
          <ErrorBoundary>
            <GameBoard
              gameState={gameState}
              chatMessages={chatMessages}
              onSendMessage={sendChatMessage}
              onSubmitNightAction={submitNightAction}
              onSubmitVote={submitVote}
              onHunterShoot={hunterShoot}
              onLeaveGame={leaveRoom}
              onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            />
          </ErrorBoundary>
        )}

      {gameState && gameState.phase === 'GAME_OVER' && (
        <GameOverView
          gameState={gameState}
          onRestart={restartGame}
          onLeave={leaveRoom}
        />
      )}

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateRoom={handleCreateRoom}
        loading={actionLoading}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoinRoom={handleJoinRoom}
        loading={actionLoading}
        initialRoomCode={joinInitialCode}
        errorMessage={error}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </div>
  );
}

