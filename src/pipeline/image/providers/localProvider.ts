import { ImageProvider, ImageProviderMetadata, ImageProviderResult, ImageSearchOptions } from './types';

/**
 * Local Image Provider for curated, approved local food photography assets.
 * Operates entirely offline with zero network requests.
 */
export class LocalImageProvider implements ImageProvider {
  readonly name = 'local_curated';
  readonly type = 'local';
  readonly metadata: ImageProviderMetadata = {
    name: 'Cookly Yerel Küratörlü Kütüphane',
    type: 'local',
    permissionPolicy: 'allowed',
    requiresApiKey: false,
    supportsSearch: true,
    supportsIdLookup: true,
    attributionRequired: false,
    defaultLicense: 'Cookly Proprietary / Approved Local'
  };

  private localDatabase: Record<string, ImageProviderResult> = {
    'mercimek_corbasi': {
      source: 'local_curated',
      sourceId: 'mercimek_corbasi',
      imageUrl: '/assets/images/mercimek_corbasi.webp',
      sourceName: 'Cookly Yerel Mutfak Arşivi',
      sourceUrl: null,
      license: 'Cookly Proprietary',
      attribution: 'Cookly Mutfak Ekibi',
      permissionPolicy: 'allowed',
      width: 1200,
      height: 800,
      mimeType: 'image/webp',
      altText: 'Geleneksel Mercimek Çorbası',
      retrievedAt: '2026-09-05T00:00:00.000Z'
    },
    'karniyarik': {
      source: 'local_curated',
      sourceId: 'karniyarik',
      imageUrl: '/assets/images/karniyarik.webp',
      sourceName: 'Cookly Yerel Mutfak Arşivi',
      sourceUrl: null,
      license: 'Cookly Proprietary',
      attribution: 'Cookly Mutfak Ekibi',
      permissionPolicy: 'allowed',
      width: 1200,
      height: 800,
      mimeType: 'image/webp',
      altText: 'Fırında Karnıyarık Yemeği',
      retrievedAt: '2026-09-05T00:00:00.000Z'
    }
  };

  search(query: string, options?: ImageSearchOptions): ImageProviderResult[] {
    const q = query.toLowerCase().trim();
    const matches = Object.values(this.localDatabase).filter(item => {
      const title = (item.altText || item.sourceId).toLowerCase();
      return title.includes(q) || q.includes(item.sourceId.replace('_', ' '));
    });

    const limit = options?.limit || 10;
    return matches.slice(0, limit);
  }

  getById(sourceId: string): ImageProviderResult | null {
    return this.localDatabase[sourceId] || null;
  }
}
