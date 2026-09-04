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

  const handleSpin = () => {
    setIsSpinning(true);
    setWinner(null);

    const candidates = prepareRouletteCandidates(recipes, pantryItems, favorites, mood);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>I don't know what to eat. Pick for me!</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk',sans-serif]">
            Meal Roulette 🎲
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Mutfaktaki malzemelerine ve moduna göre en uygun yemeği seçiyoruz.
          </p>
        </div>

        {/* Mood Selector Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
          {[
            { id: 'anything', label: 'Her Şey' },
            { id: 'under_25', label: '⚡ < 25 dk' },
            { id: 'easy', label: '👌 Çok Kolay' },
            { id: 'healthy', label: '🥗 Sağlıklı' },
            { id: 'high_protein', label: '💪 Yüksek Protein' },
            { id: 'vegetarian', label: '🥬 Vejetaryen' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => { setMood(m.id as RouletteMood); if (!isSpinning) handleSpin(); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mood === m.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Roulette Spinning Area */}
        {isSpinning && (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-slate-800/80 border-2 border-amber-500/50 flex items-center justify-center text-5xl shadow-2xl shadow-amber-500/20 animate-bounce">
              {currentEmoji}
            </div>
            <p className="text-sm font-bold text-amber-400 mt-4 animate-pulse">
              Mutfağın taranıyor ve lezzetler dönüyor...
            </p>
          </div>
        )}

        {/* Winner Result Card */}
        {!isSpinning && winner && (
          <div className="animate-in zoom-in-95 duration-300">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden mb-6">
              <div className="relative aspect-[16/9] bg-slate-800">
                <img
                  src={winner.recipe.image}
                  alt={winner.recipe.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                
                {/* Match Badge */}
                <div className="absolute top-3 left-3">
                  {winner.match.tier === 'can_make_now' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Tüm Malzemeler Var!
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-md">
                      %{winner.match.matchPercentage} Malzeme Var
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-orange-400" />
                    {winner.recipe.cookingTime}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md">
                    <Flame className="w-3 h-3 text-amber-400" />
                    {winner.recipe.calories} kcal
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-xl font-extrabold text-white mb-1">
                  {winner.recipe.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {winner.recipe.description}
                </p>

                {/* Ingredients Status */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
                  {winner.match.missingIngredients.length === 0 ? (
                    <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Eksik malzeme yok, hemen mutfağa geçebilirsin!
                    </p>
                  ) : (
                    <p className="text-amber-300 font-semibold">
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
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
              >
                <ChefHat className="w-4 h-4 text-slate-950" />
                <span>COOK THIS (BUNU PİŞİR)</span>
              </button>

              <button
                onClick={handleSpin}
                className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
                title="Başka bir yemek seç"
              >
                <RotateCw className="w-4 h-4" />
                <span>Tekrar Çevir</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
