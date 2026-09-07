import { Recipe, RecipeIngredient, MatchResult, MatchTier } from '../types';
import { INGREDIENTS_DATABASE } from '../data/ingredientsData';

/**
 * Normalizes a string: trims, lowercases, and maps Turkish characters to ascii
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .replaceAll('İ', 'i')
    .replaceAll('I', 'ı')
    .toLowerCase()
    .trim()
    .replaceAll('\u0307', '') // Strip combining dot above
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c');
}

/**
 * Checks if two normalized tokens/phrases match semantically without substring collisions.
 * Prevents "su" from matching "tavuk gogsu", "et" from matching "patates", or "bal" from matching "balik".
 */
export function tokensMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  // Space-insensitive match for compounds (e.g. "zeytinyagi" vs "zeytin yagi", "pulbiber" vs "pul biber")
  const aNoSpace = a.replace(/\s+/g, '');
  const bNoSpace = b.replace(/\s+/g, '');
  if (aNoSpace === bNoSpace && aNoSpace.length >= 4) return true;

  // Plural suffix strip (Turkish -ler, -lar for words >= 5 chars)
  const stripPlural = (s: string) => (s.endsWith('ler') || s.endsWith('lar')) && s.length > 5 ? s.slice(0, -3) : s;
  const aSingular = stripPlural(a);
  const bSingular = stripPlural(b);
  if (aSingular === bSingular) return true;

  // Strict separation between spices (pul biber, karabiber) and fresh vegetable peppers (biber, yeşil biber)
  const isSpicePepper = (s: string) => /\b(pul\s*biber|karabiber|kara\s*biber)\b/i.test(s);
  const isProducePepper = (s: string) => /\b(biber|yesil\s*biber|sivri\s*biber|kapya\s*biber|carliston\s*biber)\b/i.test(s) && !isSpicePepper(s);
  if ((isSpicePepper(a) && isProducePepper(b)) || (isSpicePepper(b) && isProducePepper(a))) {
    return false;
  }

  // Token word boundary check (prevents sub-word collisions like "su" in "gogsu" or "et" in "patates")
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const bRegex = new RegExp(`(^|\\s)${escapeRegex(b)}(\\s|$)`, 'i');
  if (bRegex.test(a)) return true;

  const aRegex = new RegExp(`(^|\\s)${escapeRegex(a)}(\\s|$)`, 'i');
  if (aRegex.test(b)) return true;

  return false;
}

/**
 * Checks whether an ingredient string matches a query or alias in the database
 */
