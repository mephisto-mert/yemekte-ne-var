import { Recipe, MatchResult } from '../types';
import { evaluateRecipeMatch, tokensMatch, normalizeText } from './matchingService';

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

const isMeatIngredient = (ingName: string): boolean => {
  const norm = normalizeText(ingName);
  const meatKeywords = [
    'tavuk', 'kiyma', 'balik', 'sucuk', 'sosis', 'kavurma', 'pastirma', 'hindi',
    'kuzu', 'dana', 'biftek', 'antrikot', 'kofte', 'karides', 'kalamar', 'somon',
    'levrek', 'hamsi', 'gerdan', 'kusbasi', 'doner', 'ciger'
  ];
  if (meatKeywords.some(kw => tokensMatch(norm, kw))) return true;
  // Word boundary regex check for 'et' and derivatives avoiding 'patates'
  if (/\b(et|eti|etin|etler|dana|kuzu|tavuk|balik|kiyma|kofte|kalamar|karides|somon|levrek|hamsi|biftek|antrikot|kusbasi|pastirma|sucuk|sosis|doner|gerdan)\b/i.test(norm)) return true;
  return false;
};

const isHighProteinIngredient = (ingName: string): boolean => {
  if (isMeatIngredient(ingName)) return true;
  const norm = normalizeText(ingName);
  const proteinKeywords = ['yumurta', 'mercimek', 'nohut', 'kuru fasulye', 'peynir', 'lor', 'kasar', 'sut', 'yogurt', 'ton baligi'];
  return proteinKeywords.some(kw => tokensMatch(norm, kw));
};

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
      if (mood === 'vegetarian') {
        const hasMeat = recipe.ingredients.some(i => isMeatIngredient(i.name));
        if (hasMeat) return false;
      }
      if (mood === 'healthy' && recipe.calories > 450) return false;
      if (mood === 'high_protein') {
        const meetsMacro = recipe.macros && recipe.macros.protein >= 20;
        const hasProtein = recipe.ingredients.some(i => isHighProteinIngredient(i.name));
        if (!meetsMacro && !hasProtein) return false;
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
