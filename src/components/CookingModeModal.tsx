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
import { resolveRecipeVideo } from '../data/videoLibrary';

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
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
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
      setSlideDirection('next');
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Finished all steps
      setIsFinished(true);
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setSlideDirection('prev');
      setCurrentStepIndex(currentStepIndex - 1);
      setIsFinished(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});

  const toggleIngredientCheck = (idx: number) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all magnetic-spring ${
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
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all magnetic-spring"
          >
            <List className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Malzemeler</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors magnetic-spring"
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
      {showVideoDrawer && (() => {
        const resolvedVideo = resolveRecipeVideo(recipe);
        const activeVideoId = resolvedVideo.videoId;
        const activeVideoTitle = resolvedVideo.videoTitle;
        if (!activeVideoId) return null;
        return (
          <div className="w-full max-w-lg mx-auto mt-4 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl animate-in slide-in-from-top-4 flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 truncate">
                <Video className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                <span className="truncate">{activeVideoTitle || `${recipe.title} Kısa Video`}</span>
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
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1`}
                title={recipe.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        );
      })()}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full py-8 text-center overflow-y-auto">
        
        {!isFinished ? (
          <>
            {/* Step Counter Badge */}
            <span className="px-4 py-1.5 rounded-full text-xs font-black bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-6 tracking-wide">
              ADIM {currentStepIndex + 1} / {totalSteps}
            </span>

            {/* Instruction Text with Directional Slide Transition */}
            <div 
              key={currentStepIndex}
              className={`px-4 max-w-2xl mx-auto transition-all ${
                slideDirection === 'next' ? 'animate-step-left' : 'animate-step-right'
              }`}
            >
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-relaxed tracking-tight font-heading">
                {currentStepText}
              </h1>
            </div>

            {/* Integrated Circular SVG Step Timer with Glow Wave & Warm Minimalist Aesthetics */}
            {timerSeconds !== null && timerInitial !== null && timerInitial > 0 && (
              <div className={`mt-8 relative flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-timer-glow backdrop-blur-md transition-all ${
                isTimerRunning ? 'animate-glow-wave border-orange-500/40' : ''
              } ${
                timerSeconds <= 10 && timerSeconds > 0 && isTimerRunning ? 'animate-pulse-urgent border-orange-500/80 shadow-orange-500/40' : ''
              }`}>
                
                {/* SVG Circular Progress Ring */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    {/* Background Track Circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      className="text-slate-800 stroke-current"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    {/* Active Animated Progress Circle */}
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      className={`transition-all duration-1000 ease-linear ${
                        isTimerRunning 
                          ? 'text-orange-500 stroke-current' 
                          : timerSeconds === 0 
                            ? 'text-emerald-400 stroke-current' 
                            : 'text-amber-500 stroke-current'
                      }`}
                      strokeWidth="8"
                      strokeDasharray={314.159}
                      strokeDashoffset={314.159 * (1 - (timerSeconds / timerInitial))}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>

                  {/* Centered Timer Value & Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-widest text-orange-400/90 mb-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isTimerRunning ? 'PİŞİYOR' : timerSeconds === 0 ? 'TAMAM!' : 'SAYAC'}</span>
                    </div>
                    <div className={`text-4xl font-black font-mono tracking-tight ${timerSeconds === 0 ? 'text-emerald-400 animate-bounce' : 'text-white'}`}>
                      {formatTimer(timerSeconds)}
                    </div>
                  </div>
                </div>

                {/* Timer Controls */}
                <div className="flex items-center gap-2.5 mt-3">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-lg magnetic-spring ${
                      isTimerRunning
                        ? 'bg-amber-500 text-slate-950 shadow-amber-500/25 hover:bg-amber-400'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-300'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4 stroke-[3]" /> : <Play className="w-4 h-4 stroke-[3]" />}
                    <span>{isTimerRunning ? 'Durdur' : 'Başlat'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsTimerRunning(false);
                      setTimerSeconds(timerInitial);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 magnetic-spring"
                    title="Süreyi Sıfırla"
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
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 font-heading">
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
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 magnetic-spring flex items-center gap-2 mx-auto"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>✓ YEMEĞİ KAYDET & BİTİR</span>
            </button>
          </div>
        )}

      </div>

      {/* Ingredients Slide-Over Drawer with Interactive Checkbox Strike-through */}
      {showIngredientsDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-900 border-l border-slate-800 p-6 shadow-2xl flex flex-col animate-in slide-in-from-right">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-extrabold text-white text-base">Tarif Malzemeleri</h3>
              <p className="text-xs text-slate-400">Hazırladıkça dokunup işaretle</p>
            </div>
            <button
              onClick={() => setShowIngredientsDrawer(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 magnetic-spring"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto py-4 space-y-2 flex-1">
            {recipe.ingredients.map((ing, idx) => {
              const isChecked = !!checkedIngredients[idx];
              return (
                <button
                  key={idx}
                  onClick={() => toggleIngredientCheck(idx)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all magnetic-spring ${
                    isChecked
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400/70'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-600 bg-slate-700/50'
                    }`}>
                      {isChecked && <span className="text-[10px] font-black">✓</span>}
                    </div>
                    <span className={`font-semibold text-xs truncate ${isChecked ? 'line-through opacity-70' : ''}`}>
                      {ing.name}
                    </span>
                  </div>
                  <span className={`font-bold text-xs flex-shrink-0 ${isChecked ? 'text-emerald-400/50' : 'text-orange-400'}`}>
                    {ing.amount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Large Bottom Touch Controls for Kitchen */}
      {!isFinished && (
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto w-full pt-4">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="py-5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-200 font-extrabold text-base sm:text-lg border border-slate-800 transition-all flex items-center justify-center gap-2 magnetic-spring shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
            <span>ÖNCEKİ</span>
          </button>

          <button
            onClick={handleNext}
            className="py-5 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-base sm:text-lg transition-all flex items-center justify-center gap-2 magnetic-spring shadow-xl shadow-orange-500/20"
          >
            <span>{currentStepIndex === totalSteps - 1 ? 'BİTİR 🏁' : 'SONRAKİ'}</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

    </div>
  );
};