export function isIngredientMatch(recipeIngName: string, userPantryItem: string): boolean {
  const normRecipe = normalizeText(recipeIngName);
  const normUser = normalizeText(userPantryItem);

  if (!normRecipe || !normUser) return false;

  // Direct exact or word boundary match
  if (tokensMatch(normRecipe, normUser)) {
    return true;
  }

  // Look up aliases in the INGREDIENTS_DATABASE
  for (const entry of INGREDIENTS_DATABASE) {
    const allAliases = [entry.name, ...entry.aliases].map(normalizeText);
    const userMatchesEntry = allAliases.some(alias => tokensMatch(alias, normUser));
    const recipeMatchesEntry = allAliases.some(alias => tokensMatch(alias, normRecipe));

    if (userMatchesEntry && recipeMatchesEntry) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a recipe ingredient is considered a common pantry staple (tuz, yağ, su, karabiber vb.)
 * Note: Uses precise word boundaries to prevent 'su' from matching 'tavuk göğsü'.
 */
export function isStapleIngredient(ingredient: RecipeIngredient): boolean {
  if (ingredient.isStaple) return true;
  const norm = normalizeText(ingredient.name);

  // Water check (must not match words ending with su like gogsu, tursu)
  if (/^(su|sicak su|ilik su|kaynar su|icme suyu)$/i.test(norm)) {
    return true;
  }

  // Salt & Spices & Oils
  if (/\b(tuz|tuzu|karabiber|pulbiber|pul biber|zeytinyagi|aycicek yagi|sivi yag|kuru nane|kekik)\b/i.test(norm)) {
    return true;
  }

  return false;
}

/**
 * Evaluates a single recipe against the user's pantry items.
 */
export function evaluateRecipeMatch(recipe: Recipe, pantryItemNames: string[]): MatchResult {
  const matchedIngredients: string[] = [];
  const missingCriticalIngredients: RecipeIngredient[] = [];
  const missingStapleIngredients: RecipeIngredient[] = [];

  const nonStapleTotal = recipe.ingredients.filter(ing => !isStapleIngredient(ing)).length;

  for (const recipeIng of recipe.ingredients) {
    const isStaple = isStapleIngredient(recipeIng);
    const hasItem = pantryItemNames.some(p => isIngredientMatch(recipeIng.name, p));

    if (hasItem) {
      matchedIngredients.push(recipeIng.name);
    } else {
      if (isStaple) {
        missingStapleIngredients.push(recipeIng);
      } else {
        missingCriticalIngredients.push(recipeIng);
      }
    }
  }

  const criticalMatchedCount = recipe.ingredients
    .filter(ing => !isStapleIngredient(ing))
    .filter(ing => pantryItemNames.some(p => isIngredientMatch(ing.name, p)))
    .length;

  // Calculate percentage based on non-staples
  let percentage = 0;
  if (nonStapleTotal > 0) {
    percentage = Math.round((criticalMatchedCount / nonStapleTotal) * 100);
  } else {
    // If recipe only has staples
    percentage = Math.round((matchedIngredients.length / (recipe.ingredients.length || 1)) * 100);
  }

  // Determine Tier:
  // 🟢 Can Make Now: 0 critical ingredients missing (staples don't block)
  // 🟡 Almost There: 1 to 3 critical ingredients missing (and at least 1 critical matched)
  // 🔴 Need More Ingredients: 4+ critical ingredients missing or 0 critical matched
  let tier: MatchTier = 'need_more';
  const missingCount = missingCriticalIngredients.length;

  if (missingCount === 0 && (nonStapleTotal > 0 || matchedIngredients.length > 0)) {
    tier = 'can_make_now';
  } else if (missingCount >= 1 && missingCount <= 3 && criticalMatchedCount > 0) {
    tier = 'almost_there';
  } else {
    tier = 'need_more';
  }

  return {
    recipe,
    matchPercentage: Math.min(100, Math.max(0, percentage)),
    matchedIngredients,
    missingIngredients: missingCriticalIngredients,
    missingStaples: missingStapleIngredients,
    tier,
    missingCount
  };
}

/**
 * Searches and categorizes all recipes into the 3 tiers, sorted by relevance
 */
export function matchRecipesAgainstPantry(recipes: Recipe[], pantryItemNames: string[]): {
  canMakeNow: MatchResult[];
  almostThere: MatchResult[];
  needMore: MatchResult[];
  totalMatches: number;
} {
  if (!pantryItemNames || pantryItemNames.length === 0) {
    return {
      canMakeNow: [],
      almostThere: [],
      needMore: recipes.map(r => evaluateRecipeMatch(r, [])),
      totalMatches: 0
    };
  }

  const evaluated = recipes.map(r => evaluateRecipeMatch(r, pantryItemNames));

  const canMakeNow = evaluated
    .filter(res => res.tier === 'can_make_now')
    .sort((a, b) => b.matchPercentage - a.matchPercentage || a.recipe.timeMinutes - b.recipe.timeMinutes);

  const almostThere = evaluated
    .filter(res => res.tier === 'almost_there')
    .sort((a, b) => a.missingCount - b.missingCount || b.matchPercentage - a.matchPercentage);

  const needMore = evaluated
    .filter(res => res.tier === 'need_more')
    .sort((a, b) => b.matchPercentage - a.matchPercentage || a.missingCount - b.missingCount);

  return {
    canMakeNow,
    almostThere,
    needMore,
    totalMatches: canMakeNow.length + almostThere.length
  };
}
