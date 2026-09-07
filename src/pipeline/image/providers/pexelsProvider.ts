import {
  ImageProvider,
  ImageProviderMetadata,
  ImageProviderResult,
  ImageSearchOptions
} from './types';
import { SafeHttpClient } from './httpClient';

export type PexelsImageSize = 'large' | 'large2x' | 'medium' | 'original' | 'landscape';

export interface PexelsProviderConfig {
  apiKey?: string;
  httpClient?: SafeHttpClient;
  preferredSize?: PexelsImageSize;
  defaultPerPage?: number;
}

export interface PexelsPhotoSrc {
  original?: string;
  large2x?: string;
  large?: string;
  medium?: string;
  small?: string;
  portrait?: string;
  landscape?: string;
  tiny?: string;
}

export interface PexelsPhoto {
  id: number | string;
  width?: number;
  height?: number;
  url?: string;
  photographer?: string;
  photographer_url?: string;
  photographer_id?: number;
  avg_color?: string;
  src?: PexelsPhotoSrc;
  alt?: string;
}

export interface PexelsSearchResponse {
  page?: number;
  per_page?: number;
  photos?: PexelsPhoto[];
  total_results?: number;
  next_page?: string;
}

/**
 * Production-Grade Pexels Image Provider.
 * Integrates directly with official Pexels API v1.
 * 
 * SECURITY & COMPLIANCE:
 * 1. API key is read strictly from environment variable or secure config.
 * 2. Secrets are never logged, formatted into error messages, or dumped in headers.
 * 3. Does not retry 401/403 errors.
 * 4. Respects rate-limits and returns structured ImageProviderResults.
 */
export class PexelsImageProvider implements ImageProvider {
  readonly name = 'pexels';
  readonly type = 'pexels' as const;
  readonly metadata: ImageProviderMetadata = {
    name: 'Pexels',
    type: 'pexels',
    permissionPolicy: 'allowed',
    requiresApiKey: true,
    apiKeyEnvVar: 'PEXELS_API_KEY',
    supportsSearch: true,
    supportsIdLookup: true,
    rateLimit: { requestsPerMinute: 200, requestsPerMonth: 20000 },
    requestCost: 0,
    attributionRequired: false,
    defaultLicense: 'Pexels License (Free Commercial & Personal Use)'
  };

  private apiKey?: string;
  private httpClient: SafeHttpClient;
  private preferredSize: PexelsImageSize;
  private defaultPerPage: number;

  constructor(config?: PexelsProviderConfig) {
    // Resolve API key safely from config or process.env without leaking
    this.apiKey = config?.apiKey || (typeof process !== 'undefined' ? process.env?.PEXELS_API_KEY : undefined);
    this.httpClient = config?.httpClient || new SafeHttpClient();
    this.preferredSize = config?.preferredSize || 'large';
    this.defaultPerPage = Math.min(config?.defaultPerPage || 5, 15);
  }

  /**
   * Checks if an active API key is configured.
   */
  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  /**
   * Searches for culinary photos on Pexels.
   */
  async search(query: string, options?: ImageSearchOptions): Promise<ImageProviderResult[]> {
    if (!this.isConfigured()) {
      // Graceful degradation when key is missing: return empty without crashing
      return [];
    }

    const cleanQuery = (query || '').trim();
    if (cleanQuery.length === 0) {
      return [];
    }

    const perPage = Math.min(options?.limit || this.defaultPerPage, 15);
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery)}&per_page=${perPage}&page=1`;

    try {
      const response = await this.httpClient.get<PexelsSearchResponse>(url, {
        headers: {
          'Authorization': this.apiKey! // Pexels expects raw key in Authorization header without "Bearer "
        }
      });

      if (!response.ok || !response.data || !Array.isArray(response.data.photos)) {
        return [];
      }

      return response.data.photos
        .map(photo => this.mapPhotoToResult(photo))
        .filter((r): r is ImageProviderResult => !!r);
    } catch {
      // Return empty list on network failure or rate-limit
      return [];
    }
  }

  /**
   * Retrieves a single photo by Pexels Photo ID.
   */
  async getById(sourceId: string): Promise<ImageProviderResult | null> {
    if (!this.isConfigured() || !sourceId || sourceId.trim().length === 0) {
      return null;
    }

    const url = `https://api.pexels.com/v1/photos/${encodeURIComponent(sourceId.trim())}`;

    try {
      const response = await this.httpClient.get<PexelsPhoto>(url, {
        headers: {
          'Authorization': this.apiKey!
        }
      });

      if (!response.ok || !response.data || !response.data.id) {
        return null;
      }

      return this.mapPhotoToResult(response.data);
    } catch {
      return null;
    }
  }

  /**
   * Maps a Pexels API photo item into the normalized ImageProviderResult model.
   */
  private mapPhotoToResult(photo: PexelsPhoto): ImageProviderResult | null {
    if (!photo || !photo.id) return null;

    const sourceId = String(photo.id);
    const src = photo.src || {};

    // Select the best image URL based on preferred size with safe fallbacks
    const imageUrl =
      src[this.preferredSize] ||
      src.large ||
      src.large2x ||
      src.medium ||
      src.original ||
      '';

    if (!imageUrl) return null;

    // Attribution format: Photographer Name (Pexels)
    const attribution = photo.photographer
      ? `${photo.photographer.trim()} (Pexels)`
      : 'Pexels';

    return {
      source: 'pexels',
      sourceId,
      imageUrl,
      sourceUrl: photo.url || `https://www.pexels.com/photo/${sourceId}/`,
      sourceName: 'Pexels',
      license: 'Pexels License (Free Commercial & Personal Use)',
      attribution,
      permissionPolicy: 'allowed',
      width: typeof photo.width === 'number' ? photo.width : null,
      height: typeof photo.height === 'number' ? photo.height : null,
      mimeType: 'image/jpeg',
      altText: photo.alt ? String(photo.alt).trim() : null,
      retrievedAt: new Date().toISOString()
    };
  }
}
