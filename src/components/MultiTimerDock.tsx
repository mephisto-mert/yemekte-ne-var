import React from 'react';
import { Play, Pause, X, Maximize2, ChefHat, Bell } from 'lucide-react';

export interface ActiveTimer {
  id: string;
  recipeTitle: string;
  stepNumber: number;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

interface MultiTimerDockProps {
  timers: ActiveTimer[];
  onToggleTimer: (id: string) => void;
  onDismissTimer: (id: string) => void;
  onOpenCookingMode?: (recipeTitle: string) => void;
}

export const MultiTimerDock: React.FC<MultiTimerDockProps> = ({
  timers,
  onToggleTimer,
  onDismissTimer,
  onOpenCookingMode,
}) => {
  if (!timers || timers.length === 0) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 flex flex-col gap-2 max-w-sm w-full pointer-events-auto animate-in slide-in-from-bottom-5">
      {timers.map((timer) => {
        const progress = timer.totalSeconds > 0 
          ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100 
          : 0;
        const isDone = timer.remainingSeconds <= 0;

        return (
          <div
            key={timer.id}
            className={`p-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all flex items-center justify-between gap-3 ${
              isDone
                ? 'bg-rose-950/90 border-rose-500 text-white animate-bounce'
                : 'bg-slate-900/95 border-orange-500/40 text-slate-100 shadow-orange-500/10'
            }`}
          >
            {/* Progress Mini Ring / Icon */}
            <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
              <svg className="w-10 h-10 transform -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  className="stroke-slate-800"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke={isDone ? '#f43f5e' : '#f97316'}
                  strokeWidth="3"
                  strokeDasharray={`${(progress / 100) * 100.5} 100.5`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {isDone ? (
                  <Bell className="w-4 h-4 text-rose-400 animate-spin" />
                ) : (
                  <ChefHat className="w-4 h-4 text-orange-400" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black truncate text-white">
                  {timer.recipeTitle}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-bold">
                  Adım {timer.stepNumber}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`font-mono text-sm font-black ${isDone ? 'text-rose-400' : 'text-amber-400'}`}>
                  {isDone ? 'SÜRE DOLDU!' : formatTime(timer.remainingSeconds)}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {timer.label}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {!isDone && (
                <button
                  type="button"
                  onClick={() => onToggleTimer(timer.id)}
                  className={`p-2 rounded-xl transition-colors ${
                    timer.isRunning
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                  }`}
                  title={timer.isRunning ? 'Duraklat' : 'Devam Et'}
                >
                  {timer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
              )}

              {onOpenCookingMode && (
                <button
                  type="button"
                  onClick={() => onOpenCookingMode(timer.recipeTitle)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Pişirme Modunu Aç"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onDismissTimer(timer.id)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                title="Kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
