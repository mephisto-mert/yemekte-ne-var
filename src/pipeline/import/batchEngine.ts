import { RawRecipe, NormalizedRecipe } from '../types';
import { normalizeRecipe } from '../normalizer';
import { validateRecipe } from '../validator';
import { RecipeProvider } from './providers/types';
import { ScalableDuplicateIndex, ScalableDuplicateMatch } from './scalableDuplicateDetector';
import { evaluateImportQualityGate, QualityGateResult, GateDecision } from './qualityGate';
import { normalizeCategory, deriveTags } from './taxonomy';

export const MAX_IMPORT_BATCH_SIZE = 100;

export interface ProcessedImportCandidate {
  rawId: string;
  source: string;
  sourceId: string;
  rawRecipe: RawRecipe;
  normalizedRecipe: NormalizedRecipe;
  gateResult: QualityGateResult;
  duplicateMatches: ScalableDuplicateMatch[];
  decision: GateDecision;
  reasons: string[];
}

export interface BatchManifest {
  batchId: string;
  provider: string;
  sourceLicense: string | null;
  startedAt: string;
  completedAt: string;
  query?: string;
  category?: string;
  page?: number;
  totalFetched: number;
  stats: {
    valid: number;
    warning: number;
    reviewRequired: number;
    rejected: number;
    duplicates: number;
    imageReady: number;
    videoReady: number;
    failed: number;
  };
  recipeDecisions: Array<{
    id: string;
    title: string;
    decision: GateDecision;
    score: number;
    reasons: string[];
  }>;
}

export interface BatchExecutionOptions {
  provider: RecipeProvider;
  query?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  existingRecipes?: NormalizedRecipe[];
  duplicateIndex?: ScalableDuplicateIndex;
}

export interface BatchExecutionResult {
  batchId: string;
  provider: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  requestedCount: number;
  fetchedCount: number;
  normalizedCount: number;
  validCount: number;
  warningCount: number;
  reviewCount: number;
  rejectedCount: number;
  duplicateCount: number;
  failedCount: number;
  imageReadyCount: number;
  videoReadyCount: number;
  candidates: ProcessedImportCandidate[];
  failedRecipes: Array<{ id: string; error: string }>;
  manifest: BatchManifest;
}

/**
 * Production-Grade Recipe Import Batch Engine.
 * Fetches, normalizes, validates, indexes, deduplicates, and evaluates candidates
 * with error isolation and strict batch boundaries.
 */
export class RecipeImportBatchEngine {
  async executeBatch(options: BatchExecutionOptions): Promise<BatchExecutionResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const provider = options.provider;

    // Safety Clamping: Enforce MAX_IMPORT_BATCH_SIZE
    const requestedSize = options.pageSize || 10;
    const safeSize = Math.min(Math.max(requestedSize, 1), MAX_IMPORT_BATCH_SIZE);
    const page = options.page || 1;

    // 1. Fetch batch from provider
    let rawResult;
    try {
      if (options.query && options.query.trim().length > 0) {
        rawResult = await provider.search({
          query: options.query,
          category: options.category,
          page,
          pageSize: safeSize
        });
      } else {
        rawResult = await provider.fetchBatch({
          category: options.category,
          page,
          pageSize: safeSize
        });
      }
    } catch (err: any) {
      // Critical provider failure
      const completedAt = new Date().toISOString();
      const failedManifest: BatchManifest = {
        batchId,
        provider: provider.id,
        sourceLicense: provider.metadata.license,
        startedAt,
        completedAt,
        query: options.query,
        category: options.category,
        page,
        totalFetched: 0,
        stats: { valid: 0, warning: 0, reviewRequired: 0, rejected: 0, duplicates: 0, imageReady: 0, videoReady: 0, failed: 1 },
        recipeDecisions: []
      };

      return {
        batchId,
        provider: provider.id,
        startedAt,
        completedAt,
        durationMs: Date.now() - startTime,
        requestedCount: safeSize,
        fetchedCount: 0,
        normalizedCount: 0,
        validCount: 0,
        warningCount: 0,
        reviewCount: 0,
        rejectedCount: 0,
        duplicateCount: 0,
        failedCount: 1,
        imageReadyCount: 0,
        videoReadyCount: 0,
        candidates: [],
        failedRecipes: [{ id: 'provider_batch_fetch', error: err.message || 'Sağlayıcı veri çekme hatası' }],
        manifest: failedManifest
      };
    }

