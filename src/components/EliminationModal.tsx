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
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in"
      onClick={onDismiss}
    >
      <div
        id="elimination-modal-content"
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl text-center my-auto overflow-hidden animate-glow max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Blood Red Ambient Fog */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-black pointer-events-none" />

        {/* Skull Icon Emblem */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-950/50 border border-red-800/60 flex items-center justify-center mb-4 sm:mb-5 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
          <Skull className="w-8 h-8 sm:w-10 sm:h-10 text-red-400 animate-pulse" />
        </div>

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-cinzel text-zinc-100 tracking-wider mb-2">
          Grim Tidings Upon the Village
        </h2>
        <p className="text-xs text-zinc-400 mb-4 sm:mb-6 font-serif italic">
          The shadows have claimed their tribute.
        </p>

        {/* Deceased Roster */}
        <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
          {deaths.map((death) => (
            <div
              key={death.id}
              className="p-3 sm:p-4 rounded-2xl bg-zinc-900/80 border border-red-950/60 text-left flex items-center justify-between gap-2"
            >
              <div>
                <div className="font-bold text-sm sm:text-base text-zinc-100 font-cinzel">{death.name}</div>
                <div className="text-[11px] sm:text-xs text-red-400 flex items-center gap-1.5 mt-0.5">
                  {death.reason === 'WEREWOLF' && (
                    <>
                      <Moon className="w-3.5 h-3.5 shrink-0" />
                      <span>Mauled by Werewolves in the night</span>
                    </>
                  )}
                  {death.reason === 'VOTE' && (
                    <>
                      <Vote className="w-3.5 h-3.5 shrink-0" />
                      <span>Condemned by Village Vote</span>
                    </>
                  )}
                  {death.reason === 'POISON' && (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Succumbed to deadly Witch's poison</span>
                    </>
                  )}
                  {death.reason === 'HUNTER' && (
                    <>
                      <Crosshair className="w-3.5 h-3.5 shrink-0" />
                      <span>Felled by Hunter's vengeful arrow</span>
                    </>
                  )}
                </div>
              </div>

              {death.role && (
                <div className="text-right shrink-0">
                  <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                    True Role
                  </div>
                  <div
                    className={`font-bold font-cinzel text-xs sm:text-sm ${
                      death.role === 'WEREWOLF' ? 'text-red-400' : 'text-purple-300'
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
          className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold font-cinzel transition active:scale-98"
        >
          Acknowledge Tragedy
        </button>
      </div>
    </div>
  );
};
