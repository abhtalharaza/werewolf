import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio.js';

export const AudioControls: React.FC = () => {
  const [muted, setMuted] = useState(sounds.getMuted());
  const [vol, setVol] = useState(sounds.getVolume());
  const [showSlider, setShowSlider] = useState(false);

  const toggleMute = () => {
    const next = !muted;
    sounds.setMuted(next);
    setMuted(next);
    if (!next) {
      sounds.playChatPing();
    }
  };

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    sounds.setVolume(val);
    setVol(val);
    if (muted && val > 0) {
      sounds.setMuted(false);
      setMuted(false);
    }
  };

  return (
    <div
      id="audio-controls-container"
      className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-md text-zinc-300 hover:text-white transition shadow-lg"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        id="audio-mute-toggle"
        onClick={toggleMute}
        className="p-1 hover:text-purple-400 transition"
        title={muted ? 'Unmute Audio' : 'Mute Audio'}
      >
        {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
      </button>

      {showSlider && (
        <input
          id="audio-volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={muted ? 0 : vol}
          onChange={onVolumeChange}
          className="w-16 h-1 accent-purple-500 bg-zinc-700 rounded-lg cursor-pointer"
        />
      )}

      <button
        id="audio-test-howl"
        onClick={() => {
          if (muted) {
            sounds.setMuted(false);
            setMuted(false);
          }
          sounds.playWolfHowl();
        }}
        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-purple-300 transition pl-1 border-l border-zinc-700 cursor-pointer"
        title="Listen to Wolf Howl Sound"
      >
        <Sparkles className="w-3 h-3 text-purple-400" />
        <span className="text-[10px]">Wolf FX</span>
      </button>
    </div>
  );
};
