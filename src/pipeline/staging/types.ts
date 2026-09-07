import { NormalizedRecipe, RawRecipe } from '../types';
import {
  LocalizedRecipeData,
  TaxonomyMappingResult,
  ParsedIngredient,
  ImageMatchingResult,
  VideoMatchingResult,
  CompletenessEvaluation,
  EnrichedQualityScore,
  ReviewItem
} from '../enrichment/types';

export const PIPELINE_VERSION = '13.0.0';
export const MAX_STAGING_BATCH_SIZE = 100;
export const DEFAULT_STAGING_BATCH_SIZE = 10;

export type StagingRecipeStatus =
  | 'imported'
  | 'enriched'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'production_ready';

export interface RecipeProvenance {
  source: string;
  sourceId: string;
  sourceUrl?: string;
  importedAt: string;
  providerVersion: string;
  pipelineVersion: string;
  transformations: string[];
}

export interface ProductionImportEligibilityChecks {
  sourceAllowed: boolean;
  licenseApproved: boolean;
  localizationApproved: boolean;
  contentComplete: boolean;
  imageApproved: boolean;
  videoPolicySatisfied: boolean;
  noBlockingReview: boolean;
  noDuplicate: boolean;
  qualityThresholdMet: boolean;
  provenanceComplete: boolean;
}

export interface ProductionImportEligibility {
  eligible: boolean;
  checks: ProductionImportEligibilityChecks;
  reasons: string[];
  blockingIssues: string[];
  evaluatedAt: string;
}

export interface StagedRecipe {
  id: string;
  source: string;
  sourceId: string;
  sourceUrl?: string;
  sourceLanguage: string;
  displayLanguage: string;
  title: string;
  displayTitle: string;
  canonicalTitle: string;
  description?: string;
  category: string;
  tags: string[];
  cuisine?: string;
  difficulty: string;
  cookingTime: string;
  timeMinutes: number;
  calories?: number;
  rating?: number;
  reviewCount?: number;
  chef?: string;
  servings: number;
  ingredients: ParsedIngredient[];
  instructions: string[];
  image: ImageMatchingResult;
  video: VideoMatchingResult;
  quality: EnrichedQualityScore;
  completeness: CompletenessEvaluation;
  localization: LocalizedRecipeData;
  taxonomy: TaxonomyMappingResult;
  provenance: RecipeProvenance;
  reviewItems: ReviewItem[];
  status: StagingRecipeStatus;
  productionEligibility: ProductionImportEligibility;
  createdAt: string;
  updatedAt: string;
}

export interface StagingCatalogStats {
  total: number;
  byStatus: Record<StagingRecipeStatus, number>;
  bySource: Record<string, number>;
  byLanguage: Record<string, number>;
  productionReadyCount: number;
  reviewRequiredCount: number;
  rejectedCount: number;
}

export interface StagingManifest {
  runId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  pipelineVersion: string;
  provider: string;
  providerVersion: string;
  requested: number;
  fetched: number;
  normalized: number;
  valid: number;
  warning: number;
  reviewRequired: number;
  rejected: number;
  failed: number;
  inserted: number;
  updated: number;
  skipped: number;
  productionReady: number;
  localizationStats: {
    translated: number;
    pending: number;
    reviewRequired: number;
    notTranslated: number;
  };
  imageStats: {
    ready: number;
    needsReview: number;
    missing: number;
    rejected: number;
  };
  videoStats: {
    ready: number;
    needsReview: number;
    missing: number;
    rejected: number;
  };
  completenessStats: {
    complete: number;
    partial: number;
    incomplete: number;
  };
  qualityStats: {
    averageScore: number;
    excellent: number;
    good: number;
    review: number;
    reject: number;
  };
  reviewStats: {
    totalReviews: number;
    blocking: number;
    warning: number;
    optional: number;
  };
  recipesSummary: Array<{
    id: string;
    title: string;
    source: string;
    sourceId: string;
    status: StagingRecipeStatus;
    qualityScore: number;
    productionReady: boolean;
  }>;
}

export interface StagingOrchestratorOptions {
  limit?: number;
  query?: string;
  category?: string;
  stagingDir?: string;
  allowNetwork?: boolean;
  forceReviewApproval?: boolean;
}

export interface StagingOrchestrationResult {
  runId: string;
  manifest: StagingManifest;
  stagedRecipes: StagedRecipe[];
  reviewQueue: ReviewItem[];
  failedRecipes: Array<{ id: string; error: string }>;
}
