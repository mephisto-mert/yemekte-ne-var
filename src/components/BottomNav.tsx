import React from 'react';
import { UtensilsCrossed, Dices, CalendarDays, ShoppingCart, Heart } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  shoppingCount: number;
  favoritesCount: number;
  onOpenRoulette: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  shoppingCount,
  favoritesCount,
  onOpenRoulette
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-stone-200 dark:border-slate-800/80 px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] flex items-center justify-around shadow-2xl transition-colors">
      
      <button
        onClick={() => setActiveTab('explore')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-[11px] font-extrabold transition-all duration-200 magnetic-spring ${
          activeTab === 'explore' 
            ? 'text-orange-600 dark:text-orange-400 bg-orange-500/15 shadow-sm shadow-orange-500/10' 
            : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
        }`}
      >
        <UtensilsCrossed className="w-5 h-5 transition-transform" />
        <span>Keşfet</span>
      </button>

      <button
        onClick={onOpenRoulette}
        className="flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-black text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-all duration-200 magnetic-spring group"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/30 -mt-5 group-hover:scale-110 transition-transform">
          <Dices className="w-5 h-5 text-slate-950" />
        </div>
        <span>Rulet</span>
      </button>

      <button
        onClick={() => setActiveTab('planner')}
        className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[11px] font-extrabold transition-all duration-200 magnetic-spring ${
          activeTab === 'planner' 
            ? 'text-orange-600 dark:text-orange-400 bg-orange-500/15 shadow-sm shadow-orange-500/10' 
            : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
        }`}
      >
        <CalendarDays className="w-5 h-5 transition-transform" />
        <span>Plan</span>
      </button>

      <button
        onClick={() => setActiveTab('shopping')}
        className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[11px] font-extrabold transition-all duration-200 relative magnetic-spring ${
          activeTab === 'shopping' 
            ? 'text-orange-600 dark:text-orange-400 bg-orange-500/15 shadow-sm shadow-orange-500/10' 
            : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5 transition-transform" />
          {shoppingCount > 0 && (
            <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-orange-500 text-slate-950 shadow-sm leading-tight animate-bounce-short">
              {shoppingCount}
            </span>
          )}
        </div>
        <span>Liste</span>
      </button>

      <button
        onClick={() => setActiveTab('favorites')}
        className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl text-[11px] font-extrabold transition-all duration-200 relative magnetic-spring ${
          activeTab === 'favorites' 
            ? 'text-orange-600 dark:text-orange-400 bg-orange-500/15 shadow-sm shadow-orange-500/10' 
            : 'text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Heart className="w-5 h-5 transition-transform" />
          {favoritesCount > 0 && (
            <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white shadow-sm leading-tight animate-bounce-short">
              {favoritesCount}
            </span>
          )}
        </div>
        <span>Defter</span>
      </button>

    </div>
  );
};