    const rawRecipes = rawResult.recipes || [];

    // 2. Setup Duplicate Index (populate with existing dataset if provided)
    const duplicateIndex = options.duplicateIndex || new ScalableDuplicateIndex();
    if (options.existingRecipes && options.existingRecipes.length > 0) {
      duplicateIndex.addRecipes(options.existingRecipes, 'existing_dataset');
    }

    const candidates: ProcessedImportCandidate[] = [];
    const failedRecipes: Array<{ id: string; error: string }> = [];

    let validCount = 0;
    let warningCount = 0;
    let reviewCount = 0;
    let rejectedCount = 0;
    let duplicateCount = 0;
    let imageReadyCount = 0;
    let videoReadyCount = 0;

    // 3. Process each recipe with Error Isolation
    for (let i = 0; i < rawRecipes.length; i++) {
      const raw = rawRecipes[i];
      const rawId = String(raw.id || `raw_${page}_${i + 1}`);

      try {
        // Normalization
        const normalized = normalizeRecipe(raw, rawId);

        // Normalize Category & Derive Verified Tags
        normalized.category = normalizeCategory(normalized.category);
        const tagsResult = deriveTags({
          title: normalized.title,
          ingredients: normalized.ingredients.map(ing => ing.name),
          instructions: normalized.instructions,
          timeMinutes: normalized.timeMinutes,
          sourceTags: normalized.tags
        });
        normalized.tags = tagsResult.allTags;

        // Duplicate Check via Scalable Index
        const duplicateMatches = duplicateIndex.checkDuplicate(normalized, provider.id, rawId);
        const hasDuplicate = duplicateMatches.length > 0;
        if (hasDuplicate) {
          duplicateCount++;
        }

        // Quality Gate Evaluation
        const gateResult = evaluateImportQualityGate({
          recipe: normalized,
          sourceMetadata: provider.metadata as any,
          duplicateCandidate: hasDuplicate,
          duplicateReason: duplicateMatches.map(m => m.reason).join('; ')
        });

        if (gateResult.imageStatus === 'ready') imageReadyCount++;
        if (gateResult.videoStatus === 'ready') videoReadyCount++;

        if (gateResult.decision === 'VALID') validCount++;
        else if (gateResult.decision === 'WARNING') warningCount++;
        else if (gateResult.decision === 'REVIEW_REQUIRED') reviewCount++;
        else if (gateResult.decision === 'REJECTED') rejectedCount++;

        // Add to local duplicate index so intra-batch duplicates are detected!
        duplicateIndex.addRecipe(normalized, provider.id, rawId);

        candidates.push({
          rawId,
          source: provider.id,
          sourceId: rawId,
          rawRecipe: raw,
          normalizedRecipe: normalized,
          gateResult,
          duplicateMatches,
          decision: gateResult.decision,
          reasons: gateResult.reasons
        });
      } catch (itemError: any) {
        // Error isolation: single failed recipe does not crash the batch
        failedRecipes.push({
          id: rawId,
          error: itemError.message || 'Tarif normalizasyon hatası'
        });
      }
    }

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    // 4. Generate Batch Manifest
    const manifest: BatchManifest = {
      batchId,
      provider: provider.id,
      sourceLicense: provider.metadata.license,
      startedAt,
      completedAt,
      query: options.query,
      category: options.category,
      page,
      totalFetched: rawRecipes.length,
      stats: {
        valid: validCount,
        warning: warningCount,
        reviewRequired: reviewCount,
        rejected: rejectedCount,
        duplicates: duplicateCount,
        imageReady: imageReadyCount,
        videoReady: videoReadyCount,
        failed: failedRecipes.length
      },
      recipeDecisions: candidates.map(c => ({
        id: c.normalizedRecipe.id,
        title: c.normalizedRecipe.title,
        decision: c.decision,
        score: c.gateResult.qualityScore.score,
        reasons: c.reasons
      }))
    };

    return {
      batchId,
      provider: provider.id,
      startedAt,
      completedAt,
      durationMs,
      requestedCount: safeSize,
      fetchedCount: rawRecipes.length,
      normalizedCount: candidates.length,
      validCount,
      warningCount,
      reviewCount,
      rejectedCount,
      duplicateCount,
      failedCount: failedRecipes.length,
      imageReadyCount,
      videoReadyCount,
      candidates,
      failedRecipes,
      manifest
    };
  }
}
