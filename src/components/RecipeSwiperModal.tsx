import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  RotateCcw, 
  Flame, 
  Clock, 
  Info, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react';
import { Recipe } from '../types';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface RecipeSwiperModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
}

export const RecipeSwiperModal: React.FC<RecipeSwiperModalProps> = ({
  isOpen,
  onClose,
  recipes,
  onSelectRecipe,
  onToggleFavorite,
  favorites,
}) => {
  useEscapeKey(onClose, isOpen);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);

  if (!isOpen) return null;

  const currentRecipe = recipes[currentIndex];
  const nextRecipe = recipes[currentIndex + 1];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentRecipe) return;
    setSwipeDirection(direction);

    if (direction === 'right') {
      if (!favorites.includes(currentRecipe.id)) {
        onToggleFavorite(currentRecipe.id);
      }
    }

    setTimeout(() => {
      setSwipeDirection(null);
      setDragOffset(0);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (dragStartX === null) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = clientX - dragStartX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (dragOffset > 80) {
      handleSwipe('right');
    } else if (dragOffset < -80) {
      handleSwipe('left');
    } else {
      setDragOffset(0);
    }
    setDragStartX(null);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setDragOffset(0);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col items-center max-h-[92vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-900 dark:text-white font-heading">Lezzet Keşfi</h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">Kaydır, beğen veya pişir</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600 dark:text-slate-400 px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-slate-800">
              {Math.min(currentIndex + 1, recipes.length)} / {recipes.length}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Card Deck Area */}
        <div className="relative w-full aspect-[4/5] max-h-[460px] my-2 select-none">
          {currentIndex < recipes.length && currentRecipe ? (
            <>
              {/* Next Card in Stack (Underneath) */}
              {nextRecipe && (
                <div className="absolute inset-0 rounded-2xl bg-stone-100 dark:bg-slate-850 border border-stone-200 dark:border-slate-800 shadow-md scale-95 translate-y-3 opacity-60 overflow-hidden pointer-events-none">
                  <img
                    src={nextRecipe.image}
                    alt={nextRecipe.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 dark:from-slate-950 via-transparent to-transparent" />
                </div>
              )}

              {/* Active Top Card */}
              <div
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  transform: "translateX(" + dragOffset + "px) rotate(" + (dragOffset * 0.06) + "deg)",
                  transition: dragStartX ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
                  opacity: swipeDirection ? 0 : 1,
                }}
                className="absolute inset-0 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing flex flex-col"
              >
                {/* Image */}
                <div className="relative flex-1 w-full overflow-hidden bg-stone-200 dark:bg-slate-800">
                  <img
                    src={currentRecipe.image}
                    alt={currentRecipe.title}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 dark:from-slate-950 via-stone-950/20 dark:via-slate-950/25 to-transparent" />

                  {/* Stamp Badges on Drag */}
                  {dragOffset > 40 && (
                    <div className="absolute top-6 left-6 px-4 py-1.5 rounded-xl border-2 border-emerald-400 bg-emerald-500/30 text-emerald-300 font-black text-lg rotate-[-12deg] shadow-lg animate-pulse">
                      BEĞENDİM 💚
                    </div>
                  )}
                  {dragOffset < -40 && (
                    <div className="absolute top-6 right-6 px-4 py-1.5 rounded-xl border-2 border-rose-500 bg-rose-500/30 text-rose-300 font-black text-lg rotate-[12deg] shadow-lg animate-pulse">
                      PAS ❌
                    </div>
                  )}

                  {/* Floating Tags */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-900/80 text-orange-400 border border-slate-700/60 backdrop-blur-md">
                      {currentRecipe.cuisine || 'Türk Mutfağı'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-900/80 text-amber-300 border border-slate-700/60 backdrop-blur-md">
                      {currentRecipe.difficulty}
                    </span>
                  </div>
                </div>

                {/* Bottom Card Content */}
                <div className="p-4 bg-white dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-extrabold text-stone-900 dark:text-white font-heading line-clamp-1">
                      {currentRecipe.title}
                    </h3>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {currentRecipe.description}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-xs font-bold text-stone-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      {currentRecipe.cookingTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      {currentRecipe.calories} kcal
                    </span>
                    <span className="text-[11px] text-stone-400 dark:text-slate-500">
                      • {currentRecipe.ingredients.length} malzeme
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Empty State when Deck is Done */
            <div className="w-full h-full rounded-2xl bg-stone-50 dark:bg-slate-850 border border-stone-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 text-orange-500 dark:text-orange-400 border border-orange-500/30 flex items-center justify-center text-2xl mb-3">
                🎉
              </div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white mb-1">Destedeki Tüm Tariflere Baktın!</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 max-w-xs mb-4">
                Beğendiğin tarifleri favorilerinden veya arama panelinden dilediğin an pişirebilirsin.
              </p>
              <button
                onClick={handleRestart}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Desteyi Yeniden Başlat</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Control Buttons */}
        {currentIndex < recipes.length && currentRecipe && (
          <div className="w-full flex items-center justify-center gap-3 pt-2">
            {/* Pass / Swipe Left */}
            <button
              onClick={() => handleSwipe('left')}
              className="w-12 h-12 rounded-full bg-stone-100 hover:bg-rose-500/15 text-stone-500 dark:bg-slate-800 dark:hover:bg-rose-500/20 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 border border-stone-300 dark:border-slate-700 flex items-center justify-center transition-all active:scale-90 shadow-lg"
              title="Pas Geç (Sol)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* View Recipe Detail */}
            <button
              onClick={() => {
                onClose();
                onSelectRecipe(currentRecipe);
              }}
              className="px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 border border-stone-300 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Info className="w-4 h-4 text-orange-500" />
              <span>Tarife Git</span>
            </button>

            {/* Like & Cook / Swipe Right */}
            <button
              onClick={() => handleSwipe('right')}
              className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-emerald-500/25"
              title="Beğen & Kaydet (Sağ)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

