import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { Timer, Plus, Minus, X, Volume2 } from 'lucide-react';

export const RestTimerFloating = () => {
  const { restTimer, adjustRestTimer, stopRestTimer } = useWorkout();

  if (!restTimer.active || restTimer.remainingSeconds <= 0) return null;

  const minutes = Math.floor(restTimer.remainingSeconds / 60);
  const seconds = restTimer.remainingSeconds % 60;
  const progressPct = ((restTimer.totalSeconds - restTimer.remainingSeconds) / (restTimer.totalSeconds || 1)) * 100;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-50 animate-in slide-in-from-bottom-5">
      <div className="glass-panel bg-dark-900/95 border-brand-emerald/40 rounded-2xl shadow-2xl p-3.5 flex items-center gap-4 glow-emerald">
        {/* Circular Countdown Progress */}
        <div className="relative w-14 h-14 flex items-center justify-center">
          <svg className="w-14 h-14 transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="#202d42"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="#10b981"
              strokeWidth="4"
              strokeDasharray={150.8}
              strokeDashoffset={150.8 - (progressPct / 100) * 150.8}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-sm font-mono font-black text-white">
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
          </div>
        </div>

        {/* Timer Info & Controls */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-brand-emerald font-bold uppercase tracking-wider">
            <Timer className="w-3.5 h-3.5 animate-pulse" />
            <span>Resting</span>
          </div>
          {restTimer.exerciseName && (
            <p className="text-[11px] text-slate-300 font-medium max-w-[140px] truncate">
              {restTimer.exerciseName}
            </p>
          )}
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={() => adjustRestTimer(-15)}
              className="px-2 py-0.5 rounded-md bg-dark-800 hover:bg-dark-700 text-[10px] font-bold text-slate-300 border border-dark-600 flex items-center gap-0.5"
              title="Minus 15 seconds"
            >
              <Minus className="w-2.5 h-2.5" /> 15s
            </button>
            <button
              onClick={() => adjustRestTimer(30)}
              className="px-2 py-0.5 rounded-md bg-dark-800 hover:bg-dark-700 text-[10px] font-bold text-brand-emerald border border-brand-emerald/30 flex items-center gap-0.5"
              title="Add 30 seconds"
            >
              <Plus className="w-2.5 h-2.5" /> 30s
            </button>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={stopRestTimer}
          className="p-1.5 rounded-xl hover:bg-dark-800 text-slate-400 hover:text-white transition-colors"
          title="Skip Rest"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
