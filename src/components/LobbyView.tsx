import React, { useState } from 'react';
import {
  Copy,
  Check,
  Crown,
  Bot,
  UserX,
  Play,
  LogOut,
  Shield,
  Clock,
  Sparkles,
  Users,
  Moon,
  Eye,
  HeartPulse,
  Crosshair,
  Sliders,
  Plus,
  Minus,
  X,
} from 'lucide-react';
import { ClientGameState, ChatMessage, Role, GameSettings } from '../types/game.js';
import { ALL_ROLES_META } from '../types/roleMeta.js';
import { getAvatar } from '../utils/avatars.js';
import { AudioControls } from './AudioControls.js';

interface LobbyViewProps {
  gameState: ClientGameState;
  onToggleReady: () => void;
  onAddBot: () => void;
  onRemoveBot: (botId?: string) => void;
  onKickPlayer: (playerId: string) => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onStartGame: () => Promise<boolean>;
  onLeaveRoom: () => void;
  onSendChat: (text: string) => void;
  chatMessages: ChatMessage[];
}

const createDefaultDeckDraft = (dist?: Partial<Record<Role, number>>): Record<Role, number> => {
  const deck: Record<Role, number> = {
    WEREWOLF: 2,
    VILLAGER: 2,
    SEER: 1,
    DOCTOR: 1,
    HUNTER: 1,
    WITCH: 1,
    BODYGUARD: 1,
    CUPID: 0,
    LITTLE_GIRL: 0,
    JESTER: 0,
    MAYOR: 0,
    THIEF: 0,
    WOLF_CUB: 0,
    CURSED: 0,
    MASON: 0,
    LYCAN: 0,
    DOPPELGANGER: 0,
    WHITE_WOLF: 0,
  };
  if (dist) {
    Object.entries(dist).forEach(([r, count]) => {
      if (typeof count === 'number') {
        deck[r as Role] = count;
      }
    });
  }
  return deck;
};

const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = ALL_ROLES_META.reduce(
  (acc, r) => {
    acc[r.role] = r.icon;
    return acc;
  },
  {} as Record<Role, React.ComponentType<{ className?: string }>>
);

const ROLE_COLORS: Record<Role, string> = ALL_ROLES_META.reduce((acc, r) => {
  acc[r.role] = r.badgeClass;
  return acc;
}, {} as Record<Role, string>);

