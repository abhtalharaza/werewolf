import React, { useState } from 'react';
import { Shield, Eye, Sparkles, Moon, Sun, Vote, Skull, HelpCircle, LogOut, MessageSquare } from 'lucide-react';
import { ClientGameState, ChatMessage, ChatChannel } from '../types/game.js';
import { PhaseBanner } from './PhaseBanner.js';
import { PlayerCard } from './PlayerCard.js';
import { NightActionPanel } from './NightActionPanel.js';
import { VotingPanel } from './VotingPanel.js';
import { ChatPanel } from './ChatPanel.js';
import { HunterActionModal } from './HunterActionModal.js';
import { EliminationModal } from './EliminationModal.js';
import { MorningProtectionCard } from './MorningProtectionCard.js';
import { AudioControls } from './AudioControls.js';
import { ROLE_DEFINITIONS } from '../types/roles.js';

interface GameBoardProps {
  gameState: ClientGameState;
  chatMessages: ChatMessage[];
  onSendMessage: (channel: ChatChannel, text: string) => void;
  onSubmitNightAction: (
    actionType: any,
    targetId: string,
    secondaryTargetId?: string,
    chosenRole?: any
  ) => Promise<boolean>;
  onSubmitVote: (targetId: string | null) => Promise<boolean>;
  onHunterShoot: (targetId: string) => void;
  onLeaveGame: () => void;
  onOpenHowToPlay: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  chatMessages,
  onSendMessage,
  onSubmitNightAction,
  onSubmitVote,
  onHunterShoot,
  onLeaveGame,
  onOpenHowToPlay,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [cupidLover1Id, setCupidLover1Id] = useState<string | null>(null);
  const [cupidLover2Id, setCupidLover2Id] = useState<string | null>(null);
  const [isCupidBoundLocal, setIsCupidBoundLocal] = useState<boolean>(false);
  const [dismissedDeaths, setDismissedDeaths] = useState<string[]>([]);
  const [mobileTab, setMobileTab] = useState<'arena' | 'chat'>('arena');

  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const isMeAlive = me?.isAlive ?? false;
  const isNight = gameState.phase === 'NIGHT';
  const isVoting = gameState.phase === 'VOTING';
  const roleInfo = gameState.myRole ? ROLE_DEFINITIONS[gameState.myRole] : null;

  const isCupidBound = Boolean(gameState.cupidLovers || isCupidBoundLocal);
  const effectiveCupidLover1Id = gameState.cupidLovers?.lover1Id || cupidLover1Id;
  const effectiveCupidLover2Id = gameState.cupidLovers?.lover2Id || cupidLover2Id;

  const isCupidActive =
    gameState.myRole === 'CUPID' &&
    gameState.phase === 'NIGHT' &&
    gameState.round === 1 &&
    isMeAlive;

  // Reset target selection when phase changes
  React.useEffect(() => {
    setSelectedTargetId(null);
    if (gameState.phase !== 'NIGHT') {
      setCupidLover1Id(null);
      setCupidLover2Id(null);
      setIsCupidBoundLocal(false);
    }
  }, [gameState.phase, gameState.round]);

