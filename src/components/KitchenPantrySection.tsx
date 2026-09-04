import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  Sparkles, 
  AlertTriangle, 
  Trash2, 
  ChefHat,
  Dices,
  Flame
} from 'lucide-react';
import { PantryItem } from '../types';
import { POPULAR_QUICK_INGREDIENTS } from '../data/ingredientsData';

interface KitchenPantrySectionProps {
  pantryItems: PantryItem[];
  onAddIngredient: (name: string, daysLeft?: number) => void;
  onRemoveIngredient: (id: string) => void;
  onClearPantry: () => void;
  onOpenRoulette: () => void;
  urgentCount: number;
}

export const KitchenPantrySection: React.FC<KitchenPantrySectionProps> = ({
  pantryItems,
  onAddIngredient,
  onRemoveIngredient,
  onClearPantry,
  onOpenRoulette,
  urgentCount
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputVal.trim()) {
      onAddIngredient(inputVal.trim());
      setInputVal('');
    }
  };

  const handleAddClick = () => {
    if (inputVal.trim()) {
      onAddIngredient(inputVal.trim());
      setInputVal('');
    }
  };

  const currentNames = pantryItems.map(p => p.name.toLowerCase());

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        
        {/* Header Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tell us what you have. We'll tell you what you can make.</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-['Space_Grotesk',sans-serif]">
              What's in your kitchen? 🥘
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              Dolabındaki ve kilerindeki malzemeleri ekle, hemen yapabileceğin yemekleri keşfet.
            </p>
          </div>

          {/* Big Quick Roulette CTA */}
          <button
            onClick={onOpenRoulette}
            className="flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap self-start sm:self-auto"
          >
            <Dices className="w-5 h-5 text-slate-950 animate-spin-fast" />
            <span>PICK MY MEAL</span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Malzeme yazın (örn: Tavuk, Patates, Soğan, Yumurta...)"
              className="w-full px-4 py-3.5 pl-11 rounded-2xl bg-slate-800/80 border border-slate-700/80 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-white placeholder-slate-400 text-sm font-medium transition-all shadow-inner outline-none"
            />
            <ChefHat className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleAddClick}
            disabled={!inputVal.trim()}
            className="px-5 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ekle</span>
          </button>
        </div>

        {/* Popular Quick Chips ("I Have This") */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Hızlı Ekle (Popüler Malzemeler):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_QUICK_INGREDIENTS.map(item => {
              const alreadyAdded = currentNames.includes(item.toLowerCase());
              return (
                <button
                  key={item}
                  onClick={() => !alreadyAdded && onAddIngredient(item)}
                  disabled={alreadyAdded}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                    alreadyAdded
                      ? 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-default line-through'
                      : 'bg-slate-800/80 hover:bg-orange-500/20 text-slate-300 hover:text-orange-300 border border-slate-700/60 hover:border-orange-500/40 active:scale-95'
                  }`}
                >
                  <span>+</span>
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Kitchen Chips */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                Mutfağındaki Malzemeler:
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {pantryItems.length} malzeme
              </span>

              {urgentCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  {urgentCount} ürün yakında bozuluyor
                </span>
              )}
            </div>

            {pantryItems.length > 0 && (
              <button
                onClick={onClearPantry}
                className="text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kileri Boşalt</span>
              </button>
            )}
          </div>

          {pantryItems.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-800/30 border border-dashed border-slate-700/60 text-center">
              <p className="text-sm text-slate-400">
                Henüz malzeme eklemedin. Yukarıdan hızlıca malzeme seçebilir veya arama kutusuna yazabilirsin.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pantryItems.map(item => (
                <span
                  key={item.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    item.isUrgent
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {item.isUrgent && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                  <span>{item.name}</span>
                  {item.daysLeft !== undefined && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({item.daysLeft}g)
                    </span>
                  )}
                  <button
                    onClick={() => onRemoveIngredient(item.id)}
                    className="p-0.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