export const LobbyView: React.FC<LobbyViewProps> = ({
  gameState,
  onToggleReady,
  onAddBot,
  onRemoveBot,
  onKickPlayer,
  onUpdateSettings,
  onStartGame,
  onLeaveRoom,
  onSendChat,
  chatMessages,
}) => {
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [starting, setStarting] = useState(false);
  const [isEditingDeck, setIsEditingDeck] = useState(false);

  // Local draft for in-lobby role deck customization
  const [deckDraft, setDeckDraft] = useState<Record<Role, number>>(() =>
    createDefaultDeckDraft(gameState.settings.roleDistribution)
  );

  const isHost = gameState.isHost;
  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const playerCount = gameState.players.length;
  const canStart = playerCount >= 4;

  const currentDeck = gameState.settings.roleDistribution || {
    WEREWOLF: 2,
    VILLAGER: 2,
    SEER: 1,
    DOCTOR: 1,
    HUNTER: 1,
    WITCH: 1,
    BODYGUARD: 1,
  };

  const copyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    await onStartGame();
    setStarting(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput);
    setChatInput('');
  };

  const openDeckEditor = () => {
    setDeckDraft(createDefaultDeckDraft(gameState.settings.roleDistribution));
    setIsEditingDeck(true);
  };

  const saveDeckSettings = () => {
    const safeCounts = {
      ...deckDraft,
      WEREWOLF: Math.max(1, deckDraft.WEREWOLF || 1),
    };
    onUpdateSettings({ roleDistribution: safeCounts });
    setIsEditingDeck(false);
  };

  const updateDraftCount = (role: Role, delta: number) => {
    setDeckDraft((prev) => {
      const current = prev[role] || 0;
      const next = Math.max(0, current + delta);
      if (role === 'WEREWOLF' && next < 1) {
        return { ...prev, WEREWOLF: 1 };
      }
      return { ...prev, [role]: next };
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col p-3 sm:p-4 md:p-8 z-10 max-w-6xl mx-auto w-full justify-between">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-purple-950/70 border border-purple-800/50 text-purple-300 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-cinzel text-zinc-100">{gameState.settings.roomName}</h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Village Gathering</span>
              <span>•</span>
              <span className="text-purple-300 font-semibold">{playerCount} / {gameState.settings.maxPlayers} Villagers</span>
            </div>
          </div>
        </div>

        {/* Room Code Badge & Top Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 border-t sm:border-t-0 border-zinc-800/60 pt-2.5 sm:pt-0">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2">
            <div className="text-[11px] sm:text-xs text-zinc-400 uppercase tracking-widest font-mono">Code:</div>
            <div className="font-mono font-bold tracking-widest text-base sm:text-lg text-purple-400">
              {gameState.roomCode}
            </div>
            <button
              id="copy-room-code-btn"
              onClick={copyCode}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition ml-0.5 min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
              title="Copy Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <AudioControls />

            <button
              id="leave-lobby-btn"
              onClick={onLeaveRoom}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800/50 text-zinc-400 hover:text-red-300 text-xs transition min-h-[38px] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid: Player list + Settings, Role Deck & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6 flex-1">
        {/* Left 2 Cols: Player Roster */}
        <div className="lg:col-span-2 flex flex-col bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <h3 className="font-cinzel font-bold text-zinc-200 text-base">Villagers in Square</h3>
            </div>

            {/* Host quick actions: Add bot / Remove bot */}
            {isHost && (
              <div className="flex items-center gap-2">
                <button
                  id="add-bot-btn"
                  onClick={onAddBot}
                  disabled={playerCount >= gameState.settings.maxPlayers}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-purple-950/50 border border-zinc-800 hover:border-purple-800/60 text-xs text-zinc-300 hover:text-purple-300 transition disabled:opacity-40 cursor-pointer"
                  title="Summon an AI Villager"
                >
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                  <span>+ Add Bot</span>
                </button>
                {gameState.players.some((p) => p.isBot) && (
                  <button
                    id="remove-bot-btn"
                    onClick={() => onRemoveBot()}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                  >
                    Remove Bot
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Grid of Players with Kick Option for Host */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-[480px] pr-1">
            {gameState.players.map((p) => {
              const avatarInfo = getAvatar(p.avatar);
              const isMe = p.id === gameState.myPlayerId;

              return (
                <div
                  key={p.id}
                  id={`lobby-player-card-${p.id}`}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                    isMe
                      ? 'bg-purple-950/30 border-purple-600/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md border border-white/10 shrink-0"
                      style={{ backgroundColor: avatarInfo.color + '33', color: avatarInfo.color }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-semibold text-sm text-zinc-100">
                        <span className="truncate">{p.name}</span>
                        {p.isHost && (
                          <span title="Village Host" className="shrink-0">
                            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          </span>
                        )}
                        {p.isBot && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono shrink-0">
                            BOT
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/70 text-purple-200 shrink-0">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">{avatarInfo.title}</div>
                    </div>
                  </div>

                  {/* Ready State & Host Kick Control */}
                  <div className="flex items-center gap-2 shrink-0">
                    {p.isHost ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40 font-mono">
                        Host
                      </span>
                    ) : p.isReady ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                        Waiting
                      </span>
                    )}

                    {/* Kick Player button for the Host */}
                    {isHost && !isMe && (
                      <button
                        id={`kick-player-${p.id}`}
                        onClick={() => onKickPlayer(p.id)}
                        title={`Banish ${p.name} from room`}
                        className="p-1.5 px-2 rounded-lg bg-red-950/40 hover:bg-red-900/70 border border-red-800/50 text-red-300 hover:text-red-100 text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5 text-red-400" />
                        <span className="hidden sm:inline font-medium">Kick</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Player Count Guidance */}
          {!canStart && (
            <div className="mt-4 p-3 rounded-xl bg-purple-950/20 border border-purple-900/30 text-purple-300 text-xs flex items-center justify-between">
              <span>A minimum of <strong>4 players</strong> are required to begin the hunt.</span>
              {isHost && (
                <button
                  id="lobby-quick-add-bots-btn"
                  onClick={onAddBot}
                  className="font-bold underline hover:text-white transition ml-2 cursor-pointer"
                >
                  + Add Villager Bot
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Village Roles Deck, Rules & Chat */}
        <div className="flex flex-col gap-4">
          {/* Active Roles in Deck Card */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Assigned Roles in Deck</span>
              </div>
              {isHost && (
                <button
                  id="lobby-edit-deck-btn"
                  onClick={openDeckEditor}
                  className="flex items-center gap-1 text-[11px] text-purple-300 hover:text-purple-100 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/40 px-2 py-1 rounded-lg transition cursor-pointer"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Customize</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(currentDeck) as [Role, number][])
                .filter(([_, count]) => count > 0)
                .map(([role, count]) => {
                  const Icon = ROLE_ICONS[role] || Users;
                  const colorClass = ROLE_COLORS[role] || 'text-zinc-300 border-zinc-700 bg-zinc-900';
                  return (
                    <div
                      key={role}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium ${colorClass}`}
                      title={`${count}x ${role}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>
                        {count}x {role.charAt(0) + role.slice(1).toLowerCase()}
                      </span>
                    </div>
                  );
                })}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">
              Every player will receive one secret role dealt from this deck.
            </p>
          </div>

          {/* Timers Card */}
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Village Rules & Timers</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-zinc-900/70 border border-zinc-800">
                <div className="text-zinc-500 text-[10px]">NIGHT</div>
                <div className="font-bold text-zinc-200 mt-0.5">{gameState.settings.nightTime}s</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/70 border border-zinc-800">
                <div className="text-zinc-500 text-[10px]">DISCUSSION</div>
                <div className="font-bold text-zinc-200 mt-0.5">{gameState.settings.discussionTime}s</div>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900/70 border border-zinc-800">
                <div className="text-zinc-500 text-[10px]">VOTING</div>
                <div className="font-bold text-zinc-200 mt-0.5">{gameState.settings.votingTime}s</div>
              </div>
            </div>
          </div>

          {/* Lobby Chat */}
          <div className="flex-1 flex flex-col bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-md min-h-[220px]">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Lobby Chatter
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[190px] pr-1 text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-zinc-600 italic text-center my-6">No words spoken yet in the tavern...</div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-0.5">
                      <span className="font-semibold text-purple-300">{msg.senderName}</span>
                      <span className="text-zinc-600">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-zinc-200 break-words">{msg.text}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
              <input
                id="lobby-chat-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Converse with the villagers..."
                maxLength={140}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:outline-none text-base sm:text-xs text-zinc-100 placeholder-zinc-500 min-h-[44px]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-700/40 text-xs text-white font-medium transition min-h-[44px] min-w-[54px] cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Controls: Start Game (Host) / Ready (Player) */}
      <footer className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 backdrop-blur-md">
        <div className="text-xs text-zinc-400 text-center sm:text-left">
          {isHost ? (
            <span>You are the Host. When all villagers are prepared, signal the town horn to begin.</span>
          ) : (
            <span>Ready up so the host knows you are ready for the dark descent.</span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {!isHost && (
            <button
              id="lobby-ready-toggle-btn"
              onClick={onToggleReady}
              className={`w-full sm:w-auto px-6 py-3.5 min-h-[48px] rounded-xl font-semibold text-sm transition font-cinzel cursor-pointer ${
                me?.isReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
              }`}
            >
              {me?.isReady ? 'Ready for the Hunt' : 'Mark Ready'}
            </button>
          )}

          {isHost && (
            <button
              id="lobby-start-game-btn"
              onClick={handleStart}
              disabled={starting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 min-h-[48px] rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-40 text-white font-bold font-cinzel text-sm tracking-wider shadow-xl shadow-purple-950/60 border border-purple-500/40 transition cursor-pointer active:scale-98"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {starting
                  ? 'Summoning...'
                  : playerCount < 4
                  ? 'Add Bots & Commence Hunt'
                  : 'Commence The Hunt'}
              </span>
            </button>
          )}
        </div>
      </footer>

      {/* Host Role Deck Customizer Modal in Lobby */}
      {isEditingDeck && (
        <div
          id="lobby-edit-deck-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsEditingDeck(false)}
        >
          <div
            id="lobby-edit-deck-modal"
            className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <h3 className="font-cinzel font-bold text-lg text-zinc-100">Customize Role Deck</h3>
              </div>
              <button
                onClick={() => setIsEditingDeck(false)}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Set the number of each role to be dealt out to players.
            </p>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {ALL_ROLES_META.map((meta) => {
                const Icon = meta.icon;
                const role = meta.role;
                const count = deckDraft[role] || 0;

                return (
                  <div
                    key={role}
                    className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 w-full"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <div className={`p-1.5 rounded-lg border shrink-0 ${meta.badgeClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                        <div className="font-semibold text-xs sm:text-sm text-zinc-200 font-cinzel truncate">
                          {meta.name}
                        </div>
                        <div className={`text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full font-mono border self-start sm:self-auto whitespace-nowrap leading-none mt-0.5 sm:mt-0 ${meta.badgeClass}`}>
                          {meta.team}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 bg-zinc-950 p-1 rounded-lg border border-zinc-800 shadow-inner">
                      <button
                        type="button"
                        onClick={() => updateDraftCount(role, -1)}
                        disabled={count <= (role === 'WEREWOLF' ? 1 : 0)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 disabled:opacity-20 text-zinc-300 flex items-center justify-center transition cursor-pointer"
                        title="Decrease"
                        aria-label={`Decrease ${meta.name} count`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 sm:w-6 text-center font-mono font-bold text-xs sm:text-sm text-purple-300 select-none">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateDraftCount(role, 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 flex items-center justify-center transition cursor-pointer"
                        title="Increase"
                        aria-label={`Increase ${meta.name} count`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 mt-5 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsEditingDeck(false)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDeckSettings}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-cinzel transition shadow-lg shadow-purple-900/40 cursor-pointer"
              >
                Save Deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