  // Determine if a card can be targeted right now
  const canTargetPlayer = (playerId: string) => {
    if (!isMeAlive) return false;
    const targetPlayer = gameState.players.find((p) => p.id === playerId);
    if (!targetPlayer || !targetPlayer.isAlive) return false;

    if (isNight) {
      // 1. Regular Werewolves
      if (
        gameState.myRole === 'WEREWOLF' ||
        gameState.myRole === 'WOLF_CUB' ||
        (gameState.myRole === 'CURSED' && gameState.myTeam === 'WEREWOLVES')
      ) {
        if (playerId === gameState.myPlayerId) return false; // Cannot target self
        const isPackmate =
          targetPlayer.role === 'WEREWOLF' ||
          targetPlayer.role === 'WOLF_CUB' ||
          targetPlayer.role === 'WHITE_WOLF' ||
          Boolean(gameState.werewolfTeammates?.some((w) => w.id === targetPlayer.id));
        if (isPackmate) return false; // Cannot target packmates

        // Check if kill is already confirmed tonight
        const hasLockedKill =
          gameState.myNightAction?.type === 'KILL' ||
          gameState.werewolfVotes?.some((v) => v.werewolfId === gameState.myPlayerId);
        if (hasLockedKill) return false;

        return true;
      }

      // 2. White Wolf
      if (gameState.myRole === 'WHITE_WOLF') {
        if (playerId === gameState.myPlayerId) return false; // Cannot target self

        const isPackmate =
          targetPlayer.role === 'WEREWOLF' || targetPlayer.role === 'WOLF_CUB';

        // On alternate (even) rounds, White Wolf can strike fellow werewolves!
        if (gameState.round % 2 === 0) {
          return true; // Can select either a villager for pack kill or a werewolf for solo hunt
        } else {
          return !isPackmate; // On odd rounds, only villagers
        }
      }

      if (gameState.myRole === 'SEER') {
        if (gameState.seerResult) return false; // Seer restricted to 1 check per night
        return playerId !== gameState.myPlayerId;
      }
      if (gameState.myRole === 'DOCTOR') return true;
      if (gameState.myRole === 'BODYGUARD') return playerId !== gameState.myPlayerId;
      if (gameState.myRole === 'WITCH') return true;
      if (gameState.myRole === 'CUPID' && gameState.round === 1) {
        // If already bound, Cupid cannot target or change anyone!
        return !isCupidBound;
      }
      if (gameState.myRole === 'DOPPELGANGER' && gameState.round === 1) {
        return playerId !== gameState.myPlayerId;
      }
      return false;
    }
    if (isVoting) {
      // Living players can vote on any living player
      return true;
    }
    return false;
  };

  const handleSelectPlayer = (playerId: string) => {
    if (isCupidActive) {
      // Once lovers are bound, undo or modifications are STRICTLY FORBIDDEN!
      if (isCupidBound) return;

      // 1. If clicking on Lover 1 again -> UNSELECT Lover 1!
      if (cupidLover1Id === playerId) {
        setCupidLover1Id(cupidLover2Id);
        setCupidLover2Id(null);
        return;
      }
      // 2. If clicking on Lover 2 again -> UNSELECT Lover 2!
      if (cupidLover2Id === playerId) {
        setCupidLover2Id(null);
        return;
      }
      // 3. If slot 1 is empty -> fill Lover 1
      if (!cupidLover1Id) {
        setCupidLover1Id(playerId);
      } else if (!cupidLover2Id) {
        // Slot 2 is empty -> fill Lover 2
        setCupidLover2Id(playerId);
      } else {
        // Both were selected; clicking a 3rd player replaces Lover 2
        setCupidLover2Id(playerId);
      }
      return;
    }

    setSelectedTargetId((prev) => (prev === playerId ? null : playerId));
  };

  const handleUnselectCupidLover = (slot: 1 | 2) => {
    if (isCupidBound) return; // Cannot undo once bound
    if (slot === 1) {
      setCupidLover1Id(cupidLover2Id);
      setCupidLover2Id(null);
    } else {
      setCupidLover2Id(null);
    }
  };

  const handleResetCupidLovers = () => {
    if (isCupidBound) return; // Cannot undo once bound
    setCupidLover1Id(null);
    setCupidLover2Id(null);
  };

