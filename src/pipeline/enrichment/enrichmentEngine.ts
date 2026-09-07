import { NormalizedRecipe, RawRecipe } from '../types';
import {
  RecipeEnrichmentResult,
  EnrichmentOptions,
  BatchEnrichmentResult,
  ReviewItem
} from './types';
import { localizeRecipe } from './localization';
import { mapToCooklyTaxonomy } from './taxonomyMapper';
import { parseIngredient } from './ingredientParser';
import { matchRecipeImage } from './imageMatcher';
import { matchRecipeVideo } from './videoMatcher';
import { evaluateRecipeCompleteness } from './completenessEngine';
import { calculateEnrichedQualityScore } from './qualityScorer';
import { extractReviewItemsFromEnrichment, HumanReviewQueue } from './reviewQueue';

export const MAX_ENRICHMENT_BATCH_SIZE = 100;

export interface BatchEnrichmentOptions extends EnrichmentOptions {
  batchId?: string;
  pageSize?: number;
}

/**
 * Enriches a single normalized recipe with modular localization, taxonomy,
 * ingredient parsing, image matching, video matching, and completeness analysis.
 */
export async function enrichRecipe(
  recipe: NormalizedRecipe,
  rawRecipe?: RawRecipe,
  options?: EnrichmentOptions
): Promise<RecipeEnrichmentResult> {
  const recipeId = recipe.id;
  const source = rawRecipe?.source || 'system';
  const sourceId = rawRecipe?.sourceId || String(recipe.id);

  // 1. Localization Layer (Preserves original title; no fake translations)
  const localizedData = await localizeRecipe(recipe, options?.translator);

  // 2. Taxonomy Mapping Layer
  const taxonomyData = mapToCooklyTaxonomy({
    category: recipe.category,
    area: recipe.cuisine,
    tags: recipe.tags
  });

  // 3. Ingredient Parsing & Extraction Layer
  const parsedIngredients = (recipe.ingredients || []).map(ing => {
    return parseIngredient({
      item: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      isStaple: ing.isStaple
    });
  });

  // 4. Image Matching Engine (Zero network downloads)
  const imageData = matchRecipeImage(recipe, {
    rawImageUrl: rawRecipe?.image || recipe.image,
    license: rawRecipe?.license,
    attribution: rawRecipe?.attribution
  });

  // 5. Video Matching Engine (Nocookie official embed URL)
  const videoData = matchRecipeVideo(recipe, {
    rawVideoId: rawRecipe?.videoId || recipe.videoId,
    rawVideoUrl: rawRecipe?.sourceUrl
  });

  // 6. Completeness Engine
  const completeness = evaluateRecipeCompleteness({
    recipe,
    localizedData,
    taxonomyData,
    imageData,
    videoData
  });

  // 7. Enriched Quality Scoring
  const quality = calculateEnrichedQualityScore({
    recipe,
    completeness,
    imageData,
    videoData,
    taxonomyData,
    localizedData
  });

  // 8. Overall Confidence Calculation
  const confidences = [
    localizedData.translationMeta?.confidence ?? 0.5,
    taxonomyData.confidence,
    imageData.confidence,
    videoData.confidence,
    parsedIngredients.length > 0
      ? parsedIngredients.reduce((acc, i) => acc + i.confidence, 0) / parsedIngredients.length
      : 0.5
  ];
  const overallConfidence = Number(
    (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(2)
  );

  // 9. Human Review Queue Extraction
  const partialEnrichment = {
    recipeId,
    source,
    sourceId,
    sourceData: rawRecipe || ({} as any),
    normalizedData: recipe,
    localizedData,
    taxonomyData,
    parsedIngredients,
    imageData,
    videoData,
    completeness,
    quality,
    overallConfidence,
    warnings: completeness.issues.filter(i => i.severity === 'warning').map(i => i.message),
    errors: completeness.issues.filter(i => i.severity === 'blocking').map(i => i.message),
    enrichedAt: new Date().toISOString()
  };

  const reviewItems = extractReviewItemsFromEnrichment(partialEnrichment);

  return {
    ...partialEnrichment,
    reviewItems
  };
}

/**
 * Enriches a batch of recipes with error isolation and safe boundaries.
 */
export async function enrichBatch(
  recipes: NormalizedRecipe[],
  rawRecipesMap?: Map<string, RawRecipe>,
  options?: BatchEnrichmentOptions
): Promise<BatchEnrichmentResult> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const batchId = options?.batchId || `enrich_batch_${Date.now()}`;

  const safeSize = Math.min(Math.max(options?.pageSize || recipes.length, 1), MAX_ENRICHMENT_BATCH_SIZE);
  const targetRecipes = recipes.slice(0, safeSize);

  const results: RecipeEnrichmentResult[] = [];
  const failedRecipes: Array<{ id: string; error: string }> = [];
  const reviewQueue = new HumanReviewQueue();

  let productionReadyCount = 0;
  let reviewRequiredCount = 0;
  let rejectedCount = 0;

  for (const recipe of targetRecipes) {
    try {
      const raw = rawRecipesMap?.get(String(recipe.id));
      const enriched = await enrichRecipe(recipe, raw, options);

      if (enriched.completeness.productionReady) {
        productionReadyCount++;
      }

      if (enriched.reviewItems.length > 0) {
        reviewRequiredCount++;
        enriched.reviewItems.forEach(item => reviewQueue.addItem(item));
      }

      if (!enriched.completeness.contentComplete) {
        rejectedCount++;
      }

      results.push(enriched);
    } catch (err: any) {
      // Error isolation: single failure does not crash the batch
      failedRecipes.push({
        id: String(recipe.id),
        error: err.message || 'Tarif enrichment hatası'
      });
    }
  }

  const completedAt = new Date().toISOString();
  const durationMs = Date.now() - startTime;

  return {
    batchId,
    startedAt,
    completedAt,
    durationMs,
    totalProcessed: results.length,
    productionReadyCount,
    reviewRequiredCount,
    rejectedCount,
    results,
    reviewQueue: reviewQueue.exportQueue(),
    failedRecipes
  };
}
