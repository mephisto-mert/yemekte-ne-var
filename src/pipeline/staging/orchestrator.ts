import { RecipeProvider } from '../import/providers/types';
import {
  StagedRecipe,
  StagingRecipeStatus,
  StagingManifest,
  StagingOrchestratorOptions,
  StagingOrchestrationResult,
  PIPELINE_VERSION,
  MAX_STAGING_BATCH_SIZE,
  DEFAULT_STAGING_BATCH_SIZE,
  RecipeProvenance
} from './types';
import { StagingCatalogRepository } from './stagingCatalogRepository';
import { evaluateProductionEligibility } from './productionEligibility';
import { normalizeRecipe } from '../normalizer';
import { validateRecipe } from '../validator';
import { ScalableDuplicateIndex } from '../import/scalableDuplicateDetector';
import { evaluateImportQualityGate } from '../import/qualityGate';
import { enrichRecipe } from '../enrichment/enrichmentEngine';
import { ReviewItem } from '../enrichment/types';

export class StagingOrchestrator {
  private repository: StagingCatalogRepository;
  private duplicateIndex: ScalableDuplicateIndex;

  constructor(options?: {
    repository?: StagingCatalogRepository;
    duplicateIndex?: ScalableDuplicateIndex;
  }) {
    this.repository = options?.repository || new StagingCatalogRepository();
    this.duplicateIndex = options?.duplicateIndex || new ScalableDuplicateIndex();
  }

  public getRepository(): StagingCatalogRepository {
    return this.repository;
  }

