import { NormalizedRecipe, DuplicateCandidate } from '../types';

export interface ScalableDuplicateMatch {
  matchType: 'exact_source_id' | 'exact_canonical_title' | 'ingredient_signature' | 'title_similarity';
  matchedRecipeId: string;
  matchedTitle: string;
  similarityScore?: number;
  reason: string;
}

/**
 * Calculates string similarity using Levenshtein / Token Jaccard metric.
 */
export function calculateTokenSimilarity(strA: string, strB: string): number {
  if (!strA || !strB) return 0;
  if (strA === strB) return 1.0;

  const tokensA = new Set(strA.toLowerCase().split(/\s+/).filter(Boolean));
  const tokensB = new Set(strB.toLowerCase().split(/\s+/).filter(Boolean));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionCount = 0;
  tokensA.forEach(t => {
    if (tokensB.has(t)) intersectionCount++;
  });

  const unionCount = new Set([...tokensA, ...tokensB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Generates an ingredient signature for fast ingredient overlap matching.
 */
export function generateIngredientSignature(recipe: NormalizedRecipe): string {
  if (!recipe.ingredients || recipe.ingredients.length === 0) return '';
  const nonStaple = recipe.ingredients
    .filter(i => !i.isStaple)
    .map(i => i.canonicalName)
    .sort()
    .slice(0, 5) // Top 5 characteristic ingredients
    .join('|');
  return nonStaple;
}

/**
 * Scalable O(1) Duplicate Detection Engine for 10,000+ recipes.
 */
export class ScalableDuplicateIndex {
  private canonicalTitleIndex: Map<string, NormalizedRecipe[]> = new Map();
  private sourceIdIndex: Map<string, NormalizedRecipe> = new Map();
  private ingredientSignatureIndex: Map<string, NormalizedRecipe[]> = new Map();
  private allIndexedRecipes: NormalizedRecipe[] = [];

  /**
   * Adds an existing recipe into the in-memory indexes.
   */
  addRecipe(recipe: NormalizedRecipe, source = 'system', sourceId?: string): void {
    this.allIndexedRecipes.push(recipe);

    // 1. Canonical Title Index
    const cTitle = recipe.canonicalTitle || '';
    if (cTitle) {
      const list = this.canonicalTitleIndex.get(cTitle) || [];
      list.push(recipe);
      this.canonicalTitleIndex.set(cTitle, list);
    }

    // 2. Source ID Index
    const sId = sourceId || recipe.id;
    if (sId) {
      const compositeKey = `${source}:${sId}`;
      this.sourceIdIndex.set(compositeKey, recipe);
    }

    // 3. Ingredient Signature Index
    const sig = generateIngredientSignature(recipe);
    if (sig) {
      const list = this.ingredientSignatureIndex.get(sig) || [];
      list.push(recipe);
      this.ingredientSignatureIndex.set(sig, list);
    }
  }

  /**
   * Adds multiple recipes in bulk.
   */
  addRecipes(recipes: NormalizedRecipe[], source = 'system'): void {
    recipes.forEach(r => this.addRecipe(r, source));
  }

  /**
   * Checks if a target recipe has duplicate or near-duplicate matches in O(1) / O(k).
   */
  checkDuplicate(recipe: NormalizedRecipe, source = 'incoming', sourceId?: string): ScalableDuplicateMatch[] {
    const matches: ScalableDuplicateMatch[] = [];

    // 1. Check Source ID collision
    const sId = sourceId || recipe.id;
    if (sId) {
      const compositeKey = `${source}:${sId}`;
      const existing = this.sourceIdIndex.get(compositeKey);
      if (existing && existing.id !== recipe.id) {
        matches.push({
          matchType: 'exact_source_id',
          matchedRecipeId: existing.id,
          matchedTitle: existing.title,
          reason: `Aynı kaynak kimliği (${compositeKey}) zaten mevcut.`
        });
      }
    }

    // 2. Check Exact Canonical Title
    const cTitle = recipe.canonicalTitle || '';
    if (cTitle) {
      const existingList = this.canonicalTitleIndex.get(cTitle) || [];
      for (const existing of existingList) {
        if (existing.id !== recipe.id) {
          matches.push({
            matchType: 'exact_canonical_title',
            matchedRecipeId: existing.id,
            matchedTitle: existing.title,
            reason: `Birebir kanonik başlık eşleşmesi: "${cTitle}"`
          });
        }
      }
    }

    // 3. Check Exact Ingredient Signature
    const sig = generateIngredientSignature(recipe);
    if (sig) {
      const existingList = this.ingredientSignatureIndex.get(sig) || [];
      for (const existing of existingList) {
        if (existing.id !== recipe.id && !matches.some(m => m.matchedRecipeId === existing.id)) {
          matches.push({
            matchType: 'ingredient_signature',
            matchedRecipeId: existing.id,
            matchedTitle: existing.title,
            reason: `Özdeş ana malzeme kombinasyonu tespit edildi (${sig}).`
          });
        }
      }
    }

    // 4. Token Similarity Check (Near-matches like "Karnıyarık" vs "Kıymalı Karnıyarık")
    if (matches.length === 0 && cTitle) {
      for (const existing of this.allIndexedRecipes) {
        if (existing.id === recipe.id) continue;
        const exTitle = existing.canonicalTitle || '';
        const sim = calculateTokenSimilarity(cTitle, exTitle);
        const isSubstring = (cTitle.length >= 5 && exTitle.includes(cTitle)) ||
                            (exTitle.length >= 5 && cTitle.includes(exTitle));

        if (sim >= 0.5 || isSubstring) {
          const effectiveScore = isSubstring ? Math.max(Math.round(sim * 100), 75) : Math.round(sim * 100);
          matches.push({
            matchType: 'title_similarity',
            matchedRecipeId: existing.id,
            matchedTitle: existing.title,
            similarityScore: effectiveScore,
            reason: `Yüksek başlık benzerliği (%${effectiveScore}): "${recipe.title}" ~ "${existing.title}"`
          });
          break; // Limit similarity matches
        }
      }
    }

    return matches;
  }
}
