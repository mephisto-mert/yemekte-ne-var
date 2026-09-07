import React, { useState, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Heart, 
  Clock, 
  Flame, 
  Star, 
  Compass,
  Coffee,
  Cake,
  Egg,
  Croissant,
  Soup,
  Beef,
  Salad,
  Globe
} from 'lucide-react';
import { Recipe } from '../types';
import { normalizeText, evaluateRecipeMatch } from '../services/matchingService';

interface CategoryShowcaseSectionProps {
  recipes: Recipe[];
  pantryItems: string[];
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onStartCooking?: (e: React.MouseEvent, recipe: Recipe) => void;
}

interface CategoryRailConfig {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  filterFn: (r: Recipe) => boolean;
}

export const CategoryShowcaseSection: React.FC<CategoryShowcaseSectionProps> = ({
  recipes,
  pantryItems,
  favorites,
  onToggleFavorite,
  onSelectRecipe,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');

  // Category rail definitions
  const CATEGORIES: CategoryRailConfig[] = useMemo(() => [
    {
      id: 'drink',
      name: 'İçecekler & Kahveler',
      subtitle: 'Limonata, smoothie, soğuk çay, kahve ve taze şerbetler',
      icon: <Coffee className="w-5 h-5 text-sky-500" />,
      filterFn: (r) => r.category === 'drink' || /içecek|serbet|şerbet|smoothie|kahve|cay|çay|limonata|frappe|milkshake|kokteyl/i.test(r.category + ' ' + r.title)
    },
    {
      id: 'dessert',
      name: 'Tatlılar, Pastalar & Kekler',
      subtitle: 'Sütlü tatlılar, şerbetliler, çikolatalı kekler ve pastalar',
      icon: <Cake className="w-5 h-5 text-pink-500" />,
      filterFn: (r) => r.category === 'dessert' || /tatli|tatlı|pasta|kek|kurabiye|sütlaç|baklava|helva|puding|tart|cheesecake|sufle/i.test(r.category + ' ' + r.title)
    },
    {
      id: 'breakfast',
      name: 'Kahvaltılıklar & Pratik Lezzetler',
      subtitle: 'Omletler, menemen, gözleme, krep, tost ve kahvaltı dürümü',
      icon: <Egg className="w-5 h-5 text-amber-500" />,
      filterFn: (r) => r.category === 'breakfast' || /kahvalti|kahvaltı|omlet|menemen|yumurta|tost|gözleme|krep|pankek/i.test(r.category + ' ' + r.title)
    },
    {
      id: 'pastry',
      name: 'Börekler, Pideler & Hamur İşleri',
      subtitle: 'Çıtır börekler, fırın poğaçaları, ev yapımı pideler ve pizzalar',
      icon: <Croissant className="w-5 h-5 text-orange-500" />,
      filterFn: (r) => r.category === 'pastry' || r.category === 'bakery' || /borek|börek|pide|pizza|poğaça|açma|çörek|ekmek|hamur/i.test(r.category + ' ' + r.title)
    },
    {
      id: 'soup',
      name: 'Sıcak ve Şifalı Çorbalar',
      subtitle: 'Geleneksel mercimek, ezogelin, tarhana ve lokanta usulü çorbalar',
      icon: <Soup className="w-5 h-5 text-red-500" />,
      filterFn: (r) => r.category === 'soup' || /corba|çorba/i.test(r.category + ' ' + r.title)
    },
    {
      id: 'main_dish',
      name: 'Nefis Ana Yemekler & Izgaralar',
      subtitle: 'Etli, tavuklu, balıklı tencere yemekleri, güveç ve fırın lezzetleri',
      icon: <Beef className="w-5 h-5 text-rose-500" />,
      filterFn: (r) => r.category === 'main_dish' || /ana yemek|etli|tavuk|kavurma|güveç|köfte|karnıyarık|sote|tandır/i.test(r.category + ' ' + r.title)
    },
    {
      id: 'meze',
      name: 'Soğuk Mezeler, Salatalar & Soslar',
      subtitle: 'Zeytinyağlılar, yoğurtlu mezeler, humus, ezme ve taze salatalar',
      icon: <Salad className="w-5 h-5 text-emerald-500" />,
      filterFn: (r) => r.category === 'meze' || r.category === 'appetizer' || r.category === 'salad' || /meze|salata|humus|ezme|şakşuka|fava|haydari|tarator/i.test(r.category + ' ' + r.title)
    },
    {
      id: 'world',
      name: 'Dünya Mutfağı & Sokak Lezzetleri',
      subtitle: 'Taco, noodle, makarna, burger, tantuni ve enfes kaseler (bowl)',
      icon: <Globe className="w-5 h-5 text-indigo-500" />,
      filterFn: (r) => r.category === 'world' || /dünya|taco|fajita|noodle|makarna|burger|quesadilla|tantuni|bowl|teriyaki/i.test(r.category + ' ' + r.title)
    }
  ], []);

  // Quick suggestions for search
  const POPULAR_SEARCHES = ['Çilekli Limonata', 'Cheesecake', 'Menemen', 'Mercimek Çorbası', 'Kıymalı Börek', 'İzmir Köfte', 'Humus', 'Tantuni'];

  // Global search matching across all 2,218+ recipes with token matching & relevance ranking
  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return [];

    const normQuery = normalizeText(query);
    const queryTokens = normQuery.split(/[\s,+/&]+/).filter(t => t.length > 1);

    if (queryTokens.length === 0) return [];

    const scored = recipes.map(r => {
      const normTitle = normalizeText(r.title);
      const normCategory = normalizeText(r.category);
      const normCuisine = normalizeText(r.cuisine || '');
      const normTags = (Array.isArray(r.tags) ? r.tags : []).map(t => normalizeText(t)).join(' ');
      const normIngredients = (r.ingredients || []).map(i => normalizeText(i.name)).join(' ');
      const allText = `${normTitle} ${normCategory} ${normCuisine} ${normTags} ${normIngredients}`;

      let score = 0;

      // Exact phrase match in title
      if (normTitle.includes(normQuery)) {
        score += 100;
      } else if (allText.includes(normQuery)) {
        score += 50;
      }

      // Check tokens
      let matchedTokens = 0;
      for (const token of queryTokens) {
        // Stem match (e.g. cilek matches cilekli, limon matches limonata, borek matches boregi)
        const stem = token.length > 4 ? token.slice(0, 4) : token;
        if (normTitle.includes(token)) {
          score += 30;
          matchedTokens++;
        } else if (normTitle.includes(stem)) {
          score += 20;
          matchedTokens++;
        } else if (normIngredients.includes(token) || normIngredients.includes(stem)) {
          score += 15;
          matchedTokens++;
        } else if (allText.includes(token) || allText.includes(stem)) {
          score += 10;
          matchedTokens++;
        }
      }

      // Require at least all tokens matched or score > 0
      const isMatch = matchedTokens >= Math.min(queryTokens.length, 2) || score >= 20;
      return { recipe: r, score, isMatch };
    });

    return scored
      .filter(item => item.isMatch)
      .sort((a, b) => b.score - a.score)
      .map(item => item.recipe);
  }, [recipes, searchQuery]);

  // Group recipes by category rails
  const categoryRailData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const railRecipes = recipes.filter(cat.filterFn);
      return {
        ...cat,
        recipes: railRecipes,
        count: railRecipes.length
      };
    });
  }, [recipes, CATEGORIES]);

  return (
    <section className="mt-4 mb-16 animate-tab-enter">
      
      {/* Header & Direct Search Bar */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8 border border-stone-700/50">
        
        {/* Glow backdrop effects */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-black uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2.218+ Lezzet Vitrini & Canlı Arama</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
            İstediğin Yemeği Anında Bul & Reyonları Gez
          </h2>
          <p className="text-sm sm:text-base text-stone-300 mt-2 font-normal">
            İster doğrudan adını veya malzemesini yazarak ara, istersen aşağıda sağdan sola kayan kategorileri keşfet.
          </p>

          {/* Interactive Live Search Input */}
          <div className="mt-6 relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-stone-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Yemek, içecek, tatlı veya malzeme ara... (örn: Çilekli Limonata, Mantı, Köfte)"
                className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-2xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl border-2 border-white/20 focus:border-orange-500 text-white placeholder-stone-400 text-sm sm:text-base font-medium outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-stone-200 transition-all active:scale-90"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Suggestions Chips */}
            <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
              <span className="text-stone-400 font-medium">Hızlı Öneriler:</span>
              {POPULAR_SEARCHES.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-stone-200 text-[11px] font-semibold transition-all active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* If Search Query is Active: Show Direct Search Results Grid */}
      {searchQuery.trim() ? (
        <div className="mb-12 animate-tab-enter">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2 font-heading">
                <Search className="w-5 h-5 text-orange-500" />
                <span>Arama Sonuçları: "{searchQuery}"</span>
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-0.5">
                2.218 tarif veritabanından filtrelendi
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
              {searchResults.length} Tarif Bulundu
            </span>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {searchResults.map(recipe => (
                <ShowcaseRecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  pantryItems={pantryItems}
                  isFavorite={favorites.includes(recipe.id)}
                  onToggleFavorite={onToggleFavorite}
                  onSelectRecipe={onSelectRecipe}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-stone-200 dark:border-slate-800 shadow-sm">
              <Compass className="w-12 h-12 text-stone-300 dark:text-slate-600 mx-auto mb-3 animate-pulse" />
              <h4 className="text-base font-bold text-stone-900 dark:text-white mb-1">
                "{searchQuery}" için sonuç bulunamadı
              </h4>
              <p className="text-xs text-stone-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                Farklı bir kelime deneyebilir veya aşağıdaki kategori reyonlarından lezzetleri inceleyebilirsiniz.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold active:scale-95 transition-all"
              >
                Aramayı Temizle ve Reyonları Göster
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Otherwise: Show Horizontal Category Rails with Slide Animation */
        <div className="space-y-12">
          
          {/* Category Jump Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveCategoryTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeCategoryTab === 'all'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-105'
                  : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tüm Reyonlar</span>
            </button>

            {categoryRailData.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryTab(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategoryTab === cat.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-105'
                    : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.icon}
                <span>{cat.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-bold">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Render Active Category Rails */}
          {categoryRailData
            .filter(cat => activeCategoryTab === 'all' || activeCategoryTab === cat.id)
            .map(cat => (
              <CategoryRail
                key={cat.id}
                config={cat}
                recipes={cat.recipes}
                pantryItems={pantryItems}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
                onSelectRecipe={onSelectRecipe}
              />
            ))}
        </div>
      )}

    </section>
  );
};

/* Individual Horizontal Scrolling Rail with Left/Right Slide Controls */
interface CategoryRailProps {
  config: CategoryRailConfig & { count: number };
  recipes: Recipe[];
  pantryItems: string[];
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

const CategoryRail: React.FC<CategoryRailProps> = ({
  config,
  recipes,
  pantryItems,
  favorites,
  onToggleFavorite,
  onSelectRecipe
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-slate-800/80 shadow-sm relative group">
      
      {/* Rail Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white font-heading">
                {config.name}
              </h3>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                {config.count} Çeşit
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">
              {config.subtitle}
            </p>
          </div>
        </div>

        {/* Scroll Left & Right Navigation Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleScroll('left')}
            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 flex items-center justify-center transition-all shadow-sm active:scale-90"
            title="Sola Kaydır"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 flex items-center justify-center transition-all shadow-sm active:scale-90"
            title="Sağa Kaydır"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none"
      >
        {recipes.map(recipe => (
          <div key={recipe.id} className="w-[230px] sm:w-[260px] flex-shrink-0 snap-start">
            <ShowcaseRecipeCard
              recipe={recipe}
              pantryItems={pantryItems}
              isFavorite={favorites.includes(recipe.id)}
              onToggleFavorite={onToggleFavorite}
              onSelectRecipe={onSelectRecipe}
            />
          </div>
        ))}
      </div>

    </div>
  );
};

/* Compact & Elegant Card for Horizontal Rails and Grid */
interface ShowcaseRecipeCardProps {
  recipe: Recipe;
  pantryItems: string[];
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

const ShowcaseRecipeCard: React.FC<ShowcaseRecipeCardProps> = ({
  recipe,
  pantryItems,
  isFavorite,
  onToggleFavorite,
  onSelectRecipe
}) => {
  const match = useMemo(() => evaluateRecipeMatch(recipe, pantryItems), [recipe, pantryItems]);

  return (
    <div
      onClick={() => onSelectRecipe(recipe)}
      className="group h-full bg-white dark:bg-slate-900 rounded-2xl border border-stone-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden relative select-none"
    >
      {/* Recipe Image with Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-slate-800">
        <img
          src={recipe.image || recipe.imageUrl}
          alt={recipe.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Top Badges: Category & Favorite */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/20">
            {recipe.category === 'drink' ? '🥤 İçecek' :
             recipe.category === 'dessert' ? '🍰 Tatlı' :
             recipe.category === 'breakfast' ? '🍳 Kahvaltı' :
             recipe.category === 'pastry' ? '🥐 Börek' :
             recipe.category === 'soup' ? '🍲 Çorba' :
             recipe.category === 'meze' ? '🧆 Meze' :
             recipe.category === 'world' ? '🌮 Dünya' : '🥩 Ana Yemek'}
          </span>

          <button
            onClick={(e) => onToggleFavorite(e, recipe.id)}
            className="w-7 h-7 rounded-xl bg-black/50 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-90"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
          </button>
        </div>

        {/* Bottom Image Info: Time & Calories */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white font-bold">
          <span className="flex items-center gap-1 drop-shadow">
            <Clock className="w-3 h-3 text-orange-400" />
            {recipe.cookingTime || `${recipe.timeMinutes || 25} dk`}
          </span>
          <span className="flex items-center gap-1 drop-shadow">
            <Flame className="w-3 h-3 text-amber-400" />
            {recipe.calories} kcal
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white line-clamp-1 group-hover:text-orange-500 transition-colors">
              {recipe.title}
            </h4>
            <div className="flex items-center gap-0.5 text-[10px] font-black text-amber-500 flex-shrink-0">
              <Star className="w-3 h-3 fill-amber-500" />
              <span>{recipe.rating || 4.8}</span>
            </div>
          </div>

          <p className="text-[11px] text-stone-500 dark:text-slate-400 line-clamp-1 mb-2.5">
            {recipe.ingredients.slice(0, 3).map(i => i.name).join(', ')}...
          </p>
        </div>

        {/* Pantry Match Indicator */}
        <div className="pt-2 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
          {match.tier === 'can_make_now' ? (
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Hemen Pişirebilirsin
            </span>
          ) : match.tier === 'almost_there' ? (
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {match.missingCount} malzeme eksik
            </span>
          ) : (
            <span className="text-stone-400 dark:text-slate-500">
              {recipe.ingredients.length} malzeme
            </span>
          )}

          <span className="text-orange-500 font-bold group-hover:translate-x-0.5 transition-transform">
            İncele →
          </span>
        </div>
      </div>
    </div>
  );
};
