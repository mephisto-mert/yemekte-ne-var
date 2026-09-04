import { Recipe, MatchResult } from '../types';
import { evaluateRecipeMatch } from './matchingService';

export type RouletteMood = 
  | 'anything' 
  | 'under_25' 
  | 'healthy' 
  | 'high_protein' 
  | 'comfort' 
  | 'vegetarian' 
  | 'easy';

export interface RouletteOption {
  recipe: Recipe;
  match: MatchResult;
  weight: number;
}

/**
 * Filters and weights recipes for the Meal Roulette spin.
 */
export function prepareRouletteCandidates(
  recipes: Recipe[],
  pantryItems: string[],
  favorites: string[],
  mood: RouletteMood = 'anything'
): RouletteOption[] {
  return recipes
    .filter(recipe => {
      if (mood === 'under_25' && recipe.timeMinutes > 25) return false;
      if (mood === 'easy' && recipe.difficulty !== 'Kolay') return false;
      if (mood === 'vegetarian' && recipe.category !== 'vegetarian' && recipe.category !== 'salad' && recipe.category !== 'olive_oil') {
        const hasMeat = recipe.ingredients.some(i => ['tavuk', 'et', 'kıyma', 'balık', 'sucuk'].some(m => i.name.toLowerCase().includes(m)));
        if (hasMeat) return false;
      }
      if (mood === 'healthy' && recipe.calories > 450) return false;
      if (mood === 'high_protein' && (!recipe.macros || recipe.macros.protein < 20)) {
        const hasProtein = recipe.ingredients.some(i => ['tavuk', 'et', 'kıyma', 'yumurta', 'mercimek', 'nohut'].some(p => i.name.toLowerCase().includes(p)));
        if (!hasProtein) return false;
      }
      return true;
    })
    .map(recipe => {
      const match = evaluateRecipeMatch(recipe, pantryItems);
      
      // Base weight
      let weight = 10;

      // Heavy bonus for match tier
      if (match.tier === 'can_make_now') {
        weight += 80; // High probability for ready-to-cook meals
      } else if (match.tier === 'almost_there') {
        weight += 40; // Good probability for nearly complete meals
      }

      // Bonus based on matched ingredient percentage
      weight += Math.round(match.matchPercentage * 0.5);

      // Favorite bonus
      if (favorites.includes(recipe.id)) {
        weight += 25;
      }

      // Quick time bonus
      if (recipe.timeMinutes <= 30) {
        weight += 15;
      }

      return {
        recipe,
        match,
        weight: Math.max(1, weight)
      };
    });
}

/**
 * Selects a recipe using roulette-wheel weighted random selection.
 */
export function spinRoulette(candidates: RouletteOption[]): RouletteOption | null {
  if (!candidates || candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let randomVal = Math.random() * totalWeight;

  for (const candidate of candidates) {
    if (randomVal < candidate.weight) {
      return candidate;
    }
    randomVal -= candidate.weight;
  }

  // Fallback to last candidate
  return candidates[candidates.length - 1];
}
