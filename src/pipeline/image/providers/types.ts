import { SourcePermissionPolicy } from '../../import/types';

export type ImageProviderType =
  | 'local'
  | 'generated'
  | 'user_uploaded'
  | 'pexels'
  | 'unsplash'
  | 'open_licensed'
  | 'authorized_api'
  | 'mock'
  | 'unknown';

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerMonth?: number;
}

/**
 * Technical, licensing, and access metadata describing an ImageProvider.
 */
export interface ImageProviderMetadata {
  name: string;
  type: ImageProviderType;
  permissionPolicy: SourcePermissionPolicy;
  requiresApiKey: boolean;
  apiKeyEnvVar?: string;
  supportsSearch: boolean;
  supportsIdLookup: boolean;
  rateLimit?: RateLimitConfig;
  requestCost?: number;
  attributionRequired: boolean;
  defaultLicense?: string | null;
}

export interface ImageSearchOptions {
  limit?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
}

/**
 * Raw output item produced by an ImageProvider.
 * Kept separate from internal ImageCandidate to preserve provider purity.
 */
export interface ImageProviderResult {
  source: string;
  sourceId: string;
  imageUrl: string;
  sourceUrl?: string | null;
  sourceName: string;
  license?: string | null;
  attribution?: string | null;
  permissionPolicy: SourcePermissionPolicy;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  altText?: string | null;
  retrievedAt: string;
}

/**
 * Core contract for all Image Providers.
 * Provider implementations must never directly mutate production datasets.
 */
export interface ImageProvider {
  readonly name: string;
  readonly type: ImageProviderType;
  readonly metadata: ImageProviderMetadata;

  search(query: string, options?: ImageSearchOptions): Promise<ImageProviderResult[]> | ImageProviderResult[];
  getById(sourceId: string): Promise<ImageProviderResult | null> | ImageProviderResult | null;
}
