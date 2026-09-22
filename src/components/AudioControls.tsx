import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../utils/audio.js';

interface AudioControlsProps {
  showFxTest?: boolean;
  compact?: boolean;
  className?: string;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  compact = false,
  className = '',
}) => {
  const [muted, setMuted] = useState(sounds.getMuted());

  const toggleMute = () => {
    const next = !muted;
    sounds.setMuted(next);
    setMuted(next);
    // Strictly do NOT play any sound on click (user requirement: bs mute aur unmute hona chahiye)
  };

  return (
    <button
      id="audio-mute-toggle"
      type="button"
      onClick={toggleMute}
      aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
      className={`relative flex items-center justify-center gap-1.5 min-h-[40px] rounded-full border text-xs font-medium transition duration-200 cursor-pointer select-none active:scale-95 shadow-xs shrink-0 ${
        compact ? 'p-2 min-w-[40px] px-2.5' : 'px-3 py-1.5'
      } ${
        muted
          ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-950/70 dark:hover:bg-rose-900/80 dark:border-rose-800/80 dark:text-rose-300'
          : 'bg-white/80 hover:bg-white border-indigo-200/80 hover:border-indigo-300 text-slate-700 dark:bg-[#181820] dark:hover:bg-[#22222e] dark:border-white/20 dark:text-zinc-200'
      } ${className}`}
      title={muted ? 'Audio is Muted — Click to Unmute' : 'Audio is On — Click to Mute'}
    >
      {muted ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          {!compact && (
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 hidden xs:inline sm:inline">
              Unmute
            </span>
          )}
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          {!compact && (
            <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-200 hidden xs:inline sm:inline">
              Mute
            </span>
          )}
        </>
      )}
    </button>
  );
};
