import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  Sparkles,
  List,
  Video
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Recipe } from '../types';
import { playTimerAlarm } from '../utils/timerSound';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface CookingModeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsCooked: (recipe: Recipe) => void;
}

export const CookingModeModal: React.FC<CookingModeModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onMarkAsCooked
}) => {
  useEscapeKey(onClose, isOpen && !!recipe);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showIngredientsDrawer, setShowIngredientsDrawer] = useState(false);
  const [showVideoDrawer, setShowVideoDrawer] = useState(false);
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerInitial, setTimerInitial] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const timerIntervalRef = useRef<number | null>(null);

  const totalSteps = recipe?.instructions?.length || 0;
  const currentStepText = recipe?.instructions?.[currentStepIndex] || '';

  // Screen wakelock request to prevent phone sleeping
  useEffect(() => {
    if (!isOpen) return;
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };
    requestWakeLock();

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isOpen]);

  // Parse time from current step string
  useEffect(() => {
    if (!isOpen || !recipe) return;
    // Reset any running timer
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsTimerRunning(false);

    const matchMin = currentStepText.match(/(\d+)\s*(?:dakika|dk|min)/i);
    const matchSec = currentStepText.match(/(\d+)\s*(?:saniye|sn|sec)/i);

    let secs: number | null = null;
    if (matchMin) {
      secs = parseInt(matchMin[1], 10) * 60;
    } else if (matchSec) {
      secs = parseInt(matchSec[1], 10);
    }

    if (secs && secs > 0) {
      setTimerSeconds(secs);
      setTimerInitial(secs);
    } else {
      setTimerSeconds(null);
      setTimerInitial(null);
    }
  }, [isOpen, recipe?.id, currentStepIndex, currentStepText]);

  // Handle timer tick
  useEffect(() => {
    if (!isOpen) return;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSeconds(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            playTimerAlarm(); // Web Audio chime!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, isTimerRunning, timerSeconds]);

  if (!isOpen || !recipe) return null;

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Finished all steps
      setIsFinished(true);
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setIsFinished(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPct = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 animate-in fade-in select-none">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold line-clamp-1">{recipe.title}</h2>
            <p className="text-xs text-slate-400">Mutfak Pişirme Modu</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {recipe.videoId && (
            <button
              onClick={() => setShowVideoDrawer(!showVideoDrawer)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                showVideoDrawer
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-sm shadow-rose-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Video className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">{showVideoDrawer ? 'Videoyu Kapat' : 'Kısa Video'}</span>
            </button>
          )}

          <button
            onClick={() => setShowIngredientsDrawer(!showIngredientsDrawer)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <List className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Malzemeler</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
        <div 
          className="bg-gradient-to-r from-orange-500 to-amber-400 h-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Optional In-Cooking Video Player Drawer */}
      {showVideoDrawer && recipe.videoId && (
        <div className="w-full max-w-lg mx-auto mt-4 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl animate-in slide-in-from-top-4 flex-shrink-0">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 truncate">
              <Video className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
              <span className="truncate">{recipe.videoTitle || `${recipe.title} Kısa Video`}</span>
            </span>
            <button 
              onClick={() => setShowVideoDrawer(false)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${recipe.videoId}?autoplay=1`}
              title={recipe.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full py-8 text-center overflow-y-auto">
        
        {!isFinished ? (
          <>
            {/* Step Counter Badge */}
            <span className="px-4 py-1.5 rounded-full text-xs font-black bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-6">
              ADIM {currentStepIndex + 1} / {totalSteps}
            </span>

            {/* Instruction Text */}
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-relaxed tracking-tight px-4 font-['Space_Grotesk',sans-serif]">
              {currentStepText}
            </h1>

            {/* Integrated Step Timer (if step has a duration) */}
            {timerSeconds !== null && (
              <div className="mt-8 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col items-center gap-3 w-full max-w-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  <span>Adım Sayacı</span>
                </div>

                <div className="text-5xl font-black tracking-tight text-white font-mono">
                  {formatTimer(timerSeconds)}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                      isTimerRunning
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isTimerRunning ? 'Durdur' : 'Başlat'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsTimerRunning(false);
                      setTimerSeconds(timerInitial);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Sıfırla"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Finished Screen */
          <div className="animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-4xl mx-auto mb-4">
              <Sparkles className="w-10 h-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 font-['Space_Grotesk',sans-serif]">
              Afiyet Olsun! 🍽️
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto mb-6">
              Tarifi başarıyla tamamladın. Bu yemeği geçmişine kaydedip şef puanı kazanabilirsin.
            </p>

            <button
              onClick={() => {
                onMarkAsCooked(recipe);
                onClose();
              }}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>✓ YEMEĞİ KAYDET & BİTİR</span>
            </button>
          </div>
        )}

      </div>

      {/* Ingredients Slide-Over Drawer */}
      {showIngredientsDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-900 border-l border-slate-800 p-6 shadow-2xl flex flex-col animate-in slide-in-from-right">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="font-extrabold text-white text-base">Tarif Malzemeleri</h3>
            <button
              onClick={() => setShowIngredientsDrawer(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto py-4 space-y-2 flex-1">
            {recipe.ingredients.map((ing, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 text-xs">
                <span className="font-semibold text-slate-200">{ing.name}</span>
                <span className="font-bold text-orange-400">{ing.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Large Bottom Touch Controls for Kitchen */}
      {!isFinished && (
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto w-full pt-4">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="py-5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-200 font-extrabold text-base sm:text-lg border border-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
            <span>ÖNCEKİ</span>
          </button>

          <button
            onClick={handleNext}
            className="py-5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-base sm:text-lg transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-orange-500/20"
          >
            <span>{currentStepIndex === totalSteps - 1 ? 'BİTİR 🏁' : 'SONRAKİ'}</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

    </div>
  );
};
