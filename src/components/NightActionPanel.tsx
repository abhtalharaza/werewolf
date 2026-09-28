import React, { useState } from 'react';
import {
  Moon,
  Eye,
  HeartPulse,
  Shield,
  Sparkles,
  Check,
  Crosshair,
  Heart,
  UserCheck,
  Zap,
  AlertTriangle,
  Skull,
  Flame,
  VolumeX,
  ShieldAlert,
  UserPlus,
  Crown,
  Clock,
  XCircle,
  Brain,
  Lock,
  Sunset,
  MessageSquare,
  Send,
  Volume2,
  ArrowLeftRight,
} from 'lucide-react';
import { ClientGameState, ClientPlayer, Role, ChatMessage, ChatChannel } from '../types/game.js';
import { ROLE_DEFINITIONS } from '../types/roles.js';
import { sounds } from '../utils/audio.js';
import { getAvatar } from '../utils/avatars.js';

interface NightActionPanelProps {
  gameState: ClientGameState;
  selectedTargetId: string | null;
  cupidLover1Id?: string | null;
  cupidLover2Id?: string | null;
  isCupidBound?: boolean;
  onCupidBound?: () => void;
  onUnselectCupidLover?: (slot: 1 | 2) => void;
  onResetCupidLovers?: () => void;
  transporterTarget1Id?: string | null;
  transporterTarget2Id?: string | null;
  onSelectTransporterTarget?: (playerId: string) => void;
  onUnselectTransporterTarget?: (slot: 1 | 2) => void;
  onResetTransporterTargets?: () => void;
  onSelectTarget?: (playerId: string) => void;
  onSubmitAction: (
    actionType: any,
    targetId: string,
    secondaryTargetId?: string,
    chosenRole?: Role
  ) => Promise<boolean>;
  chatMessages?: ChatMessage[];
  onSendMessage?: (channel: ChatChannel, text: string) => void;
}

