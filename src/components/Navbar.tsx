import React, { useState, useRef, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Dices, 
  CalendarDays, 
  ShoppingCart, 
  Heart, 
  Trophy, 
  PlusCircle, 
  Sun, 
  Moon, 
  Compass, 
  ChevronDown 
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  shoppingCount: number;
  favoritesCount: number;
  streak: number;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onOpenAddRecipe: () => void;
  onOpenRoulette: () => void;
  onOpenSwiper?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  shoppingCount,
  favoritesCount,
  streak,
  isDark,
  setIsDark,
  onOpenAddRecipe,
  onOpenRoulette,
  onOpenSwiper
}) => {
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const discoveryRef = useRef<HTMLDivElement>(null);

  // Close discovery menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (discoveryRef.current && !discoveryRef.current.contains(event.target as Node)) {
        setIsDiscoveryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-stone-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 dark:from-orange-400 dark:via-amber-300 dark:to-yellow-200 bg-clip-text text-transparent font-heading">
              Cookly
            </span>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium leading-none hidden sm:block">
              Mutfak Kurtarıcı
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links — Consolidated & Balanced */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 magnetic-spring ${
              activeTab === 'explore'
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-sm'
                : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Ne Pişirebilirim?
          </button>

          {/* Consolidated Discovery Tools Dropdown (Swiper + Roulette) */}
          <div className="relative" ref={discoveryRef}>
            <button
              onClick={() => setIsDiscoveryOpen(!isDiscoveryOpen)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-all flex items-center gap-1.5 border border-amber-500/30 shadow-sm shadow-amber-500/5 magnetic-spring"
            >
              <Compass className="w-4 h-4 text-amber-500" />
              <span>Keşif Araçları</span>
              <ChevronDown className={`w-3.5 h-3.5 text-amber-500 transition-transform ${isDiscoveryOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDiscoveryOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-tab-enter">
                {onOpenSwiper && (
                  <button
                    onClick={() => {
                      setIsDiscoveryOpen(false);
                      onOpenSwiper();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
                  >
                    <span className="text-base">🔥</span>
                    <div>
                      <div className="font-extrabold">Lezzet Kartları</div>
                      <div className="text-[10px] text-stone-500 dark:text-slate-400 font-normal">Kaydırarak yeni lezzetler keşfet</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsDiscoveryOpen(false);
                    onOpenRoulette();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors mt-1"
                >
                  <Dices className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div>
                    <div className="font-extrabold">Yemek Ruleti</div>
                    <div className="text-[10px] text-stone-500 dark:text-slate-400 font-normal">Kararsız anlara özel lezzet çarkı</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 magnetic-spring ${
              activeTab === 'planner'
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-sm'
                : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Haftalık Plan
          </button>

          <button
            onClick={() => setActiveTab('shopping')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 relative magnetic-spring ${
              activeTab === 'shopping'
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-sm'
                : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Alışveriş
            {shoppingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-black bg-orange-500 text-white">
                {shoppingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 relative magnetic-spring ${
              activeTab === 'favorites'
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-sm'
                : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Heart className="w-4 h-4" />
            Defterim
            {favoritesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-black bg-rose-500 text-white">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 magnetic-spring ${
              activeTab === 'history'
                ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 shadow-sm'
                : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            Şef
            {streak > 0 && (
              <span className="text-xs font-bold text-orange-500 dark:text-orange-400">🔥{streak}</span>
            )}
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Add Custom Recipe Button */}
          <button
            onClick={onOpenAddRecipe}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 border border-stone-200 dark:border-slate-700 transition-all shadow-sm magnetic-spring"
          >
            <PlusCircle className="w-3.5 h-3.5 text-orange-500" />
            Tarif Ekle
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors magnetic-spring"
            title={isDark ? "Açık Moda Geç" : "Koyu Moda Geç"}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-stone-600" />}
          </button>
        </div>

      </div>
    </header>
  );
};
