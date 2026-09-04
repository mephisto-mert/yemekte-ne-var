export type IngredientCategory = 
  | 'produce'       // Sebze & Meyve
  | 'meat'          // Et, Tavuk, Balık
  | 'dairy'         // Süt, Peynir, Yoğurt, Yumurta
  | 'pantry_staple' // Temel gıdalar (Tuz, Yağ, Su, Karabiber vb.)
  | 'grain'         // Bakliyat, Makarna, Pirinç, Un
  | 'spice'         // Baharatlar & Soslar
  | 'other';

export interface Ingredient {
  id: string;
  name: string;
  aliases: string[];
  category: IngredientCategory;
  icon?: string;
  commonUnit: string;
  isStaple?: boolean; // Temel mutfak malzemesi mi (tuz, yağ, un, su vb.)
}

export interface RecipeIngredient {
  ingredientId?: string;
  name: string;
  amount: string;
  unit?: string;
  isOptional?: boolean;
  isStaple?: boolean;
}

export type RecipeDifficulty = 'Kolay' | 'Orta' | 'Zor';

export interface RecipeMacros {
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  imageUrl?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  cookingTime: string;
  timeMinutes: number;
  preparationTime?: string;
  difficulty: RecipeDifficulty;
  servings: number;
  category: string;
  tags: string[];
  cuisine?: string;
  calories: number;
  macros?: RecipeMacros;
  videoId?: string;
  videoTitle?: string;
  videoAuthor?: string;
  videoLanguage?: 'tr' | 'global';
  rating?: number;
  reviewCount?: number;
  chef?: string;
  isCustom?: boolean;
  createdAt?: string;
  tips?: string[];
}

export interface PantryItem {
  id: string;
  name: string;
  ingredientId?: string;
  quantity?: string;
  unit?: string;
  addedDate: string;
  expiryDate?: string;
  daysLeft?: number;
  isUrgent?: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  checked: boolean;
  fromRecipeTitles?: string[];
  addedAt: string;
}

export type DayOfWeek = 'Pazartesi' | 'Salı' | 'Çarşamba' | 'Perşembe' | 'Cuma' | 'Cumartesi' | 'Pazar';

export interface DailyMealPlan {
  day: DayOfWeek;
  lunchRecipeId?: string;
  dinnerRecipeId?: string;
}

export interface CookedHistoryEntry {
  id: string;
  recipeId: string;
  recipeTitle: string;
  cookedAt: string;
  rating: number;
  notes?: string;
}

export type MatchTier = 'can_make_now' | 'almost_there' | 'need_more';

export interface MatchResult {
  recipe: Recipe;
  matchPercentage: number;
  matchedIngredients: string[];
  missingIngredients: RecipeIngredient[];
  missingStaples: RecipeIngredient[];
  tier: MatchTier;
  missingCount: number;
}

export interface ChefBadge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requiredValue: number;
  category: 'cooking' | 'streak' | 'explore';
  unlockedAt?: string;
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  dietaryPreference: string;
  allergens: string[];
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  createdAt?: string;
}
