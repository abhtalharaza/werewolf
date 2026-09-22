import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useNightMode } from '../context/ThemeContext.js';

interface NightModeToggleProps {
  compact?: boolean;
  className?: string;
}

export const NightModeToggle: React.FC<NightModeToggleProps> = ({
  compact = false,
  className = '',
}) => {
  const { isNightMode, toggleNightMode } = useNightMode();

  return (
    <button
      id="night-mode-toggle-btn"
      type="button"
      onClick={toggleNightMode}
      aria-label={isNightMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
      title={isNightMode ? 'Switch to Twilight Day Mode' : 'Switch to Midnight Dark Mode'}
      className={`relative flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-full border transition duration-200 cursor-pointer select-none active:scale-95 ${
        isNightMode
          ? 'bg-[#181820] hover:bg-[#22222e] border-white/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
          : 'grass-glass-subtle hover:bg-white/80 border-white/80 text-slate-700 shadow-sm'
      } ${className}`}
    >
      {isNightMode ? (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {!compact && (
            <span className="text-[11px] font-semibold text-amber-200 hidden xs:inline">
              Night
            </span>
          )}
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          {!compact && (
            <span className="text-[11px] font-semibold text-slate-700 hidden xs:inline">
              Day
            </span>
          )}
        </>
      )}
    </button>
  );
};
