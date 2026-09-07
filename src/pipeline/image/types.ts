import { SourcePermissionPolicy } from '../import/types';

export type ImageSourceType =
  | 'local'
  | 'generated'
  | 'user_uploaded'
  | 'api'
  | 'external'
  | 'unsplash'
  | 'pexels'
  | 'open_licensed'
  | 'authorized_api'
  | 'mock'
  | 'unknown';

export type ImageQualityStatus = 'VALID' | 'WARNING' | 'INVALID';

export type ImageDecision = 'usable' | 'needs_review' | 'rejected' | 'missing';

export type ImageFallbackPriority =
  | 'approved_existing'
  | 'licensed_external'
  | 'generated'
  | 'user_uploaded'
  | 'missing_state';

/**
 * Metadata associated with a recipe image asset.
 * Strict rule: Never fabricate fake licenses or permissions.
 */
export interface ImageSourceMetadata {
  sourceName: string;
  sourceType: ImageSourceType;
  sourceUrl?: string | null;
  license?: string | null;
  attribution?: string | null;
  permissionPolicy: SourcePermissionPolicy;
  retrievedAt: string;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
}

/**
 * Normalized Recipe Image representation.
 */
export interface RecipeImage {
  imageUrl: string;
  altText: string;
  metadata: ImageSourceMetadata;
  isPlaceholder: boolean;
}

/**
 * Input candidate to be processed by the image pipeline.
 */
export interface ImageCandidate {
  recipeId: string;
  recipeTitle: string;
  imageUrl?: string | null;
  source: string;
  sourceId?: string | null;
  metadata?: Partial<ImageSourceMetadata>;
  altText?: string | null;
}

/**
 * Result of evaluating a single image candidate through the pipeline.
 */
export interface ImagePipelineResult {
  recipeId: string;
  recipeTitle: string;
  imageUrl: string | null;
  altText: string;
  qualityStatus: ImageQualityStatus;
  isPlaceholder: boolean;
  decision: ImageDecision;
  decisionReason: string;
  errors: string[];
  warnings: string[];
  fallbackPriority: ImageFallbackPriority;
}

/**
 * Duplicate image match record.
 */
export interface ImageDuplicateMatch {
  sourceRecipeId: string;
  targetRecipeId: string;
  imageUrl: string;
  reason: string;
}

/**
 * Complete dry-run / batch report from the Image Pipeline.
 */
export interface ImagePipelineReport {
  total: number;
  imagesPresent: number;
  missingImages: number;
  placeholders: number;
  validImages: number;
  warnings: number;
  invalid: number;
  usable: number;
  needsReview: number;
  rejected: number;
  duplicates: ImageDuplicateMatch[];
  productionDatasetModified: false;
  results: ImagePipelineResult[];
  startedAt: string;
  completedAt: string;
}
