import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Dices, 
  Sparkles, 
  Clock, 
  Flame, 
  Check, 
  RotateCw, 
  ChefHat 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Recipe, MatchResult } from '../types';
import { prepareRouletteCandidates, spinRoulette, RouletteMood, RouletteOption } from '../services/rouletteService';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface MealRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  pantryItems: string[];
  favorites: string[];
  onStartCooking: (recipe: Recipe) => void;
}

const FOOD_EMOJIS = ['🍗', '🍝', '🍕', '🥘', '🌮', '🥩', '🍲', '🍳', '🥗', '🍔', '🥟', '🍣'];

export const MealRouletteModal: React.FC<MealRouletteModalProps> = ({
  isOpen,
  onClose,
  recipes,
  pantryItems,
  favorites,
  onStartCooking
}) => {
  useEscapeKey(onClose, isOpen);

  const [mood, setMood] = useState<RouletteMood>('anything');
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState('🎲');
  const [winner, setWinner] = useState<RouletteOption | null>(null);

  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && !winner && !isSpinning) {
      handleSpin();
    }
  }, [isOpen]);

  const handleSpin = (targetMood: RouletteMood = mood) => {
    setIsSpinning(true);
    setWinner(null);

    const candidates = prepareRouletteCandidates(recipes, pantryItems, favorites, targetMood);
    const selected = spinRoulette(candidates);

    let counter = 0;
    const maxSteps = 24; // Number of ticks before stopping
    let delay = 60;

    const tick = () => {
      counter++;
      const randomEmoji = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
      setCurrentEmoji(randomEmoji);

      if (counter < maxSteps) {
        delay += 10; // Decelerate smoothly
        animationRef.current = window.setTimeout(tick, delay);
      } else {
        // Winner revealed
        setIsSpinning(false);
        setWinner(selected);

        // Fire Confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {}
      }
    };

    tick();
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900/95 border border-stone-200 dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden backdrop-blur-xl transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Glow Elements */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/15 dark:bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-orange-500/15 dark:bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ne Yiyeceğini Bilmiyorsan Senin İçin Seçelim!</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white font-heading">
            Yemek Ruleti 🎲
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1">
            Mutfaktaki malzemelerine ve moduna göre en uygun yemeği seçiyoruz.
          </p>
        </div>

        {/* Mood Selector Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
          {[
            { id: 'anything', label: '✨ Her Şey' },
            { id: 'under_25', label: '⚡ < 25 dk' },
            { id: 'easy', label: '👌 Çok Kolay' },
            { id: 'healthy', label: '🥗 Sağlıklı' },
            { id: 'high_protein', label: '💪 Yüksek Protein' },
            { id: 'vegetarian', label: '🌱 Vejetaryen' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => { 
                setMood(m.id as RouletteMood); 
                if (!isSpinning) handleSpin(m.id as RouletteMood); 
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                mood === m.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-orange-500/20'
                  : 'bg-stone-100 dark:bg-slate-800/80 text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-slate-700/60'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Roulette Spinning Area */}
        {isSpinning && (
          <div className="py-10 flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 rounded-3xl bg-stone-100 dark:bg-slate-800/90 border-2 border-amber-500/60 flex items-center justify-center text-5xl shadow-2xl shadow-amber-500/30 animate-bounce">
              <div className="absolute inset-0 rounded-3xl bg-amber-500/10 animate-ping opacity-30 pointer-events-none" />
              <span>{currentEmoji}</span>
            </div>
            <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-5 animate-pulse">
              1.000 lezzet taranıyor ve çark dönüyor...
            </p>
          </div>
        )}

        {/* Winner Result Card */}
        {!isSpinning && winner && (
          <div className="animate-in zoom-in-95 duration-300">
            <div className="bg-stone-50/90 dark:bg-slate-950/80 border border-stone-200 dark:border-slate-800/90 rounded-2xl overflow-hidden mb-6 shadow-xl">
              <div className="relative aspect-[16/9] bg-stone-200 dark:bg-slate-800">
                <img
                  src={winner.recipe.image}
                  alt={winner.recipe.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 dark:from-slate-950 via-transparent to-transparent" />
                
                {/* Match Badge */}
                <div className="absolute top-3 left-3">
                  {winner.match.tier === 'can_make_now' ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 border border-emerald-400/40">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Tüm Malzemeler Dolabında!
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-400/40">
                      %{winner.match.matchPercentage} Malzeme Dolabında
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-700/60">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      {winner.recipe.cookingTime}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-700/60">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      {winner.recipe.calories} kcal
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-700/60">
                    {winner.recipe.difficulty}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-xl font-extrabold text-stone-900 dark:text-white mb-1 font-heading">
                  {winner.recipe.title}
                </h3>
                <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {winner.recipe.description}
                </p>

                {/* Macro summary if available */}
                {winner.recipe.macros && (
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                      🍗 {winner.recipe.macros.protein}g Protein
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      🌾 {winner.recipe.macros.carbs}g Karb
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      🥑 {winner.recipe.macros.fat}g Yağ
                    </span>
                  </div>
                )}

                {/* Ingredients Status */}
                <div className="p-3 rounded-xl bg-stone-100/90 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 text-xs">
                  {winner.match.missingIngredients.length === 0 ? (
                    <p className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1.5">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Eksik malzeme yok, hemen mutfağa geçebilirsin!
                    </p>
                  ) : (
                    <p className="text-amber-700 dark:text-amber-300 font-semibold">
                      Sadece <span className="font-bold underline">{winner.match.missingIngredients.length} malzeme</span> eksik: {winner.match.missingIngredients.map(i => i.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onClose();
                  onStartCooking(winner.recipe);
                }}
                className="flex-1 py-4 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/25 active:scale-[0.98] transition-all"
              >
                <ChefHat className="w-5 h-5 text-slate-950" />
                <span>BUNU PİŞİR 👨‍🍳</span>
              </button>

              <button
                onClick={() => handleSpin(mood)}
                className="py-4 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 border border-stone-300 dark:border-slate-700 font-bold text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
                title="Başka bir lezzet seç"
              >
                <RotateCw className="w-4 h-4" />
                <span>Tekrar Çevir</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State Fallback */}
        {!isSpinning && !winner && (
          <div className="py-8 px-4 text-center bg-stone-50 dark:bg-slate-950/40 border border-stone-200 dark:border-slate-800/80 rounded-2xl animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-2xl mx-auto mb-3">
              🍽️
            </div>
            <p className="text-sm font-bold text-stone-900 dark:text-white mb-1">Bu filtreye uygun yemek bulunamadı</p>
            <p className="text-xs text-stone-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
              Seçtiğin kriterlere uygun tarif bulunamadı. Filtreyi gevşeterek tüm tarifler arasından şansını deneyebilirsin.
            </p>
            <button
              onClick={() => {
                setMood('anything');
                handleSpin('anything');
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              Tüm Tarifler Arasından Çevir 🎲
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

