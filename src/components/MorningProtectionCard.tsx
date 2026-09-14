import React, { useEffect, useState } from 'react';
import { Shield, Sparkles, HeartPulse, X } from 'lucide-react';
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
  const [shownForRound, setShownForRound] = useState<number | null>(null);

  useEffect(() => {
    // Show in morning phases: DAY_ANNOUNCEMENT or DISCUSSION
    const isMorning = phase === 'DAY_ANNOUNCEMENT' || phase === 'DISCUSSION';
    if (isMorning && protections && protections.length > 0 && shownForRound !== round) {
      setVisible(true);
      setShownForRound(round);

      // Card appears for 2 to 2.5 seconds as requested
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [phase, round, protections, shownForRound]);

  if (!visible || !protections || protections.length === 0) return null;

  return (
    <div
      id="morning-protection-overlay"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-auto max-w-lg w-[92vw] animate-in fade-in zoom-in-95 duration-300"
    >
      {protections.map((p, idx) => {
        const isDoctor = p.role === 'DOCTOR';
        const isBodyguard = p.role === 'BODYGUARD';
        const roleLabel = isDoctor ? 'Doctor' : isBodyguard ? 'Bodyguard' : 'Witch';
        const roleColor = isDoctor
          ? 'from-blue-900/95 via-blue-800/95 to-cyan-900/95 border-blue-400/80 shadow-[0_0_25px_rgba(59,130,246,0.35)]'
          : isBodyguard
          ? 'from-amber-900/95 via-amber-800/95 to-orange-900/95 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
          : 'from-purple-900/95 via-purple-800/95 to-pink-900/95 border-purple-400/80 shadow-[0_0_25px_rgba(168,85,247,0.35)]';

        return (
          <div
            key={idx}
            id={`morning-protection-card-${idx}`}
            className={`w-full p-4 rounded-2xl bg-gradient-to-r ${roleColor} border shadow-2xl backdrop-blur-xl text-white flex items-center justify-between gap-3`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/20 shrink-0">
                {isDoctor ? (
                  <HeartPulse className="w-6 h-6 text-blue-300" />
                ) : isBodyguard ? (
                  <Shield className="w-6 h-6 text-amber-300" />
                ) : (
                  <Sparkles className="w-6 h-6 text-purple-300" />
                )}
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-white/80 flex items-center gap-1.5 font-bold">
                  <span>🛡️ Guardian Protection</span>
                  {p.wasAttackedAndSaved && (
                    <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-400/60 text-[10px] text-red-200 font-sans font-semibold">
                      Attack Blocked!
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  <span className="font-extrabold text-amber-200 underline decoration-amber-400/50">
                    {roleLabel}
                  </span>{' '}
                  protected <span className="font-bold text-white">{p.targetName}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setVisible(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
