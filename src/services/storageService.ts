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
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  savePantry(items: PantryItem[]): void {
    localStorage.setItem(KEYS.PANTRY, JSON.stringify(items));
  },

  // FAVORITES
  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(KEYS.FAVORITES);
      return data ? JSON.parse(data) : ['1', '5']; // Default Tavuk Sote & Menemen
    } catch {
      return [];
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
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
    return updated;
  },

  // SHOPPING LIST
  getShoppingList(): ShoppingItem[] {
    try {
      const data = localStorage.getItem(KEYS.SHOPPING);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveShoppingList(items: ShoppingItem[]): void {
    localStorage.setItem(KEYS.SHOPPING, JSON.stringify(items));
  },

  // WEEKLY MEAL PLAN
  getMealPlan(): DailyMealPlan[] {
    try {
      const data = localStorage.getItem(KEYS.MEAL_PLAN);
      if (data) return JSON.parse(data);
    } catch {}
    
    // Default 7 days
    const days: ('Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar')[] = [
      'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'
    ];
    return days.map(day => ({ day }));
  },

  saveMealPlan(plan: DailyMealPlan[]): void {
    localStorage.setItem(KEYS.MEAL_PLAN, JSON.stringify(plan));
  },

  // COOKED HISTORY
  getCookedHistory(): CookedHistoryEntry[] {
    try {
      const data = localStorage.getItem(KEYS.COOKED_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addCookedRecipe(recipeId: string, recipeTitle: string, rating: number = 5, notes?: string): CookedHistoryEntry[] {
    const history = this.getCookedHistory();
    const entry: CookedHistoryEntry = {
      id: Date.now().toString(),
      recipeId,
      recipeTitle,
      cookedAt: new Date().toISOString(),
      rating,
      notes
    };
    const updated = [entry, ...history];
    localStorage.setItem(KEYS.COOKED_HISTORY, JSON.stringify(updated));

    // Update streak and XP
    this.incrementXP(50);
    this.updateStreak();

    return updated;
  },

  // CUSTOM RECIPES
  getCustomRecipes(): Recipe[] {
    try {
      const data = localStorage.getItem(KEYS.CUSTOM_RECIPES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCustomRecipe(recipe: Recipe): Recipe[] {
    const current = this.getCustomRecipes();
    const updated = [recipe, ...current.filter(r => r.id !== recipe.id)];
    localStorage.setItem(KEYS.CUSTOM_RECIPES, JSON.stringify(updated));
    return updated;
  },

  // GAMIFICATION (XP & Streak)
  getXP(): number {
    return parseInt(localStorage.getItem(KEYS.CHEF_XP) || '150', 10);
  },

  incrementXP(amount: number): number {
    const current = this.getXP() + amount;
    localStorage.setItem(KEYS.CHEF_XP, current.toString());
    return current;
  },

  getStreak(): number {
    return parseInt(localStorage.getItem(KEYS.CHEF_STREAK) || '2', 10);
  },

  updateStreak(): number {
    const lastCook = localStorage.getItem(KEYS.LAST_COOK_DATE);
    const today = new Date().toDateString();
    let streak = this.getStreak();

    if (lastCook) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastCook === yesterday) {
        streak += 1;
      } else if (lastCook !== today) {
        streak = 1;
      }
    } else {
      streak = 1;
    }

    localStorage.setItem(KEYS.CHEF_STREAK, streak.toString());
    localStorage.setItem(KEYS.LAST_COOK_DATE, today);
    return streak;
  }
};
