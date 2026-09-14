import React, { useEffect, useState, useRef } from 'react';
import { Shield, Sparkles, HeartPulse, Clock, X } from 'lucide-react';
import { ProtectionRecord } from '../types/game.js';

interface MorningProtectionCardProps {
  protections?: ProtectionRecord[];
  round: number;
  phase: string;
}

export const MorningProtectionCard: React.FC<MorningProtectionCardProps> = ({
  protections,
  round,
  phase,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const shownRoundRef = useRef<number | null>(null);

  // CRITICAL REQUIREMENT: Only show when a player was ATTACKED and PROTECTED/SAVED by Doctor, Bodyguard, or Witch
  const savedProtections = (protections || []).filter((p) => p.wasAttackedAndSaved);

  // Trigger card display when morning begins ONLY if someone was attacked and saved
  useEffect(() => {
    const isMorning = phase === 'DAY_ANNOUNCEMENT' || phase === 'DISCUSSION';
    if (isMorning && savedProtections.length > 0 && shownRoundRef.current !== round) {
      shownRoundRef.current = round;
      setCurrentIndex(0);
      setVisible(true);
    }
  }, [phase, round, savedProtections.length]);

  // Hide automatically if phase transitions away from morning
  useEffect(() => {
    if (phase !== 'DAY_ANNOUNCEMENT' && phase !== 'DISCUSSION') {
      setVisible(false);
    }
  }, [phase]);

  // Dedicated 2-second auto-dismissal timer
  useEffect(() => {
    if (!visible || savedProtections.length === 0) return;

    const timer = setTimeout(() => {
      if (currentIndex < savedProtections.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setVisible(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [visible, currentIndex, savedProtections.length]);

  // If nobody was attacked and saved, never display the card
  if (!visible || savedProtections.length === 0) return null;

  const currentProtection = savedProtections[currentIndex] || savedProtections[0];
  if (!currentProtection) return null;

  const role = currentProtection.role;
  const isDoctor = role === 'DOCTOR';
  const isBodyguard = role === 'BODYGUARD';

  // Role visual configurations matching the Cinematic Role Card (Image 2)
  const roleConfig = isBodyguard
    ? {
        roleName: 'B O D Y G U A R D',
        cardGradient: 'bg-gradient-to-b from-cyan-950/85 via-zinc-950 to-black border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.25)]',
        glowColor: 'bg-cyan-500',
        emblemStyle: 'bg-cyan-950 border-cyan-600/80 text-cyan-300',
        titleColor: 'text-cyan-200 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]',
        badgeStyle: 'bg-cyan-950/90 text-cyan-300 border-cyan-600/60',
        headerBadgeStyle: 'border-cyan-500/60 text-cyan-300 bg-cyan-950/90',
        headerBadgeText: 'Dawn Bulletin • Werewolf Attack Deflected',
        progressColor: 'bg-cyan-400',
        quote: 'A stalwart warrior pledged to defend innocent lives.',
        powerTitle: 'Nocturnal Shield Activated',
        abilityText: `Werewolves attacked ${currentProtection.targetName} in the dark, but the Bodyguard's steel shield heroically deflected their fatal claws!`,
        icon: <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-300" />,
      }
    : isDoctor
    ? {
        roleName: 'D O C T O R',
        cardGradient: 'bg-gradient-to-b from-emerald-950/85 via-zinc-950 to-black border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.25)]',
        glowColor: 'bg-emerald-500',
        emblemStyle: 'bg-emerald-950 border-emerald-600/80 text-emerald-300',
        titleColor: 'text-emerald-200 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]',
        badgeStyle: 'bg-emerald-950/90 text-emerald-300 border-emerald-600/60',
        headerBadgeStyle: 'border-emerald-500/60 text-emerald-300 bg-emerald-950/90',
        headerBadgeText: 'Dawn Bulletin • Fatal Attack Healed',
        progressColor: 'bg-emerald-400',
        quote: 'The village physician skilled in antidotes and battlefield medicine.',
        powerTitle: 'Medical Miracle Performed',
        abilityText: `Werewolves attacked ${currentProtection.targetName} tonight, but the Doctor bound their fatal wounds in time and preserved their life!`,
        icon: <HeartPulse className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300" />,
      }
    : {
        roleName: 'W I T C H',
        cardGradient: 'bg-gradient-to-b from-purple-950/85 via-zinc-950 to-black border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.25)]',
        glowColor: 'bg-purple-500',
        emblemStyle: 'bg-purple-950 border-purple-600/80 text-purple-300',
        titleColor: 'text-purple-200 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]',
        badgeStyle: 'bg-purple-950/90 text-purple-300 border-purple-600/60',
        headerBadgeStyle: 'border-purple-500/60 text-purple-300 bg-purple-950/90',
        headerBadgeText: 'Dawn Bulletin • Elixir of Life Cast',
        progressColor: 'bg-purple-400',
        quote: 'A secretive alchemist brewing potent elixirs in the woods.',
        powerTitle: 'Elixir of Life Restored Life',
        abilityText: `Werewolves struck ${currentProtection.targetName} with fatal force, but the Witch administered the Elixir of Life, pulling them back from death!`,
        icon: <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-purple-300" />,
      };

  return (
    <div
      id="morning-protection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setVisible(false)}
    >
      <style>{`
        @keyframes protectionTimer2s {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>

      <div
        className="w-full max-w-md mx-auto text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Confidential / Protection Header Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[11px] font-mono tracking-wider mb-5 uppercase shadow-xl ${roleConfig.headerBadgeStyle}`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{roleConfig.headerBadgeText}</span>
        </div>

        {/* Cinematic Card (Exact layout to Image 2) */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 border backdrop-blur-2xl shadow-2xl transition duration-500 overflow-hidden ${roleConfig.cardGradient}`}
        >
          {/* Quick Dismiss Button */}
          <button
            id="close-protection-card-btn"
            onClick={() => setVisible(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-400 hover:text-white transition cursor-pointer z-10"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Multiple Protections Indicator (if multiple saves occurred) */}
          {savedProtections.length > 1 && (
            <div className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-700 text-[10px] font-mono text-zinc-300">
              {currentIndex + 1} of {savedProtections.length}
            </div>
          )}

          {/* Glowing Icon Emblem */}
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 border shadow-inner">
            <div className={`absolute inset-0 rounded-full blur-xl opacity-60 ${roleConfig.glowColor}`} />
            <div
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border ${roleConfig.emblemStyle}`}
            >
              {roleConfig.icon}
            </div>
          </div>

          {/* Role Name (Tracked typography matching Image 2) */}
          <h1
            className={`text-2xl sm:text-4xl font-black font-cinzel tracking-widest uppercase mb-2 ${roleConfig.titleColor}`}
          >
            {roleConfig.roleName}
          </h1>

          {/* Team Tag */}
          <div className="mb-5">
            <span
              className={`text-xs px-3.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase border ${roleConfig.badgeStyle}`}
            >
              Team Villagers
            </span>
          </div>

          {/* Atmospheric Quote */}
          <p className="text-sm text-zinc-300 italic mb-5 leading-relaxed font-serif">
            "{roleConfig.quote}"
          </p>

          {/* Special Nocturnal Power Box */}
          <div className="text-left p-4 rounded-xl bg-zinc-900/90 border border-zinc-800/90 text-xs space-y-2">
            <div className="font-semibold text-purple-300 uppercase tracking-wider font-mono text-[10px] flex items-center justify-between">
              <span>{roleConfig.powerTitle}</span>
              <span className="px-2 py-0.5 rounded-full bg-red-950 border border-red-500 text-red-200 text-[9px] font-bold animate-pulse">
                Werewolf Strike Blocked!
              </span>
            </div>
            <p className="text-zinc-200 leading-relaxed font-sans text-xs sm:text-sm">
              {roleConfig.abilityText}
            </p>
          </div>

          {/* 2-Second Countdown Footer with Draining Progress Line */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
              <span>
                Dismissing in <strong className="text-white text-sm">2s</strong>
              </span>
            </div>

            {/* Smooth 2-second visual timer bar */}
            <div className="w-full h-1 bg-zinc-900/80 rounded-full overflow-hidden border border-zinc-800">
              <div
                key={currentIndex}
                className={`h-full ${roleConfig.progressColor}`}
                style={{
                  animation: 'protectionTimer2s 2000ms linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
