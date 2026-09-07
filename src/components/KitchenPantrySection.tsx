import React, { useState, useMemo } from 'react';
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

// Pre-compiled static regex constants for 0-allocation performance
const MEAT_REGEX = /(tavuk|et|kiyma|balik|kuzu|dana|sucuk|sosis|biftek|kavurma|pastirma|somon|levrek|hamsi)/i;
const DAIRY_REGEX = /(sut|peynir|kasar|lor|yogurt|yumurta|kaymak|tereyagi|krema)/i;
const PRODUCE_REGEX = /(domates|biber|sogan|patates|patlican|kabak|havuc|sarimsak|maydanoz|dereotu|ispanak|marul|limon|salatalik|mantar|pirasa)/i;

const getIngredientCategoryStyle = (name: string, isUrgent?: boolean, daysLeft?: number) => {
  const lower = name.toLowerCase();
  
  if (isUrgent || (daysLeft !== undefined && daysLeft <= 2)) {
    return {
      badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-200 border-rose-500/50 shadow-sm shadow-rose-500/20 animate-pulse-urgent',
      dot: 'bg-rose-400',
      icon: '🥩',
      label: 'Acil Tüket!'
    };
  }

  // Meat / Poultry / Fish
  if (MEAT_REGEX.test(lower)) {
    return {
      badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:border-rose-500/60',
      dot: 'bg-rose-400',
      icon: '🥩',
      label: 'Et & Protein'
    };
  }

  // Dairy & Egg
  if (DAIRY_REGEX.test(lower)) {
    return {
      badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:border-sky-500/60',
      dot: 'bg-sky-400',
      icon: '🧀',
      label: 'Süt & Şarküteri'
    };
  }

  // Vegetables / Produce / Fresh Greens
  if (PRODUCE_REGEX.test(lower)) {
    return {
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:border-emerald-500/60',
      dot: 'bg-emerald-400',
      icon: '🥦',
      label: 'Sebze & Yeşillik'
    };
  }

  // Spices / Grains / Staples
  return {
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:border-amber-500/60',
    dot: 'bg-amber-400',
    icon: '🌾',
    label: 'Kiler & Bakliyat'
  };
};

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
  const [pantryView, setPantryView] = useState<'chips' | 'shelves'>('chips');
  const [isPantryCollapsed, setIsPantryCollapsed] = useState(false);

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

  // Dynamic Day/Night Culinary Ambience & Greetings
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      return {
        greeting: 'Günaydın ☀️',
        sub: 'Güne enerjik bir kahvaltı veya pratik bir brunch ile başla.',
        tag: 'Kahvaltı & Güne Başlangıç',
        glow: 'from-amber-500/20 via-orange-500/10 to-transparent'
      };
    }
    if (hour >= 11 && hour < 17) {
      return {
        greeting: 'Tünaydın 🌤️',
        sub: 'Günün en verimli saatleri için besleyici ve hafif öğle yemekleri.',
        tag: 'Öğle Molası & Fit Lezzetler',
        glow: 'from-orange-500/20 via-amber-500/10 to-transparent'
      };
    }
    if (hour >= 17 && hour < 23) {
      return {
        greeting: 'İyi Akşamlar 🌙',
        sub: 'Günün yorgunluğunu unutturacak sıcacık bir akşam ziyafeti hazırla.',
        tag: 'Akşam Ziyafeti & Ana Yemekler',
        glow: 'from-rose-500/15 via-orange-500/10 to-transparent'
      };
    }
    return {
      greeting: 'Gece Molası 🌌',
      sub: 'Gece acıkmalarına özel pratik ve 15 dakikada hazır atıştırmalıklar.',
      tag: 'Hızlı Gece Atıştırmalığı',
      glow: 'from-indigo-500/15 via-amber-500/10 to-transparent'
    };
  };

  const ambience = getTimeGreeting();

  // Group items for Fridge Shelves with memoization & static regexes
  const shelfCategories = useMemo(() => ({
    meat: {
      title: '🥩 Üst Raf (Et & Protein)',
      items: pantryItems.filter(p => MEAT_REGEX.test(p.name)),
      emptyNote: 'Et veya tavuk ekleyerek zenginleştirebilirsin'
    },
    dairy: {
      title: '🧀 Orta Raf (Süt & Şarküteri)',
      items: pantryItems.filter(p => DAIRY_REGEX.test(p.name)),
      emptyNote: 'Peynir, yoğurt veya yumurta ekle'
    },
    produce: {
      title: '🥦 Alt Sebzelik (Taze Sebze & Meyve)',
      items: pantryItems.filter(p => PRODUCE_REGEX.test(p.name)),
      emptyNote: 'Sebzelik şu an boş, taze sebze ekle'
    },
    pantry: {
      title: '🌾 Kiler Kapağı (Bakliyat & Baharatlar)',
      items: pantryItems.filter(p => !MEAT_REGEX.test(p.name) && !DAIRY_REGEX.test(p.name) && !PRODUCE_REGEX.test(p.name)),
      emptyNote: 'Un, makarna, pirinç veya baharatlar'
    }
  }), [pantryItems]);

  return (
    <section className="relative overflow-hidden bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-stone-200/90 dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl mb-8 backdrop-blur-md transition-colors">
      {/* Background Decorative Culinary Glow */}
      <div className={`absolute -top-24 -left-24 w-80 h-80 bg-gradient-to-br ${ambience.glow} rounded-full blur-3xl pointer-events-none transition-all duration-1000`} />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        
        {/* Header Title & Subtitle with Time Ambience */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25 mb-2 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{ambience.tag}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white font-heading flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span>{ambience.greeting}</span>
              <span className="text-xl sm:text-2xl font-bold text-stone-600 dark:text-slate-300">Ne Pişirelim? 🥘</span>
            </h1>
            <p className="text-xs sm:text-base text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
              {ambience.sub}
            </p>
          </div>

          {/* Big Quick Roulette CTA — Hidden on small mobile to favor bottom nav */}
          <button
            onClick={onOpenRoulette}
            className="hidden sm:flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap self-start sm:self-auto magnetic-spring"
          >
            <Dices className="w-5 h-5 text-slate-950" />
            <span>YEMEK RULETİ</span>
          </button>
        </div>


        {/* Input Bar */}
        <div className="relative flex items-center gap-2 mb-5">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Malzeme yazın (örn: Tavuk, Patates, Soğan, Yumurta, Kaşar...)"
              className="w-full px-4 py-3.5 pl-11 rounded-2xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700/80 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/25 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-400 text-sm font-medium transition-all shadow-inner outline-none"
            />
            <ChefHat className="w-5 h-5 text-stone-400 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleAddClick}
            disabled={!inputVal.trim()}
            className="px-6 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-black text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/20 active:scale-95 magnetic-spring"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Ekle</span>
          </button>
        </div>

        {/* Popular Quick Chips ("I Have This") */}
        <div className="mb-6">
          <p className="text-xs font-black text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 magnetic-spring ${
                    alreadyAdded
                      ? 'bg-stone-100 dark:bg-slate-800/40 text-stone-400 dark:text-slate-600 border border-stone-200 dark:border-slate-800 cursor-default line-through'
                      : 'bg-stone-100 hover:bg-orange-50 dark:bg-slate-800/80 hover:dark:bg-orange-500/20 text-stone-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-300 border border-stone-200 dark:border-slate-700/60 hover:border-orange-500/40'
                  }`}
                >
                  <span className="text-orange-500 font-extrabold">+</span>
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Kitchen Header with View Toggle (Chips vs Shelves) & Collapsible Switcher */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5 font-heading">
                Mutfağındaki Malzemeler:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                {pantryItems.length} malzeme
              </span>

              {urgentCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/40 animate-pulse-urgent">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  {urgentCount} ürün acil tüketilmeli!
                </span>
              )}

              {/* Collapsible Toggle Button if >= 4 items */}
              {pantryItems.length >= 4 && (
                <button
                  type="button"
                  onClick={() => setIsPantryCollapsed(!isPantryCollapsed)}
                  className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline ml-1"
                >
                  {isPantryCollapsed ? '▼ Genişlet' : '▲ Kompakt Yap'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Layout Mode Switcher */}
              <div className="flex items-center p-1 bg-stone-100 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setPantryView('chips'); setIsPantryCollapsed(false); }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    pantryView === 'chips' ? 'bg-orange-500 text-slate-950 shadow-sm font-black' : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  🏷️ Etiketler
                </button>
                <button
                  type="button"
                  onClick={() => { setPantryView('shelves'); setIsPantryCollapsed(false); }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    pantryView === 'shelves' ? 'bg-orange-500 text-slate-950 shadow-sm font-black' : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  🧊 Buzdolabı Rafları
                </button>
              </div>

              {pantryItems.length > 0 && (
                <button
                  onClick={onClearPantry}
                  className="text-xs font-bold text-stone-500 dark:text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Temizle</span>
                </button>
              )}
            </div>
          </div>

          {pantryItems.length === 0 ? (
            <div className="p-6 rounded-2xl bg-stone-50 dark:bg-slate-800/30 border border-dashed border-stone-200 dark:border-slate-700/60 text-center">
              <p className="text-sm text-stone-500 dark:text-slate-400 font-medium">
                Henüz dolabına malzeme eklemedin. Yukarıdaki hızlı butonları kullanarak veya arama kutusuna yazarak başlayabilirsin! 🍅
              </p>
            </div>
          ) : isPantryCollapsed ? (
            /* Compact Summary Banner when Collapsed */
            <div 
              onClick={() => setIsPantryCollapsed(false)}
              className="p-3.5 rounded-2xl bg-stone-100 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:border-orange-500/40 transition-all text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-extrabold text-stone-800 dark:text-slate-200">Mutfakta {pantryItems.length} malzeme hazır:</span>
                <span className="text-stone-500 dark:text-slate-400 truncate">
                  {pantryItems.slice(0, 6).map(i => i.name).join(', ')}{pantryItems.length > 6 ? ` ve ${pantryItems.length - 6} daha...` : ''}
                </span>
              </div>
              <span className="text-orange-600 dark:text-orange-400 font-extrabold whitespace-nowrap ml-2">Genişlet ▾</span>
            </div>
          ) : pantryView === 'shelves' ? (
            /* Visual Fridge Shelves View */
            <div className="space-y-3 bg-stone-100 dark:bg-slate-950/70 p-4 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-inner">
              {Object.entries(shelfCategories).map(([key, shelf]) => (
                <div key={key} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-800 dark:text-slate-300 font-heading">{shelf.title}</span>
                    <span className="text-[10px] text-stone-500 dark:text-slate-500 font-bold">{shelf.items.length} ürün</span>
                  </div>

                  {shelf.items.length === 0 ? (
                    <p className="text-[11px] text-stone-400 dark:text-slate-500 italic py-1">{shelf.emptyNote}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {shelf.items.map(item => {
                        const style = getIngredientCategoryStyle(item.name, item.isUrgent, item.daysLeft);
                        return (
                          <div
                            key={item.id}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${style.badge}`}
                          >
                            <span>{style.icon}</span>
                            <span className="text-stone-900 dark:text-white">{item.name}</span>
                            <button
                              onClick={() => onRemoveIngredient(item.id)}
                              className="text-stone-400 dark:text-slate-400 hover:text-rose-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Glass shelf shelf edge glow */}
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mt-2.5 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            /* Standard Chips View */
            <div className="flex flex-wrap gap-2.5">
              {pantryItems.map(item => {
                const style = getIngredientCategoryStyle(item.name, item.isUrgent, item.daysLeft);
                const maxDays = 14;
                const days = item.daysLeft !== undefined ? item.daysLeft : 7;
                const freshnessPct = Math.min(100, Math.max(10, Math.round((days / maxDays) * 100)));

                return (
                  <div
                    key={item.id}
                    className={`inline-flex flex-col gap-1 px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all animate-spring-pop ${style.badge}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{style.icon}</span>
                      <span className="font-bold text-stone-900 dark:text-white">{item.name}</span>
                      
                      {item.daysLeft !== undefined && (
                        <span className="text-[10px] opacity-80 font-medium text-stone-600 dark:text-slate-300">
                          ({item.daysLeft} gün)
                        </span>
                      )}

                      <button
                        onClick={() => onRemoveIngredient(item.id)}
                        className="p-0.5 ml-1 rounded-full text-stone-400 dark:text-slate-400 hover:text-rose-500 hover:bg-stone-200 dark:hover:bg-slate-800/80 transition-colors"
                        title="Çıkar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Freshness Progress Bar */}
                    <div className="w-full bg-stone-200 dark:bg-slate-950/60 h-1.5 rounded-full overflow-hidden mt-0.5">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          days <= 2 
                            ? 'bg-rose-500' 
                            : days <= 5 
                              ? 'bg-amber-400' 
                              : 'bg-emerald-400'
                        }`}
                        style={{ width: `${freshnessPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

