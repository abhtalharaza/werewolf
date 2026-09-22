/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
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
import { sounds } from './utils/audio.js';

export default function App() {
  const {
    connected,
    loading,
    error,
    clearError,
    gameState,
    chatMessages,
    createRoom,
    joinRoom,
    toggleReady,
    addBot,
    removeBot,
    kickPlayer,
    updateSettings,
    startGame,
    submitNightAction,
    submitVote,
    toggleSkipDiscussion,
    hunterShoot,
    dictatorCoup,
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

  // Suspense tick-tick audio when countdown timer reaches 5 seconds or less
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase !== 'LOBBY' && gameState.phase !== 'GAME_OVER') {
      if (gameState.timer <= 5 && gameState.timer > 0) {
        sounds.playTick(gameState.timer <= 2);
      }
    }
  }, [gameState?.timer, gameState?.phase]);

  // Victory celebration confetti trigger on game over
  useEffect(() => {
    if (gameState?.phase === 'GAME_OVER') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors:
            gameState.winnerTeam === 'VILLAGERS'
              ? ['#6366f1', '#a855f7', '#38bdf8']
              : gameState.winnerTeam === 'JESTER'
              ? ['#eab308', '#f59e0b', '#ec4899', '#a855f7']
              : gameState.winnerTeam === 'ARSONIST'
              ? ['#ea580c', '#f97316', '#fbbf24', '#dc2626']
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
    <div id="werewolf-app-root" className="relative min-h-screen text-slate-800 dark:text-zinc-100 font-sans selection:bg-purple-600 selection:text-white overflow-x-hidden">
      {/* Dynamic Gothic Atmosphere */}
      <AtmosphereBackground phase={gameState?.phase} />

      {/* Global Error Banner */}
      {error && (
        <div
          id="global-error-banner"
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-red-950/95 border border-red-600/90 text-red-200 text-xs shadow-2xl backdrop-blur-md flex items-center gap-2.5 max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping flex-shrink-0" />
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="font-medium leading-relaxed">{error}</span>
          <button
            id="dismiss-global-error-btn"
            type="button"
            onClick={clearError}
            className="ml-2 p-1 rounded-lg hover:bg-red-900/60 text-red-400 hover:text-white transition cursor-pointer flex-shrink-0"
            title="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
          onKickPlayer={kickPlayer}
          onUpdateSettings={updateSettings}
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
              onToggleSkipDiscussion={toggleSkipDiscussion}
              onHunterShoot={hunterShoot}
              onDictatorCoup={dictatorCoup}
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

