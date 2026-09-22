import React from 'react';
import { Skull, AlertTriangle, Moon, Vote, Crosshair } from 'lucide-react';
import { GameDeathRecord } from '../types/game.js';

interface EliminationModalProps {
  deaths: GameDeathRecord[];
  onDismiss: () => void;
}

export const EliminationModal: React.FC<EliminationModalProps> = ({ deaths, onDismiss }) => {
  if (!deaths || deaths.length === 0) return null;

  return (
    <div
      id="elimination-modal-backdrop"
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onDismiss}
    >
      <div
        id="elimination-modal-content"
        className="relative w-full max-w-lg grass-glass-modal grass-glass border border-white/80 dark:border-white/10 rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl text-center my-auto overflow-hidden max-h-[90vh] overflow-y-auto backdrop-blur-2xl text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Lavender / Rose Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-100/30 via-indigo-100/20 to-white/40 dark:from-rose-950/20 dark:via-black/30 dark:to-black/60 pointer-events-none" />

        {/* Skull Icon Emblem */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center mb-4 sm:mb-5 shadow-sm">
          <Skull className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500 animate-pulse" />
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-cinzel text-slate-900 dark:text-white tracking-wide mb-2">
          Grim Tidings Upon the Village
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 font-serif italic">
          The shadows have claimed their tribute from the village.
        </p>

        {/* Deceased Roster */}
        <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
          {deaths.map((death) => (
            <div
              key={death.id}
              className="p-3 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#15141e] border border-indigo-100 dark:border-white/10 text-left flex items-center justify-between gap-2 shadow-xs"
            >
              <div>
                <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-cinzel">{death.name}</div>
                <div className="text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5 mt-0.5">
                  {death.reason === 'WEREWOLF' && (
                    <>
                      <Moon className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>Mauled by Werewolves in the night</span>
                    </>
                  )}
                  {death.reason === 'VOTE' && (
                    <>
                      <Vote className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                      <span>Condemned by Village Vote</span>
                    </>
                  )}
                  {death.reason === 'POISON' && (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                      <span>Succumbed to deadly Witch's poison</span>
                    </>
                  )}
                  {death.reason === 'HUNTER' && (
                    <>
                      <Crosshair className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                      <span>Felled by Hunter's vengeful arrow</span>
                    </>
                  )}
                </div>
              </div>

              {death.role && (
                <div className="text-right shrink-0">
                  <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-mono font-medium">
                    True Role
                  </div>
                  <div
                    className={`font-bold font-cinzel text-xs sm:text-sm ${
                      death.role === 'WEREWOLF' ? 'text-rose-600' : 'text-indigo-600'
                    }`}
                  >
                    {death.role}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          id="dismiss-elimination-btn"
          onClick={onDismiss}
          className="w-full sm:w-auto px-7 py-3 min-h-[44px] rounded-2xl grass-button gradient-brand-btn text-white text-xs font-semibold font-cinzel transition cursor-pointer active:scale-98 shadow-md"
        >
          Acknowledge Tragedy
        </button>
      </div>
    </div>
  );
};