const JailChat: React.FC<{
  chatMessages: ChatMessage[];
  onSendMessage?: (channel: ChatChannel, text: string) => void;
  isJailor: boolean;
  partnerName?: string | null;
}> = ({ chatMessages, onSendMessage, isJailor, partnerName }) => {
  const [text, setText] = useState('');
  const jailMessages = chatMessages.filter((m) => m.channel === 'JAIL');
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [jailMessages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !onSendMessage) return;
    onSendMessage('JAIL', text.trim());
    setText('');
  };

  const quickPrompts = isJailor
    ? [
        'What is your role?',
        'Claim your ability now.',
        'Convince me why I shouldn’t execute you.',
        'I am listening. Speak fast.',
      ]
    : [
        'I am innocent! Please spare me.',
        'I am a Villager (Good Team)!',
        'Don’t execute me, I have an important role!',
        'You will suffer Guilt if you execute me!',
      ];

  return (
    <div className="rounded-2xl bg-zinc-950/85 border border-amber-900/50 p-3 sm:p-4 space-y-3 shadow-inner">
      <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
        <div className="flex items-center gap-2 text-xs font-cinzel font-bold text-amber-300">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Private Cell Interrogation</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400">
          {isJailor
            ? partnerName ? `Interrogating: ${partnerName}` : 'Interrogating Prisoner'
            : 'Speaking with: The Jailor'}
        </span>
      </div>

      <div className="h-36 sm:h-40 overflow-y-auto space-y-2 p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-xs">
        {jailMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-500 italic text-[11px] text-center p-3">
            {isJailor
              ? 'The prisoner sits across the iron table. Question them now to determine their fate.'
              : 'You are face to face with the masked Jailor. State your role and plead your case!'}
          </div>
        ) : (
          jailMessages.map((msg) => {
            const isMe = isJailor ? msg.senderName === 'The Jailor' : msg.senderName !== 'The Jailor';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-zinc-400 mb-0.5 font-mono">
                  {msg.senderName}
                </div>
                <div
                  className={`px-3 py-1.5 rounded-2xl max-w-[85%] break-words ${
                    isMe
                      ? 'bg-amber-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-zinc-800 text-zinc-200 rounded-tl-xs border border-zinc-700'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendMessage?.('JAIL', prompt)}
            className="px-2 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-amber-200/90 border border-amber-900/40 transition cursor-pointer text-left font-medium"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isJailor ? 'Interrogate the prisoner...' : 'Plead to the Jailor...'}
          className="flex-1 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-500"
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};

export const NightActionPanel: React.FC<NightActionPanelProps> = ({
  gameState,
  selectedTargetId,
  cupidLover1Id,
  cupidLover2Id,
  isCupidBound = false,
  onCupidBound,
  onUnselectCupidLover,
  onResetCupidLovers,
  transporterTarget1Id,
  transporterTarget2Id,
  onSelectTransporterTarget,
  onUnselectTransporterTarget,
  onResetTransporterTargets,
  onSelectTarget,
  onSubmitAction,
  chatMessages = [],
  onSendMessage,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [confirmedTargetId, setConfirmedTargetId] = useState<string | null>(null);
  const [confirmedWolfKillId, setConfirmedWolfKillId] = useState<string | null>(null);
  const [confirmedWhiteWolfKillId, setConfirmedWhiteWolfKillId] = useState<string | null>(null);

  // Reset confirmed local target if round or phase changes
  React.useEffect(() => {
    setConfirmedTargetId(null);
    setConfirmedWolfKillId(null);
    setConfirmedWhiteWolfKillId(null);
  }, [gameState.round, gameState.phase]);

  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const role = gameState.myRole;
  const isDead = me && !me.isAlive;

  const targetPlayer = gameState.players.find((p) => p.id === selectedTargetId);
  const cupidLover1 = gameState.players.find((p) => p.id === cupidLover1Id);
  const cupidLover2 = gameState.players.find((p) => p.id === cupidLover2Id);

  // Transporter helpers
  const target1Player = transporterTarget1Id
    ? gameState.players.find((p) => p.id === transporterTarget1Id)
    : null;
  const target2Player = transporterTarget2Id
    ? gameState.players.find((p) => p.id === transporterTarget2Id)
    : null;

  const hasTransporterSwapped = Boolean(
    gameState.transporterSwappedTonight ||
    (gameState.transporterTarget1Id && gameState.transporterTarget2Id) ||
    confirmedTargetId === 'TRANSPORT_CONFIRMED'
  );

  const transporterTarget1Display =
    gameState.transporterTarget1Name || target1Player?.name || 'Player A';
  const transporterTarget2Display =
    gameState.transporterTarget2Name || target2Player?.name || 'Player B';

  const canSwap = Boolean(
    transporterTarget1Id &&
    transporterTarget2Id &&
    transporterTarget1Id !== transporterTarget2Id &&
    !submitting
  );

  const handleTransportSwap = async () => {
    if (!transporterTarget1Id || !transporterTarget2Id || submitting) return;
    setSubmitting(true);
    sounds.playTransporterSwap();
    try {
      const ok = await onSubmitAction('TRANSPORT', transporterTarget1Id, transporterTarget2Id);
      if (ok) {
        setConfirmedTargetId('TRANSPORT_CONFIRMED');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePassTransport = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const ok = await onSubmitAction('PASS_TRANSPORT', '');
      if (ok) {
        setConfirmedTargetId(null);
        onResetTransporterTargets?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearSwap = async () => {
    if (submitting) return;
    onResetTransporterTargets?.();
    setConfirmedTargetId(null);
    if (hasTransporterSwapped) {
      await onSubmitAction('PASS_TRANSPORT', '');
    }
  };

  // Werewolf hunting time lock (15s for wolves when Witch is present, full night when no Witch)
  const isWolfHuntingLocked = Boolean(
    gameState.werewolfHuntingLocked ||
    (gameState.hasAliveWitch && gameState.timer <= 5)
  );

  // Werewolf pack kill lock
  const myWolfVote = gameState.werewolfVotes?.find((v) => v.werewolfId === me?.id);
  const isWolfKillLocked = Boolean(
    confirmedWolfKillId ||
    myWolfVote ||
    (gameState.myNightAction?.type === 'KILL')
  );
  const lockedWolfTargetName =
    myWolfVote?.targetName ||
    (gameState.myNightAction?.type === 'KILL'
      ? gameState.players.find((p) => p.id === gameState.myNightAction?.targetId)?.name
      : null) ||
    (targetPlayer && confirmedWolfKillId === targetPlayer.id ? targetPlayer.name : null);

  // White Wolf solo kill lock
  const isWhiteWolfSoloKillLocked = Boolean(
    confirmedWhiteWolfKillId ||
    (role === 'WHITE_WOLF' && gameState.myNightAction?.type === 'WHITE_WOLF_KILL')
  );
  const lockedWhiteWolfSoloTargetId =
    confirmedWhiteWolfKillId ||
    (role === 'WHITE_WOLF' && gameState.myNightAction?.type === 'WHITE_WOLF_KILL'
      ? gameState.myNightAction.targetId
      : null);
  const lockedWhiteWolfSoloTarget = gameState.players.find(
    (p) => p.id === lockedWhiteWolfSoloTargetId
  );

  // Bodyguard helpers
  const activeGuardedPlayerId =
    (gameState.myNightAction?.type === 'GUARD' ? gameState.myNightAction.targetId : null) ||
    (role === 'BODYGUARD' ? confirmedTargetId : null);
  const activeGuardedPlayer = gameState.players.find((p) => p.id === activeGuardedPlayerId);
  const isSelectedPlayerGuarded = Boolean(
    targetPlayer && activeGuardedPlayerId === targetPlayer.id
  );
  const isTargetingSelf = Boolean(targetPlayer && targetPlayer.id === me?.id);

  // Doppelganger helpers
  const activeDoppelTargetId =
    gameState.doppelgangerTargetId ||
    (role === 'DOPPELGANGER' ? confirmedTargetId : null);
  const activeDoppelPlayer =
    gameState.players.find((p) => p.id === activeDoppelTargetId) ||
    (gameState.doppelgangerTargetName
      ? gameState.players.find((p) => p.name === gameState.doppelgangerTargetName)
      : null);
  const isSelectedPlayerDoppelBound = Boolean(
    targetPlayer &&
      activeDoppelPlayer &&
      (targetPlayer.id === activeDoppelPlayer.id || targetPlayer.name === activeDoppelPlayer.name)
  );

  const isLoversLocked = Boolean(
    isCupidBound ||
    gameState.cupidLovers ||
    confirmedTargetId === 'CUPID_BOUND'
  );

  const canBindLovers = Boolean(
    !isLoversLocked &&
    cupidLover1 &&
    cupidLover2 &&
    cupidLover1.id !== cupidLover2.id &&
    !submitting
  );

  if (isDead) {
    return (
      <div className="p-4 rounded-2xl glass-card-subtle border border-white/80 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 italic max-w-xl mx-auto backdrop-blur-md">
        Your spirit observes from beyond the veil. Dead players rest in silent peace.
      </div>
    );
  }

  const handleConfirm = async (
    type: any,
    targetId: string,
    secondaryTargetId?: string,
    chosenRole?: Role
  ) => {
    if (submitting) return;
    setSubmitting(true);
    const ok = await onSubmitAction(type, targetId, secondaryTargetId, chosenRole);
    setSubmitting(false);
    if (ok) {
      if (type === 'CUPID_LOVERS') {
        setConfirmedTargetId('CUPID_BOUND');
        onCupidBound?.();
      } else if (type === 'KILL') {
        setConfirmedWolfKillId(targetId);
        setConfirmedTargetId(targetId);
      } else if (type === 'WHITE_WOLF_KILL') {
        setConfirmedWhiteWolfKillId(targetId);
      } else {
        setConfirmedTargetId(targetId);
      }
    }
  };

  const handleJailorJail = async (targetId: string) => {
    if (submitting) return;
    sounds.playJailLock();
    setSubmitting(true);
    try {
      await onSubmitAction('JAILOR_JAIL', targetId);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJailorExecute = async () => {
    if (submitting || !gameState.jailedPlayerId) return;
    sounds.playJailLock();
    setSubmitting(true);
    try {
      await onSubmitAction('JAILOR_EXECUTE', gameState.jailedPlayerId);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJailorDontExecute = async () => {
    if (submitting || !gameState.jailedPlayerId) return;
    sounds.playJailLock();
    setSubmitting(true);
    try {
      await onSubmitAction('JAILOR_DONT_EXECUTE', gameState.jailedPlayerId);
    } finally {
      setSubmitting(false);
    }
  };

  const isWerewolfPackMember =
    role === 'WEREWOLF' ||
    role === 'WOLF_CUB' ||
    role === 'WHITE_WOLF' ||
    (role === 'CURSED' && gameState.myTeam === 'WEREWOLVES');

  return (
    <div
      id="night-action-panel"
      className="w-full max-w-2xl mx-auto p-4 sm:p-5 rounded-3xl glass-card border border-white/80 dark:border-white/10 shadow-2xl backdrop-blur-2xl"
    >
      {/* 0A. JAILED PLAYER SCREEN - REPLACES NORMAL ROLE SCREEN ENTIRELY */}
      {gameState.isJailedTonight ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-stone-950 via-zinc-900 to-black border-2 border-stone-800 p-5 sm:p-7 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          {/* Iron Jail Bars Visual Effect Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25 flex justify-around"
            aria-hidden="true"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-full bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-800 shadow-[inset_0_0_4px_rgba(0,0,0,0.8)] border-x border-black"
              />
            ))}
          </div>

          {/* Header */}
          <div className="relative z-10 space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-950/80 border-2 border-amber-600/70 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-950/60">
              <Lock className="w-9 h-9 animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-amber-400 tracking-wider">
              You were hauled off to jail!
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
              The Jailor dragged you from your bed into a high-security stone dungeon cell for interrogation before nightfall.
            </p>

            {/* Audio Cue Indicator */}
            <div className="pt-1 flex justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-amber-900/50 text-[11px] font-mono text-amber-300/90 shadow-md">
                <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Dungeon Ambience Active</span>
                <span className="text-zinc-600">•</span>
                <button
                  type="button"
                  id="replay-jail-slam-btn"
                  onClick={() => sounds.playJailSlam()}
                  className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40 transition cursor-pointer"
                  title="Play heavy metallic cell door slam"
                >
                  Replay Cell Slam
                </button>
              </div>
            </div>
          </div>

          {/* Mechanic Badges */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/50 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-300 font-bold font-cinzel text-xs">
                <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Role Block (Silenced)</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-normal">
                You cannot perform any night actions or use any special powers tonight (Doctor heals, Werewolf attacks, Seer visions, etc. are disabled).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold font-cinzel text-xs">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Absolute Protection</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-normal">
                The fortified iron bars shield you from all outside harm. Attacks from Werewolves, Witches, or Serial Killers fail silently against your cell!
              </p>
            </div>
          </div>

          {/* Interrogation Chat */}
          <div className="relative z-10 text-left">
            <JailChat
              chatMessages={chatMessages}
              onSendMessage={onSendMessage}
              isJailor={false}
            />
          </div>
        </div>
      ) : gameState.phase === 'TWILIGHT' ? (
        /* 0B. TWILIGHT PHASE (5 SECONDS) */
        <div className="rounded-3xl bg-gradient-to-br from-amber-950/40 via-purple-950/40 to-indigo-950/50 border border-amber-500/30 p-5 sm:p-6 space-y-4 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-cinzel text-sm sm:text-base">
              <Sunset className="w-5 h-5 text-amber-400" />
              <span>Twilight Phase (5s)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>{gameState.timer}s remaining</span>
            </div>
          </div>

          {role === 'JAILOR' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-900/30 border border-amber-700/40 space-y-1.5 text-xs text-amber-100">
                <div className="font-bold font-cinzel text-amber-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>The Jailor's Custody Choice</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Select a suspect from the living villagers above before the 5-second twilight window expires. When night begins, they will be hauled off to jail, role-blocked, and shielded from outside attacks!
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                  <span className="text-amber-400 font-semibold">
                    Executions Remaining: {gameState.jailorExecutionCount ?? 3} / 3
                  </span>
                  {gameState.jailorGuilty && (
                    <span className="text-rose-400 font-bold">
                      ⚖️ Guilt Penalty: Executions Disabled
                    </span>
                  )}
                </div>
              </div>

              {/* Selected Target Status & Direct Selection Card */}
              {(() => {
                const target =
                  gameState.players.find((p) => p.id === selectedTargetId) ||
                  (gameState.jailorPendingTargetId
                    ? gameState.players.find((p) => p.id === gameState.jailorPendingTargetId)
                    : null);

                return target ? (
                  <div className="p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-full bg-amber-950 border border-amber-500 flex items-center justify-center text-amber-400 font-bold text-sm">
                        {target.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400 uppercase tracking-widest font-mono">Selected Suspect</div>
                        <div className="text-sm font-bold text-white font-cinzel">{target.name}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleJailorJail(target.id)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-amber-950/50 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{submitting ? 'Locking In...' : `Jail ${target.name}`}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-dashed border-zinc-700 text-center text-xs text-zinc-400 space-y-1">
                    <p className="font-medium text-zinc-300">Click any living player card on the village board above to select your prisoner.</p>
                    <p className="text-[11px] text-zinc-500">You must choose before the 5-second countdown finishes!</p>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-4 space-y-2">
              <div className="font-cinzel text-amber-200 font-bold text-sm sm:text-base">
                Dusk Settles Over the Hamlet
              </div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                The sky turns crimson and twilight descends. The Jailor is currently selecting a suspect to drag into custody before nightfall.
              </p>
            </div>
          )}
        </div>
      ) : role === 'JAILOR' && gameState.phase === 'NIGHT' ? (
        /* 0C. JAILOR NIGHT INTERROGATION & EXECUTION PANEL */
        <div className="rounded-3xl bg-gradient-to-b from-stone-950 via-zinc-900 to-black border-2 border-stone-800 p-5 sm:p-6 space-y-5 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-amber-950 border border-amber-600/60 text-amber-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cinzel font-bold text-white text-base">
                  The Jailor's Interrogation Chamber
                </h3>
                <p className="text-xs text-zinc-400">
                  Interrogate your captive and decree whether they live or die tonight.
                </p>
              </div>
            </div>

            {/* Execution Count Counter */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              <span>
                Executions:{' '}
                <strong className={gameState.jailorGuilty || (gameState.jailorExecutionCount ?? 0) <= 0 ? 'text-rose-400' : 'text-amber-400'}>
                  {gameState.jailorExecutionCount ?? 3} / 3
                </strong>
              </span>
            </div>
          </div>

          {/* Guilt Penalty Banner if applicable */}
          {gameState.jailorGuilty && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-600/70 text-rose-200 text-xs space-y-1">
              <div className="font-bold font-cinzel flex items-center gap-1.5 text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Overcome by Guilt</span>
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-300">
                You previously executed an innocent Villager! Tormented by remorse, all your remaining execution abilities have been revoked permanently. You can still jail suspects on future nights to role-block and protect them, but you can never execute again.
              </p>
            </div>
          )}

          {/* Prisoner Status Card */}
          {gameState.jailedPlayerId ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-950/70 border border-amber-600/60 flex items-center justify-center text-amber-400 font-bold font-cinzel text-base">
                    {gameState.jailedPlayerName?.slice(0, 2).toUpperCase() || 'PR'}
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                      Current Prisoner
                    </div>
                    <div className="text-base font-bold text-white font-cinzel">
                      {gameState.jailedPlayerName || 'Unknown Prisoner'}
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      🔒 Role-Blocked & Protected from Outside Attacks
                    </div>
                  </div>
                </div>

                {/* Current Action State Pill */}
                <div className="w-full sm:w-auto text-center sm:text-right">
                  {gameState.jailorExecutingTonight ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 font-bold text-xs animate-pulse">
                      <Skull className="w-3.5 h-3.5 text-rose-400" />
                      <span>Execution Scheduled</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 font-bold text-xs">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sparing Prisoner</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Execute vs Don't Execute */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Execute Button */}
                <button
                  type="button"
                  id="jailor-execute-btn"
                  disabled={
                    submitting ||
                    gameState.jailorGuilty ||
                    (gameState.jailorExecutionCount ?? 0) <= 0 ||
                    Boolean(gameState.jailorExecutingTonight)
                  }
                  onClick={handleJailorExecute}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold cursor-pointer ${
                    gameState.jailorExecutingTonight
                      ? 'bg-rose-900/60 border-2 border-rose-500 text-rose-100 shadow-lg shadow-rose-950/80'
                      : gameState.jailorGuilty || (gameState.jailorExecutionCount ?? 0) <= 0
                      ? 'bg-zinc-900/40 border border-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                      : 'bg-rose-950/50 hover:bg-rose-900/60 border border-rose-700/60 text-rose-200 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-cinzel">
                    <Skull className="w-4 h-4 text-rose-400" />
                    <span>Execute</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    Unstoppable Attack • Ignores Doctor & Bodyguard
                  </span>
                </button>

                {/* Don't Execute Button */}
                <button
                  type="button"
                  id="jailor-dont-execute-btn"
                  disabled={submitting || !gameState.jailorExecutingTonight}
                  onClick={handleJailorDontExecute}
                  className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold cursor-pointer ${
                    !gameState.jailorExecutingTonight
                      ? 'bg-emerald-900/50 border-2 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-950/80'
                      : 'bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-700 text-zinc-200 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-cinzel">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Don't Execute</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    Interrogate only • Prisoner released safely at dawn
                  </span>
                </button>
              </div>

              {/* Interrogation Chat Window */}
              <JailChat
                chatMessages={chatMessages}
                onSendMessage={onSendMessage}
                isJailor={true}
                partnerName={gameState.jailedPlayerName}
              />
            </div>
          ) : (
            <div className="text-center py-6 space-y-2 bg-zinc-900/40 rounded-2xl border border-zinc-800 p-4">
              <div className="font-cinzel text-zinc-300 font-bold text-sm">
                No Prisoner In Custody Tonight
              </div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                No suspect was hauled to prison during the Twilight Phase. Stay alert until dawn breaks!
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
      {/* 1. WEREWOLF PANEL */}
      {isWerewolfPackMember && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400 font-bold font-cinzel text-sm">
              <Moon className="w-4 h-4" />
              <span>Werewolf Pack Hunt</span>
            </div>
            {gameState.werewolfTeammates && (
              <div className="text-[11px] text-zinc-400 font-mono">
                Pack: {gameState.werewolfTeammates.map((w) => w.name).join(', ')}
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-300">
            Click any living villager on the board above to mark them for death tonight. Once confirmed, your kill cannot be undone.
          </p>

          {/* Werewolf Pack Voting Coordination (Shared in Real Time Among Werewolves) */}
          {gameState.werewolfVotes && gameState.werewolfVotes.length > 0 && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-red-300 font-cinzel">
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-red-400" />
                  <span>Pack Night Votes (Visible only to Werewolves):</span>
                </div>
                <span className="text-[10px] text-red-400/80 font-mono">
                  {gameState.werewolfVotes.length} {gameState.werewolfVotes.length === 1 ? 'Vote' : 'Votes'} Cast
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {gameState.werewolfVotes.map((wv) => {
                  const isMyVote = wv.werewolfId === gameState.myPlayerId;
                  return (
                    <div
                      key={wv.werewolfId}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] font-mono ${
                        isMyVote
                          ? 'bg-red-900/50 border-red-500 text-red-200 font-bold'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span>🐺 {wv.werewolfName}{isMyVote ? ' (You)' : ''}</span>
                      <span className="text-red-400 font-bold">→ {wv.targetName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Werewolf Hunting Window info / 15s limit */}
          {gameState.hasAliveWitch ? (
            isWolfHuntingLocked ? (
              <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/60 flex items-center gap-2.5 text-xs text-amber-200">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                <div>
                  <span className="font-bold font-cinzel">Pack Hunt Closed (15s elapsed)</span>
                  <p className="text-[11px] text-zinc-300 mt-0.5">
                    Final seconds reserved for the Witch's secret alchemy. Wolves can no longer change prey.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/50 text-[11px]">
                <span className="text-red-300 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Werewolf Hunting Window:
                </span>
                <span className="font-mono font-bold text-amber-300 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                  ⏳ {Math.max(0, gameState.timer - 5)}s remaining
                </span>
              </div>
            )
          ) : (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px]">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                Full night dedicated to the Werewolf pack hunt
              </span>
              <span className="font-mono font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded">
                ⏳ {gameState.timer}s
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
            <div className="text-xs">
              {isWolfKillLocked ? (
                <span className="text-indigo-400 font-mono font-semibold">
                  Locked Strike: <strong>{lockedWolfTargetName || 'Prey'}</strong> (Locked in)
                </span>
              ) : isWolfHuntingLocked ? (
                <span className="text-amber-400 font-semibold">
                  Hunting Window Expired: Witch holds the remaining 5s
                </span>
              ) : targetPlayer ? (
                <span>
                  Marked Prey:{' '}
                  <strong className="text-red-400 font-semibold">{targetPlayer.name}</strong>
                  {targetPlayer.id === me?.id && (
                    <span className="text-red-400 font-mono text-[11px] ml-1.5">(Cannot target yourself)</span>
                  )}
                </span>
              ) : (
                <span className="text-zinc-500 italic">No prey selected yet</span>
              )}
            </div>

            <button
              id="confirm-werewolf-kill-btn"
              onClick={() => targetPlayer && !isWolfKillLocked && !isWolfHuntingLocked && handleConfirm('KILL', targetPlayer.id)}
              disabled={
                !targetPlayer ||
                submitting ||
                isWolfKillLocked ||
                isWolfHuntingLocked ||
                targetPlayer.id === me?.id ||
                targetPlayer.role === 'WEREWOLF' ||
                targetPlayer.role === 'WOLF_CUB' ||
                targetPlayer.role === 'WHITE_WOLF'
              }
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg min-h-[44px] ${
                isWolfKillLocked
                  ? 'bg-indigo-900/80 border border-indigo-500/70 text-indigo-200 cursor-not-allowed shadow-md'
                  : isWolfHuntingLocked
                  ? 'bg-zinc-850 border border-amber-500/50 text-amber-300/80 cursor-not-allowed'
                  : 'bg-red-800 hover:bg-red-700 text-white shadow-red-950/50 disabled:opacity-40 cursor-pointer'
              }`}
            >
              {submitting ? (
                <>
                  <Crosshair className="w-3.5 h-3.5 animate-spin" />
                  <span>Locking Strike...</span>
                </>
              ) : isWolfKillLocked ? (
                <>
                  <Check className="w-3.5 h-3.5 text-indigo-300" />
                  <span>✓ Strike Locked: {lockedWolfTargetName || 'Target'} (Cannot be undone)</span>
                </>
              ) : isWolfHuntingLocked ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hunting Expired (15s Done) - Witch's Time</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Confirm Strike</span>
                </>
              )}
            </button>
          </div>

          {isWolfKillLocked && (
            <p className="text-[11px] text-zinc-400 italic">
              Your pack kill target is permanently locked in for tonight and cannot be undone.
            </p>
          )}
        </div>
      )}

      {/* 2. SEER PANEL */}
      {(role === 'SEER' || (role === 'APPRENTICE_SEER' && gameState.isApprenticeSeerActive)) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-bold font-cinzel text-sm">
              <Eye className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>
                {role === 'APPRENTICE_SEER'
                  ? "Apprentice Seer's Divination (Active)"
                  : "Seer's Divination"}
              </span>
            </div>
            <span className="text-[11px] text-indigo-300/80 font-mono">
              Limit: 1 Player / Night
            </span>
          </div>

          <p className="text-xs text-zinc-300">
            Select one player to uncover their allegiance. Villagers show as Good Team; Werewolves and the White Wolf show as Werewolf.
          </p>

          {/* Immediate Investigation Report Card */}
          {gameState.seerResult && (
            <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/70 text-xs shadow-[0_0_20px_rgba(99,102,241,0.25)] animate-fade-in space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-zinc-300">True Allegiance of:</span>
                  <strong className="text-white font-cinzel text-sm">{gameState.seerResult.targetName}</strong>
                </div>
                <div
                  className={`font-bold font-mono px-3 py-1 rounded-lg text-xs border ${
                    gameState.seerResult.isWerewolf
                      ? 'bg-red-950 text-red-200 border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                      : 'bg-indigo-950 text-indigo-200 border-indigo-600'
                  }`}
                >
                  {gameState.seerResult.isWerewolf ? '🐺 Werewolf' : '🛡️ Good Team'}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-indigo-900/60 text-xs">
                <span className="text-zinc-400 font-mono">Status:</span>
                <span
                  className={`font-bold font-cinzel text-sm ${
                    gameState.seerResult.isWerewolf ? 'text-red-400' : 'text-indigo-400'
                  }`}
                >
                  {gameState.seerResult.isWerewolf ? 'Werewolf' : 'Good Team'}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                  Revealed to you
                </span>
              </div>
            </div>
          )}

          {/* Divination Archive from earlier nights */}
          {gameState.seerHistory && gameState.seerHistory.length > 0 && (
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
                Divination Archive (Past Checks):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {gameState.seerHistory.map((h) => (
                  <span
                    key={h.targetId}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                      h.isWerewolf
                        ? 'bg-red-950/70 border-red-700 text-red-300'
                        : 'bg-indigo-950/70 border-indigo-700 text-indigo-300'
                    }`}
                  >
                    {h.targetName}: {h.isWerewolf ? 'Werewolf' : 'Good Team'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* If already investigated this night, show complete badge; otherwise show action button */}
          {gameState.seerResult ? (
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-center text-xs text-indigo-200 font-mono">
              ✨ Divination complete for tonight. You can only inspect 1 player per night. Rest your sight until dawn.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
              <div className="text-xs">
                {targetPlayer ? (
                  <span>
                    Target:{' '}
                    <strong className="text-indigo-400 font-semibold">{targetPlayer.name}</strong>
                    {targetPlayer.role && (
                      <span className="ml-2 text-zinc-400 font-mono text-[11px]">
                        (Known: {targetPlayer.role})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-zinc-500 italic">Select a player card on the board to gaze into their soul</span>
                )}
              </div>

              <button
                id="confirm-seer-investigate-btn"
                onClick={() => targetPlayer && handleConfirm('INVESTIGATE', targetPlayer.id)}
                disabled={!targetPlayer || submitting}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/50 min-h-[44px]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{submitting ? 'Divining...' : 'Reveal Role Now'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. DOCTOR PANEL */}
      {role === 'DOCTOR' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-bold font-cinzel text-sm">
              <HeartPulse className="w-4 h-4" />
              <span>Doctor's Antidote & Care</span>
            </div>
            {gameState.doctorLastTargetName && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300">
                Protected Last Night: {gameState.doctorLastTargetName}
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Select one player (including yourself) to administer medicine and protect against nocturnal physical attacks (Werewolves & Serial Killer).
          </p>

          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-900/50 text-[11px] text-zinc-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-300 font-mono text-[10px] uppercase tracking-wider">
              <span>Physician's Rules:</span>
            </div>
            <p className="text-zinc-300">
              • <strong>Consecutive Protection Limit:</strong> You cannot protect the same player two nights in a row (this restriction applies to yourself as well).
            </p>
            <p className="text-zinc-400 text-[10px]">
              • <strong>Damage Scope:</strong> Defends against physical attacks (Werewolves & Serial Killer). Cannot save against Witch poison, Arsonist fire, or Hunter vengeance.
            </p>
          </div>

          {gameState.doctorLastTargetId && targetPlayer?.id === gameState.doctorLastTargetId && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-600/70 text-rose-200 text-xs flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Consecutive Protection Restricted:</strong> You protected {targetPlayer.name} last night. You must choose someone else tonight.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
            <div className="text-xs">
              {targetPlayer ? (
                <div>
                  <span className="text-zinc-400">Chosen Patient: </span>
                  <strong className="text-indigo-300 font-semibold">{targetPlayer.name}</strong>
                  {targetPlayer.id === gameState.myPlayerId && (
                    <span className="ml-1 text-[10px] font-mono text-indigo-400 font-bold">(Self)</span>
                  )}
                  {confirmedTargetId === targetPlayer.id && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/60 text-indigo-300 font-mono text-[10px] font-bold">
                      ✓ Care Stationed
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-zinc-500 italic">Select a villager on the board to treat</span>
              )}
            </div>

            <button
              id="confirm-doctor-protect-btn"
              onClick={() => targetPlayer && handleConfirm('PROTECT', targetPlayer.id)}
              disabled={
                !targetPlayer ||
                submitting ||
                targetPlayer.id === gameState.doctorLastTargetId ||
                confirmedTargetId === targetPlayer?.id
              }
              className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-xs font-bold transition shadow-lg min-h-[44px] cursor-pointer ${
                confirmedTargetId === targetPlayer?.id
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-400'
                  : targetPlayer?.id === gameState.doctorLastTargetId
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-50'
                  : !targetPlayer
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-50'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/50'
              }`}
            >
              {confirmedTargetId === targetPlayer?.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>✓ Treatment Administered</span>
                </>
              ) : targetPlayer?.id === gameState.doctorLastTargetId ? (
                <>
                  <XCircle className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Cannot Protect Consecutive Nights</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>{targetPlayer ? `Administer Antidote (${targetPlayer.name})` : 'Administer Antidote'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. BODYGUARD PANEL */}
      {role === 'BODYGUARD' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-bold font-cinzel text-sm">
              <Shield className="w-4 h-4" />
              <span>Bodyguard's Iron Vigil</span>
            </div>
            {gameState.bodyguardLastTargetName ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300">
                Guarded Last Night: {gameState.bodyguardLastTargetName}
              </span>
            ) : activeGuardedPlayer ? (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/60 text-[11px] font-mono text-cyan-300 animate-pulse">
                <Check className="w-3 h-3 text-cyan-400" />
                <span>Guarding: {activeGuardedPlayer.name}</span>
              </div>
            ) : null}
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Choose a fellow villager to protect tonight. If nocturnal killers strike your ally, you will deflect their fatal blows and save them—sacrificing your own life in the fight.
          </p>

          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-900/50 text-[11px] text-zinc-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-300 font-mono text-[10px] uppercase tracking-wider">
              <span>Bodyguard's Code:</span>
            </div>
            <p className="text-zinc-300">
              • <strong>Heroic Sacrifice:</strong> If Werewolves, White Wolf, or Serial Killer attack your guarded ally, the ally survives unharmed while you perish in battle.
            </p>
            <p className="text-zinc-300">
              • <strong>Restrictions:</strong> You cannot guard yourself, and you cannot guard the same player two nights in a row.
            </p>
            <p className="text-zinc-400 text-[10px]">
              • <strong>Unstoppable Threats:</strong> Cannot protect against Witch poison, Arsonist fire, Hunter shot, or Veteran alert.
            </p>
          </div>

          {isTargetingSelf && (
            <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-600/60 text-amber-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>The Bodyguard cannot guard themselves! Please select a fellow villager.</span>
            </div>
          )}

          {gameState.bodyguardLastTargetId && targetPlayer?.id === gameState.bodyguardLastTargetId && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-600/70 text-rose-200 text-xs flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Consecutive Guard Restricted:</strong> You stood guard over {targetPlayer.name} last night. You must choose someone else tonight.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
            <div className="text-xs">
              {targetPlayer ? (
                <div>
                  <span className="text-zinc-400">Chosen Ally: </span>
                  <strong className="text-cyan-300 font-semibold">{targetPlayer.name}</strong>
                  {targetPlayer.id === gameState.myPlayerId && (
                    <span className="ml-1 text-[10px] font-mono text-rose-400 font-bold">(Self - Cannot Guard)</span>
                  )}
                  {isSelectedPlayerGuarded && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 font-mono text-[10px] font-bold">
                      ✓ Guard Stationed
                    </span>
                  )}
                </div>
              ) : activeGuardedPlayer ? (
                <div className="text-cyan-300 text-xs">
                  Currently Guarding: <strong className="font-bold text-white">{activeGuardedPlayer.name}</strong>
                </div>
              ) : (
                <span className="text-zinc-500 italic">Select an ally from the village arena</span>
              )}
            </div>

            <button
              id="confirm-bodyguard-guard-btn"
              onClick={() => targetPlayer && !isTargetingSelf && handleConfirm('GUARD', targetPlayer.id)}
              disabled={
                !targetPlayer ||
                isTargetingSelf ||
                targetPlayer.id === gameState.bodyguardLastTargetId ||
                submitting ||
                isSelectedPlayerGuarded
              }
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition min-h-[44px] cursor-pointer shadow-lg ${
                isSelectedPlayerGuarded
                  ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-indigo-600 border border-cyan-400 text-white shadow-md opacity-100 cursor-default'
                  : !targetPlayer || isTargetingSelf || targetPlayer.id === gameState.bodyguardLastTargetId
                  ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-50'
                  : activeGuardedPlayer && activeGuardedPlayer.id !== targetPlayer.id
                  ? 'bg-gradient-to-r from-amber-600 to-cyan-700 hover:from-amber-500 hover:to-cyan-600 text-white border border-amber-400/60 shadow-amber-950/50'
                  : 'bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white border border-cyan-500/50 shadow-cyan-950/50'
              }`}
            >
              {submitting ? (
                <>
                  <Shield className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Deploying Shield...</span>
                </>
              ) : isSelectedPlayerGuarded ? (
                <>
                  <Check className="w-4 h-4 text-cyan-200" />
                  <span>✓ Shield Active: Guarding {targetPlayer?.name}!</span>
                </>
              ) : targetPlayer?.id === gameState.bodyguardLastTargetId ? (
                <>
                  <XCircle className="w-4 h-4 text-zinc-400" />
                  <span>Cannot Guard Consecutive Nights</span>
                </>
              ) : isTargetingSelf ? (
                <>
                  <XCircle className="w-4 h-4 text-zinc-400" />
                  <span>Cannot Guard Self</span>
                </>
              ) : activeGuardedPlayer && targetPlayer && activeGuardedPlayer.id !== targetPlayer.id ? (
                <>
                  <Shield className="w-4 h-4 text-amber-200" />
                  <span>Switch Guard to {targetPlayer.name}</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-cyan-200" />
                  <span>{targetPlayer ? `Stand Guard over ${targetPlayer.name}` : 'Stand Guard'}</span>
                </>
              )}
            </button>
          </div>

          {/* Active Guard Status Feedback Banner */}
          {activeGuardedPlayer && (
            <div
              id="bodyguard-status-banner"
              className="p-3.5 rounded-xl bg-cyan-950/70 border border-cyan-500/60 text-cyan-200 text-xs flex items-start gap-3 shadow-lg animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="p-1.5 rounded-lg bg-cyan-900/80 border border-cyan-400/40 text-cyan-300 shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-cyan-200 text-xs sm:text-sm">
                  <span>🛡️ Iron Vigil Active</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 text-[10px] font-mono font-bold">
                    Guarding {activeGuardedPlayer.name}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  You are positioned outside <strong>{activeGuardedPlayer.name}</strong>'s home. If Werewolves or Serial Killer attack them tonight, you will intercept their fatal strike—protecting their life while sacrificing your own.
                </p>
                <div className="text-[10px] text-cyan-400/80 italic font-mono pt-0.5">
                  (To reassign your guard to another villager, select their card on the board)
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. WITCH PANEL - SPECIAL NIGHT ACTION & WEREWOLF REVEAL */}
      {role === 'WITCH' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-pink-400 font-bold font-cinzel text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Witch's Secret Cauldrons</span>
            </div>
            <div className="text-[10px] text-pink-300/80 font-mono bg-pink-950/60 px-2 py-0.5 rounded-md border border-pink-800/60">
              Each power 1x use in entire game
            </div>
          </div>

          {/* Active Potions Summary Pill */}
          {(gameState.witchPotions?.healActiveTonight || gameState.witchPotions?.poisonActiveTonight) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {gameState.witchPotions?.healActiveTonight && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/60 text-indigo-300 text-xs font-mono">
                  <span>✨ Elixir Active: Saving <strong>{gameState.witchPotions.healTargetName}</strong></span>
                  <button
                    onClick={() => handleConfirm('CANCEL_HEAL', '')}
                    disabled={submitting}
                    className="ml-1 text-[10px] text-indigo-200 hover:text-white bg-indigo-900/80 hover:bg-indigo-800 px-1.5 py-0.5 rounded transition cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {gameState.witchPotions?.poisonActiveTonight && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-mono">
                  <span>☠️ Poison Active: Killing <strong>{gameState.witchPotions.poisonTargetName}</strong></span>
                  <button
                    onClick={() => handleConfirm('CANCEL_POISON', '')}
                    disabled={submitting}
                    className="ml-1 text-[10px] text-rose-200 hover:text-white bg-rose-900/80 hover:bg-rose-800 px-1.5 py-0.5 rounded transition cursor-pointer font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Healing Potion (Elixir of Life) */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-400 font-cinzel tracking-wider">
                    ELIXIR OF LIFE
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    gameState.witchPotions?.healActiveTonight
                      ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-bold animate-pulse'
                      : gameState.witchPotions?.healAvailable
                      ? 'bg-zinc-950 border-zinc-800 text-indigo-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                  }`}>
                    {gameState.witchPotions?.healActiveTonight
                      ? 'Cast Tonight ✨'
                      : gameState.witchPotions?.healAvailable
                      ? '1 Available'
                      : 'Used (0/1)'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  {gameState.witchPotions?.healActiveTonight
                    ? `Administered to ${gameState.witchPotions.healTargetName}. They will survive tonight's attack.`
                    : gameState.witchPotions?.isWitchTargeted
                    ? 'Drink potion to save your own life.'
                    : gameState.witchPotions?.nightVictimName
                    ? `Save ${gameState.witchPotions.nightVictimName} from death.`
                    : 'Awaits werewolf victim.'}
                </p>
              </div>

              {gameState.witchPotions?.healActiveTonight ? (
                <div className="flex gap-2">
                  <button
                    id="witch-cancel-heal-btn"
                    onClick={() => handleConfirm('CANCEL_HEAL', '')}
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition min-h-[44px] cursor-pointer border border-zinc-600"
                  >
                    Cancel Elixir (Save for Later)
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {gameState.witchPotions?.nightVictimId ? (
                    <button
                      id="witch-heal-btn"
                      onClick={() =>
                        gameState.witchPotions?.nightVictimId &&
                        handleConfirm('HEAL', gameState.witchPotions.nightVictimId)
                      }
                      disabled={
                        !gameState.witchPotions?.healAvailable ||
                        submitting
                      }
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white text-xs font-bold transition min-h-[44px] cursor-pointer"
                    >
                      {gameState.witchPotions?.healAvailable
                        ? gameState.witchPotions?.isWitchTargeted
                          ? 'Drink Elixir (Save Yourself)'
                          : `Save ${gameState.witchPotions.nightVictimName}`
                        : 'Elixir Expended'}
                    </button>
                  ) : (
                    <button
                      disabled={true}
                      className="w-full py-2.5 rounded-xl bg-indigo-950/60 border border-indigo-900/60 opacity-50 text-indigo-300 text-xs font-medium min-h-[44px]"
                    >
                      {gameState.witchPotions?.healAvailable
                        ? 'Waiting for Werewolf Victim'
                        : 'Elixir Expended'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Poison Potion (Black Nightshade) */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-400 font-cinzel tracking-wider">
                    VIAL OF POISON
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    gameState.witchPotions?.poisonActiveTonight
                      ? 'bg-rose-950 border-rose-500 text-rose-300 font-bold animate-pulse'
                      : gameState.witchPotions?.poisonAvailable
                      ? 'bg-zinc-950 border-zinc-800 text-rose-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                  }`}>
                    {gameState.witchPotions?.poisonActiveTonight
                      ? 'Cast Tonight ☠️'
                      : gameState.witchPotions?.poisonAvailable
                      ? '1 Available'
                      : 'Used (0/1)'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  {gameState.witchPotions?.poisonActiveTonight
                    ? `Poison prepared for ${gameState.witchPotions.poisonTargetName}. They will perish at sunrise.`
                    : targetPlayer
                    ? <span>Selected target: <strong className="text-rose-300">{targetPlayer.name}</strong></span>
                    : <span>Select any living player on the board to poison them tonight.</span>}
                </p>
              </div>

              {gameState.witchPotions?.poisonActiveTonight ? (
                <div className="space-y-2">
                  <button
                    id="witch-cancel-poison-btn"
                    onClick={() => handleConfirm('CANCEL_POISON', '')}
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition min-h-[44px] cursor-pointer border border-zinc-600"
                  >
                    Cancel Poison (Save for Later)
                  </button>
                  {targetPlayer && targetPlayer.id !== gameState.witchPotions.poisonTargetId && (
                    <button
                      onClick={() => handleConfirm('POISON', targetPlayer.id)}
                      disabled={submitting}
                      className="w-full py-2 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold transition min-h-[36px] cursor-pointer"
                    >
                      Change Target to {targetPlayer.name}
                    </button>
                  )}
                </div>
              ) : (
                <button
                  id="witch-poison-btn"
                  onClick={() => targetPlayer && handleConfirm('POISON', targetPlayer.id)}
                  disabled={!gameState.witchPotions?.poisonAvailable || !targetPlayer || targetPlayer.id === gameState.myPlayerId || submitting}
                  className="w-full py-2.5 rounded-xl bg-rose-900 hover:bg-rose-800 disabled:opacity-30 disabled:hover:bg-rose-900 text-white text-xs font-bold transition min-h-[44px] cursor-pointer"
                >
                  {gameState.witchPotions?.poisonAvailable
                    ? targetPlayer
                      ? targetPlayer.id === gameState.myPlayerId
                        ? 'Cannot Poison Yourself'
                        : `Poison ${targetPlayer.name}`
                      : 'Select Target on Board'
                    : 'Poison Expended'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. CUPID PANEL (Night 1: Bind Lovers) */}
      {role === 'CUPID' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold font-cinzel text-sm">
              <Heart className="w-4 h-4 fill-rose-400" />
              <span>Cupid's Golden Arrow</span>
            </div>
            <div className="text-[10px] text-rose-300 font-mono bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/60">
              Night 1 Only
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            {gameState.round === 1
              ? isLoversLocked
                ? 'The bond of love is forged! This eternal vow cannot be altered or broken.'
                : 'Select the 1st Lover on the board, then select the 2nd Lover. Click again or tap Unselect to change.'
              : 'Your arrows were spent on the first night. You slumber alongside the village.'}
          </p>

          {gameState.round === 1 && (
            <div className="space-y-3">
              {/* Lovers Selection Cards (Slot 1 & Slot 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Lover 1 Slot */}
                <div
                  className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between min-h-[76px] ${
                    cupidLover1
                      ? isLoversLocked
                        ? 'bg-rose-950/40 border-rose-500/70 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                        : 'bg-rose-950/60 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                      : 'bg-zinc-900/40 border-dashed border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold font-cinzel text-rose-300 uppercase tracking-wider flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                      1st Lover
                    </span>
                    {!isLoversLocked && cupidLover1 && (
                      <button
                        type="button"
                        onClick={() => onUnselectCupidLover?.(1)}
                        className="text-[10px] font-semibold text-rose-200 hover:text-white bg-rose-900/70 hover:bg-rose-800 px-2 py-0.5 rounded border border-rose-600/60 transition cursor-pointer"
                        title="Unselect Lover 1"
                      >
                        ✕ Unselect
                      </button>
                    )}
                  </div>
                  {cupidLover1 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-7 h-7 rounded-full bg-rose-900 border border-rose-400 text-rose-100 text-xs font-bold flex items-center justify-center shrink-0">
                        {cupidLover1.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-sm text-white truncate">{cupidLover1.name}</div>
                        {isLoversLocked ? (
                          <div className="text-[10px] text-rose-300 font-semibold flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                            <span>Bound in Eternal Love • Locked</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-300/80">Selected • Click again on board to unselect</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400 italic py-1.5 flex items-center gap-1.5">
                      <span>👆 Click 1st player on the board</span>
                    </div>
                  )}
                </div>

                {/* Lover 2 Slot */}
                <div
                  className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between min-h-[76px] ${
                    cupidLover2
                      ? isLoversLocked
                        ? 'bg-rose-950/40 border-rose-500/70 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                        : 'bg-rose-950/60 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                      : 'bg-zinc-900/40 border-dashed border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold font-cinzel text-rose-300 uppercase tracking-wider flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                      2nd Lover
                    </span>
                    {!isLoversLocked && cupidLover2 && (
                      <button
                        type="button"
                        onClick={() => onUnselectCupidLover?.(2)}
                        className="text-[10px] font-semibold text-rose-200 hover:text-white bg-rose-900/70 hover:bg-rose-800 px-2 py-0.5 rounded border border-rose-600/60 transition cursor-pointer"
                        title="Unselect Lover 2"
                      >
                        ✕ Unselect
                      </button>
                    )}
                  </div>
                  {cupidLover2 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-7 h-7 rounded-full bg-rose-900 border border-rose-400 text-rose-100 text-xs font-bold flex items-center justify-center shrink-0">
                        {cupidLover2.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-sm text-white truncate">{cupidLover2.name}</div>
                        {isLoversLocked ? (
                          <div className="text-[10px] text-rose-300 font-semibold flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                            <span>Bound in Eternal Love • Locked</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-rose-300/80">Selected • Click again on board to unselect</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400 italic py-1.5 flex items-center gap-1.5">
                      <span>{cupidLover1 ? '👆 Click 2nd player on the board' : 'Awaiting 1st lover selection...'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bind Lovers Action Button: Transforms into disabled confirmation once clicked! */}
              {isLoversLocked ? (
                <button
                  id="cupid-bind-lovers-btn"
                  type="button"
                  disabled={true}
                  className="w-full py-3 px-4 rounded-xl font-bold font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[46px] bg-rose-950/60 border border-rose-500/60 text-rose-300 cursor-not-allowed opacity-90 shadow-lg select-none"
                >
                  <Heart className="w-4 h-4 fill-rose-400 text-rose-400 shrink-0" />
                  <span>Cupid's arrow struck true! Lovers have been bound together.</span>
                </button>
              ) : (
                <button
                  id="cupid-bind-lovers-btn"
                  type="button"
                  onClick={() =>
                    cupidLover1 &&
                    cupidLover2 &&
                    handleConfirm('CUPID_LOVERS', cupidLover1.id, cupidLover2.id)
                  }
                  disabled={!canBindLovers}
                  className={`w-full py-3 px-4 rounded-xl font-bold font-cinzel text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[46px] transition-all duration-300 ${
                    canBindLovers
                      ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.45)] cursor-pointer scale-[1.01]'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${canBindLovers ? 'fill-white animate-pulse' : ''}`} />
                  <span>
                    {submitting
                      ? 'Binding Lovers in Eternal Fate...'
                      : canBindLovers
                      ? `Bind as Lovers! (${cupidLover1?.name} ❤️ ${cupidLover2?.name})`
                      : !cupidLover1
                      ? '1. Select 1st Lover on board'
                      : !cupidLover2
                      ? '2. Select 2nd Lover on board'
                      : 'Bind as Lovers!'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. WHITE WOLF (Solo Hunt) */}
      {role === 'WHITE_WOLF' && (
        <div className="mt-3.5 p-4 rounded-2xl bg-zinc-900/95 border border-slate-700 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xs sm:text-sm text-slate-200 font-cinzel flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-slate-300" />
              <span>White Wolf Solo Hunt {gameState.round % 2 === 0 ? '(Active Tonight)' : '(Sleeping Tonight)'}</span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-slate-600 bg-slate-800 text-slate-300 font-bold">
              {gameState.round % 2 === 0 ? 'Night 2, 4, 6... Strike' : 'Awakens Alternate Nights'}
            </span>
          </div>

          {gameState.round % 2 === 0 ? (
            <>
              <p className="text-xs text-zinc-300">
                You are a solitary predator playing for yourself alone. Select a fellow living Werewolf on the board to assassinate them tonight in secret. Once confirmed, this strike cannot be undone.
              </p>

              <div className="text-xs">
                {isWhiteWolfSoloKillLocked ? (
                  <span className="text-slate-200 font-semibold font-mono">
                    ✓ Werewolf Target Slain: <strong>{lockedWhiteWolfSoloTarget?.name || 'Pack Wolf'}</strong> (Assassinated)
                  </span>
                ) : targetPlayer ? (
                  <span>
                    Selected Target:{' '}
                    <strong className="text-red-400 font-bold">{targetPlayer.name}</strong>{' '}
                    {targetPlayer.id === me?.id ? (
                      <span className="text-amber-400 font-mono text-[11px] ml-1.5">(Cannot target yourself)</span>
                    ) : targetPlayer.role === 'WEREWOLF' || targetPlayer.role === 'WOLF_CUB' ? (
                      <span className="text-indigo-400 font-mono text-[11px] ml-1.5">(Valid Werewolf Target)</span>
                    ) : (
                      <span className="text-amber-400 font-mono text-[11px] ml-1.5">(Must target a Werewolf)</span>
                    )}
                  </span>
                ) : (
                  <span className="text-zinc-500 italic">Click a fellow living Werewolf on the board to strike</span>
                )}
              </div>

              <button
                id="white-wolf-solo-kill-btn"
                type="button"
                onClick={() =>
                  targetPlayer &&
                  (targetPlayer.role === 'WEREWOLF' || targetPlayer.role === 'WOLF_CUB') &&
                  targetPlayer.id !== me?.id &&
                  !isWhiteWolfSoloKillLocked &&
                  !isWolfHuntingLocked &&
                  handleConfirm('WHITE_WOLF_KILL', targetPlayer.id)
                }
                disabled={
                  !targetPlayer ||
                  (targetPlayer.role !== 'WEREWOLF' && targetPlayer.role !== 'WOLF_CUB') ||
                  targetPlayer.id === me?.id ||
                  isWhiteWolfSoloKillLocked ||
                  isWolfHuntingLocked ||
                  submitting
                }
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all min-h-[46px] ${
                  isWhiteWolfSoloKillLocked
                    ? 'bg-slate-800 border border-slate-600 text-slate-200 cursor-not-allowed shadow-md'
                    : isWolfHuntingLocked
                    ? 'bg-zinc-850 border border-amber-500/50 text-amber-300/80 cursor-not-allowed'
                    : targetPlayer && (targetPlayer.role === 'WEREWOLF' || targetPlayer.role === 'WOLF_CUB') && targetPlayer.id !== me?.id
                    ? 'bg-gradient-to-r from-red-700 via-zinc-800 to-slate-800 hover:from-red-600 hover:to-slate-700 text-white border border-red-500/60 shadow-lg shadow-red-950/50 cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <Crosshair className="w-4 h-4 animate-spin text-red-200" />
                    <span>Executing Assassination...</span>
                  </>
                ) : isWhiteWolfSoloKillLocked ? (
                  <>
                    <Check className="w-4 h-4 text-slate-300" />
                    <span>✓ Werewolf Target Slain: {lockedWhiteWolfSoloTarget?.name || 'Werewolf'} (Cannot be undone)</span>
                  </>
                ) : isWolfHuntingLocked ? (
                  <>
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Hunting Window Expired (15s Done) - Witch's Time</span>
                  </>
                ) : targetPlayer && (targetPlayer.role === 'WEREWOLF' || targetPlayer.role === 'WOLF_CUB') && targetPlayer.id !== me?.id ? (
                  <>
                    <Crosshair className="w-4 h-4 text-red-300" />
                    <span>Secretly Murder Werewolf {targetPlayer.name}</span>
                  </>
                ) : (
                  <span>Select a fellow Werewolf on board to strike</span>
                )}
              </button>

              {isWhiteWolfSoloKillLocked && (
                <p className="text-[11px] text-zinc-400 italic">
                  Your solo assassination has been executed for tonight and cannot be undone.
                </p>
              )}
            </>
          ) : (
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <p>
                Your solitary assassination power sleeps tonight. You secretly strike fellow werewolves on <strong>alternate nights (Night 2, 4, 6...)</strong>.
              </p>
              <p className="text-zinc-500 text-[11px]">
                Hunt disguised alongside the pack above for now. They do not know your true intentions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 8. LITTLE GIRL SNEAK PEEK */}
      {role === 'LITTLE_GIRL' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-400 font-bold font-cinzel text-sm">
              <Eye className="w-4 h-4" />
              <span>Little Girl's Peeping Window</span>
            </div>
            {gameState.littleGirlPeekResult && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  gameState.littleGirlPeekResult.caught
                    ? 'bg-red-950/80 text-red-300 border-red-700'
                    : 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
                }`}
              >
                {gameState.littleGirlPeekResult.caught ? '⚠️ CAUGHT!' : '✨ PEEK ACTIVE'}
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Peek through your fingers to secretly discover the Werewolf pack and see whom they are attacking tonight!
            Beware: There is a 30% chance a twig snaps and the wolves catch you spying.
          </p>

          {/* Peek Result Display */}
          {gameState.littleGirlPeekResult ? (
            gameState.littleGirlPeekResult.caught ? (
              <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-700/80 text-red-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Snap! You were caught peeking!</span>
                </div>
                <p className="leading-relaxed text-zinc-300">
                  A dry twig snapped under your boots. The wolves turned their glowing red eyes directly toward your hiding spot in the dark!
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-amber-500/50 text-xs space-y-2.5 shadow-lg">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                  <Eye className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span>Successful Peek: Pack Intel Revealed!</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
                    Werewolves Spotted in the Woods:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {gameState.littleGirlPeekResult.werewolfNames &&
                    gameState.littleGirlPeekResult.werewolfNames.length > 0 ? (
                      gameState.littleGirlPeekResult.werewolfNames.map((wName, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-700/70 text-red-200 font-bold flex items-center gap-1 text-xs"
                        >
                          <Moon className="w-3 h-3 text-red-400 fill-red-400" />
                          <span>{wName}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-400 italic">No wolves visible right now.</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
                  <span className="text-zinc-400">Current Wolf Target:</span>
                  {gameState.littleGirlPeekResult.targetName ? (
                    <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-600 text-rose-200 font-bold">
                      🎯 {gameState.littleGirlPeekResult.targetName}
                    </span>
                  ) : (
                    <span className="text-zinc-400 italic">The pack has not agreed on a prey yet...</span>
                  )}
                </div>
                <div className="text-[11px] text-amber-300/80 italic">
                  💡 Note: Wolf markers and prey targets are also marked on the player arena cards!
                </div>
              </div>
            )
          ) : (
            <button
              id="little-girl-peek-btn"
              type="button"
              onClick={() => me && handleConfirm('LITTLE_GIRL_PEEK', me.id)}
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-h-[46px] shadow-[0_0_20px_rgba(245,158,11,0.3)] transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{submitting ? 'Peeking through the mist...' : 'Peek at Werewolves Tonight (30% Risk)'}</span>
            </button>
          )}
        </div>
      )}

      {/* 9. DOPPELGANGER (Night 1: Bind Fate, or Night > 1: Reflection Active) */}
      {role === 'DOPPELGANGER' && gameState.round === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-400 font-bold font-cinzel text-sm">
              <UserCheck className="w-4 h-4" />
              <span>Doppelganger Mirror</span>
            </div>
            {activeDoppelPlayer && (
              <div className="text-[11px] text-teal-300 font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Bound: {activeDoppelPlayer.name}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-zinc-300">
            {targetPlayer ? (
              <span>
                Target Reflection:{' '}
                <strong className="text-white font-bold">{targetPlayer.name}</strong>
                {isSelectedPlayerDoppelBound && (
                  <span className="ml-2 text-indigo-400 font-semibold font-mono text-[11px]">
                    (Currently Bound)
                  </span>
                )}
              </span>
            ) : activeDoppelPlayer ? (
              <span>
                Currently Bound:{' '}
                <strong className="font-bold text-white">{activeDoppelPlayer.name}</strong>
              </span>
            ) : (
              <span>
                Select a player on the board. When they die, you will mirror their reflection and inherit their role!
              </span>
            )}
          </div>

          <button
            id="doppelganger-bind-btn"
            type="button"
            onClick={() => targetPlayer && targetPlayer.id !== me?.id && handleConfirm('DOPPELGANGER_BIND', targetPlayer.id)}
            disabled={!targetPlayer || targetPlayer.id === me?.id || submitting}
            className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-h-[46px] transition-all shadow-lg cursor-pointer ${
              submitting
                ? 'bg-zinc-800 text-zinc-400 cursor-wait'
                : isSelectedPlayerDoppelBound
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-300 shadow-md'
                : activeDoppelPlayer && targetPlayer && activeDoppelPlayer.id !== targetPlayer.id
                ? 'bg-gradient-to-r from-amber-600 to-teal-600 hover:from-amber-500 hover:to-teal-500 text-white border border-amber-400/50 shadow-amber-950/50'
                : targetPlayer
                ? 'bg-gradient-to-r from-teal-700 to-cyan-700 hover:from-teal-600 hover:to-cyan-600 text-white border border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.3)]'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
            }`}
          >
            {submitting ? (
              <>
                <UserCheck className="w-4 h-4 animate-spin text-teal-200" />
                <span>Binding Reflection...</span>
              </>
            ) : isSelectedPlayerDoppelBound ? (
              <>
                <Check className="w-4 h-4 text-indigo-200" />
                <span>✓ Reflection Bound to {targetPlayer?.name || activeDoppelPlayer?.name}!</span>
              </>
            ) : activeDoppelPlayer && targetPlayer && activeDoppelPlayer.id !== targetPlayer.id ? (
              <>
                <UserCheck className="w-4 h-4 text-amber-200" />
                <span>Switch Reflection to {targetPlayer.name}</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 text-teal-200" />
                <span>{targetPlayer ? `Bind Reflection to ${targetPlayer.name}` : 'Select player on board'}</span>
              </>
            )}
          </button>

          {/* Active Doppelganger Status Feedback Banner */}
          {activeDoppelPlayer && (
            <div
              id="doppelganger-status-banner"
              className="p-3.5 rounded-xl bg-teal-950/70 border border-teal-500/60 text-teal-200 text-xs flex items-start gap-3 shadow-lg animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="p-1.5 rounded-lg bg-teal-900/80 border border-teal-400/40 text-teal-300 shrink-0 mt-0.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-teal-200 text-xs sm:text-sm">
                  <span>🪞 Soul Bound: Reflection Linked!</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-950 border border-teal-500 text-teal-300 text-[10px] font-mono font-bold">
                    Bound to {activeDoppelPlayer.name}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  You have chosen <strong>{activeDoppelPlayer.name}</strong> as your reflection. When they perish, you will immediately inherit their secret role and alignment!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9b. DOPPELGANGER (Night > 1: Waiting for target to die) */}
      {role === 'DOPPELGANGER' && gameState.round > 1 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-teal-400 font-bold font-cinzel text-sm">
            <UserCheck className="w-4 h-4" />
            <span>Doppelganger Mirror</span>
          </div>
          <div className="p-3.5 rounded-xl bg-teal-950/70 border border-teal-500/60 text-teal-200 text-xs space-y-1">
            <div className="font-bold flex items-center gap-2 text-sm text-teal-300">
              <span>🪞 Soul Bonded to {gameState.doppelgangerTargetName || 'your reflection'}</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Your mirror bond is active. When <strong>{gameState.doppelgangerTargetName || 'chosen player'}</strong> perishes, you will immediately inherit their secret role and team.
            </p>
          </div>
        </div>
      )}

      {/* 10. THIEF (Night 1: Choose Reserve Card) */}
      {role === 'THIEF' && gameState.round === 1 && gameState.thiefReserveRoles && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold font-cinzel text-sm">
            <Zap className="w-4 h-4" />
            <span>Thief's Midnight Heist</span>
          </div>
          <p className="text-xs text-zinc-300">
            Two unassigned role cards lie face down. You may steal one to replace your Thief card, or stay a Thief.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {gameState.thiefReserveRoles.map((reserveRole, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => me && handleConfirm('THIEF_CHOOSE', me.id, undefined, reserveRole)}
                className="p-3 rounded-xl bg-zinc-900 border border-amber-700/60 hover:border-amber-500 text-amber-300 text-xs font-bold font-cinzel text-center cursor-pointer"
              >
                Steal: {reserveRole}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 11. SERIAL KILLER */}
      {role === 'SERIAL_KILLER' && (() => {
        const activeSkTargetId =
          (gameState.myNightAction?.type === 'SERIAL_KILLER_KILL' ? gameState.myNightAction.targetId : null) ||
          confirmedTargetId;
        const activeSkTarget = activeSkTargetId ? gameState.players.find((p) => p.id === activeSkTargetId) : null;
        const effectiveVictim = targetPlayer || activeSkTarget;

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-500 font-bold font-cinzel text-sm">
                <Skull className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Serial Killer's Rampage</span>
              </div>
              <span className="text-[11px] text-rose-400/80 font-mono">Solo Killer</span>
            </div>
            <p className="text-xs text-zinc-300">
              You stalk alone in the shadows. Select a victim to execute tonight. You win when all other souls in the village have perished!
            </p>

            {activeSkTarget && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-600/60 flex items-center justify-between text-xs text-rose-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-rose-400" />
                  <span>
                    Slated for Execution: <strong className="text-white font-cinzel">{activeSkTarget.name}</strong>
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-900/80 font-mono text-rose-300 border border-rose-700/60">
                  Target Queued
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="text-[11px] text-zinc-400 font-medium">Select Victim:</div>
              <div className="flex flex-wrap gap-1.5">
                {gameState.players
                  .filter((p) => p.isAlive && p.id !== me?.id)
                  .map((p) => {
                    const isSelected = targetPlayer?.id === p.id || (!targetPlayer && activeSkTargetId === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectTarget?.(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-rose-900 border-rose-400 text-rose-100 ring-2 ring-rose-400/50 font-bold shadow-lg shadow-rose-950/60'
                            : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-rose-800/60 hover:text-white'
                        }`}
                      >
                        <Skull className="w-3 h-3 text-rose-400" />
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
              <div className="text-xs">
                {effectiveVictim && effectiveVictim.id !== me?.id ? (
                  <span>
                    Target: <strong className="text-rose-400 font-semibold">{effectiveVictim.name}</strong>
                  </span>
                ) : (
                  <span className="text-zinc-500 italic">Select a player above or from the cards</span>
                )}
              </div>
              <button
                id="confirm-serial-killer-btn"
                type="button"
                onClick={() => effectiveVictim && handleConfirm('SERIAL_KILLER_KILL', effectiveVictim.id)}
                disabled={!effectiveVictim || effectiveVictim.id === me?.id || submitting}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-800 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-rose-950/50 min-h-[44px] cursor-pointer"
              >
                <Skull className="w-3.5 h-3.5" />
                <span>
                  {submitting
                    ? 'Hunting...'
                    : activeSkTarget && (!targetPlayer || targetPlayer.id === activeSkTarget.id)
                    ? `✓ Execute ${activeSkTarget.name} (Slated)`
                    : effectiveVictim
                    ? `Execute ${effectiveVictim.name}`
                    : 'Select Target'}
                </span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* 12. SPELLCASTER (SILENCER) */}
      {role === 'SPELLCASTER' && (() => {
        const activeSilencedTargetId =
          (gameState.myNightAction?.type === 'SILENCE' ? gameState.myNightAction.targetId : null) ||
          confirmedTargetId;
        const activeSilencedTarget = activeSilencedTargetId
          ? gameState.players.find((p) => p.id === activeSilencedTargetId)
          : null;
        const effectiveSilenceTarget = targetPlayer || activeSilencedTarget;

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400 font-bold font-cinzel text-sm">
                <VolumeX className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>Spellcaster's Silence Hex</span>
              </div>
              <span className="text-[11px] text-purple-300/80 font-mono">Instant Death Hex</span>
            </div>
            <p className="text-xs text-zinc-300">
              Cast a magical hex of silence upon a player. Tomorrow, they are forbidden from sending a single message in chat. If they speak even once, they die immediately!
            </p>

            {activeSilencedTarget && (
              <div className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-600/60 flex items-center justify-between text-xs text-purple-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span>
                    Slated for Silence: <strong className="text-white font-cinzel">{activeSilencedTarget.name}</strong>
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/80 font-mono text-purple-300 border border-purple-700/60">
                  Hex Queued
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="text-[11px] text-zinc-400 font-medium">Select Player to Silence:</div>
              <div className="flex flex-wrap gap-1.5">
                {gameState.players
                  .filter((p) => p.isAlive && p.id !== me?.id)
                  .map((p) => {
                    const isSelected = targetPlayer?.id === p.id || (!targetPlayer && activeSilencedTargetId === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectTarget?.(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-900 border-purple-400 text-purple-100 ring-2 ring-purple-400/50 font-bold shadow-lg shadow-purple-950/60'
                            : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-purple-800/60 hover:text-white'
                        }`}
                      >
                        <VolumeX className="w-3 h-3 text-purple-400" />
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
              <div className="text-xs">
                {effectiveSilenceTarget ? (
                  <span>
                    Hex Target: <strong className="text-purple-400 font-semibold">{effectiveSilenceTarget.name}</strong>
                  </span>
                ) : (
                  <span className="text-zinc-500 italic">Select a player to silence tomorrow</span>
                )}
              </div>
              <button
                id="confirm-silence-btn"
                type="button"
                onClick={() => effectiveSilenceTarget && handleConfirm('SILENCE', effectiveSilenceTarget.id)}
                disabled={!effectiveSilenceTarget || submitting}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-purple-950/50 min-h-[44px] cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>
                  {submitting
                    ? 'Casting Hex...'
                    : activeSilencedTarget && (!targetPlayer || targetPlayer.id === activeSilencedTarget.id)
                    ? `✓ Silence ${activeSilencedTarget.name} (Slated)`
                    : effectiveSilenceTarget
                    ? `Cast Silence on ${effectiveSilenceTarget.name}`
                    : 'Select Target'}
                </span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* 13. ARSONIST */}
      {role === 'ARSONIST' && (() => {
        const activeArsonistAction =
          gameState.myNightAction?.type === 'ARSONIST_DOUSE'
            ? 'DOUSE'
            : gameState.myNightAction?.type === 'ARSONIST_IGNITE'
            ? 'IGNITE'
            : null;
        const dousedCount = gameState.dousedPlayerIds?.length || 0;
        const activeDouseTarget =
          activeArsonistAction === 'DOUSE' && gameState.myNightAction?.targetId
            ? gameState.players.find((p) => p.id === gameState.myNightAction?.targetId)
            : confirmedTargetId
            ? gameState.players.find((p) => p.id === confirmedTargetId)
            : null;
        const effectiveDouseTarget = targetPlayer || activeDouseTarget;

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-bold font-cinzel text-sm">
                <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>Arsonist's Gasoline & Blaze</span>
              </div>
              <span className="text-[11px] text-amber-400/80 font-mono">Night Immune vs Wolves</span>
            </div>
            <p className="text-xs text-zinc-300">
              Douse a player in gasoline tonight, or ignite all previously doused players simultaneously! You are immune to werewolf attacks at night (only Witch poison can kill you). Win alone when the village burns to ash!
            </p>

            {/* Active Queued Action Banner */}
            {activeArsonistAction === 'DOUSE' && activeDouseTarget && (
              <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-600/60 flex items-center justify-between text-xs text-amber-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>
                    Slated for Dousing: <strong className="text-white font-cinzel">{activeDouseTarget.name}</strong>
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/80 font-mono text-amber-300 border border-amber-700/60">
                  Douse Queued
                </span>
              </div>
            )}

            {activeArsonistAction === 'IGNITE' && (
              <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-600/60 flex items-center justify-between text-xs text-red-200">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>
                    Slated for Blaze: <strong className="text-white font-cinzel">IGNITING ALL {dousedCount} DOUSED SOULS!</strong>
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/80 font-mono text-red-300 border border-red-700/60">
                  Ignition Queued
                </span>
              </div>
            )}

            {dousedCount > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-600/40 text-xs">
                <span className="text-amber-300 font-bold font-mono">⛽ Currently Doused ({dousedCount}): </span>
                <span className="text-amber-100 font-semibold">
                  {gameState.dousedPlayerIds
                    ?.map((id) => gameState.players.find((p) => p.id === id)?.name || id)
                    .join(', ')}
                </span>
              </div>
            )}

            {/* Quick Player Target Chips */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-zinc-400 font-medium">Select Player to Douse:</div>
              <div className="flex flex-wrap gap-1.5">
                {gameState.players
                  .filter((p) => p.isAlive && p.id !== me?.id)
                  .map((p) => {
                    const isDoused = gameState.dousedPlayerIds?.includes(p.id);
                    const isSelected = targetPlayer?.id === p.id || (!targetPlayer && activeDouseTarget?.id === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onSelectTarget?.(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-900 border-amber-400 text-amber-100 ring-2 ring-amber-400/50 font-bold shadow-lg shadow-amber-950/60'
                            : isDoused
                            ? 'bg-amber-950/50 border-amber-700/70 text-amber-300 hover:border-amber-500'
                            : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-amber-800/60 hover:text-white'
                        }`}
                      >
                        <span>{isDoused ? '⛽' : '👤'}</span>
                        <span>{p.name}</span>
                        {isDoused && (
                          <span className="text-[10px] bg-amber-900/80 px-1.5 py-0.5 rounded font-mono text-amber-200">
                            Doused
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
              <div className="text-xs">
                {effectiveDouseTarget && effectiveDouseTarget.id !== me?.id ? (
                  <span>
                    Douse Target: <strong className="text-amber-400 font-semibold">{effectiveDouseTarget.name}</strong>
                    {gameState.dousedPlayerIds?.includes(effectiveDouseTarget.id) && (
                      <span className="ml-2 text-amber-400/90 font-mono text-[11px]">(Already Doused)</span>
                    )}
                  </span>
                ) : (
                  <span className="text-zinc-500 italic">Select a player to douse with fuel, or ignite all</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="confirm-arsonist-douse-btn"
                  type="button"
                  onClick={() => effectiveDouseTarget && handleConfirm('ARSONIST_DOUSE', effectiveDouseTarget.id)}
                  disabled={!effectiveDouseTarget || effectiveDouseTarget.id === me?.id || submitting}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-amber-950/50 min-h-[44px] cursor-pointer"
                >
                  <span>⛽</span>
                  <span>
                    {submitting
                      ? 'Dousing...'
                      : activeArsonistAction === 'DOUSE' && (!targetPlayer || targetPlayer.id === activeDouseTarget?.id)
                      ? `✓ Douse ${activeDouseTarget?.name || 'Target'} (Slated)`
                      : effectiveDouseTarget
                      ? `Douse ${effectiveDouseTarget.name}`
                      : 'Select to Douse'}
                  </span>
                </button>
                <button
                  id="confirm-arsonist-ignite-btn"
                  type="button"
                  onClick={() => me && dousedCount > 0 && handleConfirm('ARSONIST_IGNITE', me.id)}
                  disabled={dousedCount === 0 || submitting}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg min-h-[44px] ${
                    dousedCount > 0
                      ? 'bg-red-700 hover:bg-red-600 text-white shadow-red-950/60 cursor-pointer animate-pulse'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed'
                  }`}
                  title={dousedCount === 0 ? 'Douse players in gasoline first before igniting' : 'Ignite all doused players tonight'}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>
                    {submitting
                      ? 'Igniting...'
                      : activeArsonistAction === 'IGNITE'
                      ? `🔥 Igniting ${dousedCount} Player(s) Slated`
                      : dousedCount > 0
                      ? `🔥 Ignite All (${dousedCount})`
                      : '🔥 Ignite (0 Doused)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 14. WILD CHILD */}
      {role === 'WILD_CHILD' && (() => {
        const effectiveModel = targetPlayer;
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold font-cinzel text-sm">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Wild Child's Role Model</span>
              </div>
              <span className="text-[11px] text-indigo-300 font-mono">Feral Bond</span>
            </div>
            {gameState.wildChildModelId ? (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs text-indigo-200">
                🐺 Your beloved Role Model is{' '}
                <strong className="text-white font-cinzel text-sm">{gameState.wildChildModelName || 'your Idol'}</strong>.
                As long as they live, you fight with the Villagers. The moment your Role Model perishes, you will transform into a Werewolf!
              </div>
            ) : gameState.round === 1 ? (
              <div className="space-y-2">
                <p className="text-xs text-zinc-300">
                  Night 1: Choose any living player to be your Role Model. If they die during the game, your inner beast will awaken and turn you into a Werewolf!
                </p>

                <div className="space-y-1.5">
                  <div className="text-[11px] text-zinc-400 font-medium">Select Role Model:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {gameState.players
                      .filter((p) => p.isAlive && p.id !== me?.id)
                      .map((p) => {
                        const isSelected = targetPlayer?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => onSelectTarget?.(p.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-indigo-900 border-indigo-400 text-indigo-100 ring-2 ring-indigo-400/50 font-bold shadow-lg shadow-indigo-950/60'
                                : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-indigo-800/60 hover:text-white'
                            }`}
                          >
                            <Heart className="w-3 h-3 text-rose-400" />
                            <span>{p.name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
                  <div className="text-xs">
                    {effectiveModel && effectiveModel.id !== me?.id ? (
                      <span>
                        Role Model Target: <strong className="text-indigo-400 font-semibold">{effectiveModel.name}</strong>
                      </span>
                    ) : (
                      <span className="text-zinc-500 italic">Select a player to bond with</span>
                    )}
                  </div>
                  <button
                    id="confirm-wild-child-btn"
                    type="button"
                    onClick={() => effectiveModel && handleConfirm('WILD_CHILD_CHOOSE', effectiveModel.id)}
                    disabled={!effectiveModel || effectiveModel.id === me?.id || submitting}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-indigo-950/50 min-h-[44px] cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Binding...' : effectiveModel ? `Bind ${effectiveModel.name}` : 'Select Role Model'}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })()}

      {/* 15. THE VETERAN */}
      {role === 'VETERAN' && (() => {
        const maxAlerts = gameState.settings?.veteranMaxAlerts ?? 3;
        const alertsLeft = gameState.veteranAlertsRemaining ?? maxAlerts;

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 font-bold font-cinzel text-sm">
                <ShieldAlert className="w-4 h-4 text-blue-400" />
                <span>The Veteran's Alert</span>
              </div>
              <span className="text-[11px] text-blue-300 font-mono">
                Alerts: {alertsLeft}/{maxAlerts} Left
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              You can go on Alert up to {maxAlerts} {maxAlerts === 1 ? 'night' : 'nights'} per game. While on Alert tonight, anyone who visits or targets you (Werewolves, Seer, Doctor, Spellcaster) will be shot and killed instantly!
            </p>
            {gameState.veteranOnAlertTonight || confirmedTargetId === me?.id ? (
              <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/60 text-center text-xs text-blue-200 font-mono">
                🛡️ Shotgun loaded! You are on HIGH ALERT tonight! Any night visitor will be eliminated!
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-900">
                <div className="text-xs text-zinc-400">
                  {alertsLeft > 0
                    ? 'Guard your cabin for the night.'
                    : `All ${maxAlerts} alert${maxAlerts === 1 ? '' : 's'} have been exhausted.`}
                </div>
                <button
                  id="confirm-veteran-alert-btn"
                  onClick={() => me && handleConfirm('VETERAN_ALERT', me.id)}
                  disabled={alertsLeft <= 0 || submitting}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold transition shadow-lg shadow-blue-950/50 min-h-[44px]"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Locking Cabin...' : 'Go on Alert Tonight'}</span>
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* 16. APPRENTICE SEER (INACTIVE / LEARNING) */}
      {role === 'APPRENTICE_SEER' && !gameState.isApprenticeSeerActive && (
        <div className="space-y-2 p-3.5 rounded-xl bg-violet-950/40 border border-violet-800/40 text-center">
          <div className="flex items-center justify-center gap-2 text-violet-300 font-bold font-cinzel text-sm">
            <Eye className="w-4 h-4 text-violet-400 animate-pulse" />
            <span>Apprentice in Training</span>
          </div>
          <p className="text-xs text-zinc-300 max-w-md mx-auto">
            The true Seer is still alive and guiding the village. You slumber as a simple villager for now. If the true Seer falls, you will inherit their clairvoyant powers!
          </p>
        </div>
      )}

      {/* 17. THE AMNESIAC */}
      {role === 'AMNESIAC' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-teal-400 font-bold font-cinzel text-sm">
              <Brain className="w-4 h-4 text-teal-400" />
              <span>Amnesiac: The Whispering Graveyard</span>
            </div>
            <span className="text-[11px] text-teal-300 font-mono bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
              Neutral • Awaken Once
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            You wander with no memory of your past loyalties. Each night you may gaze into the graveyard where the true roles of all fallen souls are revealed. You may choose one soul to remember and permanently awaken as their role at dawn, joining their team!
          </p>

          {/* If already chosen a role tonight */}
          {gameState.myNightAction?.type === 'AMNESIAC_REMEMBER' || confirmedTargetId ? (() => {
            const chosenId = gameState.myNightAction?.targetId || confirmedTargetId;
            const chosenTarget = gameState.players.find((p) => p.id === chosenId);
            return (
              <div className="p-3.5 rounded-xl bg-teal-950/70 border border-teal-500/60 text-center space-y-2">
                <div className="text-xs text-teal-200 font-semibold font-mono">
                  ✨ Memory Returning: Selected <strong className="text-white">{chosenTarget?.name || 'Fallen Soul'}</strong>
                  {chosenTarget?.role && (
                    <span className="ml-1 text-amber-300">({ROLE_DEFINITIONS[chosenTarget.role]?.name || chosenTarget.role})</span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-300">
                  At sunrise, you will permanently awaken into this role and fight for their team!
                </p>
                <button
                  id="amnesiac-cancel-choice-btn"
                  onClick={() => {
                    handleConfirm('PASS_AMNESIAC', me?.id || '');
                    setConfirmedTargetId(null);
                  }}
                  disabled={submitting}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition cursor-pointer min-h-[36px]"
                >
                  Change Mind / Skip Tonight
                </button>
              </div>
            );
          })() : (
            <>
              {/* Dead players list */}
              {(() => {
                const deadPlayers = gameState.amnesiacGraveyard || gameState.players.filter((p) => !p.isAlive && p.role !== 'AMNESIAC');
                if (deadPlayers.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1.5">
                      <div className="text-xs font-semibold text-zinc-300">
                        🌑 The Graveyard is Silent (Shuruati Sannata)
                      </div>
                      <p className="text-xs text-zinc-400">
                        All villagers are currently alive. With no fallen souls in the graveyard yet, you have no identities to remember tonight. Rest peacefully until souls begin to fall!
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Select a fallen soul from the graveyard:</span>
                      <span className="text-teal-400 font-mono">{deadPlayers.length} Fallen Souls</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {deadPlayers.map((dead) => {
                        const isSelected = selectedTargetId === dead.id;
                        const roleDef = dead.role ? ROLE_DEFINITIONS[dead.role] : undefined;
                        const isWolf = roleDef?.team === 'WEREWOLVES';

                        return (
                          <div
                            key={dead.id}
                            onClick={() => onSelectTarget && onSelectTarget(dead.id)}
                            className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-teal-950/80 border-teal-500 shadow-md shadow-teal-950/50'
                                : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                                ✝
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-zinc-200 truncate">{dead.name}</div>
                                <div className={`text-[10px] font-mono ${isWolf ? 'text-red-400' : 'text-teal-300'}`}>
                                  True Role: {roleDef?.name || dead.role || 'Unknown'}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-zinc-950">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-zinc-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-zinc-800/80">
                      <button
                        id="amnesiac-skip-night-btn"
                        onClick={() => {
                          handleConfirm('PASS_AMNESIAC', me?.id || '');
                        }}
                        disabled={submitting}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer min-h-[40px] flex items-center justify-center"
                      >
                        Skip & Slumber Tonight
                      </button>

                      <button
                        id="confirm-amnesiac-remember-btn"
                        onClick={() => {
                          if (selectedTargetId) {
                            handleConfirm('AMNESIAC_REMEMBER', selectedTargetId);
                          }
                        }}
                        disabled={!selectedTargetId || submitting}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-zinc-950 font-bold text-xs transition shadow-lg shadow-teal-950/50 min-h-[40px] cursor-pointer"
                      >
                        <Brain className="w-3.5 h-3.5 text-zinc-950" />
                        <span>{submitting ? 'Remembering...' : 'Remember This Soul (Yaddash Lein)'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* 17. THE TRANSPORTER PANEL (Swap 2 Players) */}
      {role === 'TRANSPORTER' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2 text-violet-400 font-bold font-cinzel text-sm sm:text-base">
              <div className="p-1.5 rounded-lg bg-violet-950/80 border border-violet-700/60 text-violet-300">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <span>Spatial Transposition</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-300 font-mono bg-amber-950/50 px-2.5 py-0.5 rounded-md border border-amber-800/50">
                Priority: Highest (1st to Resolve)
              </span>
            </div>
          </div>

          {/* Main Prompt */}
          <div className="text-center space-y-1">
            <h4 className="font-cinzel text-violet-200 font-bold text-base sm:text-lg">
              Select two players to swap
            </h4>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Swap the nocturnal locations of any two living players (you may select yourself). Any nocturnal action (Kill, Heal, Investigate, Protect) directed at Target A will automatically redirect to Target B, and vice versa!
            </p>
          </div>

          {/* Confirmation Banner if swapped */}
          {hasTransporterSwapped && (
            <div
              id="transporter-swap-confirmation-banner"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/90 via-purple-950/90 to-violet-950/90 border-2 border-violet-400/80 shadow-[0_0_25px_rgba(139,92,246,0.35)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600/40 border border-violet-400 flex items-center justify-center text-violet-200 shrink-0 shadow-inner">
                  <ArrowLeftRight className="w-5 h-5 animate-pulse text-violet-300" />
                </div>
                <div>
                  <div className="text-sm font-bold text-violet-100 font-cinzel">
                    You swapped {transporterTarget1Display} and {transporterTarget2Display}.
                  </div>
                  <div className="text-[11px] text-violet-300/80">
                    All attacks, heals, and investigations targeting either individual will secretly redirect tonight.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearSwap}
                disabled={submitting}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold transition cursor-pointer shrink-0"
              >
                Change Swap
              </button>
            </div>
          )}

          {/* Target Slots */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3">
            {/* Slot 1: Target A */}
            <div
              className={`p-3 rounded-2xl border transition-all ${
                target1Player
                  ? 'bg-violet-950/60 border-violet-500 shadow-md shadow-violet-950/50'
                  : 'bg-zinc-900/60 border-dashed border-zinc-700/80 hover:border-violet-500/50'
              }`}
            >
              <div className="text-[10px] uppercase font-mono font-bold text-violet-400 mb-2 flex items-center justify-between">
                <span>Target A (1st Player)</span>
                {target1Player && (
                  <button
                    type="button"
                    onClick={() => onUnselectTransporterTarget?.(1)}
                    className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                    title="Unselect Target A"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {target1Player ? (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border border-violet-400 flex items-center justify-center font-bold text-sm shrink-0"
                    style={{
                      backgroundColor: getAvatar(target1Player.avatar).color + '33',
                      color: getAvatar(target1Player.avatar).color,
                    }}
                  >
                    {target1Player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                      <span>{target1Player.name}</span>
                      {target1Player.id === gameState.myPlayerId && (
                        <span className="text-[10px] text-violet-300 font-mono bg-violet-900/60 px-1.5 py-0.5 rounded">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">Position 1</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-zinc-500 font-medium">
                  Click a player on board or below
                </div>
              )}
            </div>

            {/* Portal Swap Icon */}
            <div className="flex flex-col items-center justify-center p-1">
              <div className="w-9 h-9 rounded-full bg-violet-900/60 border border-violet-500/60 flex items-center justify-center text-violet-300 shadow-lg shadow-violet-950/50">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <span className="text-[9px] text-violet-400 font-mono mt-1">Swaps with</span>
            </div>

            {/* Slot 2: Target B */}
            <div
              className={`p-3 rounded-2xl border transition-all ${
                target2Player
                  ? 'bg-violet-950/60 border-violet-500 shadow-md shadow-violet-950/50'
                  : 'bg-zinc-900/60 border-dashed border-zinc-700/80 hover:border-violet-500/50'
              }`}
            >
              <div className="text-[10px] uppercase font-mono font-bold text-violet-400 mb-2 flex items-center justify-between">
                <span>Target B (2nd Player)</span>
                {target2Player && (
                  <button
                    type="button"
                    onClick={() => onUnselectTransporterTarget?.(2)}
                    className="text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                    title="Unselect Target B"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {target2Player ? (
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border border-violet-400 flex items-center justify-center font-bold text-sm shrink-0"
                    style={{
                      backgroundColor: getAvatar(target2Player.avatar).color + '33',
                      color: getAvatar(target2Player.avatar).color,
                    }}
                  >
                    {target2Player.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-white truncate flex items-center gap-1.5">
                      <span>{target2Player.name}</span>
                      {target2Player.id === gameState.myPlayerId && (
                        <span className="text-[10px] text-violet-300 font-mono bg-violet-900/60 px-1.5 py-0.5 rounded">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">Position 2</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-zinc-500 font-medium">
                  Click 2nd player to complete swap
                </div>
              )}
            </div>
          </div>

          {/* Quick Player Selection List from Panel */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-zinc-400 flex items-center justify-between">
              <span>Living Villagers & Targets</span>
              <span className="text-[10px] text-zinc-500">Click to choose or change targets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
              {gameState.players
                .filter((p) => p.isAlive)
                .map((p) => {
                  const isTarget1 = target1Player?.id === p.id;
                  const isTarget2 = target2Player?.id === p.id;
                  const isSelected = isTarget1 || isTarget2;
                  const av = getAvatar(p.avatar);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectTransporterTarget?.(p.id)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-violet-950/80 border-violet-400 text-white shadow-sm ring-1 ring-violet-400'
                          : 'bg-zinc-900/80 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: av.color + '26', color: av.color }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate flex items-center gap-1">
                          <span>{p.name}</span>
                          {p.id === gameState.myPlayerId && (
                            <span className="text-[9px] text-violet-400">(You)</span>
                          )}
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500">
                          {isTarget1 ? 'Target A' : isTarget2 ? 'Target B' : 'Available'}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {isTarget1 ? 'A' : 'B'}
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Action / Constraints Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-800/80">
            <button
              id="transporter-skip-turn-btn"
              type="button"
              onClick={handlePassTransport}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs font-semibold transition cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
            >
              <span>Skip Turn (No Swap)</span>
            </button>

            {canSwap ? (
              <button
                id="transporter-confirm-swap-btn"
                type="button"
                onClick={handleTransportSwap}
                disabled={submitting}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm font-cinzel transition shadow-[0_0_20px_rgba(139,92,246,0.4)] cursor-pointer min-h-[42px] flex items-center justify-center gap-2 active:scale-98"
              >
                <ArrowLeftRight className="w-4 h-4 animate-pulse" />
                <span>
                  {submitting ? 'Transposing...' : `Swap ${target1Player?.name} & ${target2Player?.name}`}
                </span>
              </button>
            ) : (
              <div className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs text-center flex items-center justify-center min-h-[42px]">
                {target1Player && !target2Player
                  ? '⚠️ Must select exactly 2 distinct players or skip'
                  : 'Select two players to activate swap'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 18. PASSIVE OR SLUMBERING ROLES AT NIGHT */}
      {!isWerewolfPackMember &&
        role !== 'SEER' &&
        !(role === 'APPRENTICE_SEER' && gameState.isApprenticeSeerActive) &&
        role !== 'APPRENTICE_SEER' &&
        role !== 'DOCTOR' &&
        role !== 'BODYGUARD' &&
        role !== 'WITCH' &&
        role !== 'LITTLE_GIRL' &&
        role !== 'SERIAL_KILLER' &&
        role !== 'SPELLCASTER' &&
        role !== 'ARSONIST' &&
        role !== 'VETERAN' &&
        role !== 'AMNESIAC' &&
        role !== 'JAILOR' &&
        role !== 'TRANSPORTER' &&
        !gameState.isJailedTonight &&
        !(role === 'WILD_CHILD' && !gameState.wildChildModelId && gameState.round === 1) &&
        !(role === 'CUPID' && gameState.round === 1) &&
        !(role === 'DOPPELGANGER' && gameState.round === 1) &&
        !(role === 'THIEF' && gameState.round === 1) && (
          <div className="text-center py-3 space-y-2">
            <div className="font-cinzel text-zinc-300 font-bold text-sm">
              The Village Slumbers
            </div>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Close your eyes and lock your oak doors. The darkness belongs to prowling beasts and mystic arts.
            </p>

            {/* Bear Tamer Information */}
            {role === 'BEAR_TAMER' && (
              <div className="mt-2 text-xs text-amber-300/90 font-mono bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/40 max-w-md mx-auto">
                🐻 Bear Tamer: Your bear is sleeping beside you. At dawn, if any Werewolf sits directly next to you, your bear will growl in fury!
              </div>
            )}

            {/* Tough Guy Information */}
            {role === 'TOUGH_GUY' && (
              <div className="mt-2 text-xs text-orange-300/90 font-mono bg-orange-950/40 p-2.5 rounded-lg border border-orange-800/40 max-w-md mx-auto">
                💪 Tough Guy: You are resilient as stone. If Werewolves attack you tonight, you will not die tonight — you will survive all of tomorrow and only succumb to wounds the following night!
              </div>
            )}

            {/* Minion Information */}
            {role === 'MINION' && (
              <div className="mt-2 text-xs text-red-300/90 font-mono bg-red-950/50 p-2.5 rounded-lg border border-red-800/50 max-w-md mx-auto text-left space-y-1">
                <div className="font-bold text-red-200">🐺 Minion Knowledge:</div>
                <div>You fight alongside the Werewolves! The Seer sees you as innocent.</div>
                {gameState.werewolfTeammates && gameState.werewolfTeammates.length > 0 ? (
                  <div>Living Pack Members: <strong className="text-white">{gameState.werewolfTeammates.map((w) => w.name).join(', ')}</strong></div>
                ) : (
                  <div>No known werewolves currently alive.</div>
                )}
                <div className="text-[10px] text-zinc-400 italic">(The werewolves do not know your identity)</div>
              </div>
            )}

            {/* Dictator Information */}
            {role === 'DICTATOR' && (
              <div className="mt-2 text-xs text-amber-300/90 font-mono bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/40 max-w-md mx-auto">
                👑 Dictator: Save your absolute authority for the daytime voting phase, where you can stage a Coup and personally execute any player!
              </div>
            )}

            {gameState.masonAllies && gameState.masonAllies.length > 0 && (
              <div className="mt-2 text-xs text-amber-300/80 font-mono bg-amber-950/40 p-2 rounded-lg border border-amber-800/40 inline-block">
                Mason Brotherhood: You recognized {gameState.masonAllies.map((m) => m.name).join(', ')} in the dark!
              </div>
            )}
            {gameState.loverPartner && (
              <div className="mt-2 text-xs text-rose-300/90 font-mono bg-rose-950/40 p-2 rounded-lg border border-rose-800/40 inline-block">
                Lovers' Bond: Your beloved is {gameState.loverPartner.name}. You share each other's fate!
              </div>
            )}
          </div>
        )}
        </>
      )}
    </div>
  );
};
