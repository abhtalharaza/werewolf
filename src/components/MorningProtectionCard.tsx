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
  const roleConfig =
    isBodyguard
    ? {
        roleName: 'B O D Y G U A R D',
        cardGradient: 'grass-glass-modal grass-glass border border-white/80 dark:border-white/10 shadow-2xl',
        glowColor: 'bg-cyan-300/40 dark:bg-cyan-500/20',
        emblemStyle: 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300',
        titleColor: 'text-cyan-800 dark:text-cyan-300',
        badgeStyle: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
        headerBadgeStyle: 'border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60',
        headerBadgeText: 'Dawn Bulletin • Werewolf Attack Deflected',
        progressColor: 'bg-cyan-500',
        quote: 'A stalwart warrior pledged to defend innocent lives.',
        powerTitle: 'Nocturnal Shield Activated',
        abilityText: `Werewolves attacked ${currentProtection.targetName} in the dark, but the Bodyguard's steel shield heroically deflected their fatal claws!`,
        icon: <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-600 dark:text-cyan-400" />,
      }
    : isDoctor
    ? {
        roleName: 'D O C T O R',
        cardGradient: 'grass-glass-modal grass-glass border border-white/80 dark:border-white/10 shadow-2xl',
        glowColor: 'bg-indigo-300/40 dark:bg-indigo-500/20',
        emblemStyle: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
        titleColor: 'text-indigo-900 dark:text-indigo-300',
        badgeStyle: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        headerBadgeStyle: 'border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60',
        headerBadgeText: 'Dawn Bulletin • Fatal Attack Healed',
        progressColor: 'bg-indigo-500',
        quote: 'The village physician skilled in antidotes and battlefield medicine.',
        powerTitle: 'Medical Miracle Performed',
        abilityText: `Werewolves attacked ${currentProtection.targetName} tonight, but the Doctor bound their fatal wounds in time and preserved their life!`,
        icon: <HeartPulse className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />,
      }
    : {
        roleName: 'W I T C H',
        cardGradient: 'grass-glass-modal grass-glass border border-white/80 dark:border-white/10 shadow-2xl',
        glowColor: 'bg-purple-300/40 dark:bg-purple-500/20',
        emblemStyle: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
        titleColor: 'text-purple-900 dark:text-purple-300',
        badgeStyle: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        headerBadgeStyle: 'border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60',
        headerBadgeText: 'Dawn Bulletin • Elixir of Life Cast',
        progressColor: 'bg-purple-500',
        quote: 'A secretive alchemist brewing potent elixirs in the woods.',
        powerTitle: 'Elixir of Life Restored Life',
        abilityText: `Werewolves struck ${currentProtection.targetName} with fatal force, but the Witch administered the Elixir of Life, pulling them back from death!`,
        icon: <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" />,
      };

  return (
    <div
      id="morning-protection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200"
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
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[11px] font-mono tracking-wider mb-5 uppercase shadow-xs font-semibold ${roleConfig.headerBadgeStyle}`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{roleConfig.headerBadgeText}</span>
        </div>

        {/* Cinematic Card */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 border backdrop-blur-2xl shadow-2xl transition duration-500 overflow-hidden ${roleConfig.cardGradient}`}
        >
          {/* Quick Dismiss Button */}
          <button
            id="close-protection-card-btn"
            onClick={() => setVisible(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 border border-indigo-100 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer z-10 shadow-xs"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Multiple Protections Indicator (if multiple saves occurred) */}
          {savedProtections.length > 1 && (
            <div className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-white/10 border border-indigo-200 dark:border-white/15 text-[10px] font-mono text-indigo-700 dark:text-indigo-300 font-semibold">
              {currentIndex + 1} of {savedProtections.length}
            </div>
          )}

          {/* Glowing Icon Emblem */}
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 border border-white/90 dark:border-white/10 shadow-sm">
            <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${roleConfig.glowColor}`} />
            <div
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border shadow-xs ${roleConfig.emblemStyle}`}
            >
              {roleConfig.icon}
            </div>
          </div>

          {/* Role Name */}
          <h1
            className={`text-2xl sm:text-4xl font-black font-cinzel tracking-wider uppercase mb-2 ${roleConfig.titleColor}`}
          >
            {roleConfig.roleName}
          </h1>

          {/* Team Tag */}
          <div className="mb-5">
            <span
              className={`text-xs px-3.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase border shadow-xs ${roleConfig.badgeStyle}`}
            >
              Team Villagers
            </span>
          </div>

          {/* Atmospheric Quote */}
          <p className="text-sm text-slate-600 dark:text-slate-300 italic mb-5 leading-relaxed font-serif">
            "{roleConfig.quote}"
          </p>

          {/* Special Nocturnal Power Box */}
          <div className="text-left p-4 rounded-2xl bg-white/80 dark:bg-[#15141e] border border-indigo-100 dark:border-white/10 text-xs space-y-2 shadow-xs">
            <div className="font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider font-mono text-[10px] flex items-center justify-between">
              <span>{roleConfig.powerTitle}</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-[9px] font-bold">
                Werewolf Strike Blocked!
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium text-xs sm:text-sm">
              {roleConfig.abilityText}
            </p>
          </div>

          {/* 2-Second Countdown Footer with Draining Progress Line */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <span>
                Dismissing in <strong className="text-slate-800 dark:text-white text-sm font-bold">2s</strong>
              </span>
            </div>

            {/* Smooth 2-second visual timer bar */}
            <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden border border-slate-200">
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
