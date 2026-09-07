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
import { normalizeText } from '../services/matchingService';
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
  const [visibleCount, setVisibleCount] = useState<number>(24);

  const totalDiscoveries = canMakeNow.length + almostThere.length;

  const handleTierChange = (tier: MatchTier) => {
    setActiveTier(tier);
    setVisibleCount(24);
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setVisibleCount(24);
  };

  const handleSearchChange = (val: string) => {
    setSearchFilter(val);
    setVisibleCount(24);
  };

  // Decide current tier list
  let currentList: MatchResult[] = [];
  if (activeTier === 'can_make_now') currentList = canMakeNow;
  else if (activeTier === 'almost_there') currentList = almostThere;
  else currentList = needMore;

    // Apply sub-filters
  const filteredResults = currentList.filter(res => {
    const r = res.recipe;
    // Lifestyle & Category filters
    if (selectedCategory === 'quick' && r.timeMinutes > 30) return false;
    if (selectedCategory === 'easy' && r.difficulty !== 'Kolay') return false;
    if (selectedCategory === 'high_protein') {
      const p = r.macros?.protein || 0;
      if (p < 25 && !/(tavuk|et|kiyma|balik|köfte|biftek)/i.test(r.title)) return false;
    }
    if (selectedCategory === 'low_calorie' && r.calories > 400) return false;
    if (selectedCategory === 'vegetarian' && !/sebze|salata|makarna|börek|zeytinyağlı|tatlı|çorba|pilav/i.test(r.category + ' ' + r.title)) return false;
    if (selectedCategory === 'main_dish') {
      if (r.category !== 'main_dish' && !/etli|tavuk|köfte|balık|güveç|kavurma|karnıyarık/i.test(r.category + ' ' + r.title)) return false;
    } else if (selectedCategory === 'soup') {
      if (r.category !== 'soup' && !/corba|çorba/i.test(r.category + ' ' + r.title)) return false;
    } else if (selectedCategory === 'drink') {
      if (r.category !== 'drink' && !/içecek|serbet|şerbet|smoothie|kahve|çay|cay|limonata/i.test(r.category + ' ' + r.title)) return false;
    } else if (selectedCategory === 'dessert') {
      if (r.category !== 'dessert' && !/tatli|tatlı|pasta|kek|kurabiye|sütlaç|baklava|helva/i.test(r.category + ' ' + r.title)) return false;
    } else if (selectedCategory === 'breakfast') {
      if (r.category !== 'breakfast' && !/kahvalti|kahvaltı|omlet|menemen|yumurta|tost|gözleme/i.test(r.category + ' ' + r.title)) return false;
    } else if (selectedCategory === 'pastry') {
      if (r.category !== 'pastry' && r.category !== 'bakery' && !/borek|börek|pide|pizza|poğaça|pogaca|lahmacun|ekmek|hamur/i.test(r.category + ' ' + r.title)) return false;
    } else if (selectedCategory === 'appetizer') {
      if (r.category !== 'appetizer' && r.category !== 'meze' && r.category !== 'snack' && r.category !== 'salad' && !/meze|humus|haydari|ezme|salata|atıştırmalık/i.test(r.category + ' ' + r.title)) return false;
    } else if (selectedCategory !== 'all' && selectedCategory !== 'quick' && selectedCategory !== 'easy' && selectedCategory !== 'vegetarian' && selectedCategory !== 'high_protein' && selectedCategory !== 'low_calorie') {
      if (r.category !== selectedCategory) return false;
    }

    // Text search query
    if (searchFilter.trim()) {
      const q = normalizeText(searchFilter);
      const matchTitle = normalizeText(r.title).includes(q);
      const matchIng = r.ingredients.some(i => normalizeText(i.name).includes(q));
      if (!matchTitle && !matchIng) return false;
    }

    return true;
  });

  return (
    <section className="mb-14">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight font-heading">
              {hasPantryItems ? 'Mutfak Malzemelerine Göre Öneriler' : 'Tüm Nefis Tarifler'}
            </h2>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25">
              {totalDiscoveries} Keşif
            </span>
          </div>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">
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
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Tarif adı veya malzeme ara..."
            className="w-full px-3.5 py-2 pl-9 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:border-orange-500 outline-none shadow-sm transition-all"
          />
          <Search className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 3 Tier Navigation Tabs with Spring Physics */}
      <div className="flex flex-wrap gap-2.5 mb-6 p-1.5 bg-stone-100/90 dark:bg-slate-900/80 rounded-2xl border border-stone-200 dark:border-slate-800 transition-colors">
        
        {/* Tier 1: Can Make Now */}
        <button
          onClick={() => handleTierChange('can_make_now')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 magnetic-spring ${
            activeTier === 'can_make_now'
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>🟢 Hemen Yapabilirsin</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/25 text-emerald-800 dark:text-emerald-200">
            {canMakeNow.length}
          </span>
        </button>

        {/* Tier 2: Almost There */}
        <button
          onClick={() => handleTierChange('almost_there')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 magnetic-spring ${
            activeTier === 'almost_there'
              ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800/60'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>🟡 1–3 Malzeme Eksik</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/25 text-amber-900 dark:text-amber-200">
            {almostThere.length}
          </span>
        </button>

        {/* Tier 3: Need More */}
        <button
          onClick={() => handleTierChange('need_more')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 magnetic-spring ${
            activeTier === 'need_more'
              ? 'bg-stone-200/80 dark:bg-slate-800 text-stone-900 dark:text-slate-200 border border-stone-300 dark:border-slate-700 shadow-sm'
              : 'text-stone-500 dark:text-slate-500 hover:text-stone-800 dark:hover:text-slate-300 hover:bg-stone-200/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-stone-400 dark:text-slate-400" />
          <span>🔴 Diğer Tarifler</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-black bg-stone-300/80 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
            {needMore.length}
          </span>
        </button>

      </div>

      {/* Category & Lifestyle Pills Filter — Harmonized Warm Minimalist Palette */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <span className="text-xs font-bold text-stone-400 dark:text-slate-500 px-2 flex items-center gap-1 flex-shrink-0">
          <Filter className="w-3 h-3" /> Filtre:
        </span>

        {[
          { id: 'all', label: 'Tümü' },
          { id: 'main_dish', label: '🥩 Ana Yemek' },
          { id: 'soup', label: '🍲 Çorbalar' },
          { id: 'drink', label: '🥤 İçecek & Kahve' },
          { id: 'dessert', label: '🍰 Tatlı & Pasta' },
          { id: 'breakfast', label: '🍳 Kahvaltılık' },
          { id: 'pastry', label: '🥐 Hamur İşi & Börek' },
          { id: 'appetizer', label: '🧆 Meze & Salata' },
          { id: 'high_protein', label: '🍗 Yüksek Protein (>25g)' },
          { id: 'low_calorie', label: '🥗 Düşük Kalori (<400 kcal)' },
          { id: 'quick', label: '⚡ Hızlı (< 30 dk)' },
          { id: 'easy', label: '👌 Kolay / Pratik' },
          { id: 'vegetarian', label: '🥬 Vejetaryen' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all magnetic-spring ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
                : 'bg-white hover:bg-stone-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 border border-stone-200 dark:border-slate-800 shadow-sm'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results Grid */}
      {filteredResults.length > 0 ? (
        <div className="space-y-8 animate-tab-enter">
          <div 
            key={`${activeTier}-${selectedCategory}-${searchFilter}`}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filteredResults.slice(0, visibleCount).map(item => (
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

          {/* Progressive Load More Button */}
          {filteredResults.length > visibleCount && (
            <div className="text-center pt-2">
              <button
                onClick={() => setVisibleCount(prev => prev + 24)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/25 active:scale-95 transition-all"
              >
                Daha Fazla Tarif Göster (+24) — Kalan: {filteredResults.length - visibleCount}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Rich Culinary Empty State with Custom SVG Illustration */
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/60 border border-dashed border-stone-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="w-20 h-20 rounded-3xl bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20 flex items-center justify-center mx-auto mb-4 animate-spring-pop shadow-inner">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
          </div>
          <h3 className="text-xl font-extrabold text-stone-900 dark:text-white mb-1.5 font-heading">
            Bu Kriterde Tarif Bulunamadı
          </h3>
          <p className="text-sm text-stone-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Seçtiğin filtre veya arama kelimesine uygun bir yemek henüz yok. Filtreleri sıfırlayabilir veya şansını ruletle deneyebilirsin! 🎲
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => { setSelectedCategory('all'); setSearchFilter(''); setVisibleCount(24); }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 border border-stone-200 dark:border-slate-700 transition-all magnetic-spring shadow-sm"
            >
              Filtreleri Sıfırla
            </button>
            <button
              onClick={onOpenRoulette}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition-all flex items-center gap-1.5 magnetic-spring shadow-lg shadow-orange-500/20"
            >
              <Dices className="w-4 h-4" />
              Ruleti Çevir 🎲
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
