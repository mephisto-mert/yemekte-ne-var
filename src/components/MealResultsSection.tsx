import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Search, 
  Filter,
  Dices,
  Sparkles
} from 'lucide-react';
import { Recipe, MatchResult, MatchTier } from '../types';
import { RecipeCard } from './RecipeCard';

interface MealResultsSectionProps {
  canMakeNow: MatchResult[];
  almostThere: MatchResult[];
  needMore: MatchResult[];
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onStartCooking: (e: React.MouseEvent, recipe: Recipe) => void;
  onOpenRoulette: () => void;
  hasPantryItems: boolean;
}

export const MealResultsSection: React.FC<MealResultsSectionProps> = ({
  canMakeNow,
  almostThere,
  needMore,
  favorites,
  onToggleFavorite,
  onSelectRecipe,
  onStartCooking,
  onOpenRoulette,
  hasPantryItems
}) => {
  const [activeTier, setActiveTier] = useState<MatchTier>('can_make_now');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const totalDiscoveries = canMakeNow.length + almostThere.length;

  // Decide current tier list
  let currentList: MatchResult[] = [];
  if (activeTier === 'can_make_now') currentList = canMakeNow;
  else if (activeTier === 'almost_there') currentList = almostThere;
  else currentList = needMore;

  // Apply sub-filters
  const filteredResults = currentList.filter(res => {
    const r = res.recipe;
    // Category filter
    if (selectedCategory === 'quick' && r.timeMinutes > 30) return false;
    if (selectedCategory === 'easy' && r.difficulty !== 'Kolay') return false;
    if (selectedCategory === 'vegetarian' && r.category !== 'vegetarian' && r.category !== 'salad') return false;
    if (selectedCategory !== 'all' && selectedCategory !== 'quick' && selectedCategory !== 'easy' && selectedCategory !== 'vegetarian') {
      if (r.category !== selectedCategory) return false;
    }

    // Text search query
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchIng = r.ingredients.some(i => i.name.toLowerCase().includes(q));
      if (!matchTitle && !matchIng) return false;
    }

    return true;
  });

  return (
    <section className="mb-14">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Space_Grotesk',sans-serif] flex items-center gap-2">
            <span>Yemek Keşfi</span>
            {hasPantryItems && (
              <span className="text-base font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                {totalDiscoveries} tarif yapılabilir
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {hasPantryItems 
              ? 'Malzemelerine göre eşleşen tarifler aşağıda 3 grupta listelendi.'
              : 'Malzeme seçimi yapmadan da tüm tarif havuzunu inceleyebilir veya ruleti çevirebilirsin.'}
          </p>
        </div>

        {/* Search Filter Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Tarif adı veya malzeme ara..."
            className="w-full px-3.5 py-2 pl-9 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 focus:border-orange-500 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 3 Tier Navigation Tabs */}
      <div className="flex flex-wrap gap-2.5 mb-6 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800">
        
        {/* Tier 1: Can Make Now */}
        <button
          onClick={() => setActiveTier('can_make_now')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTier === 'can_make_now'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>🟢 Hemen Yapabilirsin</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/30 text-emerald-200">
            {canMakeNow.length}
          </span>
        </button>

        {/* Tier 2: Almost There */}
        <button
          onClick={() => setActiveTier('almost_there')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTier === 'almost_there'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>🟡 1–3 Malzeme Eksik</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/30 text-amber-200">
            {almostThere.length}
          </span>
        </button>

        {/* Tier 3: Need More */}
        <button
          onClick={() => setActiveTier('need_more')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
            activeTier === 'need_more'
              ? 'bg-slate-800 text-slate-200 border border-slate-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>🔴 Diğer Tarifler</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-slate-800 text-slate-300">
            {needMore.length}
          </span>
        </button>

      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filtre:
        </span>

        {[
          { id: 'all', label: 'Tümü' },
          { id: 'quick', label: '⚡ Hızlı (< 30 dk)' },
          { id: 'easy', label: '👌 Kolay / Pratik' },
          { id: 'main_dish', label: '🥩 Ana Yemek' },
          { id: 'soup', label: '🍲 Çorbalar' },
          { id: 'breakfast', label: '🍳 Kahvaltı' },
          { id: 'vegetarian', label: '🥬 Vejetaryen' },
          { id: 'dessert', label: '🍰 Tatlılar' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results Grid */}
      {filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredResults.map(item => (
            <RecipeCard
              key={item.recipe.id}
              recipe={item.recipe}
              match={item}
              isFavorite={favorites.includes(item.recipe.id)}
              onToggleFavorite={onToggleFavorite}
              onSelectRecipe={onSelectRecipe}
              onStartCooking={onStartCooking}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-dashed border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Bu kriterde tarif bulunamadı
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-5">
            Filtreyi temizleyebilir, mutfağına yeni malzemeler ekleyebilir ya da kararsızsan Meal Roulette ile şansını deneyebilirsin.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setSelectedCategory('all'); setSearchFilter(''); }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              Filtreleri Sıfırla
            </button>
            <button
              onClick={onOpenRoulette}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 transition-all flex items-center gap-1.5"
            >
              <Dices className="w-4 h-4" />
              Ruleti Çevir
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
