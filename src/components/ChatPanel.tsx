import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Moon, Skull, Send, ChevronDown, ChevronUp, X } from 'lucide-react';
import { ChatMessage, ChatChannel, ClientGameState } from '../types/game.js';
import { getAvatar } from '../utils/avatars.js';

interface ChatPanelProps {
  gameState: ClientGameState;
  chatMessages: ChatMessage[];
  onSendMessage: (channel: ChatChannel, text: string) => void;
  isMobileTab?: boolean;
  isDrawer?: boolean;
  onClose?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  gameState,
  chatMessages,
  onSendMessage,
  isMobileTab = false,
  isDrawer = false,
  onClose,
}) => {
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('PUBLIC');
  const [inputText, setInputText] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const me = gameState.players.find((p) => p.id === gameState.myPlayerId);
  const isWerewolf =
    me?.role === 'WEREWOLF' ||
    me?.role === 'WOLF_CUB' ||
    me?.role === 'WHITE_WOLF' ||
    (me?.role === 'CURSED' && gameState.myTeam === 'WEREWOLVES');
  const isDead = me && !me.isAlive;
  const isNight = gameState.phase === 'NIGHT';
  const isSilenced =
    me &&
    me.isAlive &&
    gameState.silencedPlayerId === me.id &&
    (gameState.phase === 'DISCUSSION' || gameState.phase === 'VOTING');

  // Auto switch channel if night begins and user is werewolf
  useEffect(() => {
    if (isNight && isWerewolf) {
      setActiveChannel('WEREWOLF');
    } else if (!isNight && activeChannel === 'WEREWOLF') {
      setActiveChannel('PUBLIC');
    }
  }, [isNight, isWerewolf]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeChannel]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(activeChannel, inputText);
    setInputText('');
  };

  // Filter messages for current channel or events tab
  const filteredMessages = chatMessages.filter((m) => {
    if (activeChannel === 'PUBLIC') return m.channel === 'PUBLIC';
    if (activeChannel === 'WEREWOLF') return m.channel === 'WEREWOLF';
    if (activeChannel === 'DEAD') return m.channel === 'DEAD';
    return true;
  });

  return (
    <div
      id="chat-panel"
      className={`flex flex-col glass-card border-indigo-200/80 dark:border-white/10 shadow-xl backdrop-blur-2xl w-full ${
        isDrawer
          ? 'h-full border-l rounded-none dark:bg-[#0c0b12]'
          : 'border rounded-3xl overflow-hidden'
      }`}
    >
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-indigo-100 dark:border-white/10 px-4 py-2.5 bg-white/70 dark:bg-[#12111a] shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 scrollbar-none">
          {/* Public Town Square */}
          <button
            id="tab-public-chat"
            onClick={() => setActiveChannel('PUBLIC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition shrink-0 cursor-pointer ${
              activeChannel === 'PUBLIC'
                ? 'gradient-brand-btn text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Village Square</span>
          </button>

          {/* Werewolf Den (Visible only to werewolves) */}
          {isWerewolf && (
            <button
              id="tab-werewolf-chat"
              onClick={() => setActiveChannel('WEREWOLF')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition shrink-0 cursor-pointer ${
                activeChannel === 'WEREWOLF'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-rose-400" />
              <span>Pack Whisper</span>
            </button>
          )}

          {/* Graveyard (Visible only to deceased) */}
          {isDead && (
            <button
              id="tab-dead-chat"
              onClick={() => setActiveChannel('DEAD')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition shrink-0 cursor-pointer ${
                activeChannel === 'DEAD'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <Skull className="w-3.5 h-3.5 text-slate-400" />
              <span>Graveyard</span>
            </button>
          )}
        </div>

        {/* Action button: Close for drawer or Collapse toggle for inline */}
        {isDrawer && onClose ? (
          <button
            id="close-chat-drawer-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/10 transition min-w-[36px] min-h-[36px] flex items-center justify-center ml-2 cursor-pointer"
            title="Close Chat Drawer"
            aria-label="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition ml-2 cursor-pointer"
            title={isCollapsed ? 'Expand Chat' : 'Collapse Chat'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {(!isCollapsed || isDrawer) && (
        <>
          {/* Message List */}
          <div
            className={`flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 text-xs ${
              isDrawer
                ? 'min-h-0'
                : isMobileTab
                ? 'min-h-[300px] max-h-[58vh]'
                : 'max-h-[260px] min-h-[140px]'
            }`}
          >
            {filteredMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 italic py-6">
                <span>Silence falls upon the {activeChannel.toLowerCase()} channel...</span>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.senderId === gameState.myPlayerId;
                const avatar = getAvatar(msg.senderAvatar);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 px-1 font-medium">
                      <span className="font-semibold text-slate-700 dark:text-slate-300" style={{ color: avatar.color }}>
                        {msg.senderName}
                      </span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-2xl max-w-[85%] break-words leading-relaxed backdrop-blur-md shadow-xs ${
                        isMe
                          ? 'gradient-brand-btn text-white'
                          : msg.channel === 'WEREWOLF'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-900/60'
                          : 'bg-white/90 dark:bg-[#161424] text-slate-800 dark:text-slate-100 border border-indigo-100/90 dark:border-white/10'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Silenced Warning Banner */}
          {isSilenced && (
            <div className="px-3 py-2 bg-rose-50 dark:bg-rose-950/80 border-t border-b border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-200 flex items-center justify-between gap-2 animate-pulse backdrop-blur-md">
              <span className="font-bold">⚠️ SILENCED BY SPELLCASTER:</span>
              <span>You cannot speak today! Sending any chat message will cause instant death.</span>
            </div>
          )}

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-2.5 sm:p-3 bg-white/70 dark:bg-[#12111a] border-t border-indigo-100 dark:border-white/10 flex gap-2 items-center">
            <input
              id="game-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isSilenced
                  ? '⚠️ SILENCED! Sending a message will kill you instantly!'
                  : activeChannel === 'WEREWOLF'
                  ? 'Conspire with your werewolf pack...'
                  : activeChannel === 'DEAD'
                  ? 'Ghostly whispers from beyond...'
                  : isNight
                  ? 'Night fell (Public whispers echo in the dark)...'
                  : 'Speak to the village council...'
              }
              maxLength={200}
              className={`flex-1 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-[#0c0b12] border focus:outline-none text-base sm:text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 min-h-[44px] focus:ring-1 focus:ring-indigo-400/50 shadow-xs ${
                isSilenced
                  ? 'border-rose-300 focus:border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                  : 'border-indigo-200/80 dark:border-white/15 focus:border-indigo-400'
              }`}
            />
            <button
              id="send-chat-btn"
              type="submit"
              disabled={!inputText.trim()}
              className="px-3.5 py-2 rounded-xl disabled:opacity-40 text-white transition shadow min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 gradient-brand-btn cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
