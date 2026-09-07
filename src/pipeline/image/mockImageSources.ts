import { ImageCandidate } from './types';

/**
 * Deterministic mock image candidates for testing the pipeline.
 * None of these are saved to the production recipe dataset.
 */
export const MOCK_IMAGE_CANDIDATES: ImageCandidate[] = [
  // 1. Allowed local image
  {
    recipeId: 'mock_rec_1',
    recipeTitle: 'Mercimek Çorbası',
    imageUrl: '/assets/images/mercimek.jpg',
    source: 'local_library',
    sourceId: 'img_local_1',
    metadata: {
      sourceName: 'Cookly Yerel Varlıklar',
      sourceType: 'local',
      permissionPolicy: 'allowed',
      attribution: 'Cookly Şefleri',
      license: 'All Rights Reserved',
      retrievedAt: '2026-09-05T00:00:00.000Z'
    }
  },

  // 2. Allowed generated image
  {
    recipeId: 'mock_rec_2',
    recipeTitle: 'Karnıyarık',
    imageUrl: 'https://images.unsplash.com/photo-1625938145744-e380515399b7',
    source: 'approved_generator',
    sourceId: 'img_gen_2',
    metadata: {
      sourceName: 'AI Culinary Studio',
      sourceType: 'generated',
      permissionPolicy: 'allowed',
      attribution: 'Model v2',
      license: 'Commercial Use Authorized',
      retrievedAt: '2026-09-05T00:00:00.000Z'
    }
  },

  // 3. Unknown external image
  {
    recipeId: 'mock_rec_3',
    recipeTitle: 'İzmir Köfte',
    imageUrl: 'https://external-blog.com/uploads/kofte.jpg',
    source: 'external_web',
    sourceId: 'img_ext_3',
    metadata: {
      sourceName: 'External Recipe Blog',
      sourceType: 'external',
      permissionPolicy: 'unknown',
      attribution: null,
      license: null,
      retrievedAt: '2026-09-05T00:00:00.000Z'
    }
  },

  // 4. Prohibited image source
  {
    recipeId: 'mock_rec_4',
    recipeTitle: 'Tavuk Sote',
    imageUrl: 'https://prohibited-scraper.com/images/tavuk.jpg',
    source: 'unauthorized_scraper',
    sourceId: 'img_proh_4',
    metadata: {
      sourceName: 'Unauthorized Source',
      sourceType: 'external',
      permissionPolicy: 'prohibited',
      attribution: null,
      license: 'Copyrighted - Scraping Prohibited',
      retrievedAt: '2026-09-05T00:00:00.000Z'
    }
  },

  // 5. Placeholder image (placehold.co)
  {
    recipeId: 'mock_rec_5',
    recipeTitle: 'Peynir Tabağı',
    imageUrl: 'https://placehold.co/400x300/1a1a2e/f98006?text=Peynir%20Tabagi',
    source: 'system_default',
    sourceId: 'img_placehold_5',
    metadata: {
      sourceName: 'Placeholder Service',
      sourceType: 'unknown',
      permissionPolicy: 'allowed',
      attribution: 'placehold.co',
      license: 'Demo Only',
      retrievedAt: '2026-09-05T00:00:00.000Z'
    }
  },

  // 6. Invalid image URL
  {
    recipeId: 'mock_rec_6',
    recipeTitle: 'Baklava',
    imageUrl: 'not-a-valid-http-url',
    source: 'corrupt_data',
    sourceId: 'img_invalid_6',
    metadata: {
      sourceName: 'Corrupted Source',
      sourceType: 'unknown',
      permissionPolicy: 'unknown',
      retrievedAt: '2026-09-05T00:00:00.000Z'
    }
  }
];
