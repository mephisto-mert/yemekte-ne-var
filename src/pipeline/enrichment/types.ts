import { NormalizedRecipe, RawRecipe } from '../types';
import { ImageCandidate } from '../image/types';
import { RecipeVideoCandidate } from '../import/videoProvider';

export interface RecipeImageCandidate {
  id?: string;
  provider: string;
  url: string;
  previewUrl?: string;
  format?: string;
  width?: number;
  height?: number;
  license?: string | null;
  attribution?: string | null;
  permissionStatus?: string;
  isPlaceholder?: boolean;
}

export type TranslationStatus = 'not_translated' | 'pending' | 'translated' | 'review_required' | 'failed';

export interface TranslationMeta {
  provider: string;
  model: string;
  translatedAt: string;
  confidence: number;
  reviewStatus: 'pending' | 'approved' | 'rejected';
}

export interface LocalizedRecipeData {
  sourceTitle: string;
  sourceLanguage: string;
  displayTitle: string;
  displayLanguage: string;
  translationStatus: TranslationStatus;
  translationMeta?: TranslationMeta;
  sourceDescription?: string;
  displayDescription?: string;
  localizedIngredients?: Array<{ original: string; localized: string }>;
  localizedInstructions?: Array<{ original: string; localized: string }>;
}

export interface TranslationRequest {
  text: string;
  fromLang: string;
  toLang: string;
  context?: 'title' | 'description' | 'ingredient' | 'instruction';
}

export interface TranslationResult {
  sourceText: string;
  translatedText: string;
  fromLang: string;
  toLang: string;
  confidence: number;
  status: TranslationStatus;
  provider: string;
  model: string;
}

export interface RecipeTranslator {
  readonly id: string;
  readonly name: string;
  translateText(request: TranslationRequest): Promise<TranslationResult>;
  translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]>;
}

export type TaxonomyMappingStatus = 'mapped' | 'unknown' | 'fallback';

export interface TaxonomyMappingResult {
  cooklyCategory: string;
  sourceCategory?: string;
  sourceArea?: string;
  matchedTags: string[];
  confidence: number;
  status: TaxonomyMappingStatus;
}

export type IngredientParseStatus = 'parsed' | 'approximate' | 'unparsed';

export interface ParsedIngredient {
  raw: string;
  name: string;
  canonicalName: string;
  amount?: string;
  amountValue?: number;
  unit?: string;
  confidence: number;
  status: IngredientParseStatus;
  isStaple: boolean;
}

export type MediaReadinessStatus = 'ready' | 'needs_review' | 'missing' | 'rejected';

export interface ImageMatchingResult {
  candidate?: RecipeImageCandidate;
  imageMatchScore: number;
  status: MediaReadinessStatus;
  reasons: string[];
  confidence: number;
  sourceUrl?: string;
  permissionStatus: string;
  license: string;
  attribution?: string | null;
}

export interface VideoMatchingResult {
  candidate?: RecipeVideoCandidate;
  videoMatchScore: number;
  status: MediaReadinessStatus;
  reasons: string[];
  confidence: number;
  videoId?: string;
  embedUrl?: string;
  permissionStatus: string;
}

export type IssueSeverity = 'blocking' | 'warning' | 'optional';

export interface CompletenessIssue {
  field: string;
  severity: IssueSeverity;
  message: string;
}

export interface CompletenessEvaluation {
  contentComplete: boolean;
  imageComplete: boolean;
  videoComplete: boolean;
  licenseComplete: boolean;
  localizationComplete: boolean;
  productionReady: boolean;
  issues: CompletenessIssue[];
  missingFields: string[];
}

export interface EnrichedQualityScore {
  overallScore: number;
  tier: 'excellent' | 'good' | 'review' | 'reject';
  contentScore: number;
  imageScore: number;
  videoScore: number;
  metadataScore: number;
  localizationScore: number;
  breakdown: Record<string, number>;
}

export type ReviewItemType = 'translation' | 'image' | 'video' | 'license' | 'duplicate' | 'taxonomy' | 'content';
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'resolved';

export interface ReviewItem {
  id: string;
  recipeId: string;
  type: ReviewItemType;
  severity: IssueSeverity;
  reason: string;
  source: string;
  candidate?: any;
  createdAt: string;
  status: ReviewStatus;
  resolutionNotes?: string;
}

export interface RecipeEnrichmentResult {
  recipeId: string;
  source: string;
  sourceId: string;
  sourceData: RawRecipe;
  normalizedData: NormalizedRecipe;
  localizedData: LocalizedRecipeData;
  taxonomyData: TaxonomyMappingResult;
  parsedIngredients: ParsedIngredient[];
  imageData: ImageMatchingResult;
  videoData: VideoMatchingResult;
  completeness: CompletenessEvaluation;
  quality: EnrichedQualityScore;
  overallConfidence: number;
  reviewItems: ReviewItem[];
  warnings: string[];
  errors: string[];
  enrichedAt: string;
}

export interface EnrichmentOptions {
  translator?: RecipeTranslator;
  enableImageMatching?: boolean;
  enableVideoMatching?: boolean;
  allowNetwork?: boolean;
  defaultLanguage?: string;
}

export interface BatchEnrichmentResult {
  batchId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totalProcessed: number;
  productionReadyCount: number;
  reviewRequiredCount: number;
  rejectedCount: number;
  results: RecipeEnrichmentResult[];
  reviewQueue: ReviewItem[];
  failedRecipes: Array<{ id: string; error: string }>;
}
