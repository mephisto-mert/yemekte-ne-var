import { PantryItem, ShoppingItem, DailyMealPlan, CookedHistoryEntry, Recipe, ChefBadge } from '../types';

const KEYS = {
  PANTRY: 'pantry_items_v2',
  FAVORITES: 'favorite_recipes_v2',
  SHOPPING: 'shopping_list_v2',
  MEAL_PLAN: 'weekly_meal_plan_v2',
  COOKED_HISTORY: 'cooked_history_v2',
  CUSTOM_RECIPES: 'custom_recipes_v2',
  THEME: 'theme_mode_v2',
  CHEF_XP: 'chef_xp_v2',
  CHEF_STREAK: 'chef_streak_v2',
  LAST_COOK_DATE: 'last_cook_date_v2',
};

export const StorageService = {
  // PANTRY
  getPantry(): PantryItem[] {
    try {
      const data = localStorage.getItem(KEYS.PANTRY);
      if (!data) {
        // Initial seed with common kitchen ingredients
        const initial: PantryItem[] = [
          { id: '1', name: 'Tavuk', addedDate: new Date().toISOString(), daysLeft: 3, isUrgent: false },
          { id: '2', name: 'Patates', addedDate: new Date().toISOString(), daysLeft: 12, isUrgent: false },
          { id: '3', name: 'Soğan', addedDate: new Date().toISOString(), daysLeft: 10, isUrgent: false },
          { id: '4', name: 'Domates', addedDate: new Date().toISOString(), daysLeft: 2, isUrgent: true },
        ];
        this.savePantry(initial);
        return initial;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item => item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string' && item.name.trim().length > 0);
    } catch {
      return [];
    }
  },

  savePantry(items: PantryItem[]): void {
    try {
      localStorage.setItem(KEYS.PANTRY, JSON.stringify(items));
    } catch {}
  },

  // FAVORITES
  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(KEYS.FAVORITES);
      if (!data) return ['1', '5']; // Default Tavuk Sote & Menemen
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : ['1', '5'];
    } catch {
      return ['1', '5'];
    }
  },

  toggleFavorite(recipeId: string): string[] {
    const favs = this.getFavorites();
    const index = favs.indexOf(recipeId);
    let updated: string[];
    if (index > -1) {
      updated = favs.filter(id => id !== recipeId);
    } else {
      updated = [...favs, recipeId];
    }
    try {
      localStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  // SHOPPING LIST
  getShoppingList(): ShoppingItem[] {
    try {
      const data = localStorage.getItem(KEYS.SHOPPING);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.filter(i => i && typeof i.id === 'string' && typeof i.name === 'string') : [];
    } catch {
      return [];
    }
  },

  saveShoppingList(items: ShoppingItem[]): void {
    try {
      localStorage.setItem(KEYS.SHOPPING, JSON.stringify(items));
    } catch {}
  },

  // WEEKLY MEAL PLAN
  getMealPlan(): DailyMealPlan[] {
    const days: ('Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar')[] = [
      'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'
    ];
    try {
      const data = localStorage.getItem(KEYS.MEAL_PLAN);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return days.map(day => ({ day }));
  },

  saveMealPlan(plan: DailyMealPlan[]): void {
    try {
      localStorage.setItem(KEYS.MEAL_PLAN, JSON.stringify(plan));
    } catch {}
  },

  // COOKED HISTORY
  getCookedHistory(): CookedHistoryEntry[] {
    try {
      const data = localStorage.getItem(KEYS.COOKED_HISTORY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.filter(h => h && typeof h.id === 'string') : [];
    } catch {
      return [];
    }
  },

  addCookedRecipe(recipeId: string, recipeTitle: string, rating: number = 5, notes?: string): CookedHistoryEntry[] {
    const history = this.getCookedHistory();
    const clampedRating = typeof rating === 'number' && !isNaN(rating)
      ? Math.max(1, Math.min(5, Math.round(rating)))
      : 5;
    const entry: CookedHistoryEntry = {
      id: Date.now().toString(),
      recipeId: typeof recipeId === 'string' ? recipeId : '',
      recipeTitle: (recipeTitle || 'İsimsiz Tarif').trim(),
      cookedAt: new Date().toISOString(),
      rating: clampedRating,
      notes: notes ? notes.trim() : undefined
    };
    const updated = [entry, ...history];
    try {
      localStorage.setItem(KEYS.COOKED_HISTORY, JSON.stringify(updated));
    } catch {}

    // Update streak and XP
    this.incrementXP(50);
    this.updateStreak();

    return updated;
  },

  // CUSTOM RECIPES
  getCustomRecipes(): Recipe[] {
    try {
      const data = localStorage.getItem(KEYS.CUSTOM_RECIPES);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.filter(r => r && typeof r.id === 'string' && typeof r.title === 'string' && r.title.trim().length > 0) : [];
    } catch {
      return [];
    }
  },

  saveCustomRecipe(recipe: Recipe): Recipe[] {
    if (!recipe || typeof recipe.id !== 'string' || !recipe.title?.trim()) {
      return this.getCustomRecipes();
    }
    const current = this.getCustomRecipes();
    const updated = [recipe, ...current.filter(r => r.id !== recipe.id)];
    try {
      localStorage.setItem(KEYS.CUSTOM_RECIPES, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  // GAMIFICATION (XP & Streak)
  getXP(): number {
    try {
      const parsed = parseInt(localStorage.getItem(KEYS.CHEF_XP) || '150', 10);
      return isNaN(parsed) || parsed < 0 ? 150 : parsed;
    } catch {
      return 150;
    }
  },

  incrementXP(amount: number): number {
    const validAmount = typeof amount === 'number' && !isNaN(amount) && amount > 0 ? Math.round(amount) : 0;
    const current = this.getXP() + validAmount;
    try {
      localStorage.setItem(KEYS.CHEF_XP, current.toString());
    } catch {}
    return current;
  },

  getStreak(): number {
    try {
      const val = localStorage.getItem(KEYS.CHEF_STREAK);
      if (val === null) return 2;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 0 ? 0 : parsed;
    } catch {
      return 2;
    }
  },

  updateStreak(): number {
    try {
      const lastCook = localStorage.getItem(KEYS.LAST_COOK_DATE);
      const today = new Date().toDateString();
      let streak = this.getStreak();

      if (lastCook) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastCook === today) {
          // Already cooked today: idempotent, don't increment multiple times on same day
          return streak;
        } else if (lastCook === yesterday) {
          // Cooked yesterday: increment consecutive streak
          streak += 1;
        } else {
          // Missed at least one day: streak resets to 1
          streak = 1;
        }
      } else {
        // First cook ever or no record: set streak to 1
        streak = 1;
      }

      localStorage.setItem(KEYS.CHEF_STREAK, streak.toString());
      localStorage.setItem(KEYS.LAST_COOK_DATE, today);
      return streak;
    } catch {
      return 1;
    }
  },

  // THEME
  getTheme(): boolean {
    try {
      const theme = localStorage.getItem(KEYS.THEME);
      return theme === 'light' ? false : true; // default dark
    } catch {
      return true;
    }
  },

  saveTheme(isDark: boolean): void {
    try {
      localStorage.setItem(KEYS.THEME, isDark ? 'dark' : 'light');
    } catch {}
  }
};
