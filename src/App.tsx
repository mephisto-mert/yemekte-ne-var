import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { KitchenPantrySection } from './components/KitchenPantrySection';
import { MealResultsSection } from './components/MealResultsSection';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { CookingModeModal } from './components/CookingModeModal';
import { MealRouletteModal } from './components/MealRouletteModal';
import { ShoppingListModal } from './components/ShoppingListModal';
import { WeeklyPlannerModal } from './components/WeeklyPlannerModal';
import { AddRecipeModal } from './components/AddRecipeModal';
import { UserHistoryModal } from './components/UserHistoryModal';
import { RecipeSwiperModal } from './components/RecipeSwiperModal';
import { MultiTimerDock, ActiveTimer } from './components/MultiTimerDock';

import { Recipe, PantryItem, ShoppingItem, DailyMealPlan, CookedHistoryEntry, RecipeIngredient } from './types';
import { RECIPES_DATABASE } from './data/recipesData';
import { matchRecipesAgainstPantry, evaluateRecipeMatch } from './services/matchingService';
import { StorageService } from './services/storageService';
import { ShoppingService } from './services/shoppingService';
import { Heart, PlusCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export function App() {
  // State
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const custom = StorageService.getCustomRecipes();
    return [...custom, ...RECIPES_DATABASE];
  });

  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => StorageService.getPantry());
  const [favorites, setFavorites] = useState<string[]>(() => StorageService.getFavorites());
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => StorageService.getShoppingList());
  const [mealPlan, setMealPlan] = useState<DailyMealPlan[]>(() => StorageService.getMealPlan());
  const [cookedHistory, setCookedHistory] = useState<CookedHistoryEntry[]>(() => StorageService.getCookedHistory());
  const [streak, setStreak] = useState<number>(() => StorageService.getStreak());
  const [xp, setXp] = useState<number>(() => StorageService.getXP());

  // Background active timers for floating MultiTimerDock
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);

  // Timer countdown interval effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev =>
        prev.map(timer => {
          if (!timer.isRunning || timer.remainingSeconds <= 0) return timer;
          return { ...timer, remainingSeconds: timer.remainingSeconds - 1 };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // UI state
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [isDark, setIsDark] = useState<boolean>(() => StorageService.getTheme());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [floatingXp, setFloatingXp] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });

  // Modals
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [isSwiperOpen, setIsSwiperOpen] = useState(false);
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);

  // Sync and persist Dark mode
  useEffect(() => {
    StorageService.saveTheme(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Extract pantry ingredient names
  const pantryNames = useMemo(() => pantryItems.map(p => p.name), [pantryItems]);

  // Evaluate matching across 3 tiers
  const { canMakeNow, almostThere, needMore } = useMemo(() => {
    return matchRecipesAgainstPantry(recipes, pantryNames);
  }, [recipes, pantryNames]);

  // Urgent expiry count
  const urgentCount = useMemo(() => {
    return pantryItems.filter(p => p.isUrgent).length;
  }, [pantryItems]);

  // Pantry handlers
  const handleAddIngredient = (name: string, daysLeft: number = 7) => {
    if (!name.trim()) return;
    const exists = pantryItems.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      showToast(`"${name}" zaten mutfağında ekli! 👍`);
      return;
    }

    const newItem: PantryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      addedDate: new Date().toISOString(),
      daysLeft,
      isUrgent: daysLeft <= 2
    };

    const updated = [newItem, ...pantryItems];
    setPantryItems(updated);
    StorageService.savePantry(updated);
    showToast(`"${name}" mutfağına eklendi! ✨`);
  };

  const handleRemoveIngredient = (id: string) => {
    const updated = pantryItems.filter(p => p.id !== id);
    setPantryItems(updated);
    StorageService.savePantry(updated);
  };

  const handleClearPantry = () => {
    setPantryItems([]);
    StorageService.savePantry([]);
    showToast('Kiler temizlendi.');
  };

  // Favorites handler
  const handleToggleFavorite = (e: React.MouseEvent | string, idArg?: string) => {
    const id = typeof e === 'string' ? e : idArg!;
    if (typeof e !== 'string') e.stopPropagation();

    const updated = StorageService.toggleFavorite(id);
    setFavorites(updated);
    const isNowFav = updated.includes(id);
    showToast(isNowFav ? '❤️ Tarif defterine eklendi!' : '💔 Defterden çıkarıldı.');
  };

  // Shopping handlers
  const handleAddMissingToShopping = (missing: RecipeIngredient[], recipeTitle: string) => {
    const updated = ShoppingService.addMissingFromRecipe(shoppingList, missing, recipeTitle);
    setShoppingList(updated);
    StorageService.saveShoppingList(updated);
    showToast(`${missing.length} eksik malzeme alışveriş listesine eklendi! 🛒`);
  };

  const handleToggleShoppingItem = (id: string) => {
    const updated = shoppingList.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    setShoppingList(updated);
    StorageService.saveShoppingList(updated);
  };

  const handleRemoveShoppingItem = (id: string) => {
    const updated = shoppingList.filter(item => item.id !== id);
    setShoppingList(updated);
    StorageService.saveShoppingList(updated);
  };

  const handleAddCustomShoppingItem = (name: string, amount: string) => {
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name,
      amount,
      checked: false,
      addedAt: new Date().toISOString()
    };
    const updated = [newItem, ...shoppingList];
    setShoppingList(updated);
    StorageService.saveShoppingList(updated);
    showToast(`"${name}" listeye eklendi!`);
  };

  const handleClearCheckedShopping = () => {
    const updated = shoppingList.filter(i => !i.checked);
    setShoppingList(updated);
    StorageService.saveShoppingList(updated);
    showToast('Alınan malzemeler temizlendi.');
  };

  const handleClearAllShopping = () => {
    setShoppingList([]);
    StorageService.saveShoppingList([]);
    showToast('Alışveriş listesi temizlendi.');
  };

  // Cooked history handler
  const handleMarkAsCooked = (recipe: Recipe) => {
    const updatedHistory = StorageService.addCookedRecipe(recipe.id, recipe.title);
    setCookedHistory(updatedHistory);
    const newStreak = StorageService.getStreak();
    const newXp = StorageService.getXP();
    setStreak(newStreak);
    setXp(newXp);
    setFloatingXp({ visible: true, text: `+50 XP • "${recipe.title}" 🏆` });
    setTimeout(() => setFloatingXp({ visible: false, text: '' }), 2200);
    showToast(`Tebrikler! "${recipe.title}" pişirildi (+50 XP) 🏆`);
  };

  // Custom recipe save - 100% free and unlimited locally
  const handleSaveCustomRecipe = (recipe: Recipe) => {
    const updated = StorageService.saveCustomRecipe(recipe);
    setRecipes([...updated, ...RECIPES_DATABASE]);
    showToast(`"${recipe.title}" özel tariflerin arasına kaydedildi! 👨‍🍳`);
  };

  const handleOpenAddRecipe = () => {
    setIsAddRecipeOpen(true);
  };

  // Favorite recipes list
  const favoriteRecipes = useMemo(() => {
    return recipes.filter(r => favorites.includes(r.id));
  }, [recipes, favorites]);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] dark:bg-slate-950 text-stone-900 dark:text-slate-100 transition-colors">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-[100] bg-white dark:bg-slate-900 border border-orange-500/50 text-stone-900 dark:text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shoppingCount={shoppingList.filter(i => !i.checked).length}
        favoritesCount={favorites.length}
        streak={streak}
        isDark={isDark}
        setIsDark={setIsDark}
        onOpenAddRecipe={handleOpenAddRecipe}
        onOpenRoulette={() => setIsRouletteOpen(true)}
        onOpenSwiper={() => setIsSwiperOpen(true)}
      />

      {/* Floating XP Reward Popup */}
      {floatingXp.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-float-xp flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-sm shadow-2xl shadow-emerald-500/40 border border-emerald-300/80">
          <Sparkles className="w-5 h-5 text-slate-950" />
          <span>{floatingXp.text}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full pb-24 lg:pb-12">
        
        <div key={activeTab} className="animate-tab-enter">
          {activeTab === 'explore' && (
            <>
              {/* Kitchen Pantry Section */}
              <KitchenPantrySection
                pantryItems={pantryItems}
                onAddIngredient={handleAddIngredient}
                onRemoveIngredient={handleRemoveIngredient}
                onClearPantry={handleClearPantry}
                onOpenRoulette={() => setIsRouletteOpen(true)}
                urgentCount={urgentCount}
              />

              {/* Meals Results Section (3 Tiers) */}
              <MealResultsSection
                canMakeNow={canMakeNow}
                almostThere={almostThere}
                needMore={needMore}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onSelectRecipe={(r) => setDetailRecipe(r)}
                onStartCooking={(_, r) => setCookingRecipe(r)}
                onOpenRoulette={() => setIsRouletteOpen(true)}
                hasPantryItems={pantryItems.length > 0}
              />
            </>
          )}

          {/* Tab: Favorites & Defterim */}
          {activeTab === 'favorites' && (
            <section className="animate-tab-enter">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white font-heading flex items-center gap-2">
                    <Heart className="w-6 h-6 text-rose-500 fill-current" />
                    <span>Tarif Defterim & Favoriler</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1">
                    Kaydettiğin lezzetler ve kendi eklediğin özel yemekler
                  </p>
                </div>

                <button
                  onClick={() => setIsAddRecipeOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 magnetic-spring"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Özel Tarif Ekle</span>
                </button>
              </div>

              {favoriteRecipes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {favoriteRecipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      match={evaluateRecipeMatch(recipe, pantryNames)}
                      isFavorite={true}
                      onToggleFavorite={handleToggleFavorite}
                      onSelectRecipe={(r) => setDetailRecipe(r)}
                      onStartCooking={(_, r) => setCookingRecipe(r)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-stone-200 dark:border-slate-800 shadow-sm">
                  <Heart className="w-12 h-12 text-stone-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-stone-900 dark:text-white mb-1">Henüz favori tarifin yok</h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mb-4">
                    Tarif kartlarındaki kalp simgesine basarak en sevdiğin yemekleri buraya toplayabilirsin.
                  </p>
                  <button
                    onClick={() => setActiveTab('explore')}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-xs font-bold active:scale-95 magnetic-spring"
                  >
                    Tarifleri Keşfet
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Tab: Planner */}
          {activeTab === 'planner' && (
            <WeeklyPlannerModal
              isOpen={true}
              onClose={() => setActiveTab('explore')}
              plan={mealPlan}
              recipes={recipes}
              pantryItems={pantryNames}
              onUpdatePlan={(p) => {
                setMealPlan(p);
                StorageService.saveMealPlan(p);
                showToast('Haftalık plan güncellendi! 📅');
              }}
              onSelectRecipe={(r) => setDetailRecipe(r)}
            />
          )}

          {/* Tab: Shopping */}
          {activeTab === 'shopping' && (
            <ShoppingListModal
              isOpen={true}
              onClose={() => setActiveTab('explore')}
              items={shoppingList}
              onToggleItem={handleToggleShoppingItem}
              onRemoveItem={handleRemoveShoppingItem}
              onAddItem={handleAddCustomShoppingItem}
              onClearChecked={handleClearCheckedShopping}
              onClearAll={handleClearAllShopping}
            />
          )}

          {/* Tab: History */}
          {activeTab === 'history' && (
            <UserHistoryModal
              isOpen={true}
              onClose={() => setActiveTab('explore')}
              cookedHistory={cookedHistory}
              streak={streak}
              xp={xp}
            />
          )}
        </div>

      </main>

      {/* Feature 2: Tinder-style Recipe Swiper Modal */}
      <RecipeSwiperModal
        isOpen={isSwiperOpen}
        onClose={() => setIsSwiperOpen(false)}
        recipes={recipes}
        onSelectRecipe={(r) => {
          setIsSwiperOpen(false);
          setDetailRecipe(r);
        }}
        onToggleFavorite={(id) => handleToggleFavorite(id)}
        favorites={favorites}
      />

      {/* Modals */}
      <MealRouletteModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        recipes={recipes}
        pantryItems={pantryNames}
        favorites={favorites}
        onStartCooking={(r) => {
          setIsRouletteOpen(false);
          setCookingRecipe(r);
        }}
      />

      {detailRecipe && (
        <RecipeDetailModal
          recipe={detailRecipe}
          onClose={() => setDetailRecipe(null)}
          match={evaluateRecipeMatch(detailRecipe, pantryNames)}
          isFavorite={favorites.includes(detailRecipe.id)}
          onToggleFavorite={(id) => handleToggleFavorite(id)}
          onStartCooking={(r) => {
            setDetailRecipe(null);
            setCookingRecipe(r);
          }}
          onAddMissingToShopping={handleAddMissingToShopping}
          onMarkAsCooked={handleMarkAsCooked}
        />
      )}

      {cookingRecipe && (
        <CookingModeModal
          recipe={cookingRecipe}
          isOpen={true}
          onClose={() => setCookingRecipe(null)}
          onMarkAsCooked={handleMarkAsCooked}
        />
      )}

      <AddRecipeModal
        isOpen={isAddRecipeOpen}
        onClose={() => setIsAddRecipeOpen(false)}
        onSaveRecipe={handleSaveCustomRecipe}
      />

      {/* Feature 6: Floating Multi-Timer Dock */}
      <MultiTimerDock
        timers={activeTimers}
        onToggleTimer={(id) => {
          setActiveTimers(prev =>
            prev.map(t => t.id === id ? { ...t, isRunning: !t.isRunning } : t)
          );
        }}
        onDismissTimer={(id) => {
          setActiveTimers(prev => prev.filter(t => t.id !== id));
        }}
        onOpenCookingMode={(recipeTitle) => {
          const match = recipes.find(r => r.title === recipeTitle);
          if (match) setCookingRecipe(match);
        }}
      />

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shoppingCount={shoppingList.filter(i => !i.checked).length}
        favoritesCount={favorites.length}
        onOpenRoulette={() => setIsRouletteOpen(true)}
      />

    </div>
  );
}
