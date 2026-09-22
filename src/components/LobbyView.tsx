import React, { useState, useEffect } from 'react';
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
  RotateCcw,
} from 'lucide-react';
import { ClientGameState, ChatMessage, Role, GameSettings } from '../types/game.js';
import { ALL_ROLES_META } from '../types/roleMeta.js';
import { getAvatar } from '../utils/avatars.js';
import { AudioControls } from './AudioControls.js';
import { NightModeToggle } from './NightModeToggle.js';

interface LobbyViewProps {
  gameState: ClientGameState;
  onToggleReady: () => void;
  onAddBot: () => void;
  onRemoveBot: (botId?: string) => void;
  onKickPlayer: (playerId: string) => void;
  onUpdateSettings: (settings: Partial<GameSettings>, hostName?: string) => Promise<boolean> | void;
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
    SERIAL_KILLER: 0,
    SPELLCASTER: 0,
    APPRENTICE_SEER: 0,
    BEAR_TAMER: 0,
    TOUGH_GUY: 0,
    ARSONIST: 0,
    MINION: 0,
    WILD_CHILD: 0,
    DICTATOR: 0,
    VETERAN: 0,
    AMNESIAC: 0,
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

const ROLE_NAMES: Record<Role, string> = ALL_ROLES_META.reduce((acc, r) => {
  acc[r.role] = r.name;
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
  const [isEditingRoomSettings, setIsEditingRoomSettings] = useState(false);

  const isHost = gameState.isHost;
  const hostPlayer = gameState.players.find((p) => p.isHost);
  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const playerCount = gameState.players.length;
  const canStart = playerCount >= 4;

  const [customRoomName, setCustomRoomName] = useState(gameState.settings.roomName || 'Whispering Pines');
  const [customHostName, setCustomHostName] = useState(hostPlayer?.name || 'Village Elder');
  const [customMaxPlayers, setCustomMaxPlayers] = useState(gameState.settings.maxPlayers || 10);
  const [customDiscussionTime, setCustomDiscussionTime] = useState(gameState.settings.discussionTime || 60);

  const openRoomSettingsEditor = () => {
    setCustomRoomName(gameState.settings.roomName || 'Whispering Pines');
    setCustomHostName(hostPlayer?.name || 'Village Elder');
    setCustomMaxPlayers(gameState.settings.maxPlayers || 10);
    setCustomDiscussionTime(gameState.settings.discussionTime || 60);
    setIsEditingRoomSettings(true);
  };

  const saveRoomSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateSettings(
      {
        roomName: customRoomName.trim() || 'Whispering Pines',
        maxPlayers: Math.max(Math.max(4, playerCount), Math.min(20, customMaxPlayers)),
        discussionTime: Math.max(20, Math.min(300, customDiscussionTime)),
      },
      customHostName.trim() || undefined
    );
    setIsEditingRoomSettings(false);
  };

  // Local draft for in-lobby role deck customization
  const [deckDraft, setDeckDraft] = useState<Record<Role, number>>(() =>
    createDefaultDeckDraft(gameState.settings.roleDistribution)
  );
  const [deckSaveToast, setDeckSaveToast] = useState(false);
  const [isSavingDeck, setIsSavingDeck] = useState(false);

  // Synchronize deck draft whenever game settings are updated
  useEffect(() => {
    if (gameState.settings?.roleDistribution) {
      setDeckDraft(createDefaultDeckDraft(gameState.settings.roleDistribution));
    }
  }, [gameState.settings?.roleDistribution]);

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

  const applyDeckPreset = (preset: 'CLASSIC' | 'BALANCED' | 'MYSTIC_AMNESIAC') => {
    const base = createDefaultDeckDraft();
    if (preset === 'CLASSIC') {
      setDeckDraft({
        ...base,
        WEREWOLF: 2,
        VILLAGER: 3,
        SEER: 1,
        DOCTOR: 1,
        HUNTER: 1,
      });
    } else if (preset === 'BALANCED') {
      setDeckDraft({
        ...base,
        WEREWOLF: 2,
        VILLAGER: 2,
        SEER: 1,
        DOCTOR: 1,
        HUNTER: 1,
        WITCH: 1,
        BODYGUARD: 1,
      });
    } else if (preset === 'MYSTIC_AMNESIAC') {
      setDeckDraft({
        ...base,
        WEREWOLF: 2,
        VILLAGER: 2,
        AMNESIAC: 1,
        SEER: 1,
        DOCTOR: 1,
        HUNTER: 1,
        WITCH: 1,
      });
    }
  };

  const saveDeckSettings = async () => {
    if (isSavingDeck) return;
    setIsSavingDeck(true);
    const safeCounts = {
      ...deckDraft,
      WEREWOLF: Math.max(1, deckDraft.WEREWOLF || 1),
    };
    try {
      await onUpdateSettings({ roleDistribution: safeCounts });
      setDeckSaveToast(true);
      setTimeout(() => setDeckSaveToast(false), 3000);
      setIsEditingDeck(false);
    } catch {
      // ignore
    } finally {
      setIsSavingDeck(false);
    }
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

  const totalCardsInDraft = Object.values(deckDraft).reduce((sum, n) => sum + (n || 0), 0);

  return (
    <div className="relative min-h-screen flex flex-col p-3 sm:p-4 md:p-8 z-10 max-w-6xl mx-auto w-full justify-between">
      {/* Role Deck Saved Toast Notification */}
      {deckSaveToast && (
        <div
          id="deck-saved-notification"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-white/95 dark:bg-[#15141e] border border-indigo-200 dark:border-white/15 text-slate-800 dark:text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none"
        >
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Village role deck saved! Settings updated for all players.</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 glass-card rounded-3xl p-3.5 sm:p-4 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-indigo-50 dark:bg-white/10 border border-indigo-200 dark:border-white/15 text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold font-cinzel text-slate-900 dark:text-white">{gameState.settings.roomName}</h2>
              {isHost && (
                <button
                  id="open-room-customization-btn"
                  onClick={openRoomSettingsEditor}
                  className="px-3.5 py-2 min-h-[44px] rounded-xl bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-indigo-200/80 dark:border-white/15 text-indigo-700 dark:text-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                  title="Customize Room Name, Host Name, Capacity & Discussion Timer"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Customize Village</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              <span>Host: <strong className="text-indigo-700 dark:text-indigo-300 font-semibold">{hostPlayer?.name || 'Elder'}</strong></span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{playerCount} / {gameState.settings.maxPlayers} Villagers</span>
              <span>•</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">Discussion: {gameState.settings.discussionTime}s</span>
            </div>
          </div>
        </div>

        {/* Room Code Badge & Top Actions */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 border-t sm:border-t-0 border-indigo-100/60 dark:border-white/10 pt-2.5 sm:pt-0 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 glass-card-subtle rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2 border border-indigo-200/60 dark:border-white/15 shrink-0">
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono font-semibold">Code:</div>
            <div className="font-mono font-bold tracking-widest text-sm sm:text-lg text-indigo-700 dark:text-indigo-300 drop-shadow-xs">
              {gameState.roomCode}
            </div>
            <button
              id="copy-room-code-btn"
              onClick={copyCode}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-white/10 text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 transition ml-0.5 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center cursor-pointer active:scale-95"
              title="Copy Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <NightModeToggle compact={true} />
            <AudioControls compact={true} showFxTest={true} />

            <button
              id="leave-lobby-btn"
              onClick={onLeaveRoom}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl glass-card-subtle hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 text-xs font-semibold transition min-h-[40px] cursor-pointer shadow-xs active:scale-98 shrink-0"
              title="Leave Village"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid: Player list + Settings, Role Deck & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6 flex-1">
        {/* Left 2 Cols: Player Roster in Frosted Glass-Card */}
        <div className="lg:col-span-2 flex flex-col glass-card rounded-3xl p-4 sm:p-6 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-md">
          <div className="flex items-center justify-between mb-4 border-b border-indigo-100/70 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-cinzel font-bold text-slate-900 dark:text-white text-base">Villagers in Square</h3>
            </div>

            {/* Host quick actions: Add bot / Remove bot */}
            {isHost && (
              <div className="flex items-center gap-2">
                <button
                  id="add-bot-btn"
                  onClick={onAddBot}
                  disabled={playerCount >= gameState.settings.maxPlayers}
                  className="flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] rounded-xl bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-indigo-200 hover:border-indigo-400 dark:border-white/15 text-xs text-indigo-700 dark:text-indigo-200 font-semibold transition disabled:opacity-40 cursor-pointer shadow-xs active:scale-98"
                  title="Summon an AI Villager"
                >
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>+ Add Bot</span>
                </button>
                {gameState.players.some((p) => p.isBot) && (
                  <button
                    id="remove-bot-btn"
                    onClick={() => onRemoveBot()}
                    className="flex items-center justify-center px-4 py-2 min-h-[44px] rounded-xl bg-white/60 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white transition cursor-pointer active:scale-98"
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
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition backdrop-blur-md ${
                    isMe
                      ? 'bg-white/95 dark:bg-[#161424] border-indigo-300 dark:border-indigo-500/60 shadow-md ring-1 ring-indigo-200 dark:ring-indigo-500/30'
                      : 'bg-white/70 dark:bg-[#111019] border-white/90 dark:border-white/10 hover:border-indigo-200 dark:hover:border-white/20 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border border-white/80 dark:border-white/20 shrink-0"
                      style={{ backgroundColor: avatarInfo.color + '26', color: avatarInfo.color }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-900 dark:text-white">
                        <span className="truncate">{p.name}</span>
                        {p.isHost && (
                          <span title="Village Host" className="shrink-0">
                            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          </span>
                        )}
                        {p.isBot && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono shrink-0">
                            BOT
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-600 text-white font-mono shrink-0">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{avatarInfo.title}</div>
                    </div>
                  </div>

                  {/* Ready State & Host Kick Control */}
                  <div className="flex items-center gap-2 shrink-0">
                    {p.isHost ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-mono flex items-center gap-1 shadow-xs">
                        <Crown className="w-3 h-3 text-amber-500" /> Host
                      </span>
                    ) : isMe ? (
                      <button
                        id="lobby-player-list-ready-btn"
                        type="button"
                        onClick={onToggleReady}
                        className={`text-xs px-4 py-2 min-h-[44px] rounded-xl font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer select-none active:scale-98 ${
                          p.isReady
                            ? 'gradient-brand-btn text-white ring-2 ring-indigo-300'
                            : 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-400 animate-pulse hover:animate-none'
                        }`}
                        title={p.isReady ? 'Click to unmark ready' : 'Click to Ready up!'}
                      >
                        {p.isReady ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Ready</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Click to Ready</span>
                          </>
                        )}
                      </button>
                    ) : p.isReady ? (
                      <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-mono flex items-center gap-1.5 shadow-xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Ready
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-white/10 font-mono">
                        Waiting
                      </span>
                    )}

                    {/* Kick Player button for the Host */}
                    {isHost && !isMe && (
                      <button
                        id={`kick-player-${p.id}`}
                        onClick={() => onKickPlayer(p.id)}
                        title={`Banish ${p.name} from room`}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                      >
                        <UserX className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
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
            <div className="mt-4 p-3 rounded-2xl bg-indigo-50/70 dark:bg-white/[0.04] border border-indigo-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between">
              <span>A minimum of <strong>4 players</strong> are required to begin the hunt.</span>
              {isHost && (
                <button
                  id="lobby-quick-add-bots-btn"
                  onClick={onAddBot}
                  className="font-bold underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition ml-2 cursor-pointer"
                >
                  + Add Villager Bot
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Village Roles Deck, Rules & Chat in Glass-Card */}
        <div className="flex flex-col gap-4">
          {/* Active Roles in Deck Card */}
          <div className="glass-card rounded-3xl p-4 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Assigned Roles in Deck</span>
              </div>
              {isHost && (
                <button
                  id="lobby-edit-deck-btn"
                  onClick={openDeckEditor}
                  className="flex items-center justify-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-200 hover:text-indigo-900 bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-indigo-200 dark:border-white/15 px-3.5 py-2 min-h-[44px] rounded-xl transition cursor-pointer shadow-xs font-semibold active:scale-98"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Customize</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(currentDeck) as [Role, number][])
                .filter(([_, count]) => count > 0)
                .map(([role, count]) => {
                  const Icon = ROLE_ICONS[role] || Users;
                  const colorClass = ROLE_COLORS[role] || 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.06]';
                  const roleName = ROLE_NAMES[role] || (role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, ' '));
                  return (
                    <div
                      key={role}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium ${colorClass} shadow-xs`}
                      title={`${count}x ${roleName}`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {count}x {roleName}
                      </span>
                    </div>
                  );
                })}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Every player will receive one secret role dealt from this deck.
            </p>
          </div>

          {/* Timers Card */}
          <div className="glass-card rounded-3xl p-4 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-md">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Village Rules & Timers</span>
              </div>
              {isHost && (
                <button
                  id="lobby-customize-timers-btn"
                  onClick={openRoomSettingsEditor}
                  className="flex items-center justify-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-200 hover:text-indigo-900 bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border border-indigo-200 dark:border-white/15 px-3.5 py-2 min-h-[44px] rounded-xl transition cursor-pointer shadow-xs font-semibold active:scale-98"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Customize</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-indigo-100 dark:border-white/10">
                <div className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold">NIGHT</div>
                <div className="font-bold text-slate-800 dark:text-white mt-0.5">{gameState.settings.nightTime}s</div>
              </div>
              <div className="p-2 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-indigo-100 dark:border-white/10">
                <div className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold">DISCUSSION</div>
                <div className="font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">{gameState.settings.discussionTime}s</div>
              </div>
              <div className="p-2 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-indigo-100 dark:border-white/10">
                <div className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold">VOTING</div>
                <div className="font-bold text-slate-800 dark:text-white mt-0.5">{gameState.settings.votingTime}s</div>
              </div>
            </div>
          </div>

          {/* Lobby Chat in Frosted Glass-Card */}
          <div className="flex-1 flex flex-col glass-card rounded-3xl p-4 backdrop-blur-xl min-h-[220px] border border-white/80 dark:border-white/10 shadow-md">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Lobby Chatter
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[190px] pr-1 text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-slate-400 dark:text-slate-500 italic text-center my-6">No words spoken yet in the village square...</div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="p-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-indigo-100 dark:border-white/10 shadow-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300">{msg.senderName}</span>
                      <span className="text-slate-400 dark:text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-800 dark:text-slate-200 break-words font-medium">{msg.text}</div>
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
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-[#12111a] border border-indigo-200/80 dark:border-white/15 focus:border-indigo-400 focus:outline-none text-base sm:text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 min-h-[44px] shadow-xs"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl gradient-brand-btn text-xs text-white font-medium transition min-h-[44px] min-w-[54px] cursor-pointer shadow-sm"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Controls: Start Game (Host only) */}
      <footer className="glass-card rounded-3xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-md">
        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium text-center sm:text-left">
          {isHost ? (
            <span>You are the Host. When all villagers are prepared, signal the town horn to begin.</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${me?.isReady ? 'bg-emerald-500 animate-pulse shadow-xs' : 'bg-amber-400'}`} />
              <span>
                {me?.isReady
                  ? '✓ You are marked Ready! Waiting for the Host to commence the hunt.'
                  : 'Use the Ready button next to your name in the player roster above.'}
              </span>
            </div>
          )}
        </div>

        {isHost && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              id="lobby-start-game-btn"
              onClick={handleStart}
              disabled={starting}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3 min-h-[48px] h-12 rounded-2xl gradient-brand-btn disabled:opacity-40 text-white font-bold font-cinzel text-sm tracking-wider transition cursor-pointer active:scale-98 shadow-md select-none"
            >
              <Play className="w-4 h-4 fill-current text-white shrink-0" />
              <span>
                {starting
                  ? 'Summoning...'
                  : playerCount < 4
                  ? 'Add Bots & Commence Hunt'
                  : 'Commence The Hunt'}
              </span>
            </button>
          </div>
        )}
      </footer>

      {/* Host Role Deck Customizer Modal in Lobby */}
      {isEditingDeck && (
        <div
          id="lobby-edit-deck-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsEditingDeck(false)}
        >
          <div
            id="lobby-edit-deck-modal"
            className="relative w-full max-w-lg glass-card-modal rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto border border-white/80 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-cinzel font-bold text-lg text-slate-900 dark:text-white">Customize Role Deck</h3>
              </div>
              <button
                onClick={() => setIsEditingDeck(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Deck Presets */}
            <div className="flex items-center gap-1.5 flex-wrap mb-3 p-2.5 bg-indigo-50/70 dark:bg-white/[0.04] rounded-2xl border border-indigo-100 dark:border-white/10">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyDeckPreset('CLASSIC')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-50 dark:bg-white/10 dark:hover:bg-white/15 border border-indigo-200 dark:border-white/15 text-indigo-700 dark:text-indigo-200 text-xs font-medium transition cursor-pointer shadow-xs"
              >
                Classic (8)
              </button>
              <button
                type="button"
                onClick={() => applyDeckPreset('BALANCED')}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-indigo-50 dark:bg-white/10 dark:hover:bg-white/15 border border-indigo-200 dark:border-white/15 text-indigo-700 dark:text-indigo-200 text-xs font-medium transition cursor-pointer shadow-xs"
              >
                Balanced (9)
              </button>
              <button
                type="button"
                onClick={() => applyDeckPreset('MYSTIC_AMNESIAC')}
                className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 text-white text-xs font-medium transition cursor-pointer shadow-xs"
              >
                Amnesiac Special
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-3 px-1 font-medium">
              <span>Adjust role frequencies for the village deck:</span>
              <span className="font-mono px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-[11px]">
                Total Cards: {totalCardsInDraft} (Players: {playerCount})
              </span>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {ALL_ROLES_META.map((meta) => {
                const Icon = meta.icon;
                const role = meta.role;
                const count = deckDraft[role] || 0;

                return (
                  <div
                    key={role}
                    className="flex items-center justify-between gap-2 p-2 sm:p-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-indigo-100 dark:border-white/10 w-full shadow-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <div className={`p-1.5 rounded-xl border shrink-0 ${meta.badgeClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                        <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white font-cinzel truncate">
                          {meta.name}
                        </div>
                        <div className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-mono border self-start sm:self-auto whitespace-nowrap leading-none mt-0.5 sm:mt-0 ${meta.badgeClass}`}>
                          {meta.team}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 bg-slate-50 dark:bg-white/[0.06] p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-inner">
                      <button
                        type="button"
                        onClick={() => updateDraftCount(role, -1)}
                        disabled={count <= (role === 'WEREWOLF' ? 1 : 0)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-white/10 hover:bg-indigo-50 dark:hover:bg-white/15 active:bg-indigo-100 disabled:opacity-20 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shadow-xs"
                        title="Decrease"
                        aria-label={`Decrease ${meta.name} count`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 sm:w-6 text-center font-mono font-bold text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 select-none">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateDraftCount(role, 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white dark:bg-white/10 hover:bg-indigo-50 dark:hover:bg-white/15 active:bg-indigo-100 text-slate-700 dark:text-slate-200 flex items-center justify-center transition cursor-pointer shadow-xs"
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

            <div className="flex items-center justify-between gap-3 mt-5 pt-3 border-t border-indigo-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setDeckDraft(createDefaultDeckDraft())}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs transition cursor-pointer font-medium"
                title="Reset to default deck"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Default</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingDeck(false)}
                  className="px-4 py-2 min-h-[44px] rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs transition cursor-pointer font-medium flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveDeckSettings}
                  disabled={isSavingDeck}
                  className="flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] h-12 rounded-2xl gradient-brand-btn disabled:opacity-50 text-white text-xs font-bold font-cinzel tracking-wider transition shadow-md cursor-pointer select-none active:scale-98"
                >
                  {isSavingDeck ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Deck</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Host Room & Village Customizer Modal */}
      {isEditingRoomSettings && (
        <div
          id="lobby-edit-room-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsEditingRoomSettings(false)}
        >
          <div
            id="lobby-edit-room-modal"
            className="relative w-full max-w-md glass-card-modal rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto border border-white/80 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-cinzel font-bold text-lg text-slate-900 dark:text-white">Customize Village Settings</h3>
              </div>
              <button
                id="close-room-settings-btn"
                type="button"
                onClick={() => setIsEditingRoomSettings(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={saveRoomSettings} className="space-y-4">
              {/* 1. Room Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                  Room / Village Name
                </label>
                <input
                  id="custom-room-name-input"
                  type="text"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                  maxLength={30}
                  className="w-full bg-white/80 dark:bg-[#12111a] border border-indigo-200/80 dark:border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-400 transition shadow-xs"
                  placeholder="e.g. Whispering Pines"
                  required
                />
              </div>

              {/* 2. Host Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                  Host Name
                </label>
                <input
                  id="custom-host-name-input"
                  type="text"
                  value={customHostName}
                  onChange={(e) => setCustomHostName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-white/80 dark:bg-[#12111a] border border-indigo-200/80 dark:border-white/15 rounded-2xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-400 transition shadow-xs"
                  placeholder="e.g. Village Elder"
                  required
                />
              </div>

              {/* 3. Village Capacity (Max Players) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Villager Capacity
                  </label>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    {customMaxPlayers} Players (Min {Math.max(4, playerCount)})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="custom-max-players-slider"
                    type="range"
                    min={Math.max(4, playerCount)}
                    max={20}
                    value={customMaxPlayers}
                    onChange={(e) => setCustomMaxPlayers(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="w-12 text-center font-mono font-bold text-sm bg-white dark:bg-white/10 py-1.5 rounded-xl border border-indigo-200 dark:border-white/15 text-indigo-700 dark:text-indigo-300 shadow-xs">
                    {customMaxPlayers}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Current villagers in room: {playerCount}. Capacity cannot be less than current villagers.
                </div>
              </div>

              {/* 4. Discussion Phase Time */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Discussion Phase Timer
                  </label>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    {customDiscussionTime} Seconds
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    id="custom-discussion-time-slider"
                    type="range"
                    min={20}
                    max={300}
                    step={5}
                    value={customDiscussionTime}
                    onChange={(e) => setCustomDiscussionTime(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="w-14 text-center font-mono font-bold text-sm bg-white dark:bg-white/10 py-1.5 rounded-xl border border-indigo-200 dark:border-white/15 text-indigo-700 dark:text-indigo-300 shadow-xs">
                    {customDiscussionTime}s
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[30, 45, 60, 90, 120, 180].map((seconds) => (
                    <button
                      key={seconds}
                      type="button"
                      onClick={() => setCustomDiscussionTime(seconds)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono transition cursor-pointer border ${
                        customDiscussionTime === seconds
                          ? 'gradient-brand-btn text-white font-bold shadow-xs'
                          : 'bg-white/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-indigo-100 dark:border-white/15 hover:border-indigo-300'
                      }`}
                    >
                      {seconds}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-indigo-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditingRoomSettings(false)}
                  className="px-4 py-2 min-h-[44px] rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition cursor-pointer flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  id="save-room-settings-btn"
                  type="submit"
                  className="flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] h-12 rounded-2xl gradient-brand-btn text-white text-xs font-bold font-cinzel tracking-wider transition shadow-md cursor-pointer select-none active:scale-98"
                >
                  Save Village Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