  /**
   * Orchestrates the complete end-to-end staging ingestion flow.
   * 
   * Strict safety limits:
   * - Limit <= 100 (Rejects if > 100 with explicit error)
   * - Error isolation for individual recipe processing
   * - ZERO mutations to production dataset
   */
  async orchestrate(
    provider: RecipeProvider,
    options?: StagingOrchestratorOptions
  ): Promise<StagingOrchestrationResult> {
    const runId = `staging_run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    const requestedLimit = options?.limit ?? DEFAULT_STAGING_BATCH_SIZE;

    // Hard Safety Limit Enforcement
    if (requestedLimit <= 0) {
      throw new Error(
        `Geçersiz batch boyutu: Batch boyutu 1 ile ${MAX_STAGING_BATCH_SIZE} arasında pozitif bir sayı olmalıdır (İstenen: ${requestedLimit}).`
      );
    }

    if (requestedLimit > MAX_STAGING_BATCH_SIZE) {
      throw new Error(
        `İstek limiti aşıldı: Maksimum batch boyutu 100 tariftir (İstenen: ${requestedLimit}).`
      );
    }

    const safeLimit = requestedLimit;

    // 1. Fetch from Provider
    let batchResult;
    try {
      if (options?.query && options.query.trim().length > 0) {
        batchResult = await provider.search({
          query: options.query,
          category: options.category,
          pageSize: safeLimit,
          page: 1
        });
      } else {
        batchResult = await provider.fetchBatch({
          category: options?.category,
          pageSize: safeLimit,
          page: 1
        });
      }
    } catch (err: any) {
      const completedAt = new Date().toISOString();
      const failedManifest: StagingManifest = this.createEmptyManifest({
        runId,
        startedAt,
        completedAt,
        durationMs: Date.now() - startTime,
        provider: provider.id,
        requested: safeLimit,
        failed: 1
      });

      return {
        runId,
        manifest: failedManifest,
        stagedRecipes: [],
        reviewQueue: [],
        failedRecipes: [{ id: 'provider_fetch', error: err.message || 'Sağlayıcı veri çekme hatası' }]
      };
    }

    const rawRecipes = (batchResult?.recipes || []).slice(0, safeLimit);
    const stagedRecipes: StagedRecipe[] = [];
    const allReviewItems: ReviewItem[] = [];
    const failedRecipes: Array<{ id: string; error: string }> = [];

    let normalizedCount = 0;
    let validCount = 0;
    let warningCount = 0;
    let reviewRequiredCount = 0;
    let rejectedCount = 0;
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let productionReadyCount = 0;

    const localizationStats = { translated: 0, pending: 0, reviewRequired: 0, notTranslated: 0 };
    const imageStats = { ready: 0, needsReview: 0, missing: 0, rejected: 0 };
    const videoStats = { ready: 0, needsReview: 0, missing: 0, rejected: 0 };
    const completenessStats = { complete: 0, partial: 0, incomplete: 0 };
    const qualityScores: number[] = [];
    const qualityTiers = { excellent: 0, good: 0, review: 0, reject: 0 };
    const reviewSeverityStats = { blocking: 0, warning: 0, optional: 0 };

    // 2. Process each recipe with Error Isolation
    for (let i = 0; i < rawRecipes.length; i++) {
      let rawId = `raw_${i + 1}`;
      try {
        const raw = rawRecipes[i];
        if (!raw) {
          throw new Error('Geçersiz ham tarif verisi (null/undefined)');
        }
        rawId = String(raw.id || raw.sourceId || `raw_${i + 1}`);

        // Step A: Normalize
        const normalized = normalizeRecipe(raw, rawId);
        normalizedCount++;

        // Step B: Validate Schema
        const validation = validateRecipe(normalized);

        // Step C: Scalable Duplicate Check
        const duplicateMatches = this.duplicateIndex.checkDuplicate(
          normalized,
          provider.id,
          rawId
        );
        const hasDuplicate = duplicateMatches.length > 0;

        // Step D: Quality Gate Evaluation
        const gateResult = evaluateImportQualityGate({
          recipe: normalized,
          sourceMetadata: provider.metadata as any,
          duplicateCandidate: hasDuplicate,
          duplicateReason: duplicateMatches.map(m => m.reason).join('; ')
        });

        // Step E: Enrichment (Localization, Taxonomy, Ingredients, Image, Video, Completeness, Quality)
        const enrichment = await enrichRecipe(normalized, raw);

        if (hasDuplicate) {
          enrichment.reviewItems.push({
            id: `rev_dup_${rawId}`,
            recipeId: `stage_${provider.id}_${rawId}`,
            type: 'duplicate',
            severity: 'blocking',
            reason: `Mükerrer tarif şüphesi: ${duplicateMatches.map(m => m.reason).join('; ')}`,
            source: provider.id,
            createdAt: new Date().toISOString(),
            status: 'pending'
          });
        }

        if (gateResult.decision === 'REVIEW_REQUIRED' && gateResult.reasons.length > 0) {
          enrichment.reviewItems.push({
            id: `rev_gate_${rawId}`,
            recipeId: `stage_${provider.id}_${rawId}`,
            type: 'content',
            severity: 'warning',
            reason: `Kalite kontrol kapısı inceleme gerektiriyor: ${gateResult.reasons.join('; ')}`,
            source: provider.id,
            createdAt: new Date().toISOString(),
            status: 'pending'
          });
        }

        // Track stats
        if (enrichment.localizedData.translationStatus === 'translated') localizationStats.translated++;
        else if (enrichment.localizedData.translationStatus === 'pending') localizationStats.pending++;
        else localizationStats.notTranslated++;

        if (enrichment.imageData.status === 'ready') imageStats.ready++;
        else if (enrichment.imageData.status === 'needs_review') imageStats.needsReview++;
        else if (enrichment.imageData.status === 'missing') imageStats.missing++;
        else imageStats.rejected++;

        if (enrichment.videoData.status === 'ready') videoStats.ready++;
        else if (enrichment.videoData.status === 'missing') videoStats.missing++;
        else videoStats.rejected++;

        if (enrichment.completeness.contentComplete) completenessStats.complete++;
        else completenessStats.incomplete++;

        qualityScores.push(enrichment.quality.overallScore);
        qualityTiers[enrichment.quality.tier]++;

        // Step F: Build Provenance
        const transformations: string[] = [
          'normalized',
          'validated',
          'taxonomy_mapped',
          'ingredients_parsed',
          'image_matched',
          'video_matched',
          'completeness_evaluated'
        ];

        const provenance: RecipeProvenance = {
          source: provider.id,
          sourceId: rawId,
          sourceUrl: raw.sourceUrl,
          importedAt: new Date().toISOString(),
          providerVersion: '1.0.0',
          pipelineVersion: PIPELINE_VERSION,
          transformations
        };

        // Determine initial status
        let initialStatus: StagingRecipeStatus = 'enriched';
        if (!enrichment.completeness.contentComplete || validation.status === 'INVALID') {
          initialStatus = 'rejected';
          rejectedCount++;
        } else if (hasDuplicate || gateResult.decision === 'REVIEW_REQUIRED' || enrichment.reviewItems.length > 0) {
          initialStatus = 'needs_review';
          reviewRequiredCount++;
        } else if (gateResult.decision === 'WARNING') {
          initialStatus = 'enriched';
          warningCount++;
        } else {
          initialStatus = 'approved';
          validCount++;
        }

        // Create StagedRecipe object
        const stagedRecipe: StagedRecipe = {
          id: `stage_${provider.id}_${rawId}`,
          source: provider.id,
          sourceId: rawId,
          sourceUrl: raw.sourceUrl,
          sourceLanguage: enrichment.localizedData.sourceLanguage,
          displayLanguage: enrichment.localizedData.displayLanguage,
          title: normalized.title,
          displayTitle: enrichment.localizedData.displayTitle,
          canonicalTitle: normalized.canonicalTitle,
          description: normalized.description,
          category: enrichment.taxonomyData.cooklyCategory,
          tags: normalized.tags,
          cuisine: normalized.cuisine,
          difficulty: normalized.difficulty,
          cookingTime: normalized.cookingTime,
          timeMinutes: normalized.timeMinutes,
          servings: normalized.servings,
          ingredients: enrichment.parsedIngredients,
          instructions: normalized.instructions,
          image: enrichment.imageData,
          video: enrichment.videoData,
          quality: enrichment.quality,
          completeness: enrichment.completeness,
          localization: enrichment.localizedData,
          taxonomy: enrichment.taxonomyData,
          provenance,
          reviewItems: enrichment.reviewItems,
          status: initialStatus,
          productionEligibility: {
            eligible: false,
            checks: {} as any,
            reasons: [],
            blockingIssues: [],
            evaluatedAt: new Date().toISOString()
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Step G: Evaluate Production Import Eligibility
        const eligibility = evaluateProductionEligibility(stagedRecipe);
        stagedRecipe.productionEligibility = eligibility;

        if (eligibility.eligible) {
          stagedRecipe.status = 'production_ready';
          productionReadyCount++;
        }

        // Add to review queue
        enrichment.reviewItems.forEach(item => {
          allReviewItems.push(item);
          if (item.severity === 'blocking') reviewSeverityStats.blocking++;
          else if (item.severity === 'warning') reviewSeverityStats.warning++;
          else reviewSeverityStats.optional++;
        });

        // Step H: Persist in Staging Repository
        const saveResult = await this.repository.add(stagedRecipe);
        if (saveResult.inserted) insertedCount++;
        else if (saveResult.updated) updatedCount++;
        else skippedCount++;

        // Add to duplicate index for intra-batch detection
        this.duplicateIndex.addRecipe(normalized, provider.id, rawId);

        stagedRecipes.push(stagedRecipe);
      } catch (itemErr: any) {
        // Error isolation: single failure does not abort remaining recipes
        failedRecipes.push({
          id: rawId,
          error: itemErr.message || 'Bilinmeyen normalizasyon veya staging hatası'
        });
      }
    }

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    const averageScore = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
      : 0;

    // Step I: Generate Staging Manifest
    const manifest: StagingManifest = {
      runId,
      startedAt,
      completedAt,
      durationMs,
      pipelineVersion: PIPELINE_VERSION,
      provider: provider.id,
      providerVersion: '1.0.0',
      requested: safeLimit,
      fetched: rawRecipes.length,
      normalized: normalizedCount,
      valid: validCount,
      warning: warningCount,
      reviewRequired: reviewRequiredCount,
      rejected: rejectedCount,
      failed: failedRecipes.length,
      inserted: insertedCount,
      updated: updatedCount,
      skipped: skippedCount,
      productionReady: productionReadyCount,
      localizationStats,
      imageStats,
      videoStats,
      completenessStats,
      qualityStats: {
        averageScore,
        excellent: qualityTiers.excellent,
        good: qualityTiers.good,
        review: qualityTiers.review,
        reject: qualityTiers.reject
      },
      reviewStats: {
        totalReviews: allReviewItems.length,
        blocking: reviewSeverityStats.blocking,
        warning: reviewSeverityStats.warning,
        optional: reviewSeverityStats.optional
      },
      recipesSummary: stagedRecipes.map(r => ({
        id: r.id,
        title: r.title,
        source: r.source,
        sourceId: r.sourceId,
        status: r.status,
        qualityScore: r.quality.overallScore,
        productionReady: r.productionEligibility.eligible
      }))
    };

    await this.repository.exportManifest(manifest);

    return {
      runId,
      manifest,
      stagedRecipes,
      reviewQueue: allReviewItems,
      failedRecipes
    };
  }

  private createEmptyManifest(data: {
    runId: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    provider: string;
    requested: number;
    failed: number;
  }): StagingManifest {
    return {
      runId: data.runId,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      durationMs: data.durationMs,
      pipelineVersion: PIPELINE_VERSION,
      provider: data.provider,
      providerVersion: '1.0.0',
      requested: data.requested,
      fetched: 0,
      normalized: 0,
      valid: 0,
      warning: 0,
      reviewRequired: 0,
      rejected: 0,
      failed: data.failed,
      inserted: 0,
      updated: 0,
      skipped: 0,
      productionReady: 0,
      localizationStats: { translated: 0, pending: 0, reviewRequired: 0, notTranslated: 0 },
      imageStats: { ready: 0, needsReview: 0, missing: 0, rejected: 0 },
      videoStats: { ready: 0, needsReview: 0, missing: 0, rejected: 0 },
      completenessStats: { complete: 0, partial: 0, incomplete: 0 },
      qualityStats: { averageScore: 0, excellent: 0, good: 0, review: 0, reject: 0 },
      reviewStats: { totalReviews: 0, blocking: 0, warning: 0, optional: 0 },
      recipesSummary: []
    };
  }
}
