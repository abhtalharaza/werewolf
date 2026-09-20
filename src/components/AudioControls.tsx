import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../utils/audio.js';

interface AudioControlsProps {
  showFxTest?: boolean;
}

export const AudioControls: React.FC<AudioControlsProps> = () => {
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition shadow-md cursor-pointer select-none ${
        muted
          ? 'bg-rose-950/70 hover:bg-rose-900/80 border-rose-800/80 text-rose-300 hover:text-rose-200'
          : 'bg-zinc-900/80 hover:bg-zinc-800/90 border-zinc-700/80 text-zinc-300 hover:text-white'
      }`}
      title={muted ? 'Audio is Muted — Click to Unmute' : 'Audio is On — Click to Mute'}
    >
      {muted ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="text-[11px] font-semibold text-rose-300">Unmute</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-semibold text-zinc-300">Mute</span>
        </>
      )}
    </button>
  );
};