  // Check for recent deaths to show modal in DAY_ANNOUNCEMENT
  const unreadDeaths =
    gameState.phase === 'DAY_ANNOUNCEMENT'
      ? (gameState.latestDeaths || []).filter((d) => !dismissedDeaths.includes(d.id))
      : [];

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-3 md:p-6 z-10 max-w-7xl mx-auto w-full">
      {/* Top Bar: Role badge, Atmosphere status, Controls */}
      <header className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3 md:px-5 backdrop-blur-md mb-4">
        {/* My Secret Role Pill */}
        {roleInfo && (
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                roleInfo.team === 'WEREWOLVES'
                  ? 'bg-red-950/80 border-red-700 text-red-300'
                  : 'bg-purple-950/80 border-purple-700 text-purple-300'
              }`}
            >
              {roleInfo.team === 'WEREWOLVES' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                  Your Role:
                </span>
                <span className="font-bold text-sm font-cinzel text-zinc-100">
                  {roleInfo.name}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 hidden sm:block">
                Team <span className="font-semibold text-zinc-200">{roleInfo.team}</span> •{' '}
                {isMeAlive ? (
                  <span className="text-emerald-400 font-semibold">Alive</span>
                ) : (
                  <span className="text-red-400 font-semibold">Dead (Spirit)</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Room Info & Audio */}
        <div className="flex items-center gap-2.5">
          <div className="text-xs text-zinc-400 font-mono hidden md:block">
            Room: <span className="text-purple-400 font-bold">{gameState.roomCode}</span>
          </div>

          <button
            id="board-rules-btn"
            onClick={onOpenHowToPlay}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
            title="Review Rules"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <AudioControls />

          <button
            id="board-leave-btn"
            onClick={onLeaveGame}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800/50 text-zinc-400 hover:text-red-300 transition"
            title="Leave Village"
            aria-label="Leave Village"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Phase Banner */}
      <PhaseBanner
        phase={gameState.phase}
        round={gameState.round}
        timer={gameState.timer}
        timerMax={
          isNight
            ? gameState.settings.nightTime
            : isVoting
            ? gameState.settings.votingTime
            : gameState.settings.discussionTime
        }
      />

      {/* Mobile Navigation Tabs for Responsive Phone Play (lg:hidden) */}
      <div className="lg:hidden flex items-center bg-zinc-950/80 border border-zinc-800 rounded-xl p-1 mb-3">
        <button
          id="mobile-tab-arena-btn"
          onClick={() => setMobileTab('arena')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
            mobileTab === 'arena'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Village Arena</span>
        </button>
        <button
          id="mobile-tab-chat-btn"
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
            mobileTab === 'chat'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Village Chat ({chatMessages.length})</span>
        </button>
      </div>

      {/* Main Board Layout: Left/Center Circle Grid + Right Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 my-2">
        {/* Left 2 Cols: Player Circle / Grid + Phase Action Panel */}
        <div className={`lg:col-span-2 flex flex-col justify-between space-y-4 ${mobileTab === 'arena' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Players Arena */}
          <div
            id="players-arena"
            className="bg-zinc-950/60 border border-zinc-800/80 rounded-3xl p-4 md:p-6 backdrop-blur-md flex-1 flex flex-col justify-center"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 justify-items-center">
              {gameState.players.map((p) => {
                const isMe = p.id === gameState.myPlayerId;
                const isSelected = selectedTargetId === p.id;
                const cupidOrder: 1 | 2 | undefined = isCupidActive
                  ? effectiveCupidLover1Id === p.id
                    ? 1
                    : effectiveCupidLover2Id === p.id
                    ? 2
                    : undefined
                  : undefined;
                const isWolfTeammate =
                  gameState.myRole === 'WEREWOLF' &&
                  (gameState.werewolfTeammates || []).some((w) => w.id === p.id);
                const wolfVotesOnPlayer =
                  gameState.myRole === 'WEREWOLF' && gameState.phase === 'NIGHT'
                    ? (gameState.werewolfVotes || []).filter((w) => w.targetId === p.id).length
                    : 0;

                const isLittleGirl = gameState.myRole === 'LITTLE_GIRL';
                const lgPeek = gameState.littleGirlPeekResult;
                const isLittleGirlSpottedWolf = Boolean(
                  isLittleGirl && lgPeek && !lgPeek.caught && lgPeek.werewolfNames?.includes(p.name)
                );
                const isLittleGirlSpottedTarget = Boolean(
                  isLittleGirl && lgPeek && !lgPeek.caught && lgPeek.targetName === p.name
                );

                const isBodyguard = gameState.myRole === 'BODYGUARD' && gameState.phase === 'NIGHT';
                const isGuardedByMe = Boolean(
                  isBodyguard &&
                  gameState.myNightAction?.type === 'GUARD' &&
                  gameState.myNightAction?.targetId === p.id
                );

                const isDoppelganger = gameState.myRole === 'DOPPELGANGER';
                const isDoppelgangerBound = Boolean(
                  isDoppelganger &&
                  (gameState.doppelgangerTargetId === p.id ||
                   (gameState.doppelgangerTargetName && gameState.doppelgangerTargetName === p.name))
                );

                return (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    isMe={isMe}
                    phase={gameState.phase}
                    myRole={gameState.myRole}
                    isSelectedTarget={isCupidActive ? cupidOrder !== undefined : isSelected}
                    cupidLoverOrder={cupidOrder}
                    isWerewolfTeammate={isWolfTeammate}
                    isLittleGirlSpottedWolf={isLittleGirlSpottedWolf}
                    isLittleGirlSpottedTarget={isLittleGirlSpottedTarget}
                    isGuardedByMe={isGuardedByMe}
                    isDoppelgangerBound={isDoppelgangerBound}
                    wolfVotesTargetingThisPlayer={wolfVotesOnPlayer}
                    onSelect={handleSelectPlayer}
                    canTarget={canTargetPlayer(p.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Phase-Specific Action Panel */}
          {isNight && (
            <NightActionPanel
              gameState={gameState}
              selectedTargetId={selectedTargetId}
              cupidLover1Id={effectiveCupidLover1Id}
              cupidLover2Id={effectiveCupidLover2Id}
              isCupidBound={isCupidBound}
              onCupidBound={() => setIsCupidBoundLocal(true)}
              onUnselectCupidLover={handleUnselectCupidLover}
              onResetCupidLovers={handleResetCupidLovers}
              onSubmitAction={onSubmitNightAction}
            />
          )}

          {isVoting && (
            <VotingPanel
              gameState={gameState}
              selectedTargetId={selectedTargetId}
              onSubmitVote={onSubmitVote}
            />
          )}

          {gameState.phase === 'DAY_ANNOUNCEMENT' && (
            <div className="p-5 rounded-2xl bg-zinc-950/90 border border-amber-800/50 text-center text-xs text-zinc-300 max-w-xl mx-auto backdrop-blur-md space-y-2 shadow-2xl animate-fade-in">
              <div className="font-cinzel font-bold text-amber-300 text-sm flex items-center justify-center gap-2">
                <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>Morning Dawn: Shadows Recede</span>
              </div>
              {gameState.latestDeaths && gameState.latestDeaths.length > 0 ? (
                <p className="text-zinc-300">
                  The village mourns the fallen souls claimed in the night. The town council prepares to deliberate.
                </p>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 font-medium flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>A peaceful dawn: No villagers fell to the darkness tonight!</span>
                </div>
              )}
            </div>
          )}

          {gameState.phase === 'DISCUSSION' && (
            <div className="p-4 rounded-2xl bg-zinc-950/90 border border-amber-900/40 text-center text-xs text-zinc-300 max-w-xl mx-auto backdrop-blur-md">
              <div className="font-cinzel font-bold text-amber-300 mb-1 flex items-center justify-center gap-1.5">
                <Sun className="w-4 h-4" />
                <span>Open Council Deliberation</span>
              </div>
              <p className="text-zinc-400">
                Discuss suspect claims, cross-examine alibis in the chat, and prepare your voting strategy.
              </p>
            </div>
          )}

          {gameState.phase === 'VOTE_RESULT' && (
            <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 text-center text-xs text-zinc-300 max-w-xl mx-auto backdrop-blur-md space-y-1">
              <div className="font-cinzel font-bold text-purple-300 flex items-center justify-center gap-1.5">
                <Skull className="w-4 h-4 text-purple-400" />
                <span>Verdict Carried Out</span>
              </div>
              <p className="text-zinc-400">The executioner takes their leave as darkness descends once again.</p>
            </div>
          )}
        </div>

        {/* Right Col: Chat Panel & Event Chronicle */}
        <div className={`flex flex-col justify-start ${mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
          <ChatPanel
            gameState={gameState}
            chatMessages={chatMessages}
            onSendMessage={onSendMessage}
          />
        </div>
      </div>

      {/* Modals & Overlays */}
      {/* 1. Elimination Announcement */}
      {unreadDeaths.length > 0 && (
        <EliminationModal
          deaths={unreadDeaths}
          onDismiss={() => {
            setDismissedDeaths((prev) => [...prev, ...unreadDeaths.map((d) => d.id)]);
          }}
        />
      )}

      {/* 2. Hunter Shot Trigger */}
      {gameState.phase === 'HUNTER_ACTION' && (
        <HunterActionModal gameState={gameState} onShoot={onHunterShoot} />
      )}

      {/* 3. Morning Protection Notification Card (2-second popup) */}
      <MorningProtectionCard
        protections={gameState.morningProtections}
        round={gameState.round}
        phase={gameState.phase}
      />
    </div>
  );
};
