import { RecipeSourceAdapter, SourceMetadata } from './types';
import { RawRecipe } from '../types';

/**
 * Mock Recipe Adapter providing deterministic test recipes.
 * Demonstrates the source adapter flow without making external requests.
 */
export class MockRecipeAdapter implements RecipeSourceAdapter {
  readonly name = 'mock_local_source';
  readonly metadata: SourceMetadata;

  private customRecipes?: RawRecipe[];

  constructor(customRecipes?: RawRecipe[]) {
    this.customRecipes = customRecipes;
    this.metadata = {
      sourceName: 'Mock Local Source',
      sourceType: 'mock',
      sourceUrl: null,
      retrievedAt: new Date().toISOString(),
      attribution: 'Local Test Data',
      license: null,
      contentPermissionStatus: 'public_domain'
    };
  }

  fetchRawRecipes(): RawRecipe[] {
    if (this.customRecipes) {
      return this.customRecipes;
    }

    // Default 3 deterministic test recipes
    return [
      // 1. VALID RECIPE (All requirements met, including image and video)
      {
        id: 'mock_yayla_1',
        name: 'Test Yayla Çorbası',
        category: 'soup',
        difficulty: 'Kolay',
        time: '25 dk',
        timeMinutes: 25,
        servings: 4,
        ingredients: [
          { item: 'Pirinç', amount: '1 çay bardağı' },
          { item: 'Yoğurt', amount: '1.5 su bardağı' },
          { item: 'Nane', amount: '1 yemek kaşığı' },
          { item: 'Tereyağı', amount: '1 yemek kaşığı' }
        ],
        steps: [
          'Pirinci yumuşayana kadar haşlayın.',
          'Yoğurt ve yumurta sarısını çırparak terbiyeyi hazırlayın.',
          'Çorbanın suyundan ekleyerek terbiyeyi ılıtın ve tencereye ilave edin.',
          'Nane ve tereyağını kızdırıp üzerine dökün.'
        ],
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
        videoId: 'mock_video_1',
        videoTitle: 'Test Yayla Çorbası Nasıl Yapılır',
        videoAuthor: 'Test Şefi',
        videoLanguage: 'tr'
      },

      // 2. WARNING RECIPE (Usable recipe, but missing image and video)
      {
        id: 'mock_sehriye_2',
        name: 'Test Tel Şehriye Çorbası',
        category: 'soup',
        difficulty: 'Kolay',
        time: '20 dk',
        timeMinutes: 20,
        servings: 4,
        ingredients: [
          { item: 'Tel Şehriye', amount: '1 çay bardağı' },
          { item: 'Domates Salçası', amount: '1 yemek kaşığı' },
          { item: 'Sıvı Yağ', amount: '2 yemek kaşığı' }
        ],
        steps: [
          'Salçayı yağda kavurun.',
          'Sıcak suyu ekleyip kaynamaya bırakın.',
          'Şehriyeleri ilave edip 10 dakika pişirin.'
        ]
        // image and video intentionally omitted to trigger WARNING status
      },

      // 3. INVALID RECIPE (Missing title or empty ingredients -> REJECTED)
      {
        id: 'mock_invalid_3',
        name: '', // Missing title
        category: 'soup',
        servings: 0, // Invalid servings
        ingredients: [], // Missing ingredients
        steps: [] // Missing instructions
      }
    ];
  }
}
