import {
  ImageProvider,
  ImageProviderMetadata,
  ImageProviderResult,
  ImageProviderType,
  ImageSearchOptions
} from './types';
import { SourcePermissionPolicy } from '../../import/types';

export interface MockProviderConfig {
  name?: string;
  type?: ImageProviderType;
  permissionPolicy?: SourcePermissionPolicy;
  requiresApiKey?: boolean;
  apiKeyEnvVar?: string;
  rateLimit?: { requestsPerMinute: number; requestsPerMonth?: number };
  requestCost?: number;
  attributionRequired?: boolean;
  results?: ImageProviderResult[];
}

/**
 * Deterministic Mock Image Provider for testing the acquisition engine.
 * Covers all 7 test scenarios:
 * 1. Approved local image
 * 2. Approved generated image
 * 3. Licensed external image
 * 4. Unknown external image
 * 5. Prohibited source
 * 6. Invalid result (malformed URL)
 * 7. Duplicate image
 */
export class MockImageProvider implements ImageProvider {
  readonly name: string;
  readonly type: ImageProviderType;
  readonly metadata: ImageProviderMetadata;
  private predefinedResults: ImageProviderResult[];

  constructor(config?: MockProviderConfig) {
    this.name = config?.name || 'mock_provider';
    this.type = config?.type || 'mock';
    this.metadata = {
      name: config?.name || 'Mock Image Provider',
      type: this.type,
      permissionPolicy: config?.permissionPolicy || 'allowed',
      requiresApiKey: config?.requiresApiKey ?? false,
      apiKeyEnvVar: config?.apiKeyEnvVar,
      supportsSearch: true,
      supportsIdLookup: true,
      rateLimit: config?.rateLimit || { requestsPerMinute: 60 },
      requestCost: config?.requestCost ?? 0,
      attributionRequired: config?.attributionRequired ?? true,
      defaultLicense: 'Mock License'
    };

    this.predefinedResults = config?.results || [
      // 1. Approved local image
      {
        source: 'mock_local',
        sourceId: 'mock_img_local_1',
        imageUrl: '/assets/images/mercimek.webp',
        sourceName: 'Local Storage',
        sourceUrl: null,
        license: 'Approved Proprietary',
        attribution: 'Cookly Şefleri',
        permissionPolicy: 'allowed',
        width: 1200,
        height: 800,
        mimeType: 'image/webp',
        altText: 'Yerel Mercimek Çorbası',
        retrievedAt: '2026-09-05T00:00:00.000Z'
      },
      // 2. Approved generated image
      {
        source: 'mock_generated',
        sourceId: 'mock_img_gen_2',
        imageUrl: 'https://images.unsplash.com/photo-1625938145744-e380515399b7',
        sourceName: 'Culinary AI Studio',
        sourceUrl: 'https://ai-culinary.example.com',
        license: 'Commercial License Authorized',
        attribution: 'AI Studio v2',
        permissionPolicy: 'allowed',
        width: 1024,
        height: 1024,
        mimeType: 'image/jpeg',
        altText: 'Yapay Zeka Karnıyarık',
        retrievedAt: '2026-09-05T00:00:00.000Z'
      },
      // 3. Licensed external image
      {
        source: 'mock_licensed_external',
        sourceId: 'mock_img_ext_3',
        imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
        sourceName: 'Unsplash CC Food Library',
        sourceUrl: 'https://unsplash.com/photos/soup',
        license: 'Unsplash Commercial License',
        attribution: 'Food Photographer Dave',
        permissionPolicy: 'allowed',
        width: 1920,
        height: 1080,
        mimeType: 'image/jpeg',
        altText: 'Lisanslı Mercimek Çorbası',
        retrievedAt: '2026-09-05T00:00:00.000Z'
      },
      // 4. Unknown external image
      {
        source: 'mock_unknown_external',
        sourceId: 'mock_img_unk_4',
        imageUrl: 'https://unknown-blog.example.com/soup.jpg',
        sourceName: 'Unknown Cooking Blog',
        sourceUrl: 'https://unknown-blog.example.com',
        license: null,
        attribution: null,
        permissionPolicy: 'unknown',
        width: 800,
        height: 600,
        mimeType: 'image/jpeg',
        altText: 'Bilinmeyen Kaynak Çorba',
        retrievedAt: '2026-09-05T00:00:00.000Z'
      },
      // 5. Prohibited source
      {
        source: 'mock_prohibited',
        sourceId: 'mock_img_proh_5',
        imageUrl: 'https://prohibited-site.example.com/stolen.jpg',
        sourceName: 'Scraped Website Forbidden',
        sourceUrl: 'https://prohibited-site.example.com',
        license: 'All Rights Reserved - Scraping Prohibited',
        attribution: null,
        permissionPolicy: 'prohibited',
        width: 600,
        height: 400,
        mimeType: 'image/jpeg',
        altText: 'Yasaklı Kaynak Görseli',
        retrievedAt: '2026-09-05T00:00:00.000Z'
      },
      // 6. Invalid result (malformed URL)
      {
        source: 'mock_invalid',
        sourceId: 'mock_img_inv_6',
        imageUrl: 'not-a-valid-http-or-local-url',
        sourceName: 'Corrupted Source',
        sourceUrl: null,
        license: null,
        attribution: null,
        permissionPolicy: 'unknown',
        width: null,
        height: null,
        mimeType: null,
        altText: 'Bozuk URL',
        retrievedAt: '2026-09-05T00:00:00.000Z'
      },
      // 7. Duplicate image (shares exact imageUrl with #3)
      {
        source: 'mock_duplicate',
        sourceId: 'mock_img_dup_7',
        imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd', // Duplicate of #3
        sourceName: 'Unsplash CC Food Library Duplicate',
        sourceUrl: 'https://unsplash.com/photos/soup',
        license: 'Unsplash Commercial License',
        attribution: 'Food Photographer Dave',
        permissionPolicy: 'allowed',
        width: 1920,
        height: 1080,
        mimeType: 'image/jpeg',
        altText: 'Kopya Lisanslı Mercimek Çorbası',
        retrievedAt: '2026-09-05T00:00:00.000Z'
      }
    ];
  }

  search(query: string, options?: ImageSearchOptions): ImageProviderResult[] {
    const limit = options?.limit || this.predefinedResults.length;
    return this.predefinedResults.slice(0, limit);
  }

  getById(sourceId: string): ImageProviderResult | null {
    return this.predefinedResults.find(r => r.sourceId === sourceId) || null;
  }
}
