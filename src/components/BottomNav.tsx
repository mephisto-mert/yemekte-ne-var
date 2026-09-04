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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      
      <button
        onClick={() => setActiveTab('explore')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-bold transition-all ${
          activeTab === 'explore' ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <UtensilsCrossed className="w-5 h-5" />
        <span>Keşfet</span>
      </button>

      <button
        onClick={onOpenRoulette}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-all"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30 -mt-3">
          <Dices className="w-5 h-5" />
        </div>
        <span>Rulet</span>
      </button>

      <button
        onClick={() => setActiveTab('planner')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-bold transition-all ${
          activeTab === 'planner' ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <CalendarDays className="w-5 h-5" />
        <span>Plan</span>
      </button>

      <button
        onClick={() => setActiveTab('shopping')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-bold transition-all relative ${
          activeTab === 'shopping' ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {shoppingCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] font-black bg-orange-500 text-white leading-tight">
              {shoppingCount}
            </span>
          )}
        </div>
        <span>Liste</span>
      </button>

      <button
        onClick={() => setActiveTab('favorites')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[11px] font-bold transition-all relative ${
          activeTab === 'favorites' ? 'text-orange-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Heart className="w-5 h-5" />
          {favoritesCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] font-black bg-rose-500 text-white leading-tight">
              {favoritesCount}
            </span>
          )}
        </div>
        <span>Defter</span>
      </button>

    </div>
  );
};
