import { RawRecipe } from '../../types';
import { SourceType, ContentPermissionStatus, SourcePermissionPolicy } from '../types';

export interface RecipeProviderCapabilities {
  search: boolean;
  pagination: boolean;
  batch: boolean;
  recipeDetail: boolean;
  images: boolean;
  videos: boolean;
}

export interface RecipeProviderMetadata {
  id: string;
  name: string;
  sourceType: SourceType;
  permissionStatus: ContentPermissionStatus;
  permissionPolicy: SourcePermissionPolicy;
  license: string | null;
  attributionRequired: boolean;
  defaultAttribution?: string;
  rateLimit?: {
    requestsPerMinute: number;
    delayMs?: number;
  };
  requiresApiKey: boolean;
  apiKeyEnvVar?: string;
  capabilities: RecipeProviderCapabilities;
  sourceUrl?: string | null;
  description?: string;
}

export interface RecipeSearchOptions {
  query: string;
  category?: string;
  cuisine?: string;
  page?: number;
  pageSize?: number;
  language?: string;
}

export interface RecipeBatchOptions {
  category?: string;
  page?: number;
  pageSize?: number;
  cursor?: string;
  limit?: number;
}

export interface RecipeProviderBatchResult {
  recipes: RawRecipe[];
  page?: number;
  pageSize: number;
  cursor?: string;
  nextCursor?: string;
  hasMore: boolean;
  totalAvailable?: number;
  provider: string;
  retrievedAt: string;
}

/**
 * Standard Contract for all Recipe Source Providers.
 */
export interface RecipeProvider {
  readonly id: string;
  readonly name: string;
  readonly metadata: RecipeProviderMetadata;

  isConfigured(): boolean;
  search(options: RecipeSearchOptions): Promise<RecipeProviderBatchResult>;
  fetchById(externalId: string): Promise<RawRecipe | null>;
  fetchBatch(options?: RecipeBatchOptions): Promise<RecipeProviderBatchResult>;
}
