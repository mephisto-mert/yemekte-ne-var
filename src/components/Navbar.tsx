import React from 'react';
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
  User,
  Crown,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  onOpenRoulette
}) => {
  const { user, profile, isPro, openAuthModal, openProfileModal, openSubscriptionModal } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('explore')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent font-['Space_Grotesk',sans-serif]">
                Cookly
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openSubscriptionModal();
                }}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  isPro
                    ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
                }`}
                title="Abonelik Planları"
              >
                PRO
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none hidden sm:block">
              Mutfak Kurtarıcı
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'explore'
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Ne Pişirebilirim?
          </button>

          <button
            onClick={onOpenRoulette}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all flex items-center gap-1.5 border border-amber-500/30 shadow-sm shadow-amber-500/10"
          >
            <Dices className="w-4 h-4 animate-bounce-short" />
            Meal Roulette
          </button>

          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'planner'
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Haftalık Plan
          </button>

          <button
            onClick={() => setActiveTab('shopping')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 relative ${
              activeTab === 'shopping'
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Alışveriş
            {shoppingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-orange-500 text-white">
                {shoppingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 relative ${
              activeTab === 'favorites'
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Heart className="w-4 h-4" />
            Defterim
            {favoritesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-rose-500 text-white">
                {favoritesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            Şef
            {streak > 0 && (
              <span className="text-xs font-bold text-orange-400">🔥{streak}</span>
            )}
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Pro Upgrade Trigger Pill (visible to non-pro on desktop) */}
          {!isPro && (
            <button
              onClick={openSubscriptionModal}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
            >
              <Crown className="w-3 h-3" />
              <span>Pro'ya Geç</span>
            </button>
          )}

          {/* Add Custom Recipe Button */}
          <button
            onClick={onOpenAddRecipe}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-orange-400" />
            Tarif Ekle
          </button>

          {/* User Account / Auth Trigger */}
          {user ? (
            <button
              onClick={openProfileModal}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all text-xs font-semibold shadow-sm cursor-pointer"
              title="Profil & Ayarlar"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center border border-emerald-500/30">
                {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden md:inline max-w-[80px] truncate">{profile?.displayName || 'Şef'}</span>
              {isPro && <Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('signin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md hover:shadow-emerald-500/20 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Giriş</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isDark ? "Açık Moda Geç" : "Koyu Moda Geç"}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

      </div>
    </header>
  );
};
