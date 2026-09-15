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
  const isWerewolf = me?.role === 'WEREWOLF';
  const isDead = me && !me.isAlive;
  const isNight = gameState.phase === 'NIGHT';

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
      className={`flex flex-col bg-zinc-950/95 border-zinc-800 shadow-2xl backdrop-blur-md w-full ${
        isDrawer
          ? 'h-full border-l rounded-none'
          : 'border rounded-2xl overflow-hidden'
      }`}
    >
      {/* Header & Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5 bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 scrollbar-none">
          {/* Public Town Square */}
          <button
            id="tab-public-chat"
            onClick={() => setActiveChannel('PUBLIC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
              activeChannel === 'PUBLIC'
                ? 'bg-purple-900/50 text-purple-200 border border-purple-700/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>Village Square</span>
          </button>

          {/* Werewolf Den (Visible only to werewolves) */}
          {isWerewolf && (
            <button
              id="tab-werewolf-chat"
              onClick={() => setActiveChannel('WEREWOLF')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
                activeChannel === 'WEREWOLF'
                  ? 'bg-red-950/70 text-red-200 border border-red-800/60'
                  : 'text-red-400/70 hover:text-red-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-red-400" />
              <span>Pack Whisper</span>
            </button>
          )}

          {/* Graveyard (Visible only to deceased) */}
          {isDead && (
            <button
              id="tab-dead-chat"
              onClick={() => setActiveChannel('DEAD')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
                activeChannel === 'DEAD'
                  ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Skull className="w-3.5 h-3.5 text-zinc-400" />
              <span>Graveyard</span>
            </button>
          )}
        </div>

        {/* Action button: Close for drawer or Collapse toggle for inline */}
        {isDrawer && onClose ? (
          <button
            id="close-chat-drawer-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition min-w-[36px] min-h-[36px] flex items-center justify-center ml-2"
            title="Close Chat Drawer"
            aria-label="Close Chat"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-zinc-400 hover:text-white transition ml-2"
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
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic py-6">
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
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mb-0.5 px-1">
                      <span className="font-semibold text-zinc-300" style={{ color: avatar.color }}>
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
                      className={`px-3 py-2 rounded-2xl max-w-[85%] break-words leading-relaxed ${
                        isMe
                          ? 'bg-purple-900/60 text-purple-100 border border-purple-700/40'
                          : msg.channel === 'WEREWOLF'
                          ? 'bg-red-950/60 text-red-200 border border-red-900/50'
                          : 'bg-zinc-900/90 text-zinc-200 border border-zinc-800'
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

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-2.5 sm:p-3 bg-zinc-900/40 border-t border-zinc-800/80 flex gap-2 items-center">
            <input
              id="game-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeChannel === 'WEREWOLF'
                  ? 'Conspire with your werewolf pack...'
                  : activeChannel === 'DEAD'
                  ? 'Ghostly whispers from beyond...'
                  : isNight
                  ? 'Night fell (Public whispers echo in the dark)...'
                  : 'Speak to the village council...'
              }
              maxLength={200}
              className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500 focus:outline-none text-base sm:text-xs text-zinc-100 placeholder-zinc-500 min-h-[44px]"
            />
            <button
              id="send-chat-btn"
              type="submit"
              disabled={!inputText.trim()}
              className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white transition shadow min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
